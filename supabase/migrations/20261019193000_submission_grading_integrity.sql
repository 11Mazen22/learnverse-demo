-- Grading integrity: a score may only exist once the student has actually
-- submitted the assignment. Teachers previously could grade a draft submission
-- row (submitted_at is null) because the update policy and table had no guard.
-- Repeatable and idempotent: safe to re-run on staging and production.

-- Repair (defensively) any legacy grade that was recorded without a submission
-- timestamp. The invalid grade is cleared instead of inventing a submit time.
update public.assignment_submissions
set score = null
where submitted_at is null
  and score is not null;

alter table public.assignment_submissions
  drop constraint if exists assignment_submissions_score_requires_submission;

alter table public.assignment_submissions
  add constraint assignment_submissions_score_requires_submission
  check (score is null or submitted_at is not null);

-- Keep the RLS update policy aligned with the constraint: a teacher update of an
-- unsubmitted row must fail as an authorization error, not rely on the CHECK.
drop policy if exists "submissions scoped update" on public.assignment_submissions;
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
  or (
    submitted_at is not null
    and exists(
      select 1 from public.assignments a
      where a.id=assignment_id and (select private.can_manage_class(a.class_id))
    )
  )
);
