-- Noäta 2.0 M2: Study Ecosystem v2 additive migration (metadata, strict column grants,
-- SM-2 receipt fields, mistake logs, and study session checkpoints).
-- Strictly owner-scoped. No XP, Coin, Skill Mastery, or Lesson Progress is ever minted here.

-- 1. Validated metadata JSONB columns on decks and flashcards
alter table public.flashcard_decks
  add column if not exists metadata jsonb not null default '{}'::jsonb;

do $$
begin
  if not exists (
    select 1 from pg_constraint where conname = 'flashcard_decks_metadata_object'
  ) then
    alter table public.flashcard_decks
      add constraint flashcard_decks_metadata_object
      check (jsonb_typeof(metadata) = 'object');
  end if;
end $$;

alter table public.flashcards
  add column if not exists metadata jsonb not null default '{}'::jsonb;

do $$
begin
  if not exists (
    select 1 from pg_constraint where conname = 'flashcards_metadata_object'
  ) then
    alter table public.flashcards
      add constraint flashcards_metadata_object
      check (jsonb_typeof(metadata) = 'object');
  end if;
end $$;

-- 2. Explicit table-level revoke before narrowed column grants on public.flashcards
-- Keeps state, ease_factor, interval_days, repetitions, lapses, last_reviewed_at,
-- and due_at strictly non-writable by authenticated clients.
revoke insert, update on table public.flashcards from public, anon, authenticated;

grant insert (
  deck_id,
  user_id,
  card_type,
  front,
  back,
  cloze_text,
  position,
  suspended,
  metadata
) on table public.flashcards to authenticated;

grant update (
  card_type,
  front,
  back,
  cloze_text,
  position,
  suspended,
  metadata
) on table public.flashcards to authenticated;

-- 3. Preserve public.review_flashcard(uuid, int, text) -> jsonb signature while
-- ensuring full server-computed schedule state (state, repetitions, lapses) is included.
create or replace function private.review_flashcard(
  p_card_id uuid,
  p_rating int,
  p_idempotency_key text
) returns jsonb
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_user uuid := auth.uid();
  v_card public.flashcards%rowtype;
  v_existing public.flashcard_reviews%rowtype;
  v_interval int;
  v_ease numeric(4,2);
  v_repetitions int;
  v_lapses int;
  v_state text;
  v_due timestamptz;
begin
  if v_user is null then raise exception 'Authentication required'; end if;
  if p_rating < 0 or p_rating > 3 then raise exception 'Invalid recall rating'; end if;
  if char_length(btrim(coalesce(p_idempotency_key, ''))) < 8 then
    raise exception 'Invalid idempotency key';
  end if;

  select * into v_existing
  from public.flashcard_reviews
  where user_id = v_user and idempotency_key = p_idempotency_key;

  if found then
    if v_existing.card_id <> p_card_id or v_existing.rating <> p_rating then
      raise exception 'Idempotency key already belongs to another review';
    end if;

    select * into v_card
    from public.flashcards
    where id = v_existing.card_id and user_id = v_user;

    return jsonb_build_object(
      'card_id', v_existing.card_id,
      'rating', v_existing.rating,
      'interval_days', v_existing.next_interval_days,
      'ease_factor', v_existing.next_ease_factor,
      'due_at', v_existing.next_due_at,
      'state', coalesce(v_card.state, case when v_existing.rating <= 1 then 'learning' else 'review' end),
      'repetitions', coalesce(v_card.repetitions, 0),
      'lapses', coalesce(v_card.lapses, 0),
      'duplicate', true
    );
  end if;

  select * into v_card
  from public.flashcards
  where id = p_card_id and user_id = v_user and suspended = false
  for update;
  if not found then raise exception 'Flashcard unavailable'; end if;

  v_ease := v_card.ease_factor;
  v_repetitions := v_card.repetitions;
  v_lapses := v_card.lapses;

  if p_rating = 0 then
    v_interval := 0;
    v_ease := greatest(1.30, v_ease - 0.20);
    v_repetitions := 0;
    v_lapses := v_lapses + 1;
    v_state := 'learning';
    v_due := now() + interval '10 minutes';
  elsif p_rating = 1 then
    v_interval := greatest(1, ceil(greatest(v_card.interval_days, 1) * 1.20)::int);
    v_ease := greatest(1.30, v_ease - 0.15);
    v_repetitions := v_repetitions + 1;
    v_state := 'learning';
    v_due := now() + make_interval(days => v_interval);
  elsif p_rating = 2 then
    v_interval := case
      when v_repetitions = 0 then 1
      when v_repetitions = 1 then 6
      else least(3650, greatest(1, round(v_card.interval_days * v_ease)::int))
    end;
    v_repetitions := v_repetitions + 1;
    v_state := 'review';
    v_due := now() + make_interval(days => v_interval);
  else
    v_interval := case
      when v_repetitions = 0 then 4
      when v_repetitions = 1 then 8
      else least(3650, greatest(1, round(v_card.interval_days * v_ease * 1.30)::int))
    end;
    v_ease := least(3.00, v_ease + 0.15);
    v_repetitions := v_repetitions + 1;
    v_state := 'review';
    v_due := now() + make_interval(days => v_interval);
  end if;

  insert into public.flashcard_reviews (
    user_id, card_id, rating, previous_interval_days, next_interval_days,
    previous_ease_factor, next_ease_factor, next_due_at, idempotency_key
  ) values (
    v_user, v_card.id, p_rating, v_card.interval_days, v_interval,
    v_card.ease_factor, v_ease, v_due, p_idempotency_key
  ) returning * into v_existing;

  update public.flashcards
  set state = v_state,
      ease_factor = v_ease,
      interval_days = v_interval,
      repetitions = v_repetitions,
      lapses = v_lapses,
      last_reviewed_at = now(),
      due_at = v_due,
      updated_at = now()
  where id = v_card.id and user_id = v_user;

  return jsonb_build_object(
    'card_id', v_card.id,
    'rating', p_rating,
    'interval_days', v_interval,
    'ease_factor', v_ease,
    'due_at', v_due,
    'state', v_state,
    'repetitions', v_repetitions,
    'lapses', v_lapses,
    'duplicate', false
  );
