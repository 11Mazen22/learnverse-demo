create table public.classes (
  id uuid primary key default gen_random_uuid(),
  slug text unique not null,
  name text not null,
  grade_label text not null,
  academic_year text not null,
  active boolean not null default true,
  created_at timestamptz not null default now()
);

create table public.class_memberships (
  class_id uuid not null references public.classes(id) on delete cascade,
  student_id uuid not null references public.profiles(id) on delete cascade,
  joined_at timestamptz not null default now(),
  primary key(class_id,student_id)
);

create table public.teacher_class_access (
  class_id uuid not null references public.classes(id) on delete cascade,
  teacher_id uuid not null references public.profiles(id) on delete cascade,
  created_at timestamptz not null default now(),
  primary key(class_id,teacher_id)
);

create table public.assignments (
  id uuid primary key default gen_random_uuid(),
  class_id uuid not null references public.classes(id) on delete cascade,
  created_by uuid not null references public.profiles(id) on delete restrict,
  title text not null,
  instructions text not null default '',
  due_at timestamptz,
  published_at timestamptz,
  created_at timestamptz not null default now()
);

create table public.assignment_items (
  assignment_id uuid not null references public.assignments(id) on delete cascade,
  position int not null check(position>0),
  question_id uuid not null references public.questions(id) on delete restrict,
  primary key(assignment_id,position),
  unique(assignment_id,question_id)
);

create table public.assignment_submissions (
  id uuid primary key default gen_random_uuid(),
  assignment_id uuid not null references public.assignments(id) on delete cascade,
  student_id uuid not null references public.profiles(id) on delete cascade,
  submitted_at timestamptz,
  score numeric(5,2) check(score between 0 and 100),
  metadata jsonb not null default '{}'::jsonb,
  unique(assignment_id,student_id)
);

create table public.mission_runs (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles(id) on delete cascade,
  lesson_id uuid references public.lessons(id) on delete set null,
  skill_id uuid references public.skills(id) on delete set null,
  source text not null default 'adaptive',
  status text not null default 'active' check(status in ('active','completed','abandoned')),
  stage int not null default 1 check(stage between 1 and 3),
  question_ids uuid[] not null default '{}',
  completed_question_ids uuid[] not null default '{}',
  started_at timestamptz not null default now(),
  completed_at timestamptz
);

create table public.reward_boxes (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles(id) on delete cascade,
  source text not null,
  source_ref text,
  tier text not null default 'standard' check(tier in ('standard','rare','epic')),
  claimed_at timestamptz,
  reward jsonb,
  idempotency_key text not null,
  created_at timestamptz not null default now(),
  unique(user_id,idempotency_key)
);

create table public.ai_attachments (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles(id) on delete cascade,
  conversation_id uuid references public.ai_conversations(id) on delete cascade,
  message_id uuid references public.ai_messages(id) on delete set null,
  storage_path text not null,
  mime_type text not null,
  size_bytes bigint not null check(size_bytes>=0),
  created_at timestamptz not null default now()
);

create table public.notifications (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles(id) on delete cascade,
  type text not null,
  title text not null,
  body text not null default '',
  href text,
  read_at timestamptz,
  created_at timestamptz not null default now()
);

alter table public.classes enable row level security;
alter table public.class_memberships enable row level security;
alter table public.teacher_class_access enable row level security;
alter table public.assignments enable row level security;
alter table public.assignment_items enable row level security;
alter table public.assignment_submissions enable row level security;
alter table public.mission_runs enable row level security;
alter table public.reward_boxes enable row level security;
alter table public.ai_attachments enable row level security;
alter table public.notifications enable row level security;

create or replace function public.can_access_class(p_class_id uuid)
returns boolean language sql stable security definer set search_path=''
as $$
  select public.is_admin()
    or exists(select 1 from public.class_memberships m where m.class_id=p_class_id and m.student_id=auth.uid())
    or exists(select 1 from public.teacher_class_access t where t.class_id=p_class_id and t.teacher_id=auth.uid());
$$;

create or replace function public.can_manage_class(p_class_id uuid)
returns boolean language sql stable security definer set search_path=''
as $$
  select public.is_admin()
    or exists(select 1 from public.teacher_class_access t where t.class_id=p_class_id and t.teacher_id=auth.uid());
$$;

create policy "classes scoped read" on public.classes for select using(public.can_access_class(id));
create policy "classes admin write" on public.classes for all using(public.is_admin()) with check(public.is_admin());

create policy "membership scoped read" on public.class_memberships for select using(
  student_id=auth.uid() or public.can_manage_class(class_id)
);
create policy "membership admin write" on public.class_memberships for all using(public.is_admin()) with check(public.is_admin());

create policy "teacher class scoped read" on public.teacher_class_access for select using(
  teacher_id=auth.uid() or public.is_admin()
);
create policy "teacher class admin write" on public.teacher_class_access for all using(public.is_admin()) with check(public.is_admin());

