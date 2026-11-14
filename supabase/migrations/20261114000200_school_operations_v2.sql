-- Noäta 2.0 M3: School Operations, Academic Terms, Class Attendance,
-- Announcements, Feature Flags, Assignment Rubric Metadata & Export Audit Logging.
-- Additive, idempotent, forward-only. Zero staff bypass onto student private decks,
-- flashcards, study tasks, mistake logs, or AI conversations.

-- 1. Academic Terms
create table if not exists public.academic_terms (
  id uuid primary key default gen_random_uuid(),
  slug text not null unique check (slug ~ '^[a-z0-9][a-z0-9-]{1,63}$'),
  title_ar text not null check (char_length(btrim(title_ar)) between 1 and 140),
  title_en text not null check (char_length(btrim(title_en)) between 1 and 140),
  academic_year text not null check (char_length(btrim(academic_year)) between 4 and 32),
  starts_on date not null,
  ends_on date not null,
  is_active boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint academic_terms_valid_range check (ends_on > starts_on)
);

create unique index if not exists academic_terms_single_active_idx
  on public.academic_terms (is_active)
  where is_active = true;

create trigger academic_terms_touch_updated_at
  before update on public.academic_terms
  for each row execute procedure private.touch_updated_at();

alter table public.academic_terms enable row level security;

revoke all on table public.academic_terms from public, anon, authenticated;
grant select, insert, update, delete on table public.academic_terms to authenticated;

create policy "academic terms authenticated read" on public.academic_terms
  for select to authenticated
  using (true);

create policy "academic terms admin insert" on public.academic_terms
  for insert to authenticated
  with check ((select private.is_admin()));

create policy "academic terms admin update" on public.academic_terms
  for update to authenticated
  using ((select private.is_admin()))
  with check ((select private.is_admin()));

create policy "academic terms admin delete" on public.academic_terms
  for delete to authenticated
  using ((select private.is_admin()));

