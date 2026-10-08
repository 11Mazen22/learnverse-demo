// Full Chrome QA transport. Serverless PDF flags deliberately do not enter here.
import {spawn, spawnSync} from 'node:child_process';
import {mkdir, mkdtemp, readFile, readdir, rm, statfs, writeFile} from 'node:fs/promises';
import {createWriteStream} from 'node:fs';
import {finished} from 'node:stream/promises';
import {join} from 'node:path';
import {tmpdir, arch, release, freemem, totalmem, availableParallelism} from 'node:os';
import {setTimeout as delay} from 'node:timers/promises';
import {get} from 'node:http';
import {createRequire} from 'node:module';
const require=createRequire(new URL('../../apps/web/package.json',import.meta.url));
const WebSocket=require('ws');

export function findQaChrome(){
  return process.env.NOATA_CHROMIUM_PATH || ['google-chrome','google-chrome-stable','chromium','chromium-browser']
    .find(binary=>spawnSync('which',[binary],{stdio:'ignore'}).status===0);
}
export function diagnosticError(error,depth=0){
  if(!error)return null;
  if(depth>4)return String(error);
  return {name:error.name??'Error',message:error.message??String(error),stack:error.stack??null,code:error.code??null,statusCode:error.statusCode??null,
    cause:error.cause?diagnosticError(error.cause,depth+1):null,
    errors:error.errors?.map(e=>diagnosticError(e,depth+1))};
}
export const qaChromeArgs=profile=>[
  '--user-data-dir='+profile,'--headless=new','--no-sandbox','--disable-dev-shm-usage',
  '--disable-background-networking','--no-first-run','--no-default-browser-check',
  '--enable-logging=stderr','--v=1',
  '--remote-debugging-address=127.0.0.1','--remote-debugging-port=0','about:blank',
];

// Inspect only process metadata, never command lines or environment values.
export async function processGroupMembers(group){
  if(process.platform!=='linux'||!group)return [];
  const entries=await readdir('/proc');
  const rows=await Promise.all(entries.filter(name=>/^\d+$/.test(name)).map(async pid=>{
    try{
      const raw=await readFile(`/proc/${pid}/stat`,'utf8');
      const fields=raw.slice(raw.lastIndexOf(')')+2).split(' ');
      return Number(fields[2])===group?{pid:Number(pid),state:fields[0],parent:Number(fields[1]),threads:Number(fields[17])}:null;
    }catch{return null;}
  }));
  return rows.filter(Boolean);
}
async function resourceSnapshot(){
  const result={at:new Date().toISOString(),platform:process.platform,arch:arch(),kernel:release(),node:process.version,
    cpus:availableParallelism(),freeMemory:freemem(),totalMemory:totalmem(),limits:{},filesystems:{}};
  for(const name of ['pids.current','pids.max','memory.current','memory.max','memory.events']){
    try{result.limits[name]=(await readFile('/sys/fs/cgroup/'+name,'utf8')).trim();}catch{}
  }
  try{result.processLimits=await readFile('/proc/self/limits','utf8');}catch{}
  for(const path of [tmpdir(),'/dev/shm']){
    try{const s=await statfs(path);result.filesystems[path]={availableBytes:s.bavail*s.bsize,freeFiles:s.ffree};}catch{}
  }
  return result;
}

// DevTools is local-only. node:http and ws's direct agent do not inherit proxy
// dispatchers used by application fetch or NODE_USE_ENV_PROXY.
function loopbackJson(port,path){
  return new Promise((resolve,reject)=>{
    const request=get({hostname:'127.0.0.1',port,path,agent:false},response=>{
      if(response.statusCode!==200){response.resume();reject(Error(`Chrome ${path} returned HTTP ${response.statusCode}`));return;}
      let bytes=0,body='';response.setEncoding('utf8');
      response.on('data',chunk=>{bytes+=Buffer.byteLength(chunk);if(bytes>1024*1024)request.destroy(Error('Chrome discovery response exceeds 1 MiB'));else body+=chunk;});
      response.on('error',reject);response.on('end',()=>{try{resolve(JSON.parse(body));}catch(error){reject(error);}});
    });
    request.setTimeout(1500,()=>request.destroy(Error('Chrome loopback discovery timed out')));
    request.on('error',reject);
  });
}

