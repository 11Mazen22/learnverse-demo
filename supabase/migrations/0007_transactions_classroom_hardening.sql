
alter function public.apply_ledger_to_profile() set schema private;
alter function public.can_access_class(uuid) set schema private;
alter function public.can_manage_class(uuid) set schema private;
alter function public.claim_ai_quota(uuid,text,int,int) set schema private;
alter function public.submit_attempt(uuid,jsonb,boolean,text,boolean) set schema private;
alter function public.complete_lesson(uuid,numeric) set schema private;
alter function public.purchase_shop_item(uuid,text) set schema private;
alter function public.equip_cosmetic(uuid) set schema private;
alter function public.claim_reward_box(uuid) set schema private;

revoke all on function private.apply_ledger_to_profile() from public,anon,authenticated;
revoke all on function private.can_access_class(uuid) from public;
revoke all on function private.can_manage_class(uuid) from public;
revoke all on function private.claim_ai_quota(uuid,text,int,int) from public,anon,authenticated;
revoke all on function private.submit_attempt(uuid,jsonb,boolean,text,boolean) from public;
revoke all on function private.complete_lesson(uuid,numeric) from public;
revoke all on function private.purchase_shop_item(uuid,text) from public;
revoke all on function private.equip_cosmetic(uuid) from public;
revoke all on function private.claim_reward_box(uuid) from public;

grant execute on function private.can_access_class(uuid) to authenticated;
grant execute on function private.can_manage_class(uuid) to authenticated;
grant execute on function private.claim_ai_quota(uuid,text,int,int) to service_role;
grant execute on function private.submit_attempt(uuid,jsonb,boolean,text,boolean) to authenticated;
grant execute on function private.complete_lesson(uuid,numeric) to authenticated;
grant execute on function private.purchase_shop_item(uuid,text) to authenticated;
grant execute on function private.equip_cosmetic(uuid) to authenticated;
grant execute on function private.claim_reward_box(uuid) to authenticated;

create function public.submit_attempt(
  p_question_id uuid,
  p_response jsonb,
  p_assisted boolean,
  p_idempotency_key text,
  p_practice_repeat boolean default false
)
returns jsonb language sql security invoker set search_path=''
as $ select private.submit_attempt(p_question_id,p_response,p_assisted,p_idempotency_key,p_practice_repeat); $;

create function public.complete_lesson(p_lesson_id uuid,p_score numeric)
returns jsonb language sql security invoker set search_path=''
as $ select private.complete_lesson(p_lesson_id,p_score); $;

create function public.purchase_shop_item(p_item_id uuid,p_idempotency_key text)
returns jsonb language sql security invoker set search_path=''
as $ select private.purchase_shop_item(p_item_id,p_idempotency_key); $;

create function public.equip_cosmetic(p_item_id uuid)
returns jsonb language sql security invoker set search_path=''
as $ select private.equip_cosmetic(p_item_id); $;

create function public.claim_reward_box(p_box_id uuid)
returns jsonb language sql security invoker set search_path=''
as $ select private.claim_reward_box(p_box_id); $;

create function public.claim_ai_quota(
  p_user_id uuid,
  p_capability text,
  p_limit int,
  p_window_seconds int
)
returns table(allowed boolean,remaining int,reset_at timestamptz)
language sql security invoker set search_path=''
as $ select * from private.claim_ai_quota(p_user_id,p_capability,p_limit,p_window_seconds); $;

revoke all on function public.submit_attempt(uuid,jsonb,boolean,text,boolean) from public,anon;
grant execute on function public.submit_attempt(uuid,jsonb,boolean,text,boolean) to authenticated;
revoke all on function public.complete_lesson(uuid,numeric) from public,anon;
grant execute on function public.complete_lesson(uuid,numeric) to authenticated;
revoke all on function public.purchase_shop_item(uuid,text) from public,anon;
grant execute on function public.purchase_shop_item(uuid,text) to authenticated;
revoke all on function public.equip_cosmetic(uuid) from public,anon;
grant execute on function public.equip_cosmetic(uuid) to authenticated;
revoke all on function public.claim_reward_box(uuid) from public,anon;
grant execute on function public.claim_reward_box(uuid) to authenticated;
revoke all on function public.claim_ai_quota(uuid,text,int,int) from public,anon,authenticated;
grant execute on function public.claim_ai_quota(uuid,text,int,int) to service_role;

create policy "ai usage direct deny" on public.ai_usage_events
for all to anon,authenticated using(false) with check(false);

revoke update on public.profiles from authenticated;
grant update(display_name,preferred_language,avatar_url) on public.profiles to authenticated;

create or replace function private.touch_updated_at()
returns trigger language plpgsql security invoker set search_path=''
as $$ begin new.updated_at=now(); return new; end; $$;

drop trigger if exists profiles_touch_updated_at on public.profiles;
create trigger profiles_touch_updated_at
before update on public.profiles
for each row execute procedure private.touch_updated_at();

drop policy if exists "attempts own insert" on public.attempts;
revoke insert,update,delete on public.attempts from authenticated;

revoke update on public.notifications from authenticated;
grant update(read_at) on public.notifications to authenticated;

drop policy if exists "classes scoped read" on public.classes;
drop policy if exists "classes admin write" on public.classes;
create policy "classes scoped read" on public.classes
for select to authenticated using ((select private.can_access_class(id)));
create policy "classes admin insert" on public.classes
for insert to authenticated with check ((select private.is_admin()));
create policy "classes admin update" on public.classes
for update to authenticated using ((select private.is_admin())) with check ((select private.is_admin()));
create policy "classes admin delete" on public.classes
for delete to authenticated using ((select private.is_admin()));

