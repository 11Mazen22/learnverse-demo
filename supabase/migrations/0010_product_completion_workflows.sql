
create table public.user_settings (
  user_id uuid primary key references public.profiles(id) on delete cascade,
  theme text not null default 'system' check (theme in ('light','dark','system')),
  reduced_motion boolean not null default false,
  locale text not null default 'ar' check (locale in ('ar','en')),
  default_ai_model text not null default 'auto',
  ai_memory_enabled boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.user_settings enable row level security;

create policy "settings own read"
on public.user_settings for select to authenticated
using (user_id=(select auth.uid()));

create policy "settings own insert"
on public.user_settings for insert to authenticated
with check (user_id=(select auth.uid()));

create policy "settings own update"
on public.user_settings for update to authenticated
using (user_id=(select auth.uid()))
with check (user_id=(select auth.uid()));

create trigger user_settings_touch_updated_at
before update on public.user_settings
for each row execute procedure private.touch_updated_at();

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
  from unnest(p_question_ids) question_id
  where exists (
    select 1
    from public.attempts a
    where a.user_id=v_user
      and a.question_id=question_id
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

create function public.complete_unit_boss(
  p_unit_id uuid,
  p_question_ids uuid[]
)
returns jsonb
language sql
security invoker
set search_path=''
as $$
  select private.complete_unit_boss(p_unit_id,p_question_ids);
$$;

revoke all on function public.complete_unit_boss(uuid,uuid[]) from public,anon;
grant execute on function public.complete_unit_boss(uuid,uuid[]) to authenticated;

create or replace function private.set_user_role(
  p_user_id uuid,
  p_role public.noata_role
)
returns jsonb
language plpgsql
security definer
set search_path=''
as $$
declare
  v_actor uuid:=auth.uid();
  v_old public.noata_role;
begin
  if v_actor is null or not private.is_admin() then
    raise exception 'Admin access required';
  end if;
  if p_user_id=v_actor then
    raise exception 'Use another admin account to change your own role';
  end if;

  select role into v_old from public.profiles where id=p_user_id for update;
  if not found then raise exception 'User not found'; end if;

  update public.profiles
  set role=p_role,updated_at=now()
  where id=p_user_id;

  insert into public.audit_events(actor_id,action,entity_type,entity_id,metadata)
  values(
    v_actor,'ROLE_CHANGED','profile',p_user_id::text,
    jsonb_build_object('from',v_old,'to',p_role)
  );

  return jsonb_build_object('user_id',p_user_id,'role',p_role);
end;
$$;

revoke all on function private.set_user_role(uuid,public.noata_role) from public,anon;
grant execute on function private.set_user_role(uuid,public.noata_role) to authenticated;

create function public.set_user_role(
  p_user_id uuid,
  p_role public.noata_role
)
returns jsonb
language sql
security invoker
set search_path=''
as $$
  select private.set_user_role(p_user_id,p_role);
$$;

revoke all on function public.set_user_role(uuid,public.noata_role) from public,anon;
grant execute on function public.set_user_role(uuid,public.noata_role) to authenticated;

create or replace function private.transition_question(
  p_question_id uuid,
  p_action text
)
returns jsonb
language plpgsql
security definer
set search_path=''
as $$
declare
  v_actor uuid:=auth.uid();
  v_q public.questions%rowtype;
begin
  if v_actor is null or not private.is_staff() then
    raise exception 'Staff access required';
  end if;

  select * into v_q from public.questions where id=p_question_id for update;
  if not found then raise exception 'Question not found'; end if;

  if p_action='submit_review' then
    if v_q.review_status<>'draft' then raise exception 'Only draft content can enter review'; end if;
    update public.questions set review_status='in_review' where id=p_question_id;
  elsif p_action='approve' then
    if v_q.review_status<>'in_review' then raise exception 'Only in-review content can be approved'; end if;
    update public.questions set review_status='approved' where id=p_question_id;
  elsif p_action='return_to_draft' then
    if v_q.review_status<>'in_review' then raise exception 'Only in-review content can return to draft'; end if;
    update public.questions set review_status='draft' where id=p_question_id;
  elsif p_action='publish' then
    if not private.is_admin() then raise exception 'Admin access required to publish'; end if;
    if v_q.review_status<>'approved' then raise exception 'Only approved content can publish'; end if;
    update public.questions set publication_status='published' where id=p_question_id;
  elsif p_action='retire' then
    if not private.is_admin() then raise exception 'Admin access required to retire'; end if;
    if v_q.publication_status not in ('published','published_demo') then raise exception 'Only published content can retire'; end if;
    update public.questions set publication_status='retired' where id=p_question_id;
  else
    raise exception 'Unsupported transition';
  end if;

  insert into public.audit_events(actor_id,action,entity_type,entity_id,metadata)
  values(
    v_actor,'QUESTION_'||upper(p_action),'question',p_question_id::text,
    jsonb_build_object(
      'previous_review',v_q.review_status,
      'previous_publication',v_q.publication_status
    )
  );

  return (
    select jsonb_build_object(
      'id',id,
      'review_status',review_status,
      'publication_status',publication_status
    )
    from public.questions where id=p_question_id
  );
end;
$$;

revoke all on function private.transition_question(uuid,text) from public,anon;
grant execute on function private.transition_question(uuid,text) to authenticated;

create function public.transition_question(
  p_question_id uuid,
  p_action text
)
returns jsonb
language sql
security invoker
set search_path=''
as $$
  select private.transition_question(p_question_id,p_action);
$$;

revoke all on function public.transition_question(uuid,text) from public,anon;
grant execute on function public.transition_question(uuid,text) to authenticated;

drop policy if exists "submissions teacher update" on public.assignment_submissions;
create policy "submissions teacher update"
on public.assignment_submissions for update to authenticated
using (
  exists(
    select 1 from public.assignments a
    where a.id=assignment_id and (select private.can_manage_class(a.class_id))
  )
)
with check (
  exists(
    select 1 from public.assignments a
    where a.id=assignment_id and (select private.can_manage_class(a.class_id))
  )
);

create index if not exists boss_runs_user_completed_idx
  on public.boss_runs(user_id,unit_id,completed_at desc);

create index if not exists user_settings_locale_idx
  on public.user_settings(locale);