end;
$$;

-- 4. Owner-only study mistake logs (strictly isolated from rewards, ledger, skill_evidence, lesson_progress)
create table if not exists public.study_mistake_logs (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles(id) on delete cascade,
  source_type text not null default 'quiz' check (source_type in ('quiz','cloze','typed_recall','flashcard','exam')),
  deck_id uuid references public.flashcard_decks(id) on delete set null,
  card_id uuid references public.flashcards(id) on delete set null,
  lesson_id uuid references public.lessons(id) on delete set null,
  topic text not null check (char_length(btrim(topic)) between 1 and 200),
  prompt text not null check (char_length(btrim(prompt)) between 1 and 2000),
  user_answer text not null default '' check (char_length(user_answer) <= 1000),
  expected_answer text not null check (char_length(btrim(expected_answer)) between 1 and 2000),
  explanation text not null default '' check (char_length(explanation) <= 4000),
  mistake_count int not null default 1 check (mistake_count >= 1),
  resolved_at timestamptz,
  last_missed_at timestamptz not null default now(),
  metadata jsonb not null default '{}'::jsonb check (jsonb_typeof(metadata) = 'object'),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists study_mistake_logs_owner_recent_idx
  on public.study_mistake_logs(user_id, last_missed_at desc);
create index if not exists study_mistake_logs_deck_idx
  on public.study_mistake_logs(deck_id) where deck_id is not null;
create index if not exists study_mistake_logs_card_idx
  on public.study_mistake_logs(card_id) where card_id is not null;
create index if not exists study_mistake_logs_lesson_idx
  on public.study_mistake_logs(lesson_id) where lesson_id is not null;

-- 5. Owner-only study sessions / recovery checkpoints (no reward or mastery side effects)
create table if not exists public.study_sessions (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles(id) on delete cascade,
  session_mode text not null check (session_mode in (
    'spaced','cram','cloze','typed_recall','practice_quiz','exam_sim','speed_match','adaptive','mistake_drill','interleaved'
  )),
  title text not null check (char_length(btrim(title)) between 1 and 180),
  deck_ids uuid[] not null default '{}'::uuid[],
  status text not null default 'in_progress' check (status in ('in_progress','completed','abandoned')),
  total_items int not null default 0 check (total_items between 0 and 500),
  completed_items int not null default 0 check (completed_items between 0 and total_items),
  correct_items int not null default 0 check (correct_items between 0 and completed_items),
  checkpoint jsonb not null default '{}'::jsonb check (jsonb_typeof(checkpoint) = 'object'),
  started_at timestamptz not null default now(),
  completed_at timestamptz,
  updated_at timestamptz not null default now(),
  constraint study_session_completion_consistent check (
    (status = 'completed' and completed_at is not null)
    or (status <> 'completed' and completed_at is null)
  )
);

create index if not exists study_sessions_owner_active_idx
  on public.study_sessions(user_id, status, updated_at desc);

alter table public.study_mistake_logs enable row level security;
alter table public.study_sessions enable row level security;

create policy "study mistake logs owner select" on public.study_mistake_logs
  for select to authenticated using ((select auth.uid()) = user_id);
create policy "study mistake logs owner insert" on public.study_mistake_logs
  for insert to authenticated with check ((select auth.uid()) = user_id);
create policy "study mistake logs owner update" on public.study_mistake_logs
  for update to authenticated using ((select auth.uid()) = user_id)
  with check ((select auth.uid()) = user_id);
create policy "study mistake logs owner delete" on public.study_mistake_logs
  for delete to authenticated using ((select auth.uid()) = user_id);

create policy "study sessions owner select" on public.study_sessions
  for select to authenticated using ((select auth.uid()) = user_id);
create policy "study sessions owner insert" on public.study_sessions
  for insert to authenticated with check ((select auth.uid()) = user_id);
create policy "study sessions owner update" on public.study_sessions
  for update to authenticated using ((select auth.uid()) = user_id)
  with check ((select auth.uid()) = user_id);
create policy "study sessions owner delete" on public.study_sessions
  for delete to authenticated using ((select auth.uid()) = user_id);

create trigger study_mistake_logs_touch_updated_at before update on public.study_mistake_logs
  for each row execute procedure private.touch_updated_at();
create trigger study_sessions_touch_updated_at before update on public.study_sessions
  for each row execute procedure private.touch_updated_at();

revoke all on public.study_mistake_logs, public.study_sessions from public, anon, authenticated;
grant select, insert, update, delete on public.study_mistake_logs to authenticated;
grant select, insert, update, delete on public.study_sessions to authenticated;

comment on table public.study_mistake_logs is
  'Owner-only active-recall misconception and mistake replay log. Does not grant XP, Coins, skill mastery, or lesson completion.';
comment on table public.study_sessions is
  'Owner-only personal study session state and cross-device checkpoints. Does not grant XP, Coins, skill mastery, or lesson completion.';
