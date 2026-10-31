-- Noata owner-scoped study planning and persistent active-recall decks.
-- Additive and staging-first. No rewards or mastery are granted from these rows.

create table public.study_tasks (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles(id) on delete cascade,
  task_type text not null default 'study' check (task_type in ('study','lesson','quiz','flashcards','review','exam_preparation')),
  title text not null check (char_length(btrim(title)) between 1 and 160),
  notes text not null default '' check (char_length(notes) <= 4000),
  status text not null default 'open' check (status in ('open','completed','dismissed')),
  priority text not null default 'normal' check (priority in ('low','normal','high')),
  due_at timestamptz,
  completed_at timestamptz,
  lesson_id uuid references public.lessons(id) on delete set null,
  track_id uuid references public.curriculum_tracks(id) on delete set null,
  source text not null default 'personal' check (source in ('personal','recommendation')),
  recommendation_reason text check (recommendation_reason is null or char_length(recommendation_reason) <= 500),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint study_task_completion_consistent check (
    (status = 'completed' and completed_at is not null)
    or (status <> 'completed' and completed_at is null)
  )
);

create table public.flashcard_decks (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles(id) on delete cascade,
  title text not null check (char_length(btrim(title)) between 1 and 160),
  description text not null default '' check (char_length(description) <= 2000),
  status text not null default 'draft' check (status in ('draft','active','archived')),
  source_type text not null default 'manual' check (source_type in ('manual','lesson','ai_draft')),
  source_id uuid,
  source_version text check (source_version is null or char_length(source_version) <= 160),
  lesson_id uuid references public.lessons(id) on delete set null,
  track_id uuid references public.curriculum_tracks(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (id, user_id)
);

create table public.flashcards (
  id uuid primary key default gen_random_uuid(),
  deck_id uuid not null,
  user_id uuid not null references public.profiles(id) on delete cascade,
  card_type text not null default 'question_answer' check (card_type in ('term_definition','question_answer','cloze')),
  front text not null check (char_length(btrim(front)) between 1 and 2000),
  back text not null check (char_length(btrim(back)) between 1 and 4000),
  cloze_text text check (cloze_text is null or char_length(cloze_text) <= 4000),
  position int not null default 1 check (position > 0),
  state text not null default 'new' check (state in ('new','learning','review')),
  ease_factor numeric(4,2) not null default 2.50 check (ease_factor between 1.30 and 3.00),
  interval_days int not null default 0 check (interval_days between 0 and 3650),
  repetitions int not null default 0 check (repetitions >= 0),
  lapses int not null default 0 check (lapses >= 0),
  last_reviewed_at timestamptz,
  due_at timestamptz not null default now(),
  suspended boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint flashcards_owner_deck_fkey foreign key (deck_id, user_id)
    references public.flashcard_decks(id, user_id) on delete cascade,
  unique (deck_id, position)
);

create table public.flashcard_reviews (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles(id) on delete cascade,
  card_id uuid not null references public.flashcards(id) on delete cascade,
  rating int not null check (rating between 0 and 3),
  previous_interval_days int not null check (previous_interval_days between 0 and 3650),
  next_interval_days int not null check (next_interval_days between 0 and 3650),
  previous_ease_factor numeric(4,2) not null check (previous_ease_factor between 1.30 and 3.00),
  next_ease_factor numeric(4,2) not null check (next_ease_factor between 1.30 and 3.00),
  next_due_at timestamptz not null,
  idempotency_key text not null check (char_length(idempotency_key) between 8 and 200),
  created_at timestamptz not null default now(),
  unique (user_id, idempotency_key)
);

create index study_tasks_owner_due_idx on public.study_tasks(user_id, status, due_at)
  where status = 'open';
create index study_tasks_lesson_idx on public.study_tasks(lesson_id) where lesson_id is not null;
create index study_tasks_track_idx on public.study_tasks(track_id) where track_id is not null;
create index flashcard_decks_owner_recent_idx on public.flashcard_decks(user_id, updated_at desc);
create index flashcard_decks_lesson_idx on public.flashcard_decks(lesson_id) where lesson_id is not null;
create index flashcard_decks_track_idx on public.flashcard_decks(track_id) where track_id is not null;
create index flashcards_owner_due_idx on public.flashcards(user_id, due_at)
  where suspended = false;
create index flashcards_deck_idx on public.flashcards(deck_id, position);
create index flashcard_reviews_card_recent_idx on public.flashcard_reviews(card_id, created_at desc);

alter table public.study_tasks enable row level security;
alter table public.flashcard_decks enable row level security;
alter table public.flashcards enable row level security;
alter table public.flashcard_reviews enable row level security;

create policy "study tasks owner select" on public.study_tasks for select to authenticated
  using ((select auth.uid()) = user_id);
create policy "study tasks owner insert" on public.study_tasks for insert to authenticated
  with check ((select auth.uid()) = user_id);
create policy "study tasks owner update" on public.study_tasks for update to authenticated
  using ((select auth.uid()) = user_id)
  with check ((select auth.uid()) = user_id);
create policy "study tasks owner delete" on public.study_tasks for delete to authenticated
  using ((select auth.uid()) = user_id);

create policy "flashcard decks owner select" on public.flashcard_decks for select to authenticated
  using ((select auth.uid()) = user_id);
create policy "flashcard decks owner insert" on public.flashcard_decks for insert to authenticated
  with check ((select auth.uid()) = user_id);
create policy "flashcard decks owner update" on public.flashcard_decks for update to authenticated
  using ((select auth.uid()) = user_id)
  with check ((select auth.uid()) = user_id);
create policy "flashcard decks owner delete" on public.flashcard_decks for delete to authenticated
  using ((select auth.uid()) = user_id);

create policy "flashcards owner select" on public.flashcards for select to authenticated
  using ((select auth.uid()) = user_id);
create policy "flashcards owner insert" on public.flashcards for insert to authenticated
  with check (
    (select auth.uid()) = user_id
    and exists (
      select 1 from public.flashcard_decks d
      where d.id = deck_id and d.user_id = (select auth.uid())
    )
  );
create policy "flashcards owner update" on public.flashcards for update to authenticated
  using ((select auth.uid()) = user_id)
  with check ((select auth.uid()) = user_id);
create policy "flashcards owner delete" on public.flashcards for delete to authenticated
  using ((select auth.uid()) = user_id);

create policy "flashcard reviews owner select" on public.flashcard_reviews for select to authenticated
  using ((select auth.uid()) = user_id);

create trigger study_tasks_touch_updated_at before update on public.study_tasks
  for each row execute procedure private.touch_updated_at();
create trigger flashcard_decks_touch_updated_at before update on public.flashcard_decks
  for each row execute procedure private.touch_updated_at();
create trigger flashcards_touch_updated_at before update on public.flashcards
  for each row execute procedure private.touch_updated_at();

revoke all on public.study_tasks, public.flashcard_decks, public.flashcards, public.flashcard_reviews
  from anon, authenticated;
grant select, insert, update, delete on public.study_tasks to authenticated;
grant select, insert, update, delete on public.flashcard_decks to authenticated;
grant select, delete on public.flashcards to authenticated;
grant insert (deck_id, user_id, card_type, front, back, cloze_text, position, suspended)
  on public.flashcards to authenticated;
grant update (card_type, front, back, cloze_text, position, suspended)
  on public.flashcards to authenticated;
grant select on public.flashcard_reviews to authenticated;

create function private.review_flashcard(
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
    return jsonb_build_object(
      'card_id', v_existing.card_id,
      'rating', v_existing.rating,
      'interval_days', v_existing.next_interval_days,
      'ease_factor', v_existing.next_ease_factor,
      'due_at', v_existing.next_due_at,
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
    'duplicate', false
  );
end;
$$;

revoke all on function private.review_flashcard(uuid, int, text) from public, anon;
grant execute on function private.review_flashcard(uuid, int, text) to authenticated;

create function public.review_flashcard(p_card_id uuid, p_rating int, p_idempotency_key text)
returns jsonb
language sql
security invoker
set search_path = ''
as $$
  select private.review_flashcard(p_card_id, p_rating, p_idempotency_key);
$$;

revoke all on function public.review_flashcard(uuid, int, text) from public, anon;
grant execute on function public.review_flashcard(uuid, int, text) to authenticated;

comment on function public.review_flashcard(uuid, int, text) is
  'SM-2-inspired active-recall scheduler. Intervals are estimates, not proof of mastery; no rewards are granted.';
