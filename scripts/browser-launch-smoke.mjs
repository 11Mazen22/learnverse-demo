// Real full-Chrome startup, collision isolation and abrupt-disconnect verification.
import assert from 'node:assert/strict';
import {launchQaBrowser} from './lib/qa-browser.mjs';
import {mkdir,writeFile} from 'node:fs/promises';
import {spawnSync} from 'node:child_process';
const sessions=[];let failure;
await mkdir('artifacts/noata-browser-launch',{recursive:true});
try{
  const launches=await Promise.allSettled(Array.from({length:3},(_,i)=>launchQaBrowser({artifactsDir:`artifacts/noata-browser-launch/session-${i}`})));
  for(const result of launches){if(result.status==='fulfilled')sessions.push(result.value);else failure??=result.reason;}
  if(failure)throw failure;
  assert.equal(new Set(sessions.map(s=>s.diagnostics.port)).size,3,'Simultaneous Chrome sessions must have distinct ports');
  assert.equal(new Set(sessions.map(s=>s.diagnostics.profile)).size,3,'Chrome profiles must be isolated');
  for(const session of sessions){
    const result=await session.command('Runtime.evaluate',{expression:'document.body.innerHTML="<h1>اختبار تشغيل Chrome</h1>";document.body.innerText',returnByValue:true});
    assert.match(result.result.value,/اختبار تشغيل Chrome/);
  }
  // A never-settling JS promise should time out one CDP command, while
  // leaving the browser connection usable for subsequent commands.
  const healthy=sessions[1];
  await assert.rejects(
    healthy.command('Runtime.evaluate',{expression:'new Promise(()=>{})',awaitPromise:true},400),
    /CDP timed out: Runtime\.evaluate/
  );
  const recovered=await healthy.command('Runtime.evaluate',{expression:'6*7',returnByValue:true});
  assert.equal(recovered.result.value,42,'CDP must recover after one command times out');
  assert.equal(healthy.diagnostics.commandTimeouts.at(-1)?.method,'Runtime.evaluate');
  const interrupted=sessions[0];
  const pending=interrupted.command('Runtime.evaluate',{expression:'new Promise(()=>{})',awaitPromise:true},30000);
  const rejected=assert.rejects(pending,/Chrome (exited unexpectedly|CDP closed|CDP WebSocket failed)/);
  interrupted.process.kill('SIGKILL');
  await rejected;
  console.log('PASS: three isolated full-Chrome sessions, timeout recovery, Arabic DOM and immediate crash propagation');
}catch(error){failure=error;console.error(error);}
finally{
  for(const session of sessions){try{await session.close();}catch(error){failure??=error;console.error(error);}}
  await writeFile('artifacts/noata-browser-launch/outcome.json',JSON.stringify({revision:spawnSync('git',['rev-parse','HEAD'],{encoding:'utf8'}).stdout.trim(),passed:!failure,failure:failure?.message??null,scope:'Three real startup sessions; session 0 is intentionally killed to assert immediate crash propagation',diagnostics:sessions.map(s=>s.diagnostics)},null,2));
}
if(failure)process.exitCode=1;
