\set ON_ERROR_STOP on
begin;
create schema qa;
grant usage on schema qa to anon,authenticated,service_role;
create function qa.check(ok boolean,label text) returns text language plpgsql as $$
begin if ok is distinct from true then raise exception 'QA FAIL: %',label; end if;return 'QA PASS: '||label;end;
$$;
create function qa.denied(statement text,label text,expected_message text default null) returns text language plpgsql as $$
begin
  begin execute statement;exception when others then
    if sqlstate='42501' or (sqlstate='P0001' and sqlerrm=expected_message) then return 'QA PASS: '||label;end if;
    raise;
  end;
  raise exception 'QA FAIL: operation was allowed: %',label;
end;
$$;
create function qa.invalid(statement text,label text) returns text language plpgsql as $$
begin
  begin execute statement;exception when invalid_parameter_value then return 'QA PASS: '||label;end;
  raise exception 'QA FAIL: invalid operation was allowed: %',label;
end;
$$;
-- Dedicated local identities only. Metadata must never promote their roles.
insert into auth.users(id,raw_user_meta_data) values
 ('00000000-0000-0000-0000-000000000001','{"role":"admin","display_name":"Local student A"}'),
 ('00000000-0000-0000-0000-000000000002','{"display_name":"Local student B"}'),
 ('00000000-0000-0000-0000-000000000003','{"display_name":"Local teacher A"}'),
 ('00000000-0000-0000-0000-000000000004','{"display_name":"Local teacher B"}'),
 ('00000000-0000-0000-0000-000000000005','{"display_name":"Local admin"}');
select qa.check((select role='student' from public.profiles where id='00000000-0000-0000-0000-000000000001'),'signup metadata cannot escalate role');
update public.profiles set role='teacher' where id in ('00000000-0000-0000-0000-000000000003','00000000-0000-0000-0000-000000000004');
update public.profiles set role='admin' where id='00000000-0000-0000-0000-000000000005';
insert into public.classes(id,slug,name,grade_label,academic_year) values
 ('10000000-0000-0000-0000-000000000001','qa-a','QA A','QA','QA'),
 ('10000000-0000-0000-0000-000000000002','qa-b','QA B','QA','QA');
insert into public.class_memberships(class_id,student_id) values
 ('10000000-0000-0000-0000-000000000001','00000000-0000-0000-0000-000000000001'),
 ('10000000-0000-0000-0000-000000000002','00000000-0000-0000-0000-000000000002');
insert into public.teacher_class_access(class_id,teacher_id) values
 ('10000000-0000-0000-0000-000000000001','00000000-0000-0000-0000-000000000003'),
 ('10000000-0000-0000-0000-000000000002','00000000-0000-0000-0000-000000000004');
insert into public.assignments(id,class_id,created_by,title,published_at) values
 ('20000000-0000-0000-0000-000000000001','10000000-0000-0000-0000-000000000001','00000000-0000-0000-0000-000000000003','Published A',now()),
 ('20000000-0000-0000-0000-000000000002','10000000-0000-0000-0000-000000000001','00000000-0000-0000-0000-000000000003','Draft A',null),
 ('20000000-0000-0000-0000-000000000003','10000000-0000-0000-0000-000000000002','00000000-0000-0000-0000-000000000004','Published B',now());
insert into public.ai_conversations(id,user_id,title) values
 ('30000000-0000-0000-0000-000000000001','00000000-0000-0000-0000-000000000001','A private'),
 ('30000000-0000-0000-0000-000000000002','00000000-0000-0000-0000-000000000002','B private');
insert into public.ai_messages(id,conversation_id,role,content) values
 ('40000000-0000-0000-0000-000000000001','30000000-0000-0000-0000-000000000001','user','A private text'),
 ('40000000-0000-0000-0000-000000000002','30000000-0000-0000-0000-000000000002','user','B private text');
