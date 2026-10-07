
drop policy if exists "courses admin insert" on public.courses;
drop policy if exists "courses admin update" on public.courses;
drop policy if exists "courses admin delete" on public.courses;
create policy "courses admin insert" on public.courses
for insert to authenticated with check ((select private.is_admin()));
create policy "courses admin update" on public.courses
for update to authenticated using ((select private.is_admin())) with check ((select private.is_admin()));
create policy "courses admin delete" on public.courses
for delete to authenticated using ((select private.is_admin()));

drop policy if exists "units admin insert" on public.units;
drop policy if exists "units admin update" on public.units;
drop policy if exists "units admin delete" on public.units;
create policy "units admin insert" on public.units
for insert to authenticated with check ((select private.is_admin()));
create policy "units admin update" on public.units
for update to authenticated using ((select private.is_admin())) with check ((select private.is_admin()));
create policy "units admin delete" on public.units
for delete to authenticated using ((select private.is_admin()));

drop policy if exists "lessons admin insert" on public.lessons;
drop policy if exists "lessons admin update" on public.lessons;
drop policy if exists "lessons admin delete" on public.lessons;
create policy "lessons admin insert" on public.lessons
for insert to authenticated with check ((select private.is_admin()));
create policy "lessons admin update" on public.lessons
for update to authenticated using ((select private.is_admin())) with check ((select private.is_admin()));
create policy "lessons admin delete" on public.lessons
for delete to authenticated using ((select private.is_admin()));

drop policy if exists "skills admin insert" on public.skills;
drop policy if exists "skills admin update" on public.skills;
drop policy if exists "skills admin delete" on public.skills;
create policy "skills admin insert" on public.skills
for insert to authenticated with check ((select private.is_admin()));
create policy "skills admin update" on public.skills
for update to authenticated using ((select private.is_admin())) with check ((select private.is_admin()));
create policy "skills admin delete" on public.skills
for delete to authenticated using ((select private.is_admin()));
