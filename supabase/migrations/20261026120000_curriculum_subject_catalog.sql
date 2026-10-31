-- Noata curriculum subject catalog and language-specific tracks.
--
-- Model (see docs/CURRICULUM_CATALOG.md):
--   public.subjects               -> the six canonical subject families
--   public.curriculum_tracks      -> eight selectable tracks (Science and Mathematics
--                                    each expose an Arabic-medium and an English-medium track)
--   public.curriculum_enrollments -> the learner's own track selection (owner scoped)
--
-- Every track owns its own course, unit, lessons, questions and skills, so progress,
-- mastery evidence and question banks never bleed between the Arabic and English
-- versions of Integrated Science or Mathematics.
--
-- The Arabic-medium tracks keep the real First Secondary Term 1 content that the
-- 20261025* migrations loaded. The two English-medium tracks are explicit English
-- renderings of the same Arabic source (variant lessons and variant questions with
-- `variant_of` links); they are labelled as translations, never as an official
-- English-medium textbook, and their provenance stays visible.
--
-- Idempotent: safe to re-run. Uses natural-key lookups and deterministic ids.

do $$
declare
  v_source_document text := 'first_secondary_term1_first_lessons_study_pack_2026_2027.txt';
  v_source_sha text := '2b7fc53252e02b1885df3c1d3141d163bb038eb6cb4d917c0d0c29addcfb5c28';
  v_prov jsonb := jsonb_build_object(
    'curriculum', true,
    'source_document', 'first_secondary_term1_first_lessons_study_pack_2026_2027.txt',
    'source_sha256', '2b7fc53252e02b1885df3c1d3141d163bb038eb6cb4d917c0d0c29addcfb5c28',
    'curriculum_context', jsonb_build_object(
      'country', 'Egypt',
      'grade_ar', 'الصف الأول الثانوي',
      'grade_en', 'First Secondary',
      'term', 1,
      'academic_year', '2026-2027'
    ),
    'provenance_ar', 'دليل مذاكرة أصلي ومفصّل يشرح الأفكار والقواعد ويقدّم أمثلة وأسئلة تدريبية، وليس نسخة حرفية من الكتب المدرسية. راجع الكتاب المدرسي مع هذه الملاحظات.',
    'provenance_en', 'An original detailed study guide that explains ideas and rules with examples and practice questions; it is not a verbatim copy of the official school textbooks. Use it alongside the school book.'
  );
  v_program uuid;
  v_subject uuid;
  v_track uuid;
  v_course uuid;
  v_unit uuid;
  v_ar_course uuid;
  v_en_course uuid;
  v_ar_unit uuid;
  v_en_unit uuid;
  v_row record;