-- 2. Feature Flags
create table if not exists public.feature_flags (
  flag_key text primary key check (flag_key ~ '^[a-z][a-z0-9_.-]{1,63}$'),
  title_ar text not null default '' check (char_length(title_ar) <= 140),
  title_en text not null default '' check (char_length(title_en) <= 140),
  description_ar text not null default '' check (char_length(description_ar) <= 500),
  description_en text not null default '' check (char_length(description_en) <= 500),
  enabled boolean not null default false,
  rollout_scope text not null default 'all' check (rollout_scope in ('all', 'staff', 'students', 'beta')),
  updated_by uuid references public.profiles(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists feature_flags_updated_by_idx
  on public.feature_flags (updated_by);

create trigger feature_flags_touch_updated_at
  before update on public.feature_flags
  for each row execute procedure private.touch_updated_at();

alter table public.feature_flags enable row level security;

revoke all on table public.feature_flags from public, anon, authenticated;
grant select, insert, update, delete on table public.feature_flags to authenticated;

create policy "feature flags authenticated read" on public.feature_flags
  for select to authenticated
  using (true);

create policy "feature flags admin insert" on public.feature_flags
  for insert to authenticated
  with check ((select private.is_admin()));

create policy "feature flags admin update" on public.feature_flags
  for update to authenticated
  using ((select private.is_admin()))
  with check ((select private.is_admin()));

create policy "feature flags admin delete" on public.feature_flags
  for delete to authenticated
  using ((select private.is_admin()));

insert into public.feature_flags (flag_key, title_ar, title_en, description_ar, description_en, enabled, rollout_scope)
values
  ('ai_study_studio', 'استوديو المذاكرة الذكي', 'Smart AI Study Studio', 'إنشاء حزم البطاقات والاختبارات بالذكاء الاصطناعي من الدروس.', 'AI-assisted deck and practice generation anchored to lessons.', true, 'all'),
  ('spaced_review_v2', 'جدولة المراجعة المتباعدة', 'SM-2 Spaced Review v2', 'مؤقت المراجعة الخادمي وتتبع الأخطاء.', 'Server-authoritative SM-2 intervals and mistake recovery.', true, 'all'),
  ('quran_reader', 'قارئ المصحف الشريف', 'Quran Mushaf Reader', 'التلاوة الصوتية وبحث الآيات داخل التطبيق.', 'Integrated Mushaf reader and verse recitation.', true, 'all')
on conflict (flag_key) do nothing;

-- 3. Class Attendance (Managed Class Scoped)
create table if not exists public.class_attendance (
  id uuid primary key default gen_random_uuid(),
  class_id uuid not null references public.classes(id) on delete cascade,
  student_id uuid not null references public.profiles(id) on delete cascade,
  session_date date not null,
  status text not null check (status in ('present', 'late', 'absent', 'excused')),
  notes text not null default '' check (char_length(notes) <= 500),
  recorded_by uuid references public.profiles(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint class_attendance_unique_day unique (class_id, student_id, session_date)
);

create index if not exists class_attendance_class_date_idx
  on public.class_attendance (class_id, session_date desc);

create index if not exists class_attendance_student_idx
  on public.class_attendance (student_id, session_date desc);

create index if not exists class_attendance_recorded_by_idx
  on public.class_attendance (recorded_by);

create trigger class_attendance_touch_updated_at
  before update on public.class_attendance
  for each row execute procedure private.touch_updated_at();

alter table public.class_attendance enable row level security;

revoke all on table public.class_attendance from public, anon, authenticated;
grant select, insert, update, delete on table public.class_attendance to authenticated;

create policy "class attendance scoped read" on public.class_attendance
  for select to authenticated
  using (
    student_id = (select auth.uid())
    or (select private.can_manage_class(class_id))
  );

create policy "class attendance staff insert" on public.class_attendance
  for insert to authenticated
  with check (
    (select private.can_manage_class(class_id))
    and (recorded_by is null or recorded_by = (select auth.uid()) or (select private.is_admin()))
    and exists (
      select 1 from public.class_memberships cm
      where cm.class_id = class_attendance.class_id
        and cm.student_id = class_attendance.student_id
    )
  );

create policy "class attendance staff update" on public.class_attendance
  for update to authenticated
  using ((select private.can_manage_class(class_id)))
  with check (
    (select private.can_manage_class(class_id))
    and (recorded_by is null or recorded_by = (select auth.uid()) or (select private.is_admin()))
    and exists (
      select 1 from public.class_memberships cm
      where cm.class_id = class_attendance.class_id
        and cm.student_id = class_attendance.student_id
    )
  );

create policy "class attendance staff delete" on public.class_attendance
  for delete to authenticated
  using ((select private.can_manage_class(class_id)));

-- 4. Class & School Announcements
create table if not exists public.class_announcements (
  id uuid primary key default gen_random_uuid(),
  class_id uuid references public.classes(id) on delete cascade,
  author_id uuid not null references public.profiles(id) on delete cascade,
  title text not null check (char_length(btrim(title)) between 1 and 180),
  body text not null check (char_length(btrim(body)) between 1 and 2000),
  pinned boolean not null default false,
  published_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists class_announcements_class_idx
  on public.class_announcements (class_id, created_at desc);

create index if not exists class_announcements_author_idx
  on public.class_announcements (author_id);

create trigger class_announcements_touch_updated_at
  before update on public.class_announcements
  for each row execute procedure private.touch_updated_at();

alter table public.class_announcements enable row level security;

revoke all on table public.class_announcements from public, anon, authenticated;
grant select, insert, update, delete on table public.class_announcements to authenticated;

create policy "class announcements scoped read" on public.class_announcements
  for select to authenticated
  using (
    (select private.is_admin())
    or (class_id is not null and (select private.can_manage_class(class_id)))
    or (
      published_at is not null
      and (class_id is null or (select private.can_access_class(class_id)))
    )
  );

create policy "class announcements scoped insert" on public.class_announcements
  for insert to authenticated
  with check (
    (select private.is_admin())
    or (
      class_id is not null
      and (select private.can_manage_class(class_id))
      and author_id = (select auth.uid())
    )
  );

create policy "class announcements scoped update" on public.class_announcements
  for update to authenticated
  using (
    (select private.is_admin())
    or (class_id is not null and (select private.can_manage_class(class_id)))
  )
  with check (
    (select private.is_admin())
    or (
      class_id is not null
      and (select private.can_manage_class(class_id))
      and author_id = (select auth.uid())
    )
  );

create policy "class announcements scoped delete" on public.class_announcements
  for delete to authenticated
  using (
    (select private.is_admin())
    or (class_id is not null and (select private.can_manage_class(class_id)))
  );

-- 5. Additive rubric & instructional metadata on assignments
alter table public.assignments
  add column if not exists metadata jsonb not null default '{}'::jsonb;

do $$
begin
  if not exists (
    select 1
    from pg_constraint
    where conrelid = 'public.assignments'::regclass
      and conname = 'assignments_metadata_object'
  ) then
    alter table public.assignments
      add constraint assignments_metadata_object
      check (jsonb_typeof(metadata) = 'object');
  end if;
end $$;

-- 6. Staff export audit logging helper (Teacher/Admin authorized exports only)
create or replace function private.log_staff_export(
  p_entity_type text,
  p_row_count int default 0,
  p_details jsonb default '{}'::jsonb
) returns bigint
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_actor uuid := auth.uid();
  v_clean_entity text := btrim(coalesce(p_entity_type, ''));
  v_event_id bigint;
begin
  if v_actor is null or not (select private.is_staff()) then
    raise exception 'Staff role required for compliance export logging';
  end if;
  if char_length(v_clean_entity) < 2 or char_length(v_clean_entity) > 64 then
    raise exception 'Invalid entity type';
  end if;
  if p_details is null or jsonb_typeof(p_details) <> 'object' then
    raise exception 'Export metadata must be a JSON object';
  end if;

  insert into public.audit_events (actor_id, action, entity_type, entity_id, metadata)
  values (
    v_actor,
    'staff_export',
    v_clean_entity,
    null,
    jsonb_build_object(
      'row_count', greatest(0, coalesce(p_row_count, 0)),
      'details', p_details
    )
  )
  returning id into v_event_id;

  return v_event_id;
end;
$$;

revoke all on function private.log_staff_export(text, int, jsonb) from public, anon, authenticated;

create or replace function public.log_staff_export(
  p_entity_type text,
  p_row_count int default 0,
  p_details jsonb default '{}'::jsonb
) returns bigint
language sql
security definer
set search_path = ''
as $$
  select private.log_staff_export(p_entity_type, p_row_count, p_details);
$$;

revoke all on function public.log_staff_export(text, int, jsonb) from public, anon;
grant execute on function public.log_staff_export(text, int, jsonb) to authenticated;
