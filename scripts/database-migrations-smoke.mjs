// Real PostgreSQL migration/RLS tests with simulated Supabase auth/storage schemas.
// No network, published ports, remote database URL, or live QA account is used.
import {spawn,spawnSync} from 'node:child_process';
import {randomUUID,createHash} from 'node:crypto';
import {readFile,readdir,mkdir,writeFile} from 'node:fs/promises';
import {setTimeout as delay} from 'node:timers/promises';
import {runFixtureRecovery} from './database-recovery-rehearsal.mjs';
const container='noata-sql-qa-'+randomUUID();
const image='postgres:17-alpine@sha256:b0f9560a2de083e2cc7382e75f808c7381a32852a7ec49117deedb300e552b24';
const rateLimitMirror='public.ecr.aws/docker/library/postgres:17-alpine';
let runningImage=image;
const directory='artifacts/noata-database';
await mkdir(directory,{recursive:true});
const outcome={revision:spawnSync('git',['rev-parse','HEAD'],{encoding:'utf8'}).stdout.trim(),passed:false,
 dirty:!!spawnSync('git',['status','--porcelain'],{encoding:'utf8'}).stdout.trim(),
 scope:'Local PostgreSQL; simulated auth claims and storage schemas. Not live Supabase Auth, Storage or provider verification.',image,migrations:[],retentionApplied:false};