create policy "assignments scoped read" on public.assignments for select using(public.can_access_class(class_id));
create policy "assignments teacher write" on public.assignments for all using(public.can_manage_class(class_id)) with check(public.can_manage_class(class_id));

create policy "assignment items scoped read" on public.assignment_items for select using(
  exists(select 1 from public.assignments a where a.id=assignment_id and public.can_access_class(a.class_id))
);
create policy "assignment items teacher write" on public.assignment_items for all using(
  exists(select 1 from public.assignments a where a.id=assignment_id and public.can_manage_class(a.class_id))
) with check(
  exists(select 1 from public.assignments a where a.id=assignment_id and public.can_manage_class(a.class_id))
);

create policy "submissions scoped read" on public.assignment_submissions for select using(
  student_id=auth.uid()
  or exists(select 1 from public.assignments a where a.id=assignment_id and public.can_manage_class(a.class_id))
);
create policy "submissions own insert" on public.assignment_submissions for insert with check(
  student_id=auth.uid()
  and exists(select 1 from public.assignments a where a.id=assignment_id and public.can_access_class(a.class_id))
);
create policy "submissions own update" on public.assignment_submissions for update using(student_id=auth.uid()) with check(student_id=auth.uid());

create policy "mission own" on public.mission_runs for all using(user_id=auth.uid()) with check(user_id=auth.uid());
create policy "reward boxes own read" on public.reward_boxes for select using(user_id=auth.uid());
create policy "attachments own" on public.ai_attachments for all using(user_id=auth.uid()) with check(user_id=auth.uid());
create policy "notifications own read" on public.notifications for select using(user_id=auth.uid());
create policy "notifications own update" on public.notifications for update using(user_id=auth.uid()) with check(user_id=auth.uid());

create index class_memberships_student_idx on public.class_memberships(student_id,class_id);
create index teacher_class_access_teacher_idx on public.teacher_class_access(teacher_id,class_id);
create index assignments_class_due_idx on public.assignments(class_id,due_at);
create index assignment_submissions_student_idx on public.assignment_submissions(student_id,submitted_at desc);
create index mission_runs_user_status_idx on public.mission_runs(user_id,status,started_at desc);
create index reward_boxes_user_claimed_idx on public.reward_boxes(user_id,claimed_at,created_at desc);
create index ai_attachments_conversation_idx on public.ai_attachments(conversation_id,created_at);
create index notifications_user_unread_idx on public.notifications(user_id,read_at,created_at desc);

create or replace function public.claim_reward_box(p_box_id uuid)
returns jsonb
language plpgsql
security definer
set search_path=''
as $$
declare
  v_user uuid:=auth.uid();
  v_box public.reward_boxes%rowtype;
  v_roll numeric;
  v_reward jsonb;
  v_coins int:=0;
  v_xp int:=0;
begin
  if v_user is null then raise exception 'Authentication required'; end if;
  select * into v_box from public.reward_boxes
  where id=p_box_id and user_id=v_user
  for update;
  if not found then raise exception 'Reward box not found'; end if;
  if v_box.claimed_at is not null then
    return jsonb_build_object('duplicate',true,'reward',v_box.reward);
  end if;

  v_roll:=random();
  if v_box.tier='epic' then
    v_coins:=case when v_roll<.5 then 180 else 120 end;
    v_xp:=case when v_roll>=.5 then 90 else 60 end;
  elsif v_box.tier='rare' then
    v_coins:=case when v_roll<.5 then 100 else 70 end;
    v_xp:=case when v_roll>=.5 then 55 else 35 end;
  else
    v_coins:=case when v_roll<.5 then 55 else 35 end;
    v_xp:=case when v_roll>=.5 then 30 else 20 end;
  end if;

  v_reward:=jsonb_build_object('coins',v_coins,'xp',v_xp,'tier',v_box.tier);

  if v_coins>0 then
    insert into public.ledger(user_id,currency,amount,reason,reference_type,reference_id,idempotency_key)
    values(v_user,'COIN',v_coins,'MYSTERY_BOX','reward_box',v_box.id,'box-coin:'||v_box.id)
    on conflict(user_id,currency,idempotency_key) do nothing;
  end if;
  if v_xp>0 then
    insert into public.ledger(user_id,currency,amount,reason,reference_type,reference_id,idempotency_key)
    values(v_user,'XP',v_xp,'MYSTERY_BOX','reward_box',v_box.id,'box-xp:'||v_box.id)
    on conflict(user_id,currency,idempotency_key) do nothing;
  end if;

  update public.reward_boxes set claimed_at=now(),reward=v_reward where id=v_box.id;
  return jsonb_build_object('duplicate',false,'reward',v_reward);
end;
$$;

revoke all on function public.claim_reward_box(uuid) from public,anon;
grant execute on function public.claim_reward_box(uuid) to authenticated;
