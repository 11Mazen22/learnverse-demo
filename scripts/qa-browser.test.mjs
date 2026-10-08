import test from 'node:test';
import assert from 'node:assert/strict';
import {mkdtemp,writeFile,chmod,readFile,rm,mkdir} from 'node:fs/promises';
import {join,resolve} from 'node:path';
import {tmpdir} from 'node:os';
import {launchQaBrowser,qaChromeArgs} from './lib/qa-browser.mjs';

async function fakeChrome(t,name,source){
  const root=await mkdtemp(join(tmpdir(),'noata-chrome-fault-'));
  t.after(()=>rm(root,{recursive:true,force:true}));
  const executablePath=join(root,'chrome');
  await writeFile(executablePath,'#!/usr/bin/env node\n'+source);await chmod(executablePath,0o700);
  return {executablePath,artifactsDir:resolve('artifacts/noata-browser-runtime-tests/'+name),startupTimeoutMs:2000};
}
test('QA Chrome uses a dynamic loopback debugging port and normal multiprocess flags',()=>{
  const args=qaChromeArgs('/tmp/isolated-profile');
  assert.ok(args.includes('--remote-debugging-port=0'));
  assert.ok(args.includes('--remote-debugging-address=127.0.0.1'));
  assert.ok(!args.includes('--single-process'));assert.ok(!args.includes('--no-zygote'));
});
test('missing Chrome captures the spawn error and cleans its isolated profile',async()=>{
  const dir=resolve('artifacts/noata-browser-runtime-tests/missing-binary');
  await assert.rejects(launchQaBrowser({executablePath:'/noata-missing-chrome',artifactsDir:dir}),error=>{
    assert.equal(error.diagnostics.spawnError.code,'ENOENT');assert.equal(error.diagnostics.profileRemoved,true);return true;
  });
  const result=JSON.parse(await readFile(join(dir,'browser-startup.json'),'utf8'));
  assert.equal(result.spawnError.code,'ENOENT');
});
test('Chrome startup crash captures its exact exit code and untruncated stderr',async t=>{
  const options=await fakeChrome(t,'exit-code',`process.stderr.write('STARTUP-BEGIN\\n'+'x'.repeat(20000)+'\\nSTARTUP-END\\n',()=>process.exit(7));`);
  await assert.rejects(launchQaBrowser(options),error=>{
    assert.match(error.message,/code=7/);assert.equal(error.diagnostics.exit.code,7);return true;
  });
  const log=await readFile(join(options.artifactsDir,'chromium.log'),'utf8');
  assert.ok(log.startsWith('STARTUP-BEGIN'));assert.ok(log.includes('STARTUP-END'));assert.ok(log.length>20000);
});
test('Chrome signal failure is distinguished from a connection timeout',async t=>{
  const options=await fakeChrome(t,'signal',`process.stderr.write('simulated abrupt browser termination\\n');process.kill(process.pid,'SIGKILL');`);
  await assert.rejects(launchQaBrowser(options),error=>{
    assert.equal(error.diagnostics.exit.signal,'SIGKILL');assert.match(error.message,/signal=SIGKILL/);return true;
  });
});
test('WebSocket handshake rejection retains platform error, endpoint and Chrome diagnostics',async t=>{
  const options=await fakeChrome(t,'websocket-rejected',`
const http=require('node:http'),fs=require('node:fs'),path=require('node:path');
const profile=process.argv.find(a=>a.startsWith('--user-data-dir=')).split('=').slice(1).join('=');
const server=http.createServer((req,res)=>{res.setHeader('Content-Type','application/json');const origin='ws://127.0.0.1:'+server.address().port;
res.end(JSON.stringify(req.url==='/json/version'?{Browser:'Fault fixture',webSocketDebuggerUrl:origin+'/devtools/browser/fixture'}:[{type:'page',webSocketDebuggerUrl:origin+'/devtools/page/fixture'}]));});
server.on('upgrade',(req,socket)=>{process.stderr.write('Fixture CDP handshake denied: HTTP 403\\n');socket.end('HTTP/1.1 403 Forbidden\\r\\nContent-Length: 0\\r\\n\\r\\n');});
server.listen(0,'127.0.0.1',()=>fs.writeFileSync(path.join(profile,'DevToolsActivePort'),server.address().port+'\\n/devtools/browser/fixture\\n'));
`);
  await assert.rejects(launchQaBrowser(options),error=>{
    assert.match(error.message,/WebSocket failed/);assert.ok(error.cause.cause);
    assert.equal(error.diagnostics.webSocket.error.statusCode,403);
    assert.ok(error.diagnostics.webSocket.error.stack);assert.match(error.diagnostics.webSocket.url,/127\.0\.0\.1:\d+/);
    assert.equal(error.diagnostics.profileRemoved,true);return true;
  });
  assert.match(await readFile(join(options.artifactsDir,'chromium.log'),'utf8'),/HTTP 403/);
});
test('missing debugger readiness times out with the last filesystem error and exit diagnostics',async t=>{
  const options=await fakeChrome(t,'no-debugger',`process.stderr.write('Chrome fixture without debugger\\n');setInterval(()=>{},1000);`);
  options.startupTimeoutMs=250;
  await assert.rejects(launchQaBrowser(options),error=>{
    assert.match(error.message,/startup timed out/);assert.equal(error.diagnostics.lastReadinessError.code,'ENOENT');
    assert.equal(error.diagnostics.exit.expected,true);return true;
  });
});