begin
  -- ============================================================ schema
  create table if not exists public.subjects (
    id uuid primary key default gen_random_uuid(),
    slug text unique not null,
    canonical_key text unique not null,
    title_ar text not null,
    title_en text not null,
    short_title_ar text not null default '',
    short_title_en text not null default '',
    description_ar text not null default '',
    description_en text not null default '',
    grade_level int not null default 1 check (grade_level > 0),
    term int not null default 1 check (term > 0),
    position int not null check (position > 0),
    accent text not null default 'indigo',
    active boolean not null default true,
    metadata jsonb not null default '{}'::jsonb,
    created_at timestamptz not null default now(),
    updated_at timestamptz not null default now()
  );

  create table if not exists public.curriculum_tracks (
    id uuid primary key default gen_random_uuid(),
    subject_id uuid not null references public.subjects(id) on delete cascade,
    slug text unique not null,
    content_language text not null check (content_language in ('ar','en')),
    title_ar text not null,
    title_en text not null,
    grade_level int not null default 1 check (grade_level > 0),
    term int not null default 1 check (term > 0),
    publication_status text not null default 'draft'
      check (publication_status in ('draft','pending_source','published','retired')),
    course_id uuid references public.courses(id) on delete set null,
    source_document text,
    source_sha256 text,
    metadata jsonb not null default '{}'::jsonb,
    created_at timestamptz not null default now(),
    updated_at timestamptz not null default now(),
    unique (subject_id, content_language)
  );

  create table if not exists public.curriculum_enrollments (
    id uuid primary key default gen_random_uuid(),
    user_id uuid not null references public.profiles(id) on delete cascade,
    track_id uuid not null references public.curriculum_tracks(id) on delete cascade,
    status text not null default 'active' check (status in ('active','paused','completed')),
    created_at timestamptz not null default now(),
    updated_at timestamptz not null default now(),
    unique (user_id, track_id)
  );

  create index if not exists curriculum_tracks_subject_idx on public.curriculum_tracks(subject_id);
  create index if not exists curriculum_enrollments_user_idx on public.curriculum_enrollments(user_id);
  create index if not exists curriculum_enrollments_track_idx on public.curriculum_enrollments(track_id);

  alter table public.subjects enable row level security;
  alter table public.curriculum_tracks enable row level security;
  alter table public.curriculum_enrollments enable row level security;

  drop policy if exists "subjects public read" on public.subjects;
  create policy "subjects public read" on public.subjects for select to anon, authenticated
    using (active or (select private.is_admin()));
  drop policy if exists "subjects admin insert" on public.subjects;
  create policy "subjects admin insert" on public.subjects
    for insert to authenticated with check ((select private.is_admin()));
  drop policy if exists "subjects admin update" on public.subjects;
  create policy "subjects admin update" on public.subjects
    for update to authenticated using ((select private.is_admin())) with check ((select private.is_admin()));
  drop policy if exists "subjects admin delete" on public.subjects;

  drop policy if exists "tracks public read" on public.curriculum_tracks;
  create policy "tracks public read" on public.curriculum_tracks for select to anon, authenticated
    using (publication_status = 'published' or (select private.is_admin()));
  drop policy if exists "tracks admin insert" on public.curriculum_tracks;
  create policy "tracks admin insert" on public.curriculum_tracks
    for insert to authenticated with check ((select private.is_admin()));
  drop policy if exists "tracks admin update" on public.curriculum_tracks;
  create policy "tracks admin update" on public.curriculum_tracks
    for update to authenticated using ((select private.is_admin())) with check ((select private.is_admin()));
  drop policy if exists "tracks admin delete" on public.curriculum_tracks;

  drop policy if exists "enrollments own read" on public.curriculum_enrollments;
  create policy "enrollments own read" on public.curriculum_enrollments
    for select to authenticated
    using (user_id = (select auth.uid()) or (select private.is_admin()));
  drop policy if exists "enrollments own insert" on public.curriculum_enrollments;
  create policy "enrollments own insert" on public.curriculum_enrollments
    for insert to authenticated with check (user_id = (select auth.uid()));
  drop policy if exists "enrollments own update" on public.curriculum_enrollments;
  create policy "enrollments own update" on public.curriculum_enrollments
    for update to authenticated
    using (user_id = (select auth.uid()))
    with check (user_id = (select auth.uid()));
  drop policy if exists "enrollments own delete" on public.curriculum_enrollments;
  create policy "enrollments own delete" on public.curriculum_enrollments
    for delete to authenticated using (user_id = (select auth.uid()));

  -- Supabase Data API no longer auto-exposes newly created public tables.
  -- Explicit grants and RLS are both required; official catalog rows remain
  -- non-deletable through browser roles.
  revoke all on public.subjects, public.curriculum_tracks, public.curriculum_enrollments
    from anon, authenticated;
  grant select on public.subjects, public.curriculum_tracks to anon, authenticated;
  grant insert, update on public.subjects, public.curriculum_tracks to authenticated;
  grant select, insert, update, delete on public.curriculum_enrollments to authenticated;

  drop trigger if exists subjects_touch_updated_at on public.subjects;
  create trigger subjects_touch_updated_at
    before update on public.subjects
    for each row execute procedure private.touch_updated_at();
  drop trigger if exists curriculum_tracks_touch_updated_at on public.curriculum_tracks;
  create trigger curriculum_tracks_touch_updated_at
    before update on public.curriculum_tracks
    for each row execute procedure private.touch_updated_at();
  drop trigger if exists curriculum_enrollments_touch_updated_at on public.curriculum_enrollments;
  create trigger curriculum_enrollments_touch_updated_at
    before update on public.curriculum_enrollments
    for each row execute procedure private.touch_updated_at();

  -- ============================================================ subjects
  insert into public.subjects
    (slug, canonical_key, title_ar, title_en, short_title_ar, short_title_en,
     description_ar, description_en, grade_level, term, position, accent, metadata)
  values
    ('integrated-science', 'integrated_science', 'العلوم المتكاملة', 'Integrated Science',
     'علوم', 'Science',
     'الغلاف المائي على الأرض، الخصائص الكيميائية والفيزيائية للماء، المحاليل المائية، والأهمية الحيوية للماء.',
     'The hydrosphere on Earth, the chemical and physical properties of water, aqueous solutions, and the biological importance of water.',
     1, 1, 1, 'cyan', v_prov || jsonb_build_object('subject_key', 'integrated-science', 'dual_language', true)),
    ('mathematics', 'mathematics', 'الرياضيات', 'Mathematics',
     'رياضيات', 'Mathematics',
     'مدخل إلى الأعداد المركبة، تحديد نوع جذور المعادلة التربيعية، العلاقة بين الجذرين والمعاملات، إشارة الدالة التربيعية، والمتباينات التربيعية.',
     'Introduction to complex numbers, the nature of quadratic roots, relations between roots and coefficients, the sign of a quadratic function, and quadratic inequalities.',
     1, 1, 2, 'indigo', v_prov || jsonb_build_object('subject_key', 'mathematics', 'dual_language', true)),
    ('history', 'history', 'تاريخ', 'History',
     'تاريخ', 'History',
     'مصر الحضارة والعالم القديم: مفهوم الحضارة والتاريخ، انتقال مراكز الحضارة، وتطور الحضارات.',
     'Egypt, civilisation and the ancient world: the concepts of civilisation and history, the shifting centres of civilisation, and the development of civilisations.',
     1, 1, 3, 'amber', v_prov || jsonb_build_object('subject_key', 'history', 'dual_language', false)),
    ('arabic-language', 'arabic_language', 'اللغة العربية', 'Arabic Language',
     'لغة عربية', 'Arabic',
     'أول خمسة نصوص قرائية وأدبية، وأول خمسة دروس من قواعد النحو والصرف، ثم ملخص دراسي لأجزاء قصة «أبو الفوارس: عنترة بن شداد» الأربعة.',
     'The first five reading and literature texts, the first five grammar and morphology lessons, then a study summary of the four parts of the story Abu al-Fawaris: Antara ibn Shaddad.',
     1, 1, 4, 'rose', v_prov || jsonb_build_object('subject_key', 'arabic', 'dual_language', false)),
    ('english', 'english', 'اللغة الإنجليزية', 'English',
     'إنجليزي', 'English',
     'خمس وحدات: EGYPT’S HERITAGE، HANDS HELP, HEARTS CARE، TRUTH VS. LIES، SAVE AND SHINE، USING TECHNOLOGY AT SCHOOLS.',
     'Five units: EGYPT’S HERITAGE, HANDS HELP, HEARTS CARE, TRUTH VS. LIES, SAVE AND SHINE, USING TECHNOLOGY AT SCHOOLS.',
     1, 1, 5, 'teal', v_prov || jsonb_build_object('subject_key', 'english', 'dual_language', false)),
    ('philosophy-logic', 'philosophy_logic', 'الفلسفة والمنطق', 'Philosophy & Logic',
     'فلسفة', 'Philosophy',
     'التفكير الإنساني وأساليبه، الفلسفة والموقف الفلسفي، مبادئ المنطق، والاستدلال — أربعة دروس رسمية ثم مراجعة إضافية.',
     'Human thinking and its styles, philosophy and the philosophical stance, principles of logic, and inference — four official lessons plus one additional review module.',
     1, 1, 6, 'violet', v_prov || jsonb_build_object('subject_key', 'philosophy-logic', 'dual_language', false))
  on conflict (slug) do update
    set title_ar = excluded.title_ar,
        title_en = excluded.title_en,
        short_title_ar = excluded.short_title_ar,
        short_title_en = excluded.short_title_en,
        description_ar = excluded.description_ar,
        description_en = excluded.description_en,
        grade_level = excluded.grade_level,
        term = excluded.term,
        position = excluded.position,
        accent = excluded.accent,
        active = true,
        metadata = excluded.metadata;

  -- ============================================================ tracks
  insert into public.curriculum_tracks
    (subject_id, slug, content_language, title_ar, title_en, grade_level, term,
     publication_status, source_document, source_sha256, metadata)
  select s.id, v.slug, v.lang, v.title_ar, v.title_en, 1, 1, v.status,
         v_source_document, v_source_sha,
         v_prov || jsonb_build_object(
           'subject', s.slug,
           'track', v.slug,
           'content_language', v.lang,
           'language_role', v.role,
           'source_language', v.source_lang,
           'render_language', v.lang,
           'translation_track', v.translation
         )
  from (values
    ('integrated-science', 'integrated-science-ar', 'ar',
     'علوم متكاملة — المسار العربي', 'Integrated Science — Arabic track', 'published', 'dual', 'ar', false),
    ('integrated-science', 'integrated-science-en', 'en',
     'علوم متكاملة — المسار الإنجليزي', 'Integrated Science — English track', 'published', 'dual', 'ar', true),
    ('mathematics', 'mathematics-ar', 'ar',
     'الرياضيات — المسار العربي', 'Mathematics — Arabic track', 'published', 'dual', 'ar', false),
    ('mathematics', 'mathematics-en', 'en',
     'الرياضيات — المسار الإنجليزي', 'Mathematics — English track', 'published', 'dual', 'ar', true),
    ('history', 'history-ar', 'ar', 'تاريخ', 'History', 'published', 'single', 'ar', false),
    ('arabic-language', 'arabic-language-ar', 'ar', 'اللغة العربية', 'Arabic Language', 'published', 'single', 'ar', false),
    ('english', 'english-en', 'en', 'اللغة الإنجليزية', 'English', 'published', 'single', 'en', false),
    ('philosophy-logic', 'philosophy-logic-ar', 'ar', 'الفلسفة والمنطق', 'Philosophy & Logic', 'published', 'single', 'ar', false)
  ) as v(subject_slug, slug, lang, title_ar, title_en, status, role, source_lang, translation)
  join public.subjects s on s.slug = v.subject_slug
  on conflict (subject_id, content_language) do update
    set slug = excluded.slug,
        title_ar = excluded.title_ar,
        title_en = excluded.title_en,
        grade_level = excluded.grade_level,
        term = excluded.term,
        publication_status = excluded.publication_status,
        source_document = excluded.source_document,
        source_sha256 = excluded.source_sha256,
        metadata = excluded.metadata;

  -- ============================================================ one course per track
  insert into public.courses
    (slug, title_ar, title_en, description_ar, description_en, active, metadata)
  select 'first-secondary-term1-' || t.slug,
         t.title_ar,
         t.title_en,
         s.description_ar,
         s.description_en,
         true,
         v_prov || jsonb_build_object(
           'curriculum', true,
           'subject', s.slug,
           'track', t.slug,
           'content_language', t.content_language,
           'track_scope', 'single_track_course'
         )
  from public.curriculum_tracks t
  join public.subjects s on s.id = t.subject_id
  on conflict (slug) do update
    set title_ar = excluded.title_ar,
        title_en = excluded.title_en,
        description_ar = excluded.description_ar,
        description_en = excluded.description_en,
        active = true,
        metadata = excluded.metadata;

  update public.curriculum_tracks t
  set course_id = c.id
  from public.courses c
  where c.slug = 'first-secondary-term1-' || t.slug
    and (t.course_id is null or t.course_id <> c.id);

  -- ============================================================ move the loaded content into its track course
  select id into v_program from public.courses where slug = 'first-secondary-term1-2026-2027' limit 1;
  if v_program is null then
    raise exception 'Program course first-secondary-term1-2026-2027 not found. Run migration 20261025100000 first.';
  end if;

  for v_row in
    select * from (values
      ('philosophy-logic', 'philosophy-logic-ar', 'phil-', 'ar'),
      ('integrated-science', 'integrated-science-ar', 'sci-', 'ar'),
      ('mathematics', 'mathematics-ar', 'math-', 'ar'),
      ('arabic', 'arabic-language-ar', 'arab-', 'ar'),
      ('english', 'english-en', 'eng-', 'en'),
      ('history', 'history-ar', 'hist-', 'ar')
    ) as v(subject_key, track_slug, skill_prefix, content_language)
  loop
    select t.course_id into v_course
    from public.curriculum_tracks t
    where t.slug = v_row.track_slug
    limit 1;
    if v_course is null then
      raise exception 'Track % not found', v_row.track_slug;
    end if;

    select id into v_unit
    from public.units
    where course_id = v_program and metadata->>'subject' = v_row.subject_key
    limit 1;
    if v_unit is not null then
      update public.units
      set course_id = v_course,
          position = 1,
          metadata = coalesce(metadata, '{}'::jsonb) || jsonb_build_object(
            'subject', v_row.subject_key,
            'track', v_row.track_slug,
            'content_language', v_row.content_language,
            'track_scope', 'single_track_course'
          )
      where id = v_unit;
    end if;

    update public.skills
    set course_id = v_course
    where course_id = v_program and slug like v_row.skill_prefix || '%';
  end loop;

  -- ============================================================ English-medium tracks for Science and Mathematics
  for v_row in
    select * from (values
      ('integrated-science', 'integrated-science-ar', 'integrated-science-en', 'sci-'),
      ('mathematics', 'mathematics-ar', 'mathematics-en', 'math-')
    ) as v(subject_key, ar_track, en_track, skill_prefix)
  loop
    select t.course_id into v_ar_course
    from public.curriculum_tracks t where t.slug = v_row.ar_track limit 1;
    select t.course_id into v_en_course
    from public.curriculum_tracks t where t.slug = v_row.en_track limit 1;
    if v_ar_course is null or v_en_course is null then
      raise exception 'Track courses missing for %', v_row.subject_key;
    end if;

    select id into v_ar_unit
    from public.units
    where course_id = v_ar_course and metadata->>'subject' = v_row.subject_key
    limit 1;
    if v_ar_unit is null then
      raise exception 'Arabic unit for % not found', v_row.subject_key;
    end if;

    select id into v_en_unit
    from public.units
    where course_id = v_en_course and metadata->>'subject' = v_row.subject_key
    limit 1;
    if v_en_unit is null then
      insert into public.units (course_id, position, title_ar, title_en, boss_enabled, description_ar, description_en, metadata)
      values (
        v_en_course, 1,
        case when v_row.subject_key = 'integrated-science' then 'العلوم المتكاملة — النسخة الإنجليزية' else 'الرياضيات — النسخة الإنجليزية' end,
        case when v_row.subject_key = 'integrated-science' then 'Integrated Science — English Edition' else 'Mathematics — English Edition' end,
        true,
        'نسخة إنجليزية من نفس المصدر العربي، مع دروس وأسئلة مستقلة تُتابَع بمعزل عن النسخة العربية.',
        'An English rendering of the same Arabic source, with its own lessons and questions tracked separately from the Arabic edition.',
        v_prov || jsonb_build_object(
          'subject', v_row.subject_key,
          'track', v_row.en_track,
          'content_language', 'en',
          'source_language', 'ar',
          'translation_track', true,
          'translation_note_ar', 'ترجمة إنجليزية لملاحظات المذاكرة العربية المصدرية، وليست كتابًا رسميًا بالإنجليزية.',
          'translation_note_en', 'An English rendering of the Arabic study notes; it is not an official English-medium textbook.'
        )
      )
      returning id into v_en_unit;
    end if;

    -- Skills: the English track keeps its own mastery evidence.
    with src as (
      select s.*, md5('noata:en-skill:' || s.slug) as h
      from public.skills s
      where s.course_id = v_ar_course
    )
    insert into public.skills (id, course_id, slug, title_ar, title_en)
    select (substr(s.h,1,8) || '-' || substr(s.h,9,4) || '-' || substr(s.h,13,4) || '-' || substr(s.h,17,4) || '-' || substr(s.h,21,12))::uuid,
           v_en_course, s.slug || '-en', s.title_ar, s.title_en
    from src s
    on conflict (course_id, slug) do update
      set title_ar = excluded.title_ar, title_en = excluded.title_en;

    -- Lessons: separate rows, so progress never crosses the language boundary.
    with src as (
      select l.*, md5('noata:en-lesson:' || l.slug) as h
      from public.lessons l
      where l.unit_id = v_ar_unit
    )
    insert into public.lessons (id, unit_id, position, slug, title_ar, title_en, xp_reward, coin_reward, content)
    select (substr(s.h,1,8) || '-' || substr(s.h,9,4) || '-' || substr(s.h,13,4) || '-' || substr(s.h,17,4) || '-' || substr(s.h,21,12))::uuid,
           v_en_unit,
           s.position,
           s.slug || '-en',
           s.title_ar,
           s.title_en,
           s.xp_reward,
           s.coin_reward,
           coalesce(s.content, '{}'::jsonb) || jsonb_build_object(
             'render_language', 'en',
             'primary_content_language', 'en',
             'source_language', 'ar',
             'translation_track', true,
             'translation_of_track', v_row.ar_track,
             'translation_note_ar', 'ترجمة إنجليزية لملاحظات المذاكرة العربية المصدرية، وليست كتابًا رسميًا بالإنجليزية.',
             'translation_note_en', 'An English rendering of the Arabic study notes; it is not an official English-medium textbook.'
           )
    from src s
    on conflict (unit_id, slug) do update
      set position = excluded.position,
          title_ar = excluded.title_ar,
          title_en = excluded.title_en,
          xp_reward = excluded.xp_reward,
          coin_reward = excluded.coin_reward,
          content = excluded.content;

    -- Prerequisites must point at the English sibling, not the Arabic lesson.
    update public.lessons en
    set content = jsonb_set(en.content, '{prerequisite_lesson_id}', to_jsonb(sibling.new_id::text))
    from (
      select ar_old.id as old_id,
             (
               select en_prereq.id
               from public.lessons en_prereq
               where en_prereq.unit_id = v_en_unit and en_prereq.slug = ar_old.slug || '-en'
             ) as new_id
      from public.lessons ar_old
      where ar_old.unit_id = v_ar_unit
    ) sibling
    where en.unit_id = v_en_unit
      and sibling.new_id is not null
      and en.content->>'prerequisite_lesson_id' = sibling.old_id::text;

    -- Questions: variants of the Arabic questions, with their own keys and skills.
    -- Lesson questions and unit-level boss questions are both copied, so the English
    -- track can offer the same end-of-unit challenge without sharing any rows.
    with src as (
      select q.*,
             md5('noata:en-question:' || q.id::text) as qh,
             case when l.id is null then null else md5('noata:en-lesson:' || l.slug) end as lh
      from public.questions q
      left join public.lessons l on l.id = q.lesson_id
      where (q.lesson_id is null and q.unit_id = v_ar_unit)
         or (l.id is not null and l.unit_id = v_ar_unit)
    )
    insert into public.questions
      (id, lesson_id, unit_id, skill_id, variant_of, position, question_type, difficulty,
       prompt_ar, prompt_en, choices_ar, choices_en, review_status, publication_status,
       created_by, metadata)
    select (substr(s.qh,1,8) || '-' || substr(s.qh,9,4) || '-' || substr(s.qh,13,4) || '-' || substr(s.qh,17,4) || '-' || substr(s.qh,21,12))::uuid,
           case
             when s.lh is null then null
             else (substr(s.lh,1,8) || '-' || substr(s.lh,9,4) || '-' || substr(s.lh,13,4) || '-' || substr(s.lh,17,4) || '-' || substr(s.lh,21,12))::uuid
           end,
           case when s.lh is null then v_en_unit else null end,
           en_skill.id,
           s.id,
           s.position,
           s.question_type,
           s.difficulty,
           s.prompt_ar,
           s.prompt_en,
           s.choices_ar,
           s.choices_en,
           s.review_status,
           s.publication_status,
           s.created_by,
           coalesce(s.metadata, '{}'::jsonb) || jsonb_build_object(
             'render_language', 'en',
             'source_language', 'ar',
             'translation_track', true,
             'translation_of_track', v_row.ar_track
           )
    from src s
    left join public.skills ar_skill on ar_skill.id = s.skill_id
    left join public.skills en_skill
      on en_skill.course_id = v_en_course
     and ar_skill is not null
     and en_skill.slug = ar_skill.slug || '-en'
    on conflict (id) do update
      set lesson_id = excluded.lesson_id,
          unit_id = excluded.unit_id,
          skill_id = excluded.skill_id,
          variant_of = excluded.variant_of,
          position = excluded.position,
          question_type = excluded.question_type,
          difficulty = excluded.difficulty,
          prompt_ar = excluded.prompt_ar,
          prompt_en = excluded.prompt_en,
          choices_ar = excluded.choices_ar,
          choices_en = excluded.choices_en,
          review_status = excluded.review_status,
          publication_status = excluded.publication_status,
          metadata = excluded.metadata;

    with src as (
      select q.id as old_id,
             md5('noata:en-question:' || q.id::text) as qh
      from public.questions q
      left join public.lessons l on l.id = q.lesson_id
      where (q.lesson_id is null and q.unit_id = v_ar_unit)
         or (l.id is not null and l.unit_id = v_ar_unit)
    )
    insert into public.question_keys (question_id, answer_spec, explanation_ar, explanation_en)
    select (substr(s.qh,1,8) || '-' || substr(s.qh,9,4) || '-' || substr(s.qh,13,4) || '-' || substr(s.qh,17,4) || '-' || substr(s.qh,21,12))::uuid,
           k.answer_spec, k.explanation_ar, k.explanation_en
    from src s
    join public.question_keys k on k.question_id = s.old_id
    on conflict (question_id) do update
      set answer_spec = excluded.answer_spec,
          explanation_ar = excluded.explanation_ar,
          explanation_en = excluded.explanation_en;
  end loop;

  -- The umbrella course is kept for history but stops being a selectable path:
  -- every subject now lives in its own track course.
  update public.courses
  set active = false,
      metadata = coalesce(metadata, '{}'::jsonb) || jsonb_build_object(
        'role', 'program',
        'split_into_tracks', true,
        'split_note_ar', 'فُصلت وحدات هذا المسار إلى مسارات مستقلة حسب المادة ولغة المحتوى.',
        'split_note_en', 'The units of this program were split into independent per-subject and per-language tracks.'
      )
  where id = v_program;
end $$;
