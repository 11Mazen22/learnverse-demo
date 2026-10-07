alter table public.courses
  add column if not exists metadata jsonb not null default '{}'::jsonb;

alter table public.units
  add column if not exists description_ar text not null default '',
  add column if not exists description_en text not null default '',
  add column if not exists metadata jsonb not null default '{}'::jsonb;

alter table public.questions
  add column if not exists unit_id uuid references public.units(id) on delete cascade,
  add column if not exists position int,
  add column if not exists question_type text not null default 'multiple-choice',
  add column if not exists choices_ar jsonb not null default '[]'::jsonb,
  add column if not exists choices_en jsonb not null default '[]'::jsonb,
  add column if not exists metadata jsonb not null default '{}'::jsonb;

alter table public.questions
  drop constraint if exists questions_question_type_check;
alter table public.questions
  add constraint questions_question_type_check
  check (question_type in ('multiple-choice','numeric'));

alter table public.questions
  drop constraint if exists questions_content_parent_check;
alter table public.questions
  add constraint questions_content_parent_check
  check (not (lesson_id is not null and unit_id is not null));

alter table public.questions
  drop constraint if exists questions_position_check;
alter table public.questions
  add constraint questions_position_check
  check (position is null or position > 0);

create index if not exists questions_unit_id_idx on public.questions(unit_id);
create index if not exists questions_lesson_position_idx
  on public.questions(lesson_id,position)
  where lesson_id is not null;
create index if not exists questions_unit_position_idx
  on public.questions(unit_id,position)
  where unit_id is not null;
