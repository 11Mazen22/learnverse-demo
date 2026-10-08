// Keep complete artifacts; expose a bounded diagnostic excerpt in check
// annotations as well, so a denied artifact download cannot hide the cause.
import {readFile} from 'node:fs/promises';
const escape=value=>String(value).replaceAll('%','%25').replaceAll('\r','%0D').replaceAll('\n','%0A');
for(const directory of ['artifacts/noata-browser',...Array.from({length:3},(_,i)=>`artifacts/noata-browser-launch/session-${i}`)]){
  try{
    const diagnostic=JSON.parse(await readFile(directory+'/browser-startup.json','utf8'));
    const log=await readFile(directory+'/chromium.log','utf8');
    console.log(`::notice title=Chrome runtime diagnostics::${escape(JSON.stringify({directory,exit:diagnostic.exit,spawnError:diagnostic.spawnError,resourcesBefore:diagnostic.resourcesBefore,resourcesAtExit:diagnostic.resourcesAtExit,groupAfterCleanup:diagnostic.groupAfterCleanup,stderrTail:log.slice(-12000)}))}`);
  }catch(error){if(error.code!=='ENOENT')throw error;}
}
try{
  const result=JSON.parse(await readFile('artifacts/noata-browser/outcome.json','utf8'));
  if(!result.passed)console.log(`::error title=Browser QA failure::${escape(JSON.stringify(result.failure))}`);
}catch(error){if(error.code!=='ENOENT')throw error;}
