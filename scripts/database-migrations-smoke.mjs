// Real PostgreSQL migration/RLS tests with simulated Supabase auth/storage schemas.
// No network, published ports, remote database URL, or live QA account is used.
import {spawn,spawnSync} from 'node:child_process';
import {randomUUID,createHash} from 'node:crypto';
import {readFile,readdir,mkdir,writeFile} from 'node:fs/promises';
import {setTimeout as delay} from 'node:timers/promises';
const container='noata-sql-qa-'+randomUUID();
const image='postgres:17-alpine@sha256:b0f9560a2de083e2cc7382e75f808c7381a32852a7ec49117deedb300e552b24';
const rateLimitMirror='public.ecr.aws/docker/library/postgres:17-alpine';
let runningImage=image;
const directory='artifacts/noata-database';
await mkdir(directory,{recursive:true});
const outcome={revision:spawnSync('git',['rev-parse','HEAD'],{encoding:'utf8'}).stdout.trim(),passed:false,
 dirty:!!spawnSync('git',['status','--porcelain'],{encoding:'utf8'}).stdout.trim(),
 scope:'Local PostgreSQL; simulated auth claims and storage schemas. Not live Supabase Auth, Storage or provider verification.',image,migrations:[],retentionApplied:false};
let log='',started=false;
function docker(args,input){
 const r=spawnSync('docker',args,{encoding:'utf8',input,maxBuffer:8*1024*1024,timeout:120000});
 log+=r.stdout??'';log+=r.stderr??'';
 if(r.error||r.status!==0)throw Error(`Docker ${args[0]} failed: ${r.error?.message||r.stderr||r.stdout}`);
 return r.stdout;
}
try{
 const startArgs=['run','--detach','--rm','--network','none','--memory','512m','--cpus','2','--name',container,'-e','POSTGRES_HOST_AUTH_METHOD=trust'];
 try{
   docker([...startArgs,image]);started=true;
 }catch(error){
   // Official Docker Hub's unauthenticated quota is independent of the test
   // result. Only that specific registry failure permits an ECR mirror.
   if(!/toomanyrequests|pull rate limit/i.test(String(error)))throw error;
   console.warn('Docker Hub pull quota reached. Trying the public AWS ECR mirror of the official PostgreSQL 17 image.');
   runningImage=rateLimitMirror;
   outcome.image=runningImage;
   outcome.imageMirrorFallback=true;
   docker([...startArgs,runningImage]);started=true;
 }
 let ready=false;
 for(let i=0;i<60;i++){
  // The image's temporary initialization server accepts only Unix sockets.
  // TCP readiness identifies the final server after that process exits.
  if(spawnSync('docker',['exec',container,'pg_isready','-h','127.0.0.1','-U','postgres'],{stdio:'ignore'}).status===0){ready=true;break;}
  await delay(250);
 }
 if(!ready)throw Error('Local PostgreSQL did not become ready');
 const bootstrap=await readFile('scripts/sql/local-supabase-fixture.sql','utf8');
 docker(['exec','-i',container,'psql','-U','postgres','-v','ON_ERROR_STOP=1'],bootstrap);
 const files=(await readdir('supabase/migrations')).filter(f=>f.endsWith('.sql')&&!f.endsWith('_private_ai_documents.sql')).sort();
 let sql='BEGIN;\n';
 for(const file of files){
  const source=await readFile('supabase/migrations/'+file,'utf8');
  outcome.migrations.push({file,sha256:createHash('sha256').update(source).digest('hex')});
  sql+=`\n\\echo Applying ${file}\n`+source+'\n';
 }
 sql+='COMMIT;\n';
 docker(['exec','-i',container,'psql','-U','postgres','-v','ON_ERROR_STOP=1'],sql);
 const tests=await readFile('scripts/sql/security-regressions.sql','utf8');
 const result=docker(['exec','-i',container,'psql','-U','postgres','-v','ON_ERROR_STOP=1'],tests);
 outcome.assertions=(result.match(/QA PASS:/g)||[]).length;
 // Two real PostgreSQL sessions hit the same idempotency key concurrently.
 docker(['exec','-i',container,'psql','-U','postgres','-v','ON_ERROR_STOP=1'],"insert into auth.users(id) values('00000000-0000-0000-0000-000000000010');");
 const concurrentQuery=`begin;set local role authenticated;set local request.jwt.claim.sub='00000000-0000-0000-0000-000000000010';
 select public.submit_attempt('05c00c64-b9b8-5736-b996-86dd82a3dd83','{"value":"1"}',false,'concurrent-same-answer',false);commit;`;
 const simultaneous=()=>new Promise((resolve,reject)=>{
  const p=spawn('docker',['exec','-i',container,'psql','-U','postgres','-At','-v','ON_ERROR_STOP=1'],{stdio:['pipe','pipe','pipe']});
  let output='',errors='';p.stdout.on('data',c=>{output+=c;});p.stderr.on('data',c=>{errors+=c;});p.on('error',reject);
  p.on('close',code=>{log+=output+errors;code===0?resolve(output):reject(Error('Concurrent PostgreSQL session failed: '+errors));});
  p.stdin.end(concurrentQuery);
 });
 const responses=await Promise.all([simultaneous(),simultaneous()]);
 const duplicates=responses.map(s=>JSON.parse(s.split('\n').find(line=>line.startsWith('{'))).duplicate).sort();
 if(JSON.stringify(duplicates)!=='[false,true]')throw Error('Concurrent attempts must return one original and one duplicate receipt');
 const count=docker(['exec','-i',container,'psql','-U','postgres','-At','-v','ON_ERROR_STOP=1'],"select count(*) from public.attempts where user_id='00000000-0000-0000-0000-000000000010';select count(*) from public.ledger where user_id='00000000-0000-0000-0000-000000000010';").trim();
 if(count!=='1\n1')throw Error('Concurrent attempt duplicated a grade or reward');
 outcome.assertions+=2;
 outcome.passed=true;console.log(`PASS: ${files.length} migrations; ${outcome.assertions} local PostgreSQL assertions`);
}catch(error){outcome.error=error.message;console.error(error);process.exitCode=1;}
finally{
 if(started){try{docker(['rm','--force',container]);}catch(error){outcome.passed=false;outcome.cleanupError=error.message;process.exitCode=1;}}
 await writeFile(directory+'/postgres.log',log);
 await writeFile(directory+'/outcome.json',JSON.stringify(outcome,null,2));
}
