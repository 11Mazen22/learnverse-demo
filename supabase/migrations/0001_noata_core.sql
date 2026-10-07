create extension if not exists pgcrypto;

create type public.noata_role as enum ('student','teacher','admin');
create type public.mastery_state as enum ('new','reteach','supported','mixed','provisional_mastery','mastered');
create type public.question_review_status as enum ('draft','in_review','approved');
create type public.question_publication_status as enum ('draft','published_demo','published','retired');

create table public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  display_name text not null default '',
  role public.noata_role not null default 'student',
  preferred_language text not null default 'ar' check (preferred_language in ('ar','en')),
  avatar_url text,
  xp bigint not null default 0 check (xp >= 0),
  coins bigint not null default 0 check (coins >= 0),
  streak_days int not null default 0 check (streak_days >= 0),
  last_learning_day date,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.courses (
  id uuid primary key default gen_random_uuid(),
  slug text unique not null,
  title_ar text not null,
  title_en text not null,
  description_ar text not null default '',
  description_en text not null default '',
  active boolean not null default true,
  created_at timestamptz not null default now()
);

create table public.units (
  id uuid primary key default gen_random_uuid(),
  course_id uuid not null references public.courses(id) on delete cascade,
  position int not null check (position > 0),
  title_ar text not null,
  title_en text not null,
  boss_enabled boolean not null default true,
  unique(course_id,position)
);

create table public.lessons (
  id uuid primary key default gen_random_uuid(),
  unit_id uuid not null references public.units(id) on delete cascade,
  position int not null check (position > 0),
  slug text not null,
  title_ar text not null,
  title_en text not null,
  content jsonb not null default '{}'::jsonb,
  xp_reward int not null default 15 check (xp_reward >= 0),
  coin_reward int not null default 25 check (coin_reward >= 0),
  unique(unit_id,position),
  unique(unit_id,slug)
);

create table public.skills (
  id uuid primary key default gen_random_uuid(),
  course_id uuid not null references public.courses(id) on delete cascade,
  slug text not null,
  title_ar text not null,
  title_en text not null,
  unique(course_id,slug)
);

create table public.questions (
  id uuid primary key default gen_random_uuid(),
  lesson_id uuid references public.lessons(id) on delete cascade,
  skill_id uuid references public.skills(id) on delete set null,
  variant_of uuid references public.questions(id) on delete set null,
  difficulty numeric(4,2) not null default 1.0 check (difficulty > 0),
  prompt_ar text not null,
  prompt_en text not null,
  review_status public.question_review_status not null default 'draft',
  publication_status public.question_publication_status not null default 'draft',
  created_by uuid references public.profiles(id) on delete set null,
  created_at timestamptz not null default now()
);

create table public.question_keys (
  question_id uuid primary key references public.questions(id) on delete cascade,
  answer_spec jsonb not null,
  explanation_ar text not null default '',
  explanation_en text not null default '',
  updated_at timestamptz not null default now()
);

create table public.attempts (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles(id) on delete cascade,
  question_id uuid not null references public.questions(id) on delete cascade,
  idempotency_key text not null,
  response jsonb not null,
  correct boolean not null,
  assisted boolean not null default false,
  practice_repeat boolean not null default false,
  evidence_weight numeric(4,3) not null default 1.0 check (evidence_weight >= 0),
  created_at timestamptz not null default now(),
  unique(user_id,idempotency_key)
);

create table public.skill_evidence (
  user_id uuid not null references public.profiles(id) on delete cascade,
  skill_id uuid not null references public.skills(id) on delete cascade,
  mastery_score numeric(5,2) not null default 0 check (mastery_score between 0 and 100),
  state public.mastery_state not null default 'new',
  independent_distinct_count int not null default 0 check (independent_distinct_count >= 0),
  next_review_at timestamptz,
  updated_at timestamptz not null default now(),
  primary key(user_id,skill_id)
);

create table public.lesson_progress (
  user_id uuid not null references public.profiles(id) on delete cascade,
  lesson_id uuid not null references public.lessons(id) on delete cascade,
  completed_at timestamptz,
  best_score numeric(5,2) not null default 0 check (best_score between 0 and 100),
  updated_at timestamptz not null default now(),
  primary key(user_id,lesson_id)
);

create table public.boss_runs (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles(id) on delete cascade,
  unit_id uuid not null references public.units(id) on delete cascade,
  score int not null check (score between 0 and 3),
  question_ids uuid[] not null default '{}',
  completed_at timestamptz not null default now()
);

create table public.ledger (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles(id) on delete cascade,
  currency text not null check (currency in ('XP','COIN')),
  amount int not null,
  reason text not null,
  reference_type text,
  reference_id uuid,
  idempotency_key text not null,
  created_at timestamptz not null default now(),
  unique(user_id,currency,idempotency_key)
);

create table public.shop_items (
  id uuid primary key default gen_random_uuid(),
  slug text unique not null,
  item_type text not null check (item_type in ('avatar','outfit','companion','background')),
  title_ar text not null,
  title_en text not null,
  price int not null check (price >= 0),
  asset_url text,
  active boolean not null default true
);

create table public.inventory (
  user_id uuid not null references public.profiles(id) on delete cascade,
  item_id uuid not null references public.shop_items(id) on delete cascade,
  acquired_at timestamptz not null default now(),
  primary key(user_id,item_id)
);

