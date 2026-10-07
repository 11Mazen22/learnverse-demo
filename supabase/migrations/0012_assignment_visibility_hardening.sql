
drop policy if exists "assignments scoped read" on public.assignments;
create policy "assignments scoped read"
on public.assignments for select to authenticated
using (
  (select private.can_manage_class(class_id))
  or (
    published_at is not null
    and exists(
      select 1 from public.class_memberships m
      where m.class_id=assignments.class_id
        and m.student_id=(select auth.uid())
    )
  )
);

drop policy if exists "assignment items scoped read" on public.assignment_items;
create policy "assignment items scoped read"
on public.assignment_items for select to authenticated
using (
  exists(
    select 1 from public.assignments a
    where a.id=assignment_id
      and (
        (select private.can_manage_class(a.class_id))
        or (
          a.published_at is not null
          and exists(
            select 1 from public.class_memberships m
            where m.class_id=a.class_id
              and m.student_id=(select auth.uid())
          )
        )
      )
  )
);

drop policy if exists "submissions own insert" on public.assignment_submissions;
create policy "submissions own insert"
on public.assignment_submissions for insert to authenticated
with check (
  student_id=(select auth.uid())
  and score is null
  and exists(
    select 1
    from public.assignments a
    join public.class_memberships m on m.class_id=a.class_id
    where a.id=assignment_id
      and a.published_at is not null
      and m.student_id=(select auth.uid())
  )
);