drop policy if exists "membership scoped read" on public.class_memberships;
drop policy if exists "membership admin write" on public.class_memberships;
create policy "membership scoped read" on public.class_memberships
for select to authenticated
using (student_id=(select auth.uid()) or (select private.can_manage_class(class_id)));
create policy "membership admin insert" on public.class_memberships
for insert to authenticated with check ((select private.is_admin()));
create policy "membership admin update" on public.class_memberships
for update to authenticated using ((select private.is_admin())) with check ((select private.is_admin()));
create policy "membership admin delete" on public.class_memberships
for delete to authenticated using ((select private.is_admin()));

drop policy if exists "teacher class scoped read" on public.teacher_class_access;
drop policy if exists "teacher class admin write" on public.teacher_class_access;
create policy "teacher class scoped read" on public.teacher_class_access
for select to authenticated
using (teacher_id=(select auth.uid()) or (select private.is_admin()));
create policy "teacher class admin insert" on public.teacher_class_access
for insert to authenticated with check ((select private.is_admin()));
create policy "teacher class admin update" on public.teacher_class_access
for update to authenticated using ((select private.is_admin())) with check ((select private.is_admin()));
create policy "teacher class admin delete" on public.teacher_class_access
for delete to authenticated using ((select private.is_admin()));

drop policy if exists "assignments scoped read" on public.assignments;
drop policy if exists "assignments teacher write" on public.assignments;
create policy "assignments scoped read" on public.assignments
for select to authenticated using ((select private.can_access_class(class_id)));
create policy "assignments teacher insert" on public.assignments
for insert to authenticated
with check ((select private.can_manage_class(class_id)) and created_by=(select auth.uid()));
create policy "assignments teacher update" on public.assignments
for update to authenticated
using ((select private.can_manage_class(class_id)))
with check ((select private.can_manage_class(class_id)));
create policy "assignments teacher delete" on public.assignments
for delete to authenticated using ((select private.can_manage_class(class_id)));

drop policy if exists "assignment items scoped read" on public.assignment_items;
drop policy if exists "assignment items teacher write" on public.assignment_items;
create policy "assignment items scoped read" on public.assignment_items
for select to authenticated
using (exists(select 1 from public.assignments a where a.id=assignment_id and (select private.can_access_class(a.class_id))));
create policy "assignment items teacher insert" on public.assignment_items
for insert to authenticated
with check (exists(select 1 from public.assignments a where a.id=assignment_id and (select private.can_manage_class(a.class_id))));
create policy "assignment items teacher update" on public.assignment_items
for update to authenticated
using (exists(select 1 from public.assignments a where a.id=assignment_id and (select private.can_manage_class(a.class_id))))
with check (exists(select 1 from public.assignments a where a.id=assignment_id and (select private.can_manage_class(a.class_id))));
create policy "assignment items teacher delete" on public.assignment_items
for delete to authenticated
using (exists(select 1 from public.assignments a where a.id=assignment_id and (select private.can_manage_class(a.class_id))));

drop policy if exists "submissions scoped read" on public.assignment_submissions;
drop policy if exists "submissions own insert" on public.assignment_submissions;
drop policy if exists "submissions own update" on public.assignment_submissions;
create policy "submissions scoped read" on public.assignment_submissions
for select to authenticated
using (
  student_id=(select auth.uid())
  or exists(select 1 from public.assignments a where a.id=assignment_id and (select private.can_manage_class(a.class_id)))
);
create policy "submissions own insert" on public.assignment_submissions
for insert to authenticated
with check (
  student_id=(select auth.uid())
  and score is null
  and exists(select 1 from public.assignments a where a.id=assignment_id and (select private.can_access_class(a.class_id)))
);
create policy "submissions own update" on public.assignment_submissions
for update to authenticated
using (student_id=(select auth.uid()) and score is null)
with check (student_id=(select auth.uid()) and score is null);

drop policy if exists "mission own" on public.mission_runs;
create policy "mission own" on public.mission_runs
for all to authenticated
using (user_id=(select auth.uid()))
with check (user_id=(select auth.uid()));

drop policy if exists "reward boxes own read" on public.reward_boxes;
create policy "reward boxes own read" on public.reward_boxes
for select to authenticated using (user_id=(select auth.uid()));

drop policy if exists "attachments own" on public.ai_attachments;
create policy "attachments own" on public.ai_attachments
for all to authenticated
using (user_id=(select auth.uid()))
with check (user_id=(select auth.uid()));

drop policy if exists "notifications own read" on public.notifications;
drop policy if exists "notifications own update" on public.notifications;
create policy "notifications own read" on public.notifications
for select to authenticated using (user_id=(select auth.uid()));
create policy "notifications own update" on public.notifications
for update to authenticated
using (user_id=(select auth.uid()))
with check (user_id=(select auth.uid()));

drop policy if exists "purchases own read" on public.purchases;
create policy "purchases own read" on public.purchases
for select to authenticated using (user_id=(select auth.uid()));

create index if not exists ai_attachments_message_id_idx on public.ai_attachments(message_id);
create index if not exists ai_attachments_user_id_idx on public.ai_attachments(user_id);
create index if not exists assignment_items_question_id_idx on public.assignment_items(question_id);
create index if not exists assignments_created_by_idx on public.assignments(created_by);
create index if not exists mission_runs_lesson_id_idx on public.mission_runs(lesson_id);
create index if not exists mission_runs_skill_id_idx on public.mission_runs(skill_id);
create index if not exists purchases_item_id_idx on public.purchases(item_id);