create table public.equipped_cosmetics (
  user_id uuid not null references public.profiles(id) on delete cascade,
  slot text not null check (slot in ('avatar','outfit','companion','background')),
  item_id uuid not null references public.shop_items(id) on delete cascade,
  updated_at timestamptz not null default now(),
  primary key(user_id,slot)
);

create table public.ai_conversations (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles(id) on delete cascade,
  title text not null default 'New chat',
  pinned boolean not null default false,
  archived boolean not null default false,
  temporary boolean not null default false,
  selected_model text not null default 'auto',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.ai_messages (
  id uuid primary key default gen_random_uuid(),
  conversation_id uuid not null references public.ai_conversations(id) on delete cascade,
  role text not null check (role in ('user','assistant','system')),
  content text not null default '',
  model text,
  status text not null default 'complete' check (status in ('generating','stopped','continuing','complete','failed')),
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);

create table public.audit_events (
  id bigint generated always as identity primary key,
  actor_id uuid references public.profiles(id) on delete set null,
  action text not null,
  entity_type text not null,
  entity_id text,
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);

create or replace function public.is_staff()
returns boolean language sql stable security definer set search_path=''
as $$
  select exists(
    select 1 from public.profiles p
    where p.id=auth.uid() and p.role in ('teacher','admin')
  );
$$;

create or replace function public.is_admin()
returns boolean language sql stable security definer set search_path=''
as $$
  select exists(
    select 1 from public.profiles p
    where p.id=auth.uid() and p.role='admin'
  );
$$;

alter table public.profiles enable row level security;
alter table public.courses enable row level security;
alter table public.units enable row level security;
alter table public.lessons enable row level security;
alter table public.skills enable row level security;
alter table public.questions enable row level security;
alter table public.question_keys enable row level security;
alter table public.attempts enable row level security;
alter table public.skill_evidence enable row level security;
alter table public.lesson_progress enable row level security;
alter table public.boss_runs enable row level security;
alter table public.ledger enable row level security;
alter table public.shop_items enable row level security;
alter table public.inventory enable row level security;
alter table public.equipped_cosmetics enable row level security;
alter table public.ai_conversations enable row level security;
alter table public.ai_messages enable row level security;
alter table public.audit_events enable row level security;

create policy "profiles own read" on public.profiles for select using (id=auth.uid() or public.is_staff());
create policy "profiles own update" on public.profiles for update using (id=auth.uid()) with check (id=auth.uid());

revoke update on public.profiles from anon,authenticated;
grant update(display_name,preferred_language,avatar_url) on public.profiles to authenticated;
create policy "courses public read" on public.courses for select using (active or public.is_staff());
create policy "units read" on public.units for select using (true);
create policy "lessons read" on public.lessons for select using (true);
create policy "skills read" on public.skills for select using (true);
create policy "questions published read" on public.questions for select using (publication_status in ('published_demo','published') or public.is_staff());
create policy "questions staff write" on public.questions for all using (public.is_staff()) with check (public.is_staff());
create policy "question keys staff only" on public.question_keys for all using (public.is_staff()) with check (public.is_staff());
create policy "attempts own read" on public.attempts for select using (user_id=auth.uid() or public.is_staff());
create policy "attempts own insert" on public.attempts for insert with check (user_id=auth.uid());
create policy "evidence own read" on public.skill_evidence for select using (user_id=auth.uid() or public.is_staff());
create policy "lesson progress own" on public.lesson_progress for select using (user_id=auth.uid() or public.is_staff());
create policy "boss runs own" on public.boss_runs for select using (user_id=auth.uid() or public.is_staff());
create policy "ledger own read" on public.ledger for select using (user_id=auth.uid());
create policy "shop public read" on public.shop_items for select using (active or public.is_admin());
create policy "inventory own read" on public.inventory for select using (user_id=auth.uid());
create policy "equipped own" on public.equipped_cosmetics for select using (user_id=auth.uid());
create policy "ai conversations own" on public.ai_conversations for all using (user_id=auth.uid()) with check (user_id=auth.uid());
create policy "ai messages own" on public.ai_messages for all using (
  exists(select 1 from public.ai_conversations c where c.id=conversation_id and c.user_id=auth.uid())
) with check (
  exists(select 1 from public.ai_conversations c where c.id=conversation_id and c.user_id=auth.uid())
);
create policy "audit admin read" on public.audit_events for select using (public.is_admin());

create or replace function public.handle_new_user()
returns trigger language plpgsql security definer set search_path=''
as $$
begin
  insert into public.profiles(id,display_name,role)
  values(new.id,coalesce(new.raw_user_meta_data->>'display_name',''),'student');
  return new;
end;
$$;

create trigger on_auth_user_created
after insert on auth.users
for each row execute procedure public.handle_new_user();

create index attempts_user_question_created_idx on public.attempts(user_id,question_id,created_at desc);
create index skill_evidence_user_review_idx on public.skill_evidence(user_id,next_review_at);
create index lesson_progress_user_idx on public.lesson_progress(user_id,updated_at desc);
create index boss_runs_user_unit_idx on public.boss_runs(user_id,unit_id,completed_at desc);
create index ledger_user_created_idx on public.ledger(user_id,created_at desc);
create index ai_conversations_user_updated_idx on public.ai_conversations(user_id,updated_at desc);
create index ai_messages_conversation_created_idx on public.ai_messages(conversation_id,created_at);
