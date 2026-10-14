-- Additive authorization corrections found while reviewing isolated staging.
-- Does not enable document retention or change existing user data.

-- The content workflow owns review/publication transitions. Table grants must
-- not let a teacher bypass the admin-only publish RPC or replace answer keys.
revoke insert,update,delete on public.questions from anon,authenticated;
revoke insert,update,delete on public.question_keys from anon,authenticated;

-- An attachment row must not reference another account's conversation/message
-- or claim another account's storage path, even when its user_id is the caller.
drop policy "attachments own" on public.ai_attachments;
create policy "attachments own" on public.ai_attachments
for all to authenticated
using(user_id=(select auth.uid()))
with check(
  user_id=(select auth.uid())
  and split_part(storage_path,'/',1)=(select auth.uid())::text
  and (conversation_id is null or exists(
    select 1 from public.ai_conversations c where c.id=conversation_id and c.user_id=(select auth.uid())
  ))
  and (message_id is null or exists(
    select 1 from public.ai_messages m join public.ai_conversations c on c.id=m.conversation_id
    where m.id=message_id and c.user_id=(select auth.uid())
      and (ai_attachments.conversation_id is null or m.conversation_id=ai_attachments.conversation_id)
  ))
);

create function private.protect_submission_identity()
returns trigger language plpgsql security invoker set search_path='' as $$
begin
  if new.id is distinct from old.id or new.assignment_id is distinct from old.assignment_id
     or new.student_id is distinct from old.student_id then
    raise exception 'Submission identity cannot change' using errcode='42501';
  end if;
  return new;
end;
$$;
revoke all on function private.protect_submission_identity() from public,anon,authenticated;
create trigger submission_identity_immutable before update on public.assignment_submissions
for each row execute function private.protect_submission_identity();

-- Keep the grading implementation behind a serialized, validated entry point.
-- Renamed helpers are not executable by API roles; wrappers preserve RPC names.
alter function private.submit_attempt(uuid,jsonb,boolean,text,boolean) rename to submit_attempt_internal;
revoke all on function private.submit_attempt_internal(uuid,jsonb,boolean,text,boolean) from public,anon,authenticated;
create function private.submit_attempt(p_question_id uuid,p_response jsonb,p_assisted boolean,p_idempotency_key text,p_practice_repeat boolean default false)
returns jsonb language plpgsql security definer set search_path='' as $$
declare v_user uuid:=auth.uid();
begin
  if v_user is null then raise exception 'Authentication required' using errcode='42501'; end if;
  if p_idempotency_key is null or length(trim(p_idempotency_key)) not between 4 and 200 then
    raise exception 'Invalid idempotency key' using errcode='22023';
  end if;
  perform pg_advisory_xact_lock(hashtextextended('noata-learning:'||v_user::text,0));
  if exists(select 1 from public.attempts where user_id=v_user and idempotency_key=p_idempotency_key
    and (question_id<>p_question_id or response is distinct from p_response
      or assisted is distinct from p_assisted or practice_repeat is distinct from p_practice_repeat)) then
    raise exception 'Idempotency key reused with different answer' using errcode='22023';
  end if;
  if not exists(
    select 1 from public.questions q
    left join public.lessons l on l.id=q.lesson_id
    left join public.units u on u.id=coalesce(l.unit_id,q.unit_id)
    left join public.skills s on s.id=q.skill_id
    join public.courses c on c.id=coalesce(u.course_id,s.course_id)
    where q.id=p_question_id and q.publication_status in ('published','published_demo')
      and c.active and coalesce(u.metadata->>'locked','false')<>'true'
  ) then raise exception 'Question unavailable' using errcode='42501'; end if;
  return private.submit_attempt_internal(p_question_id,p_response,p_assisted,p_idempotency_key,p_practice_repeat);
end;
$$;
revoke all on function private.submit_attempt(uuid,jsonb,boolean,text,boolean) from public,anon;
grant execute on function private.submit_attempt(uuid,jsonb,boolean,text,boolean) to authenticated;

