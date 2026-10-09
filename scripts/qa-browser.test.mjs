import test from 'node:test';
import assert from 'node:assert/strict';
import {mkdtemp,writeFile,chmod,readFile,rm,mkdir} from 'node:fs/promises';
import {join,resolve} from 'node:path';
import {tmpdir} from 'node:os';
import { getEventListeners } from 'node:events';
import { createContext, runInContext } from 'node:vm';
import {launchQaBrowser,reloadQaPage,qaChromeArgs,processGroupMembers} from './lib/qa-browser.mjs';

async function fakeChrome(t,name,source){
  const root=await mkdtemp(join(tmpdir(),'noata-chrome-fault-'));
  t.after(()=>rm(root,{recursive:true,force:true}));
  const executablePath=join(root,'chrome');
  await writeFile(executablePath,'#!/usr/bin/env node\n'+source);await chmod(executablePath,0o700);
  return {executablePath,artifactsDir:resolve('artifacts/noata-browser-runtime-tests/'+name),startupTimeoutMs:2000};
}
test('reload waits for command acknowledgement and the new document, never an old ready state', async () => {
  const socket = new EventTarget();
  let acknowledge, finished = false;
  const browser = { socket, command(method) {
    assert.equal(method, 'Page.reload');
    return new Promise(resolve => { acknowledge = resolve; });
  } };
  const work = reloadQaPage(browser, 1000).then(() => { finished = true; });
  socket.dispatchEvent(new MessageEvent('message', { data: JSON.stringify({ method: 'Runtime.executionContextDestroyed' }) }));
  await Promise.resolve();
  assert.equal(finished, false);
  socket.dispatchEvent(new MessageEvent('message', { data: JSON.stringify({ method: 'Page.loadEventFired' }) }));
  await Promise.resolve();
  assert.equal(finished, false);
  acknowledge({});
  await work;
  assert.equal(finished, true);
  assert.equal(getEventListeners(socket, 'message').length, 0);
  assert.equal(getEventListeners(socket, 'close').length, 0);
});
test('reload timeout fails rather than evaluating or accepting the unloaded page', async () => {
  const socket = new EventTarget();
  await assert.rejects(reloadQaPage({ socket, command: async () => ({}) }, 10), /New document load timed out/);
  assert.equal(getEventListeners(socket, 'message').length, 0);
  assert.equal(getEventListeners(socket, 'close').length, 0);
});
test('reload command and browser disconnect errors release listeners without retrying a mutation', async () => {
  const socket = new EventTarget();
  await assert.rejects(reloadQaPage({ socket, command: async () => { throw Error('Protocol rejected reload'); } }), /Protocol rejected reload/);
  assert.equal(getEventListeners(socket, 'message').length, 0);
  const work = reloadQaPage({ socket, command: async () => ({}) });
  socket.dispatchEvent(new Event('close'));
  await assert.rejects(work, /disconnected during page reload/);
  assert.equal(getEventListeners(socket, 'close').length, 0);
});

test('palette storage fault and cleanup return primitives without weakening denial or restoration', async () => {
  const source = await readFile(new URL('./palette-aura-smoke.mjs', import.meta.url), 'utf8');
  const expressions = Array.from(source.matchAll(/await evaluate\(("(?:[^"\\]|\\.)*")\)/g), match => JSON.parse(match[1]));
  const setup = expressions.find(expression => expression.startsWith('window.__paletteStorageDescriptors='));
  const cleanup = expressions.find(expression => expression.includes('delete window.__paletteStorageDescriptors'));
  assert.ok(setup);
  assert.ok(cleanup);
  class Storage {
    getItem() { return 'ocean'; }
    setItem() { return undefined; }
  }
  const descriptors = Object.getOwnPropertyDescriptors(Storage.prototype);
  const context = createContext({ window: {}, Storage });
  for (let attempt = 0; attempt < 2; attempt++) {
    assert.equal(runInContext(setup, context), true, 'CDP must not serialize native Storage.prototype');
    assert.equal(new Storage().getItem(), 'ocean', 'old storage remains readable');
    assert.throws(() => new Storage().setItem('palette', 'forest'), /QA storage unavailable/);
    assert.equal(runInContext(cleanup, context), true);
    assert.deepEqual(Object.getOwnPropertyDescriptors(Storage.prototype), descriptors);
    assert.equal(Object.hasOwn(context.window, '__paletteStorageDescriptors'), false);
  }
});

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
test('crashed browser cleanup kills descendants that ignore SIGTERM',async t=>{
  assert.equal(process.platform,'linux','This process-group regression requires the Linux CI runner');
  const options=await fakeChrome(t,'orphan-child',`
const {spawn}=require('node:child_process');
const orphan=spawn(process.execPath,['-e',"process.on('SIGTERM',()=>{});process.stdout.write('ready');setInterval(()=>{},1000)"],{stdio:['ignore','pipe','ignore']});
orphan.stdout.once('data',()=>{orphan.stdout.destroy();process.exit(9);});
`);
  await assert.rejects(launchQaBrowser(options),error=>{
    assert.equal(error.diagnostics.exit.code,9);
    assert.ok(error.diagnostics.groupBeforeCleanup.some(p=>p.pid!==error.diagnostics.pid&&p.state!=='Z'));
    assert.equal(error.diagnostics.groupAfterCleanup.filter(p=>p.state!=='Z'&&p.state!=='X').length,0);
    assert.equal(error.diagnostics.profileRemoved,true);
    assert.equal(error.diagnostics.cleanupErrors.length,0);
    return true;
  });
  const result=JSON.parse(await readFile(join(options.artifactsDir,'browser-startup.json'),'utf8'));
  assert.equal((await processGroupMembers(result.pid)).filter(p=>p.state!=='Z'&&p.state!=='X').length,0);
  assert.ok(result.resourcesBefore.processLimits);
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
