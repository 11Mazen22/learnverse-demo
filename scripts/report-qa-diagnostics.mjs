// Keep complete artifacts; expose a bounded diagnostic excerpt in check
// annotations as well, so a denied artifact download cannot hide the cause.
import {readFile} from 'node:fs/promises';
const escape=value=>String(value).replaceAll('%','%25').replaceAll('\r','%0D').replaceAll('\n','%0A');
const roots=['artifacts/noata-browser',...Array.from({length:3},(_,i)=>`artifacts/noata-browser-launch/session-${i}`)];
for(const directory of roots.flatMap(root=>[root+'/startup-attempt-1',root])){
  try{
    const diagnostic=JSON.parse(await readFile(directory+'/browser-startup.json','utf8'));
    const log=await readFile(directory+'/chromium.log','utf8');
    const compact=resource=>resource&&({...resource,processLimits:undefined});
    console.log(`::notice title=Chrome runtime diagnostics::${escape(JSON.stringify({directory,executablePath:diagnostic.executablePath,args:diagnostic.args,exit:diagnostic.exit,spawnError:diagnostic.spawnError,failedStartupAttempts:diagnostic.failedStartupAttempts,resourcesBefore:compact(diagnostic.resourcesBefore),resourcesAtExit:compact(diagnostic.resourcesAtExit),groupAfterCleanup:diagnostic.groupAfterCleanup}))}`);
    // GitHub's annotations API truncates long messages at approximately 4 KiB.
    // Emit separate bounded pieces; complete stderr remains in the artifact.
    const tail=log.slice(-12000);
    for(let offset=0;offset<tail.length;offset+=2000){
      console.log(`::notice title=Chrome stderr ${directory} ${offset/2000+1}::${escape(tail.slice(offset,offset+2000))}`);
    }
  }catch(error){if(error.code!=='ENOENT')throw error;}
}
try{
  const result=JSON.parse(await readFile('artifacts/noata-browser/outcome.json','utf8'));
  if(!result.passed)console.log(`::error title=Browser QA failure::${escape(JSON.stringify(result.failure))}`);
}catch(error){if(error.code!=='ENOENT')throw error;}
