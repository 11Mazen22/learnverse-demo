// Source-fixture recovery only. Never connect this helper to a remote database.
// Called by the already isolated database smoke runner; no live data or Auth.
import assert from 'node:assert/strict';
import {readFile,readdir,writeFile,mkdir} from 'node:fs/promises';
import {createHash,randomUUID} from 'node:crypto';

export async function runFixtureRecovery({postgres,pgDump,directory,revision,dirty}) {
 const outcome={revision,dirty,passed:false,scope:'Isolated PostgreSQL source fixture with simulated Supabase schemas and synthetic users. NOT a production backup, production-compatible copy, hosted Auth or production disaster-recovery verification.',productionBackupVerified:false,productionDataUsed:false,checks:[]};
 await mkdir(directory,{recursive:true});
 const suffix=randomUUID().replaceAll('-','');
 const baseline='noata_baseline_'+suffix, restored='noata_restore_'+suffix;
 const query=(db,sql)=>postgres(['-X','-A','-t','-d',db,'-v','ON_ERROR_STOP=1'],sql).trim();
 const pass=name=>{outcome.checks.push(name);console.log('FIXTURE PASS: '+name);};
 const created=[];
 try {
  const files=(await readdir('supabase/migrations')).filter(f=>f.endsWith('.sql')&&!f.endsWith('_private_ai_documents.sql')).sort();
  const before=files.filter(f=>f<'20261008170000'), delta=files.filter(f=>f>='20261008170000');
  assert.equal(before.length,18);assert.equal(delta.length,5);
  outcome.baselineMigrations=before;outcome.deltaMigrations=[];
  const infrastructure=(await readFile('scripts/sql/local-supabase-fixture.sql','utf8')).replace(/^create role .*;\r?\n/gm,'');
  query('postgres',`CREATE DATABASE ${baseline} TEMPLATE template0;`);created.push(baseline);
  query(baseline,infrastructure);
  query(baseline,'BEGIN;\n'+(await Promise.all(before.map(f=>readFile('supabase/migrations/'+f,'utf8')))).join('\n')+'\nCOMMIT;');
  query(baseline,`
   INSERT INTO auth.users(id) VALUES
    ('00000000-0000-0000-0000-000000000020'),('00000000-0000-0000-0000-000000000021'),
    ('00000000-0000-0000-0000-000000000022'),('00000000-0000-0000-0000-000000000023');
   UPDATE public.profiles SET role='teacher' WHERE id='00000000-0000-0000-0000-000000000022';
   UPDATE public.profiles SET role='admin' WHERE id='00000000-0000-0000-0000-000000000023';
   INSERT INTO public.classes(id,slug,name,grade_label,academic_year) VALUES
    ('00000000-0000-0000-0000-000000000030','recovery-fixture','Synthetic recovery class','QA','QA');
   INSERT INTO public.class_memberships(class_id,student_id) VALUES
    ('00000000-0000-0000-0000-000000000030','00000000-0000-0000-0000-000000000020');
   INSERT INTO public.teacher_class_access(class_id,teacher_id) VALUES
    ('00000000-0000-0000-0000-000000000030','00000000-0000-0000-0000-000000000022');
   INSERT INTO public.ledger(user_id,currency,amount,reason,idempotency_key) VALUES
    ('00000000-0000-0000-0000-000000000020','XP',500,'FIXTURE','restore-xp'),
    ('00000000-0000-0000-0000-000000000020','COIN',750,'FIXTURE','restore-coin');
   INSERT INTO public.lesson_progress(user_id,lesson_id,best_score,completed_at)
    SELECT '00000000-0000-0000-0000-000000000020',id,70,now() FROM public.lessons ORDER BY id LIMIT 1;
  `);
  const columns=JSON.parse(query(baseline,`SELECT json_agg(t ORDER BY t.schema,t.name) FROM
   (SELECT table_schema AS schema,table_name AS name,array_agg(column_name ORDER BY ordinal_position) AS columns
    FROM information_schema.columns WHERE table_schema IN ('public','auth','storage')
    AND table_name IN (SELECT tablename FROM pg_tables WHERE schemaname IN ('public','auth','storage'))
    GROUP BY table_schema,table_name) t;`));
  const ident=s=>'"'+s.replaceAll('"','""')+'"';
  const fingerprint=db=>columns.map(t=>({table:t.schema+'.'+t.name,value:query(db,`SELECT count(*)||':'||md5(coalesce(string_agg(row_to_json(s)::text,E'\\n' ORDER BY row_to_json(s)::text),'')) FROM (SELECT ${t.columns.map(ident).join(',')} FROM ${ident(t.schema)}.${ident(t.name)}) s;`)}));
  const original=fingerprint(baseline);
  const dump=pgDump(['-d',baseline,'--format=plain','--no-owner']);
  const backup=directory+'/source-fixture-backup.sql';
  await writeFile(backup,dump);
  outcome.fixtureBackup={file:backup,sha256:createHash('sha256').update(dump).digest('hex'),bytes:Buffer.byteLength(dump),containsProductionData:false};
  query('postgres',`CREATE DATABASE ${restored} TEMPLATE template0;`);created.push(restored);
  query(restored,dump);
  assert.deepEqual(fingerprint(restored),original);pass('Initial fixture dump restored with identical row counts and original-column fingerprints');
  const schemaFingerprint=db=>query(db,`SELECT md5(string_agg(x,E'\\n' ORDER BY x)) FROM (
   SELECT 'column:'||table_schema||'.'||table_name||'.'||column_name||':'||data_type AS x FROM information_schema.columns WHERE table_schema IN ('public','private','auth','storage')
   UNION ALL SELECT 'policy:'||schemaname||'.'||tablename||'.'||policyname||':'||coalesce(qual,'')||':'||coalesce(with_check,'') FROM pg_policies WHERE schemaname IN ('public','private','auth','storage')
   UNION ALL SELECT 'function:'||n.nspname||'.'||p.proname||':'||pg_get_functiondef(p.oid)||':'||coalesce(p.proacl::text,'') FROM pg_proc p JOIN pg_namespace n ON n.oid=p.pronamespace WHERE n.nspname IN ('public','private','auth','storage') AND p.prokind='f'
   UNION ALL SELECT 'relation:'||n.nspname||'.'||c.relname||':'||c.relrowsecurity||':'||coalesce(c.relacl::text,'') FROM pg_class c JOIN pg_namespace n ON n.oid=c.relnamespace WHERE n.nspname IN ('public','private','auth','storage') AND c.relkind='r'
   UNION ALL SELECT 'constraint:'||n.nspname||'.'||c.relname||'.'||k.conname||':'||pg_get_constraintdef(k.oid) FROM pg_constraint k JOIN pg_class c ON c.oid=k.conrelid JOIN pg_namespace n ON n.oid=c.relnamespace WHERE n.nspname IN ('public','private','auth','storage')
   ) a;`);
  const originalSchema=schemaFingerprint(restored);
  assert.equal(originalSchema,schemaFingerprint(baseline));pass('Restore preserves fixture functions, RLS policies, grants and constraints');
  const deltaSql=[];
  for(const file of delta){const sql=await readFile('supabase/migrations/'+file,'utf8');deltaSql.push(sql);outcome.deltaMigrations.push({file,sha256:createHash('sha256').update(sql).digest('hex')});}
  // Rehearse a transaction failure after real migration DDL. A closed psql
  // connection rolls back the failed transaction rather than committing it.
  assert.throws(()=>query(restored,'BEGIN;\n'+deltaSql.join('\n')+'\nSELECT 1/0; COMMIT;'));
  assert.equal(schemaFingerprint(restored),originalSchema);assert.deepEqual(fingerprint(restored),original);
  pass('Injected migration failure rolls back all five deltas and preserves original rows/privileges');
  query(restored,'BEGIN;\n'+deltaSql.join('\n')+'\nCOMMIT;');
  assert.deepEqual(fingerprint(restored),original);pass('Five deltas preserve every preexisting fixture row and original column');
  assert.equal(query(restored,`SELECT xp||':'||coins||':'||gems FROM public.profiles WHERE id='00000000-0000-0000-0000-000000000020';`),'500:750:0');
  assert.equal(query(restored,`SELECT count(*) FROM public.ledger WHERE currency='GEM';`),'0');
  pass('XP=500 and Coins=750 unchanged; zero Gems and no retroactive rewards');
  assert.equal(query(restored,`SELECT count(*) FROM pg_tables WHERE schemaname='public' AND NOT rowsecurity;`),'0');pass('All public fixture tables retain RLS');
  assert.equal(query(restored,`SELECT has_function_privilege('anon','public.submit_attempt(uuid,jsonb,boolean,text,boolean)','EXECUTE');`),'f');
  assert.equal(query(restored,`SELECT has_function_privilege('authenticated','private.submit_attempt_internal(uuid,jsonb,boolean,text,boolean)','EXECUTE');`),'f');
  assert.equal(query(restored,`SELECT has_column_privilege('authenticated','public.profiles','gems','UPDATE');`),'f');
  pass('Anonymous grading, direct internal grading and client Gem balance writes denied');
  const asUser=(id,sql)=>query(restored,`BEGIN;SET LOCAL ROLE authenticated;SET LOCAL request.jwt.claim.sub='${id}';${sql};ROLLBACK;`);
  // Quiet mode leaves only the query's result, making role scope measurable.
  const roleCount=(id)=>asUser(id,`SELECT count(*) FROM public.profiles WHERE id IN ('00000000-0000-0000-0000-000000000020','00000000-0000-0000-0000-000000000021')`).split(/\r?\n/).find(x=>/^\d+$/.test(x));
  assert.equal(roleCount('00000000-0000-0000-0000-000000000020'),'1');
  assert.equal(roleCount('00000000-0000-0000-0000-000000000022'),'1');
  assert.equal(roleCount('00000000-0000-0000-0000-000000000023'),'2');
  pass('Simulated student sees self; teacher sees assigned student only; admin sees both');
  assert.equal(query(restored,`SELECT count(*) FROM public.user_settings WHERE palette IS NOT NULL OR active_design_id IS NOT NULL;`),'0');
  pass('Existing settings preserve NULL palette and active-design fallback');
  const learning=(id,key)=>query(restored,`BEGIN;SET LOCAL ROLE authenticated;SET LOCAL request.jwt.claim.sub='${id}';SELECT public.submit_attempt('05c00c64-b9b8-5736-b996-86dd82a3dd83','{"value":"1"}',false,'${key}',false);COMMIT;`).split(/\r?\n/).find(x=>x.startsWith('{'));
  const student='00000000-0000-0000-0000-000000000020';
  assert.equal(JSON.parse(learning(student,'restored-learning-attempt')).duplicate,false);
  const rewarded=query(restored,`SELECT xp||':'||coins||':'||gems FROM public.profiles WHERE id='${student}';`);
  assert.equal(JSON.parse(learning(student,'restored-learning-attempt')).duplicate,true);
  assert.equal(query(restored,`SELECT xp||':'||coins||':'||gems FROM public.profiles WHERE id='${student}';`),rewarded);
  assert.equal(query(restored,`SELECT count(*) FROM public.attempts WHERE user_id='${student}' AND idempotency_key='restored-learning-attempt';`),'1');
  pass('Restored incremental schema grades through the public RPC and prevents duplicate grades/rewards');
  const own=(id,sql)=>query(restored,`BEGIN;SET LOCAL ROLE authenticated;SET LOCAL request.jwt.claim.sub='${id}';${sql};COMMIT;`);
  const other='00000000-0000-0000-0000-000000000021';
  own(student,`INSERT INTO public.user_theme_designs(id,user_id,name,tokens) VALUES('00000000-0000-0000-0000-000000000040','${student}','QA owner','{"primary":"#123456"}')`);
  own(other,`INSERT INTO public.user_theme_designs(id,user_id,name,tokens) VALUES('00000000-0000-0000-0000-000000000041','${other}','QA other','{"primary":"#abcdef"}')`);
  own(student,`UPDATE public.user_settings SET active_design_id='00000000-0000-0000-0000-000000000040' WHERE user_id='${student}'`);
  assert.throws(()=>own(student,`UPDATE public.user_settings SET active_design_id='00000000-0000-0000-0000-000000000041' WHERE user_id='${student}'`));
  assert.equal(query(restored,`SELECT active_design_id::text FROM public.user_settings WHERE user_id='${student}';`),'00000000-0000-0000-0000-000000000040');
  assert.equal(asUser(student,`SELECT count(*) FROM public.user_theme_designs WHERE user_id='${other}'`).split(/\r?\n/).find(x=>/^\d+$/.test(x)),'0');
  pass('Owned design persists; cross-owner active reference and cross-account design reads denied');
  const palettes=['classic','aura','ocean','forest','sunset','rose','midnight'];
  for(const palette of palettes){own(student,`UPDATE public.user_settings SET palette='${palette}' WHERE user_id='${student}'`);assert.equal(query(restored,`SELECT palette FROM public.user_settings WHERE user_id='${student}';`),palette);}
  assert.throws(()=>own(student,`UPDATE public.user_settings SET palette='invalid' WHERE user_id='${student}'`));
  pass('All seven palette values persist; invalid palette rejected in restored incremental schema');
  outcome.applicationSqlAssertions=15;
  query('postgres',`DROP DATABASE ${restored};`);created.splice(created.indexOf(restored),1);
  query('postgres',`CREATE DATABASE ${restored} TEMPLATE template0;`);created.push(restored);
  query(restored,dump);
  assert.equal(schemaFingerprint(restored),originalSchema);assert.deepEqual(fingerprint(restored),original);
  pass('Full fixture backup restore returns post-migration database to original data/schema/RLS/grants');
  outcome.originalTableFingerprints=original;outcome.originalSchemaFingerprint=originalSchema;
  outcome.passed=true;
 } catch(error){outcome.error=error.message;throw error;}
 finally {
  for(const db of created.reverse())try{query('postgres',`DROP DATABASE ${db};`);}catch(error){outcome.passed=false;outcome.cleanupError=error.message;}
  await writeFile(directory+'/outcome.json',JSON.stringify(outcome,null,2));
 }
 if(!outcome.passed)throw Error('Fixture recovery cleanup failed');
 console.log(`PASS: source-fixture recovery (${outcome.checks.length} checks, ${outcome.applicationSqlAssertions} application SQL assertions). Production recovery remains NOT TESTED.`);
 return outcome;
}
