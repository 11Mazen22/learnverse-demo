-- Renaissance 2.0: explicit, user-owned AI memory. Additive, staging-first.
-- Legacy user_settings.ai_memory_enabled is NOT consent for this system.
begin;
create table public.ai_memory_consent (
 user_id uuid primary key references auth.users(id) on delete cascade,
 enabled boolean not null default false,
 updated_at timestamptz not null default now()
);
create table public.ai_user_memories (
 id uuid primary key default gen_random_uuid(),
 user_id uuid not null references auth.users(id) on delete cascade,
 content text not null check (char_length(content) between 8 and 500),
 source text not null default 'manual' check (source = 'manual'),
 created_at timestamptz not null default now(),
 updated_at timestamptz not null default now()
);
create index ai_user_memories_owner_recent_idx on public.ai_user_memories(user_id,updated_at desc);
alter table public.ai_memory_consent enable row level security;
alter table public.ai_user_memories enable row level security;
create policy "consent owner read" on public.ai_memory_consent for select to authenticated using(user_id=(select auth.uid()));
create policy "consent owner insert" on public.ai_memory_consent for insert to authenticated with check(user_id=(select auth.uid()));
create policy "consent owner update" on public.ai_memory_consent for update to authenticated using(user_id=(select auth.uid())) with check(user_id=(select auth.uid()));
create policy "consent owner delete" on public.ai_memory_consent for delete to authenticated using(user_id=(select auth.uid()));
create policy "memory owner read" on public.ai_user_memories for select to authenticated using(user_id=(select auth.uid()));
create policy "memory owner insert" on public.ai_user_memories for insert to authenticated with check(user_id=(select auth.uid()));
create policy "memory owner update" on public.ai_user_memories for update to authenticated using(user_id=(select auth.uid())) with check(user_id=(select auth.uid()));
create policy "memory owner delete" on public.ai_user_memories for delete to authenticated using(user_id=(select auth.uid()));
revoke all on public.ai_memory_consent,public.ai_user_memories from anon;
grant select,insert,update,delete on public.ai_memory_consent,public.ai_user_memories to authenticated;
comment on table public.ai_memory_consent is 'Explicit Noata AI memory consent, independently opt-in. No retroactive consent from legacy user_settings fields.';
comment on table public.ai_user_memories is 'User-authorized manual AI context only; data isolated with owner RLS. No derived memory indexes in this release.';
commit;