alter function private.complete_lesson(uuid,numeric) rename to complete_lesson_internal;
revoke all on function private.complete_lesson_internal(uuid,numeric) from public,anon,authenticated;
create function private.complete_lesson(p_lesson_id uuid,p_score numeric)
returns jsonb language plpgsql security definer set search_path='' as $$
declare v_user uuid:=auth.uid(); v_required int; v_completed int; v_score numeric; v_prerequisite uuid;
begin
  if v_user is null then raise exception 'Authentication required' using errcode='42501'; end if;
  perform pg_advisory_xact_lock(hashtextextended('noata-learning:'||v_user::text,0));
  select nullif(l.content->>'prerequisite_lesson_id','')::uuid into v_prerequisite
  from public.lessons l join public.units u on u.id=l.unit_id join public.courses c on c.id=u.course_id
  where l.id=p_lesson_id and c.active and coalesce(u.metadata->>'locked','false')<>'true';
  if not found then raise exception 'Lesson unavailable' using errcode='42501'; end if;
  if v_prerequisite is not null and not exists(select 1 from public.lesson_progress
    where user_id=v_user and lesson_id=v_prerequisite and completed_at is not null) then
    raise exception 'Complete the prerequisite lesson first' using errcode='42501';
  end if;
  select count(*),count(*) filter(where exists(
    select 1 from public.attempts a join public.questions answered on answered.id=a.question_id
    where a.user_id=v_user and a.correct and not a.practice_repeat
      and (answered.id=q.id or answered.variant_of=q.id)
  )),round(100*avg(coalesce((
    select case when a.correct then 1.0 else 0.0 end from public.attempts a
    where a.user_id=v_user and a.question_id=q.id and not a.practice_repeat
    order by a.created_at,a.id limit 1
  ),0))) into v_required,v_completed,v_score
  from public.questions q where q.lesson_id=p_lesson_id and q.variant_of is null
    and q.publication_status in ('published','published_demo');
  if v_required=0 or v_completed<>v_required then
    raise exception 'Complete all lesson questions before claiming rewards' using errcode='42501';
  end if;
  -- p_score remains in the API signature for compatibility; the database owns it.
  return private.complete_lesson_internal(p_lesson_id,v_score);
end;
$$;
revoke all on function private.complete_lesson(uuid,numeric) from public,anon;
grant execute on function private.complete_lesson(uuid,numeric) to authenticated;

alter function private.purchase_shop_item(uuid,text) rename to purchase_shop_item_internal;
revoke all on function private.purchase_shop_item_internal(uuid,text) from public,anon,authenticated;
create function private.purchase_shop_item(p_item_id uuid,p_idempotency_key text)
returns jsonb language plpgsql security definer set search_path='' as $$
declare v_user uuid:=auth.uid();
begin
  if v_user is null then raise exception 'Authentication required' using errcode='42501'; end if;
  if p_idempotency_key is null or length(trim(p_idempotency_key)) not between 4 and 200 then
    raise exception 'Invalid idempotency key' using errcode='22023';
  end if;
  perform pg_advisory_xact_lock(hashtextextended('noata-learning:'||v_user::text,0));
  if exists(select 1 from public.purchases where user_id=v_user and idempotency_key=p_idempotency_key and item_id<>p_item_id) then
    raise exception 'Idempotency key reused with different item' using errcode='22023';
  end if;
  return private.purchase_shop_item_internal(p_item_id,p_idempotency_key);
end;
$$;
revoke all on function private.purchase_shop_item(uuid,text) from public,anon;
grant execute on function private.purchase_shop_item(uuid,text) to authenticated;

-- Qualify the requested question: an unrelated correct answer must not pass all three.
create or replace function private.complete_unit_boss(
  p_unit_id uuid,
  p_question_ids uuid[]
)
returns jsonb
language plpgsql
security definer
set search_path=''
as $$
declare
  v_user uuid:=auth.uid();
  v_valid_count int;
  v_score int;
  v_run_id uuid;
  v_rewarded boolean:=false;
  v_box_id uuid;
