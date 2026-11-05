-- Noata Aura role-aware onboarding progress.
--
-- This stores only tour identifiers and progress metadata. It never records page
-- content, learner answers, prompts, or other sensitive interaction data.

create table public.user_tour_progress (
  user_id uuid not null references public.profiles(id) on delete cascade,
  role public.noata_role not null,
  tour_id text not null check (
    char_length(tour_id) between 1 and 100
    and tour_id ~ '^[a-z0-9_:-]+$'
  ),
  tour_version integer not null check (tour_version > 0),
  status text not null default 'not_started'
    check (status in ('not_started', 'in_progress', 'completed', 'skipped')),
  step_index integer not null default 0 check (step_index >= 0),
  automatic_dismissed boolean not null default false,
  completed_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  primary key (user_id, role, tour_id),
  constraint user_tour_progress_completion_consistent check (
    (status = 'completed' and completed_at is not null)
    or (status <> 'completed' and completed_at is null)
  )
);

create index user_tour_progress_owner_recent_idx
  on public.user_tour_progress (user_id, role, updated_at desc);

alter table public.user_tour_progress enable row level security;

create policy "tour progress owner select"
  on public.user_tour_progress for select to authenticated
  using ((select auth.uid()) = user_id);

create policy "tour progress owner insert"
  on public.user_tour_progress for insert to authenticated
  with check (
    (select auth.uid()) = user_id
    and role = (
      select profile.role
      from public.profiles as profile
      where profile.id = (select auth.uid())
    )
  );

create policy "tour progress owner update"
  on public.user_tour_progress for update to authenticated
  using ((select auth.uid()) = user_id)
  with check (
    (select auth.uid()) = user_id
    and role = (
      select profile.role
      from public.profiles as profile
      where profile.id = (select auth.uid())
    )
  );

create policy "tour progress owner delete"
  on public.user_tour_progress for delete to authenticated
  using ((select auth.uid()) = user_id);

create trigger user_tour_progress_touch_updated_at
  before update on public.user_tour_progress
  for each row execute procedure private.touch_updated_at();

revoke all on public.user_tour_progress from anon, authenticated;
grant select, insert, update, delete on public.user_tour_progress to authenticated;

comment on table public.user_tour_progress is
  'Owner-scoped, role-aware guided-tour state. Stores no page content, prompts, or learner answers.';
