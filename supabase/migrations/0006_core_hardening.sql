
create schema if not exists private;
revoke all on schema private from public;
grant usage on schema private to anon, authenticated;

create or replace function private.is_staff()
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select exists(
    select 1 from public.profiles p
    where p.id = (select auth.uid())
      and p.role in ('teacher','admin')
  );
$$;

create or replace function private.is_admin()
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select exists(
    select 1 from public.profiles p
    where p.id = (select auth.uid())
      and p.role = 'admin'
  );
$$;

grant execute on function private.is_staff() to anon, authenticated;
grant execute on function private.is_admin() to anon, authenticated;

create or replace function private.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  insert into public.profiles(id,display_name,role)
  values(new.id,coalesce(new.raw_user_meta_data->>'display_name',''),'student');
  return new;
end;
$$;

revoke all on function private.handle_new_user() from public, anon, authenticated;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
after insert on auth.users
for each row execute procedure private.handle_new_user();

drop policy if exists "profiles own read" on public.profiles;
drop policy if exists "profiles own update" on public.profiles;
create policy "profiles own read" on public.profiles
for select to authenticated
using (id=(select auth.uid()) or (select private.is_staff()));
create policy "profiles own update" on public.profiles
for update to authenticated
using (id=(select auth.uid()))
with check (id=(select auth.uid()));

drop policy if exists "courses public read" on public.courses;
create policy "courses public read" on public.courses
for select to anon,authenticated
using (active or (select private.is_staff()));

drop policy if exists "units read" on public.units;
create policy "units read" on public.units
for select to anon,authenticated
using (
  exists(
    select 1 from public.courses c
    where c.id=units.course_id and (c.active or (select private.is_staff()))
  )
);

drop policy if exists "lessons read" on public.lessons;
create policy "lessons read" on public.lessons
for select to anon,authenticated
using (
  exists(
    select 1 from public.units u
    join public.courses c on c.id=u.course_id
    where u.id=lessons.unit_id and (c.active or (select private.is_staff()))
  )
);

drop policy if exists "skills read" on public.skills;
create policy "skills read" on public.skills
for select to anon,authenticated
using (
  exists(
    select 1 from public.courses c
    where c.id=skills.course_id and (c.active or (select private.is_staff()))
  )
);

drop policy if exists "questions published read" on public.questions;
drop policy if exists "questions staff write" on public.questions;
create policy "questions published read" on public.questions
for select to anon,authenticated
using (publication_status in ('published_demo','published') or (select private.is_staff()));
create policy "questions staff insert" on public.questions
for insert to authenticated with check ((select private.is_staff()));
create policy "questions staff update" on public.questions
for update to authenticated
using ((select private.is_staff()))
with check ((select private.is_staff()));
create policy "questions staff delete" on public.questions
for delete to authenticated using ((select private.is_staff()));

drop policy if exists "question keys staff only" on public.question_keys;
create policy "question keys staff read" on public.question_keys
for select to authenticated using ((select private.is_staff()));
create policy "question keys staff insert" on public.question_keys
for insert to authenticated with check ((select private.is_staff()));
create policy "question keys staff update" on public.question_keys
for update to authenticated
using ((select private.is_staff()))
with check ((select private.is_staff()));
create policy "question keys staff delete" on public.question_keys
for delete to authenticated using ((select private.is_staff()));

drop policy if exists "attempts own read" on public.attempts;
drop policy if exists "attempts own insert" on public.attempts;
create policy "attempts own read" on public.attempts
for select to authenticated
using (user_id=(select auth.uid()) or (select private.is_staff()));
create policy "attempts own insert" on public.attempts
for insert to authenticated
with check (user_id=(select auth.uid()));

drop policy if exists "evidence own read" on public.skill_evidence;
create policy "evidence own read" on public.skill_evidence
for select to authenticated
using (user_id=(select auth.uid()) or (select private.is_staff()));

drop policy if exists "lesson progress own" on public.lesson_progress;
create policy "lesson progress own" on public.lesson_progress
for select to authenticated
using (user_id=(select auth.uid()) or (select private.is_staff()));

drop policy if exists "boss runs own" on public.boss_runs;
create policy "boss runs own" on public.boss_runs
for select to authenticated
using (user_id=(select auth.uid()) or (select private.is_staff()));

drop policy if exists "ledger own read" on public.ledger;
create policy "ledger own read" on public.ledger
for select to authenticated using (user_id=(select auth.uid()));

drop policy if exists "shop public read" on public.shop_items;
create policy "shop public read" on public.shop_items
for select to anon,authenticated using (active or (select private.is_admin()));

drop policy if exists "inventory own read" on public.inventory;
create policy "inventory own read" on public.inventory
for select to authenticated using (user_id=(select auth.uid()));

drop policy if exists "equipped own" on public.equipped_cosmetics;
create policy "equipped own" on public.equipped_cosmetics
for select to authenticated using (user_id=(select auth.uid()));

drop policy if exists "ai conversations own" on public.ai_conversations;
create policy "ai conversations own" on public.ai_conversations
for all to authenticated
using (user_id=(select auth.uid()))
with check (user_id=(select auth.uid()));

drop policy if exists "ai messages own" on public.ai_messages;
create policy "ai messages own" on public.ai_messages
for all to authenticated
using (
  exists(select 1 from public.ai_conversations c
    where c.id=ai_messages.conversation_id and c.user_id=(select auth.uid()))
)
with check (
  exists(select 1 from public.ai_conversations c
    where c.id=ai_messages.conversation_id and c.user_id=(select auth.uid()))
);

drop policy if exists "audit admin read" on public.audit_events;
create policy "audit admin read" on public.audit_events
for select to authenticated using ((select private.is_admin()));

revoke execute on function public.handle_new_user() from public,anon,authenticated;
revoke execute on function public.is_staff() from public,anon,authenticated;
revoke execute on function public.is_admin() from public,anon,authenticated;

create index if not exists attempts_question_id_idx on public.attempts(question_id);
create index if not exists audit_events_actor_id_idx on public.audit_events(actor_id);
create index if not exists boss_runs_unit_id_idx on public.boss_runs(unit_id);
create index if not exists equipped_cosmetics_item_id_idx on public.equipped_cosmetics(item_id);
create index if not exists inventory_item_id_idx on public.inventory(item_id);
create index if not exists lesson_progress_lesson_id_idx on public.lesson_progress(lesson_id);
create index if not exists questions_created_by_idx on public.questions(created_by);
create index if not exists questions_lesson_id_idx on public.questions(lesson_id);
create index if not exists questions_skill_id_idx on public.questions(skill_id);
create index if not exists questions_variant_of_idx on public.questions(variant_of);
create index if not exists skill_evidence_skill_id_idx on public.skill_evidence(skill_id);