select qa.check((select count(*)=5 from public.user_settings),'signup creates settings');
select qa.check((select count(*)=5 from public.notifications where type='welcome'),'signup creates welcome notification');
select qa.check((select count(*)=2 from public.notifications where type='assignment'),'assignment publishing notifies only class members');
select qa.check((select count(*)=0 from storage.buckets where id='noata-documents'),'private-document retention absent');
select qa.check(to_regclass('public.ai_document_files') is null,'private-document metadata table absent');
select qa.check((select bool_and(not public) from storage.buckets),'base storage buckets private');
set local role anon;
select qa.check((select count(*)=0 from public.profiles),'anonymous profiles denied');
select qa.check((select count(*)=0 from public.ai_messages),'anonymous messages denied');
select qa.check((select count(*)=0 from public.question_keys),'anonymous answer keys denied');
select qa.denied($s$select public.complete_lesson('29ea460d-92fc-570b-942a-c80fe012be22',100)$s$,'anonymous learning RPC denied');
reset role;
set local role authenticated;
set local request.jwt.claim.sub='00000000-0000-0000-0000-000000000001';
select qa.check((select count(*)=1 from public.profiles),'student cannot read another profile');
select qa.check((select count(*)=1 from public.ai_conversations),'conversation owner isolation');
select qa.check((select count(*)=1 from public.ai_messages),'message owner isolation');
select qa.check((select count(*)=0 from public.question_keys),'student answer keys denied');
select qa.check((select count(*)=1 from public.assignments),'student sees published assignments in own class only');
select qa.denied($s$update public.profiles set role='admin' where id=auth.uid()$s$,'direct role escalation denied');
select qa.denied($s$update public.profiles set xp=999 where id=auth.uid()$s$,'direct XP editing denied');
select qa.denied($s$select public.set_user_role(auth.uid(),'admin')$s$,'student admin RPC denied','Admin access required');
select qa.denied($s$select * from public.admin_ai_usage_summary()$s$,'student AI usage summary denied');
select qa.denied($s$select * from public.claim_ai_quota(auth.uid(),'text',100,60)$s$,'student service quota RPC denied');
select qa.denied($s$select * from public.ai_request_receipts$s$,'student inference receipt access denied');
select qa.denied($s$update public.notifications set title='spoofed' where user_id=auth.uid()$s$,'notification text immutable to client');
with changed as(update public.notifications set read_at=now() where user_id=auth.uid() returning id)
select qa.check((select count(*)>0 from changed),'notification read status writable by owner');
select qa.denied($s$insert into public.ai_messages(conversation_id,role,content) values('30000000-0000-0000-0000-000000000002','user','injection')$s$,'cross-account message insert denied');
select qa.denied($s$insert into public.ai_attachments(user_id,conversation_id,storage_path,mime_type,size_bytes) values(auth.uid(),'30000000-0000-0000-0000-000000000002',auth.uid()||'/qa.txt','text/plain',1)$s$,'cross-account attachment conversation denied');
select qa.denied($s$insert into public.ai_attachments(user_id,message_id,storage_path,mime_type,size_bytes) values(auth.uid(),'40000000-0000-0000-0000-000000000002',auth.uid()||'/qa.txt','text/plain',1)$s$,'cross-account attachment message denied');
select qa.denied($s$insert into public.ai_attachments(user_id,storage_path,mime_type,size_bytes) values(auth.uid(),'00000000-0000-0000-0000-000000000002/qa.txt','text/plain',1)$s$,'cross-account attachment path denied');
insert into public.ai_attachments(user_id,conversation_id,message_id,storage_path,mime_type,size_bytes)
values(auth.uid(),'30000000-0000-0000-0000-000000000001','40000000-0000-0000-0000-000000000001',auth.uid()||'/qa.png','image/png',1);
select qa.check((select count(*)=1 from public.ai_attachments),'own attachment metadata allowed');
insert into storage.objects(bucket_id,name) values('noata-uploads',auth.uid()||'/qa.png');
select qa.denied($s$insert into storage.objects(bucket_id,name) values('noata-uploads','00000000-0000-0000-0000-000000000002/qa.png')$s$,'cross-account storage upload denied');
select qa.denied($s$insert into storage.objects(bucket_id,name) values('noata-generated',auth.uid()||'/qa.png')$s$,'generated storage client upload denied');
select qa.check((select count(*)=1 from storage.objects),'own storage object visible');
select qa.denied($s$insert into public.assignment_submissions(assignment_id,student_id,score) values('20000000-0000-0000-0000-000000000001',auth.uid(),100)$s$,'student cannot grade on submission');
select qa.denied($s$insert into public.assignment_submissions(assignment_id,student_id) values('20000000-0000-0000-0000-000000000002',auth.uid())$s$,'draft assignment submission denied');
select qa.denied($s$insert into public.assignment_submissions(assignment_id,student_id) values('20000000-0000-0000-0000-000000000003',auth.uid())$s$,'foreign class submission denied');
insert into public.assignment_submissions(assignment_id,student_id,submitted_at) values('20000000-0000-0000-0000-000000000001',auth.uid(),now());
select qa.denied($s$update public.assignment_submissions set assignment_id='20000000-0000-0000-0000-000000000003' where student_id=auth.uid()$s$,'submission cannot move to foreign assignment');
select qa.denied($s$update public.assignment_submissions set score=100 where student_id=auth.uid()$s$,'student cannot update own grade');
select qa.denied($s$select public.complete_lesson('29ea460d-92fc-570b-942a-c80fe012be22',100)$s$,'unearned lesson completion denied');
select qa.denied($s$select private.complete_lesson_internal('29ea460d-92fc-570b-942a-c80fe012be22',100)$s$,'internal lesson bypass denied');
select qa.check((public.submit_attempt('05c00c64-b9b8-5736-b996-86dd82a3dd83','{"value":"0"}',false,'qa-first',false)->>'correct')='false','actual incorrect answer grading');
select qa.check((public.submit_attempt('05c00c64-b9b8-5736-b996-86dd82a3dd83','{"value":"0"}',false,'qa-first',false)->>'duplicate')='true','attempt retry returns same result');
select qa.invalid($s$select public.submit_attempt('05c00c64-b9b8-5736-b996-86dd82a3dd83','{"value":"1"}',false,'qa-first',false)$s$,'idempotency key cannot change answer');
select qa.check((public.submit_attempt('9d871ff7-39fe-5a54-87d9-e9de30c37371','{"value":"1"}',false,'qa-variant',false)->>'correct')='true','parallel variant grading');
select qa.check((public.complete_unit_boss('1193c2ae-2e06-53d0-ae79-ad338fb52742',array['33fddc1b-daaa-582f-87a5-71b6ce7eb904','44ca081f-ceae-536e-9bfc-e29c506cb208','367a897d-0394-586e-a5cf-062fed876601']::uuid[])->>'score')::int=0,'unrelated correct answer cannot pass Unit Boss');
select public.submit_attempt('b4ebb1e4-c88f-545a-8cdd-9faa970e5311','{"value":"8"}',false,'qa-second',false);
select public.submit_attempt('d25f0844-8a0c-59e4-b93b-4cbde38e9bb8','{"value":"1"}',false,'qa-third',false);
select qa.check((public.complete_lesson('29ea460d-92fc-570b-942a-c80fe012be22',100)->>'best_score')::numeric=67,'lesson score comes from attempts not client claim');
select qa.check((public.complete_lesson('29ea460d-92fc-570b-942a-c80fe012be22',100)->>'xp_reward')::int=0,'repeated completion cannot award XP twice');
select qa.check((select count(*)=2 from public.ledger where reason='LESSON_COMPLETION'),'one XP and one coin completion ledger entry');
select qa.check((public.purchase_shop_item('51784f92-e172-59ea-9298-d7b7bac522be','qa-purchase')->>'duplicate')='false','purchase confirms persisted receipt');
select qa.check((public.purchase_shop_item('51784f92-e172-59ea-9298-d7b7bac522be','qa-purchase')->>'duplicate')='true','purchase retry is idempotent');
select qa.check((public.equip_cosmetic('51784f92-e172-59ea-9298-d7b7bac522be')->>'slot')='avatar','owned cosmetic can equip');
set local request.jwt.claim.sub='00000000-0000-0000-0000-000000000002';
select qa.check((select count(*)=0 from storage.objects),'other student storage is private');
select qa.check((select count(*)=0 from public.ai_attachments),'other student attachment rows are private');
set local request.jwt.claim.sub='00000000-0000-0000-0000-000000000004';
select qa.check((select count(*)=0 from public.assignment_submissions),'unrelated teacher cannot read submission');
select qa.check((select count(*)=0 from public.attempts),'unrelated teacher cannot read learning attempts');
select qa.check((select count(*)=0 from public.profiles where id='00000000-0000-0000-0000-000000000001'),'unrelated teacher cannot read student profile');
with changed as(update public.assignment_submissions set score=100 returning id)
select qa.check((select count(*)=0 from changed),'unrelated teacher cannot grade');
set local request.jwt.claim.sub='00000000-0000-0000-0000-000000000003';
select qa.check((select count(*)=1 from public.assignment_submissions),'assigned teacher can read submission');
select qa.check((select count(*)>0 from public.attempts),'assigned teacher can read learning attempts');
select qa.denied($s$update public.questions set publication_status='published' where id='92286df0-8362-52fa-9f3c-233111d9e388'$s$,'teacher cannot bypass publish RPC using table update');
select qa.denied($s$select public.transition_question('92286df0-8362-52fa-9f3c-233111d9e388','publish')$s$,'teacher cannot publish via RPC','Admin access required to publish');
with changed as(update public.assignment_submissions set score=83 returning id)
select qa.check((select count(*)=1 from changed),'assigned teacher can grade');
set local request.jwt.claim.sub='00000000-0000-0000-0000-000000000001';
with changed as(update public.assignment_submissions set metadata='{"overwrite":true}' returning id)
select qa.check((select count(*)=0 from changed),'graded submission cannot be overwritten by student');
select qa.check((select count(*)=1 from public.notifications where type='grade'),'student receives grade notification');
select public.submit_attempt('33fddc1b-daaa-582f-87a5-71b6ce7eb904','{"value":"5"}',false,'qa-boss-one',false);
select public.submit_attempt('44ca081f-ceae-536e-9bfc-e29c506cb208','{"value":"0"}',false,'qa-boss-two',false);
select public.submit_attempt('367a897d-0394-586e-a5cf-062fed876601','{"value":"1"}',false,'qa-boss-three',false);
select qa.check((public.complete_unit_boss('1193c2ae-2e06-53d0-ae79-ad338fb52742',array['33fddc1b-daaa-582f-87a5-71b6ce7eb904','44ca081f-ceae-536e-9bfc-e29c506cb208','367a897d-0394-586e-a5cf-062fed876601']::uuid[])->>'score')::int=3,'three actual boss answers earn completion');
select qa.check((public.claim_reward_box((select id from public.reward_boxes limit 1))->>'duplicate')='false','owner can claim earned box');
select qa.check((public.claim_reward_box((select id from public.reward_boxes limit 1))->>'duplicate')='true','reward retry cannot award twice');
select qa.check((select count(*)=2 from public.ledger where reason='MYSTERY_BOX'),'one XP and one coin reward ledger entry');
set local request.jwt.claim.sub='00000000-0000-0000-0000-000000000003';
select public.transition_question('92286df0-8362-52fa-9f3c-233111d9e388','submit_review');
select public.transition_question('92286df0-8362-52fa-9f3c-233111d9e388','approve');
set local request.jwt.claim.sub='00000000-0000-0000-0000-000000000005';
select qa.check((public.transition_question('92286df0-8362-52fa-9f3c-233111d9e388','publish')->>'publication_status')='published','admin can publish reviewed question');
select qa.check((public.set_user_role('00000000-0000-0000-0000-000000000002','teacher')->>'role')='teacher','admin role change succeeds');
select qa.check((select count(*)=1 from public.audit_events where action='ROLE_CHANGED'),'role change has audit evidence');
select qa.check((select count(*)=0 from public.class_memberships where student_id='00000000-0000-0000-0000-000000000002'),'role change removes stale membership');
reset role;
select qa.check((select bool_and(relrowsecurity) from pg_class c join pg_namespace n on n.oid=c.relnamespace where n.nspname='public' and c.relkind='r'),'RLS enabled on every application table');
rollback;
