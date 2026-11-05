-- Noata curriculum language integrity remediation.
--
-- Reviewed against production (2026-11-05). All eight published catalog tracks
-- already pass the structural invariants (duplicate positions and slugs, broken
-- prerequisites, orphaned rows, empty lessons, missing prompts). Two issues
-- remained and are addressed here without inventing any curriculum content:
--
-- 1. The native English track's lessons (`english-en`) never declared
--    `render_language` inside lesson content, unlike the translated Science and
--    Mathematics English tracks (`integrated-science-en`, `mathematics-en`).
--    The lesson surface falls back to the track's content language, but the
--    per-lesson declaration is required by the catalog's own pattern and to
--    make language provenance explicit on every English-track lesson.
-- 2. A single draft demo question (`92286df0-8362-52fa-9f3c-233111d9e388`,
--    intentionally unscoped to demonstrate the review workflow) must never
--    become the norm. From now on the database refuses to publish any question
--    that is not scoped to a lesson or a unit, so unscoped rows can only be
--    review-workflow drafts that are never served to learners.

-- ============================================================ 1. English-native
-- track lesson language declaration
-- Only adds the missing key; no lesson copy, rewards, or structure is touched.
update public.lessons lesson
set content = lesson.content || jsonb_build_object('render_language', 'en')
from public.units unit
join public.courses course on course.id = unit.course_id
where lesson.unit_id = unit.id
  and course.metadata->>'track' = 'english-en'
  and lesson.content->>'render_language' is distinct from 'en';

-- ============================================================ 2. Published
-- questions must be scoped to a lesson or a unit
-- Scoping is what keeps published questions attached to real curriculum rows;
-- RLS otherwise grants global read access to every published question.
do $$
begin
  if not exists (
    select 1
    from pg_constraint
    where conname = 'questions_published_scope_check'
      and conrelid = 'public.questions'::regclass
  ) then
    alter table public.questions
      add constraint questions_published_scope_check
      check (
        publication_status not in ('published_demo', 'published')
        or lesson_id is not null
        or unit_id is not null
      );
  end if;
end $$;

comment on constraint questions_published_scope_check on public.questions is
  'Published questions must be scoped to a lesson or unit. Unscoped rows may only exist as never-served drafts of the content review workflow.';
