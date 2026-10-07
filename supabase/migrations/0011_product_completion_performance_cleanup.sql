
drop policy if exists "submissions own update" on public.assignment_submissions;
drop policy if exists "submissions teacher update" on public.assignment_submissions;

create policy "submissions scoped update"
on public.assignment_submissions for update to authenticated
using (
  (student_id=(select auth.uid()) and score is null)
  or exists(
    select 1 from public.assignments a
    where a.id=assignment_id and (select private.can_manage_class(a.class_id))
  )
)
with check (
  (student_id=(select auth.uid()) and score is null)
  or exists(
    select 1 from public.assignments a
    where a.id=assignment_id and (select private.can_manage_class(a.class_id))
  )
);

drop index if exists public.boss_runs_user_completed_idx;
drop index if exists public.user_settings_locale_idx;