export async function launchQaBrowser({executablePath=findQaChrome(),artifactsDir,startupTimeoutMs=30000,commandTimeoutMs=12000}={}){
  if(!executablePath)throw Error('Browser QA requires full Chrome; run scripts/install-qa-chrome.mjs or set NOATA_CHROMIUM_PATH');
  await mkdir(artifactsDir,{recursive:true});
  const root=await mkdtemp(join(tmpdir(),'noata-qa-chrome-'));
  const profile=join(root,'profile');
  await Promise.all(['profile','cache','config'].map(name=>mkdir(join(root,name))));
  const args=qaChromeArgs(profile);
  const diagnostics={executablePath,args,pid:null,profile,profileRemoved:false,startedAt:new Date().toISOString(),
    readyAt:null,port:null,version:null,spawnError:null,exit:null,webSocket:{url:null,error:null,close:null},
    lastReadinessError:null,commandTimeouts:[],lastCommand:null,cleanupErrors:[],proxyEnvironmentPresent:Object.fromEntries(['HTTP_PROXY','HTTPS_PROXY','ALL_PROXY','NO_PROXY','NODE_USE_ENV_PROXY'].map(name=>[name,Boolean(process.env[name])]))};
  diagnostics.resourcesBefore=await resourceSnapshot();
  const log=createWriteStream(join(artifactsDir,'chromium.log'),{flags:'w'});
  let logError;log.on('error',error=>{logError=error;});
  let stopping=false,terminalError,connectionReject,socket,nextId=0,exitResources;
  const pending=new Map();
  function fail(error){
    terminalError??=error;
    connectionReject?.(error);
    for(const item of pending.values())item.reject(error);
    pending.clear();
  }
  const child=spawn(executablePath,args,{stdio:['ignore','pipe','pipe'],detached:process.platform!=='win32',
    env:{...process.env,XDG_CACHE_HOME:join(root,'cache'),XDG_CONFIG_HOME:join(root,'config')}});
  diagnostics.pid=child.pid??null;
  child.stdout.on('data',chunk=>log.write(chunk));
  child.stderr.on('data',chunk=>log.write(chunk));
  child.on('error',error=>{diagnostics.spawnError=diagnosticError(error);fail(new Error('Chrome spawn failed: '+error.message,{cause:error}));});
  const exited=new Promise(resolve=>child.once('close',()=>resolve()));
  child.once('exit',(code,signal)=>{
    diagnostics.exit={code,signal,at:new Date().toISOString(),expected:stopping};
    exitResources=resourceSnapshot().then(value=>{diagnostics.resourcesAtExit=value;});
    if(!stopping)fail(Error(`Chrome exited unexpectedly: code=${code}, signal=${signal??'none'}`));
  });
  function command(method,params={},timeoutMs=commandTimeoutMs){
    if(terminalError)return Promise.reject(terminalError);
    if(socket?.readyState!==WebSocket.OPEN)return Promise.reject(Error('CDP socket is not open: '+method));
    return new Promise((resolve,reject)=>{
      const id=++nextId;
      const started=Date.now();
      diagnostics.lastCommand={method,id,startedAt:new Date(started).toISOString()};
      const timer=setTimeout(()=>{
        const timeout={method,id,timeoutMs,elapsedMs:Date.now()-started,pendingCount:pending.size,
          at:new Date().toISOString()};
        diagnostics.commandTimeouts.push(timeout);
        if(diagnostics.commandTimeouts.length>15)diagnostics.commandTimeouts.shift();
        pending.delete(id);
        reject(Error(`CDP timed out: ${method} (id=${id}, ${timeoutMs}ms, Chrome pid=${diagnostics.pid}, port=${diagnostics.port})`));
      },timeoutMs);
      pending.set(id,{resolve:value=>{clearTimeout(timer);resolve(value);},reject:error=>{clearTimeout(timer);reject(error);}});
      try{socket.send(JSON.stringify({id,method,params}));}catch(error){pending.delete(id);clearTimeout(timer);reject(error);}
    });
  }
  async function close(){
    stopping=true;
    for(const item of pending.values())item.reject(Error('QA browser is closing'));
    pending.clear();
    // Give a healthy browser a chance to reap its own renderer/zygote children.
    // Crash paths still terminate the entire isolated process group below.
    if(!terminalError&&socket?.readyState===WebSocket.OPEN){
      try{socket.send(JSON.stringify({id:++nextId,method:'Browser.close'}));await Promise.race([exited,delay(1000)]);}
      catch(error){diagnostics.cleanupErrors.push(diagnosticError(error));}
    }
    try{socket?.terminate();}catch(error){diagnostics.cleanupErrors.push(diagnosticError(error));}
    const terminate=signal=>{
      if(!child.pid)return;
      // A crashed browser parent can leave renderer/zygote descendants alive.
      try{if(process.platform==='win32'){if(child.exitCode===null&&child.signalCode===null)child.kill(signal);}else process.kill(-child.pid,signal);}
      catch(error){if(error.code!=='ESRCH')diagnostics.cleanupErrors.push(diagnosticError(error));}
    };
    const liveMembers=async()=>(await processGroupMembers(child.pid)).filter(p=>p.state!=='Z'&&p.state!=='X');
    const waitForGroup=async ms=>{
      const until=Date.now()+ms;
      while((await liveMembers()).length&&Date.now()<until)await delay(50);
    };
    diagnostics.groupBeforeCleanup=await processGroupMembers(child.pid);
    terminate('SIGTERM');
    if(process.platform==='linux'){
      await waitForGroup(3000);
      // Parent exit is insufficient: descendants may ignore SIGTERM.
      if((await liveMembers()).length){terminate('SIGKILL');await waitForGroup(1000);}
      diagnostics.groupAfterCleanup=await processGroupMembers(child.pid);
      if((await liveMembers()).length)diagnostics.cleanupErrors.push(diagnosticError(Error('Live Chrome descendants survived process-group cleanup')));
    }else{
      await Promise.race([exited,delay(3000)]);
      if(child.exitCode===null&&child.signalCode===null&&child.pid){terminate('SIGKILL');await Promise.race([exited,delay(1000)]);}
    }
    await Promise.race([exited,delay(1000)]);
    await exitResources;
    log.end();await finished(log).catch(error=>{logError??=error;});
    try{await rm(root,{recursive:true,force:true,maxRetries:3,retryDelay:100});diagnostics.profileRemoved=true;}
    catch(error){diagnostics.cleanupErrors.push(diagnosticError(error));}
    if(logError)diagnostics.cleanupErrors.push(diagnosticError(logError));
    await writeFile(join(artifactsDir,'browser-startup.json'),JSON.stringify(diagnostics,null,2));
    if(diagnostics.cleanupErrors.length)throw Error('QA browser cleanup failed; inspect browser-startup.json');
  }
  try{
    const until=Date.now()+startupTimeoutMs;
    let tab;
    while(Date.now()<until){
      if(terminalError)throw terminalError;
      if(logError)throw logError;
      try{
        const active=(await readFile(join(profile,'DevToolsActivePort'),'utf8')).trim().split('\n');
        const port=Number(active[0]);
        if(!Number.isInteger(port)||port<1||port>65535||!active[1]?.startsWith('/devtools/browser/'))throw Error('Invalid Chrome DevToolsActivePort');
        diagnostics.port=port;
        const version=await loopbackJson(port,'/json/version');
        if(new URL(version.webSocketDebuggerUrl).pathname!==active[1])throw Error('Chrome endpoint does not match this isolated profile');
        diagnostics.version=version;
        tab=(await loopbackJson(port,'/json/list')).find(t=>t.type==='page'&&t.webSocketDebuggerUrl);
        if(!tab)throw Error('Chrome has no page target yet');
        const target=new URL(tab.webSocketDebuggerUrl);
        if(target.protocol!=='ws:'||!['127.0.0.1','localhost','[::1]'].includes(target.hostname)||Number(target.port)!==port)throw Error('Chrome page target is outside the isolated loopback endpoint');
        break;
      }catch(error){diagnostics.lastReadinessError=diagnosticError(error);}
      await delay(100);
    }
    if(!tab)throw Error('Chrome debugger startup timed out; last error: '+diagnostics.lastReadinessError?.message);
    diagnostics.webSocket.url=tab.webSocketDebuggerUrl;
    socket=new WebSocket(tab.webSocketDebuggerUrl,{agent:false,followRedirects:false,handshakeTimeout:10000,perMessageDeflate:false,maxPayload:64*1024*1024});
    socket.on('unexpected-response',(_request,response)=>{
      const error=Error(`Chrome CDP handshake rejected: HTTP ${response.statusCode} ${response.statusMessage}`);
      error.statusCode=response.statusCode;
      diagnostics.webSocket.error=diagnosticError(error);
      fail(new Error('Chrome CDP WebSocket failed: '+error.message,{cause:error}));
      response.resume();socket.terminate();
    });
    socket.addEventListener('error',event=>{
      const error=event.error??Error(event.message||'WebSocket error with no platform details');
      diagnostics.webSocket.error??=diagnosticError(error);
      if(!stopping)fail(new Error('Chrome CDP WebSocket failed: '+error.message,{cause:error}));
    });
    socket.addEventListener('close',event=>{
      diagnostics.webSocket.close={code:event.code,reason:event.reason,wasClean:event.wasClean,expected:stopping};
      if(!stopping)fail(Error(`Chrome CDP closed: code=${event.code}, reason=${event.reason||'none'}, clean=${event.wasClean}`));
    });
    socket.addEventListener('message',({data})=>{
      try{
        const message=JSON.parse(String(data));
        const item=pending.get(message.id);
        if(!item)return;
        pending.delete(message.id);
        if(message.error)item.reject(Error('CDP response: '+JSON.stringify(message.error)));
        else item.resolve(message.result);
      }catch(error){fail(new Error('Invalid CDP message',{cause:error}));}
    });
    await new Promise((resolve,reject)=>{
      const timer=setTimeout(()=>reject(Error('Chrome CDP WebSocket handshake timed out: '+tab.webSocketDebuggerUrl)),10000);
      connectionReject=error=>{clearTimeout(timer);reject(error);};
      socket.addEventListener('open',()=>{clearTimeout(timer);connectionReject=undefined;resolve();},{once:true});
      if(terminalError)connectionReject(terminalError);
    });
    await command('Browser.getVersion');
    diagnostics.readyAt=new Date().toISOString();
    await writeFile(join(artifactsDir,'browser-startup.json'),JSON.stringify(diagnostics,null,2));
    return {socket,command,close,diagnostics,process:child};
  }catch(error){
    try{await close();}catch(cleanupError){diagnostics.cleanupErrors.push(diagnosticError(cleanupError));}
    const failure=new Error(error.message+'; inspect chromium.log and browser-startup.json',{cause:error});
    failure.diagnostics=diagnostics;
    throw failure;
  }
}