let log='',started=false,engine='docker',localStarted=false;
function docker(args,input){
 const r=spawnSync('docker',args,{encoding:'utf8',input,maxBuffer:8*1024*1024,timeout:120000});
 log+=r.stdout??'';log+=r.stderr??'';
 if(r.error||r.status!==0)throw Error(`Docker ${args[0]} failed: ${r.error?.message||r.stderr||r.stdout}`);
 return r.stdout;
}
function postgres(args,input){
  if(engine==='docker')return docker(['exec','-i',container,'psql','-U','postgres',...args],input);
  const r=spawnSync('sudo',['-n','-u','postgres','psql',...args],{
    encoding:'utf8',input,maxBuffer:8*1024*1024,timeout:120000
  });
  log+=r.stdout??'';log+=r.stderr??'';
  if(r.error||r.status!==0)throw Error('Local PostgreSQL failed: '+(r.error?.message||r.stderr||r.stdout));
  return r.stdout;
}
function startLocalPostgres(){
  const r=spawnSync('sudo',['-n','systemctl','start','postgresql.service'],{
    encoding:'utf8',timeout:30000
  });
  log+=r.stdout??'';log+=r.stderr??'';
  if(r.error||r.status!==0)throw Error('Runner PostgreSQL could not start: '+(r.error?.message||r.stderr));
  engine='local';localStarted=true;started=true;
  const version=spawnSync('psql',['--version'],{encoding:'utf8'}).stdout.trim();
  outcome.image='runner-preinstalled-'+version;
  outcome.localRunnerFallback=true;
  console.warn('Using isolated GitHub runner PostgreSQL service; version recorded in QA evidence.');
}
try{
 const startArgs=['run','--detach','--rm','--network','none','--memory','512m','--cpus','2','--name',container,'-e','POSTGRES_HOST_AUTH_METHOD=trust'];
 try{
   docker([...startArgs,image]);started=true;
 }catch(error){
   // Registry throttling and transport timeouts are external to PostgreSQL
   // migration correctness. Do not mask SQL or Docker runtime failures.
   if(!/(?:toomanyrequests|pull rate limit|rate exceeded|context deadline exceeded|Client\.Timeout|TLS handshake timeout|i\/o timeout|connection reset)/i.test(String(error)))throw error;
   console.warn('Docker Hub registry unavailable or throttled. Trying the public AWS ECR mirror of PostgreSQL 17.');
   runningImage=rateLimitMirror;
   outcome.image=runningImage;
   outcome.imageMirrorFallback=true;
   try{
     docker([...startArgs,runningImage]);started=true;
   }catch(mirrorError){
     if(!/(?:toomanyrequests|pull rate limit|rate exceeded|context deadline exceeded|Client\.Timeout|TLS handshake timeout|i\/o timeout|connection reset)/i.test(String(mirrorError)))throw mirrorError;
     startLocalPostgres();
   }
 }
 let ready=false;
 for(let i=0;i<60;i++){
  // The image's temporary initialization server accepts only Unix sockets.
  // TCP readiness identifies the final server after that process exits.
  const check=engine==='docker'
    ? spawnSync('docker',['exec',container,'pg_isready','-h','127.0.0.1','-U','postgres'],{stdio:'ignore'})
    : spawnSync('sudo',['-n','-u','postgres','pg_isready'],{stdio:'ignore'});
  if(check.status===0){ready=true;break;}
  await delay(250);
 }
 if(!ready)throw Error('Local PostgreSQL did not become ready');
 const bootstrap=await readFile('scripts/sql/local-supabase-fixture.sql','utf8');
 postgres(['-v','ON_ERROR_STOP=1'],bootstrap);
 const files=(await readdir('supabase/migrations')).filter(f=>f.endsWith('.sql')&&!f.endsWith('_private_ai_documents.sql')).sort();
 let sql='BEGIN;\n';
 for(const file of files){
  const source=await readFile('supabase/migrations/'+file,'utf8');
  outcome.migrations.push({file,sha256:createHash('sha256').update(source).digest('hex')});
  sql+=`\n\\echo Applying ${file}\n`+source+'\n';
 }
 sql+='COMMIT;\n';
 postgres(['-v','ON_ERROR_STOP=1'],sql);
 const tests=await readFile('scripts/sql/security-regressions.sql','utf8');
 const result=postgres(['-v','ON_ERROR_STOP=1'],tests);
 outcome.assertions=(result.match(/QA PASS:/g)||[]).length;
 // Two real PostgreSQL sessions hit the same idempotency key concurrently.
 postgres(['-v','ON_ERROR_STOP=1'],"insert into auth.users(id) values('00000000-0000-0000-0000-000000000010');");
 const concurrentQuery=`begin;set local role authenticated;set local request.jwt.claim.sub='00000000-0000-0000-0000-000000000010';
 select public.submit_attempt('05c00c64-b9b8-5736-b996-86dd82a3dd83','{"value":"1"}',false,'concurrent-same-answer',false);commit;`;
 const simultaneous=()=>new Promise((resolve,reject)=>{
  const p=spawn(engine==='docker'?'docker':'sudo',engine==='docker'
   ? ['exec','-i',container,'psql','-U','postgres','-At','-v','ON_ERROR_STOP=1']
   : ['-n','-u','postgres','psql','-At','-v','ON_ERROR_STOP=1'],{stdio:['pipe','pipe','pipe']});
  let output='',errors='';p.stdout.on('data',c=>{output+=c;});p.stderr.on('data',c=>{errors+=c;});p.on('error',reject);
  p.on('close',code=>{log+=output+errors;code===0?resolve(output):reject(Error('Concurrent PostgreSQL session failed: '+errors));});
  p.stdin.end(concurrentQuery);
 });
 const responses=await Promise.all([simultaneous(),simultaneous()]);
 const duplicates=responses.map(s=>JSON.parse(s.split('\n').find(line=>line.startsWith('{'))).duplicate).sort();
 if(JSON.stringify(duplicates)!=='[false,true]')throw Error('Concurrent attempts must return one original and one duplicate receipt');
 const count=postgres(['-At','-v','ON_ERROR_STOP=1'],"select count(*) from public.attempts where user_id='00000000-0000-0000-0000-000000000010';select count(*) from public.ledger where user_id='00000000-0000-0000-0000-000000000010';").trim();
 if(count!=='1\n1')throw Error('Concurrent attempt duplicated a grade or reward');
 outcome.assertions+=2;
 const pgDump=args=>{
  if(engine==='docker')return docker(['exec',container,'pg_dump','-U','postgres',...args]);
  const result=spawnSync('sudo',['-n','-u','postgres','pg_dump',...args],{encoding:'utf8',maxBuffer:8*1024*1024,timeout:120000});
  if(result.error||result.status!==0)throw Error('Isolated fixture pg_dump failed');
  return result.stdout;
 };
 await runFixtureRecovery({postgres,pgDump,directory:'artifacts/noata-recovery-fixture',revision:outcome.revision,dirty:outcome.dirty});
 outcome.passed=true;console.log(`PASS: ${files.length} migrations; ${outcome.assertions} local PostgreSQL assertions`);
}catch(error){outcome.error=error.message;console.error(error);process.exitCode=1;}
finally{
 if(started){
   try{
     if(engine==='docker')docker(['rm','--force',container]);
     else if(localStarted){
       const stop=spawnSync('sudo',['-n','systemctl','stop','postgresql.service'],{encoding:'utf8',timeout:20000});
       if(stop.status!==0)throw Error('Unable to stop runner-local PostgreSQL service');
     }
   }catch(error){outcome.passed=false;outcome.cleanupError=error.message;process.exitCode=1;}
 }
 await writeFile(directory+'/postgres.log',log);
 await writeFile(directory+'/outcome.json',JSON.stringify(outcome,null,2));
}