begin
  if v_user is null then raise exception 'Authentication required'; end if;
  perform pg_advisory_xact_lock(hashtextextended('noata-learning:'||v_user::text,0));
  if not exists(select 1 from public.units u join public.courses c on c.id=u.course_id
    where u.id=p_unit_id and u.boss_enabled and c.active and coalesce(u.metadata->>'locked','false')<>'true') then
    raise exception 'Unit Boss unavailable' using errcode='42501';
  end if;
  if coalesce(array_length(p_question_ids,1),0) <> 3 then
    raise exception 'Unit Boss requires exactly three questions';
  end if;
  if (select count(distinct q) from unnest(p_question_ids) q) <> 3 then
    raise exception 'Unit Boss questions must be distinct';
  end if;

  select count(*) into v_valid_count
  from public.questions q
  where q.id=any(p_question_ids)
    and q.unit_id=p_unit_id
    and q.publication_status in ('published_demo','published')
    and coalesce((q.metadata->>'boss')::boolean,false)=true;

  if v_valid_count <> 3 then raise exception 'Invalid Unit Boss question set'; end if;

  select count(*) into v_score
  from unnest(p_question_ids) as requested(question_id)
  where exists (
    select 1
    from public.attempts a
    where a.user_id=v_user
      and a.question_id=requested.question_id
      and a.correct=true
      and a.practice_repeat=false
  );

  insert into public.boss_runs(user_id,unit_id,score,question_ids,completed_at)
  values(v_user,p_unit_id,v_score,p_question_ids,now())
  returning id into v_run_id;

  if v_score=3 then
    insert into public.ledger(user_id,currency,amount,reason,reference_type,reference_id,idempotency_key)
    values(v_user,'XP',40,'UNIT_BOSS_COMPLETION','unit',p_unit_id,'unit-boss-xp:'||p_unit_id)
    on conflict(user_id,currency,idempotency_key) do nothing;
    if found then v_rewarded:=true; end if;

    insert into public.ledger(user_id,currency,amount,reason,reference_type,reference_id,idempotency_key)
    values(v_user,'COIN',60,'UNIT_BOSS_COMPLETION','unit',p_unit_id,'unit-boss-coin:'||p_unit_id)
    on conflict(user_id,currency,idempotency_key) do nothing;

    insert into public.reward_boxes(user_id,source,source_ref,tier,idempotency_key)
    values(v_user,'unit_boss',p_unit_id::text,'rare','unit-boss-box:'||p_unit_id)
    on conflict(user_id,idempotency_key) do nothing
    returning id into v_box_id;

    if v_box_id is null then
      select id into v_box_id
      from public.reward_boxes
      where user_id=v_user and idempotency_key='unit-boss-box:'||p_unit_id;
    end if;
  end if;

  return jsonb_build_object(
    'run_id',v_run_id,
    'score',v_score,
    'passed',v_score=3,
    'first_reward',v_rewarded,
    'xp_reward',case when v_rewarded then 40 else 0 end,
    'coin_reward',case when v_rewarded then 60 else 0 end,
    'reward_box_id',v_box_id
  );
end;
$$;

revoke all on function private.complete_unit_boss(uuid,uuid[]) from public,anon;
grant execute on function private.complete_unit_boss(uuid,uuid[]) to authenticated;

-- Teacher visibility is limited to students assigned to their own classes.
create function private.can_read_student(p_student_id uuid)
returns boolean language sql stable security definer set search_path='' as $$
  select p_student_id=auth.uid() or private.is_admin() or exists(
    select 1 from public.class_memberships m
    join public.teacher_class_access t on t.class_id=m.class_id
    join public.profiles p on p.id=t.teacher_id
    where m.student_id=p_student_id and t.teacher_id=auth.uid() and p.role='teacher'
  );
$$;
revoke all on function private.can_read_student(uuid) from public,anon;
grant execute on function private.can_read_student(uuid) to authenticated;
drop policy "profiles own read" on public.profiles;
create policy "profiles own read" on public.profiles for select to authenticated using(private.can_read_student(id));
drop policy "attempts own read" on public.attempts;
create policy "attempts own read" on public.attempts for select to authenticated using(private.can_read_student(user_id));
drop policy "evidence own read" on public.skill_evidence;
create policy "evidence own read" on public.skill_evidence for select to authenticated using(private.can_read_student(user_id));
drop policy "lesson progress own" on public.lesson_progress;
create policy "lesson progress own" on public.lesson_progress for select to authenticated using(private.can_read_student(user_id));
drop policy "boss runs own" on public.boss_runs;
create policy "boss runs own" on public.boss_runs for select to authenticated using(private.can_read_student(user_id));
