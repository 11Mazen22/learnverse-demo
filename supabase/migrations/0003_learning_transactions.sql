create table public.purchases (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles(id) on delete cascade,
  item_id uuid not null references public.shop_items(id) on delete restrict,
  price int not null check (price >= 0),
  idempotency_key text not null,
  created_at timestamptz not null default now(),
  unique(user_id,idempotency_key)
);

alter table public.purchases enable row level security;
create policy "purchases own read" on public.purchases for select using (user_id=auth.uid());

create or replace function public.apply_ledger_to_profile()
returns trigger
language plpgsql
security definer
set search_path=''
as $$
begin
  if new.currency='XP' then
    update public.profiles
    set xp=xp+new.amount,updated_at=now()
    where id=new.user_id;
  elsif new.currency='COIN' then
    update public.profiles
    set coins=coins+new.amount,updated_at=now()
    where id=new.user_id;
  end if;
  return new;
end;
$$;

create trigger ledger_updates_profile
after insert on public.ledger
for each row execute procedure public.apply_ledger_to_profile();

create or replace function public.submit_attempt(
  p_question_id uuid,
  p_response jsonb,
  p_assisted boolean,
  p_idempotency_key text,
  p_practice_repeat boolean default false
)
returns jsonb
language plpgsql
security definer
set search_path=''
as $$
declare
  v_user uuid:=auth.uid();
  v_question public.questions%rowtype;
  v_key public.question_keys%rowtype;
  v_existing public.attempts%rowtype;
  v_correct boolean:=false;
  v_value text:=coalesce(p_response->>'value','');
  v_numeric numeric;
  v_target numeric;
  v_tolerance numeric:=0;
  v_first_correct boolean:=false;
  v_score numeric;
  v_state public.mastery_state;
  v_distinct_independent int;
  v_recent_correct int;
  v_next_review timestamptz;
  v_interval_days int;
  v_xp_awarded int:=0;
begin
  if v_user is null then raise exception 'Authentication required'; end if;
  if length(trim(p_idempotency_key))<4 then raise exception 'Invalid idempotency key'; end if;

  select * into v_existing
  from public.attempts
  where user_id=v_user and idempotency_key=p_idempotency_key;

  if found then
    select * into v_key from public.question_keys where question_id=v_existing.question_id;
    return jsonb_build_object(
      'id',v_existing.id,
      'correct',v_existing.correct,
      'duplicate',true,
      'explanation_ar',coalesce(v_key.explanation_ar,''),
      'explanation_en',coalesce(v_key.explanation_en,''),
      'xp_awarded',0
    );
  end if;

  select * into v_question
  from public.questions
  where id=p_question_id
    and publication_status in ('published_demo','published');

  if not found then raise exception 'Question unavailable'; end if;
  select * into v_key from public.question_keys where question_id=p_question_id;
  if not found then raise exception 'Question key unavailable'; end if;

  if v_key.answer_spec->>'type'='multiple-choice' then
    v_correct:=v_value=coalesce(v_key.answer_spec->>'correctAnswer','');
  elsif v_key.answer_spec->>'type'='numeric' then
    begin
      v_numeric:=replace(trim(v_value),',','.')::numeric;
      v_target:=(v_key.answer_spec->>'correctAnswer')::numeric;
      v_tolerance:=coalesce((v_key.answer_spec->>'tolerance')::numeric,0);
      v_correct:=abs(v_numeric-v_target)<=v_tolerance;
    exception when others then
      v_correct:=false;
    end;
  else
    raise exception 'Unsupported question type';
  end if;

  if v_correct and not p_practice_repeat then
    select not exists(
      select 1 from public.attempts
      where user_id=v_user and question_id=p_question_id and correct=true and practice_repeat=false
    ) into v_first_correct;
  end if;

  insert into public.attempts(
    user_id,question_id,idempotency_key,response,correct,assisted,practice_repeat,evidence_weight
  ) values(
    v_user,p_question_id,p_idempotency_key,p_response,v_correct,p_assisted,p_practice_repeat,
    v_question.difficulty*(case when p_assisted then .55 else 1 end)
  ) returning * into v_existing;

  if v_first_correct then
    insert into public.ledger(user_id,currency,amount,reason,reference_type,reference_id,idempotency_key)
    values(v_user,'XP',10,'QUESTION_FIRST_CORRECT','question',p_question_id,'question-first-correct:'||p_question_id)
    on conflict(user_id,currency,idempotency_key) do nothing;
    if found then v_xp_awarded:=10; end if;
  end if;

  if v_question.skill_id is not null then
    with recent as (
      select a.*,q.difficulty,
        row_number() over(order by a.created_at desc) as rn
      from public.attempts a
      join public.questions q on q.id=a.question_id
      where a.user_id=v_user and q.skill_id=v_question.skill_id and a.practice_repeat=false
      order by a.created_at desc
      limit 8
    )
    select
      round(
        100*sum(case when correct then difficulty*(case when assisted then .55 else 1 end) else 0 end)
        /nullif(sum(difficulty),0)
      ),
      count(distinct question_id) filter(where assisted=false)
    into v_score,v_distinct_independent
    from recent;

    if v_distinct_independent<3 then
      v_state:='new';
    elsif v_score<50 then
      v_state:='reteach';
    elsif v_score<70 then
      v_state:='supported';
    elsif v_score<85 then
      v_state:='mixed';
    else
      v_state:='provisional_mastery';
    end if;

    select count(*) filter(where correct)
    into v_recent_correct
    from (
      select correct
      from public.attempts a
      join public.questions q on q.id=a.question_id
      where a.user_id=v_user and q.skill_id=v_question.skill_id
        and a.practice_repeat=false and a.assisted=false
      order by a.created_at desc
      limit 3
    ) t;

    v_interval_days:=case
      when v_recent_correct>=3 then 7
      when v_recent_correct=2 then 3
      else 1
    end;
    v_next_review:=now()+make_interval(days=>v_interval_days);

    insert into public.skill_evidence(
      user_id,skill_id,mastery_score,state,independent_distinct_count,next_review_at,updated_at
    ) values(
      v_user,v_question.skill_id,coalesce(v_score,0),v_state,coalesce(v_distinct_independent,0),v_next_review,now()
    )
    on conflict(user_id,skill_id) do update set
      mastery_score=excluded.mastery_score,
      state=excluded.state,
      independent_distinct_count=excluded.independent_distinct_count,
      next_review_at=excluded.next_review_at,
      updated_at=now();
  end if;

  return jsonb_build_object(
    'id',v_existing.id,
    'correct',v_correct,
    'duplicate',false,
    'explanation_ar',v_key.explanation_ar,
    'explanation_en',v_key.explanation_en,
    'xp_awarded',v_xp_awarded,
    'mastery_score',v_score,
    'mastery_state',v_state,
    'next_review_at',v_next_review
  );
end;
$$;

create or replace function public.complete_lesson(
  p_lesson_id uuid,
  p_score numeric
)
returns jsonb
language plpgsql
security definer
set search_path=''
as $$
declare
  v_user uuid:=auth.uid();
  v_lesson public.lessons%rowtype;
  v_progress public.lesson_progress%rowtype;
  v_first boolean:=false;
begin
  if v_user is null then raise exception 'Authentication required'; end if;
  if p_score<0 or p_score>100 then raise exception 'Invalid score'; end if;

  select * into v_lesson from public.lessons where id=p_lesson_id;
  if not found then raise exception 'Lesson not found'; end if;

  select * into v_progress
  from public.lesson_progress
  where user_id=v_user and lesson_id=p_lesson_id
  for update;

  if not found then
    insert into public.lesson_progress(user_id,lesson_id,completed_at,best_score)
    values(v_user,p_lesson_id,now(),p_score)
    returning * into v_progress;
    v_first:=true;
  else
    v_first:=v_progress.completed_at is null;
    update public.lesson_progress set
      completed_at=coalesce(completed_at,now()),
      best_score=greatest(best_score,p_score),
      updated_at=now()
    where user_id=v_user and lesson_id=p_lesson_id
    returning * into v_progress;
  end if;

  if v_first then
    insert into public.ledger(user_id,currency,amount,reason,reference_type,reference_id,idempotency_key)
    values(v_user,'XP',v_lesson.xp_reward,'LESSON_COMPLETION','lesson',p_lesson_id,'lesson-xp:'||p_lesson_id)
    on conflict(user_id,currency,idempotency_key) do nothing;

    insert into public.ledger(user_id,currency,amount,reason,reference_type,reference_id,idempotency_key)
    values(v_user,'COIN',v_lesson.coin_reward,'LESSON_COMPLETION','lesson',p_lesson_id,'lesson-coin:'||p_lesson_id)
    on conflict(user_id,currency,idempotency_key) do nothing;
  end if;

  return jsonb_build_object(
    'completed_at',v_progress.completed_at,
    'best_score',v_progress.best_score,
    'first_completion',v_first,
    'xp_reward',case when v_first then v_lesson.xp_reward else 0 end,
    'coin_reward',case when v_first then v_lesson.coin_reward else 0 end
  );
end;
$$;

create or replace function public.purchase_shop_item(
  p_item_id uuid,
  p_idempotency_key text
)
returns jsonb
language plpgsql
security definer
set search_path=''
as $$
declare
  v_user uuid:=auth.uid();
  v_item public.shop_items%rowtype;
  v_profile public.profiles%rowtype;
  v_purchase public.purchases%rowtype;
begin
  if v_user is null then raise exception 'Authentication required'; end if;

  select * into v_purchase from public.purchases
  where user_id=v_user and idempotency_key=p_idempotency_key;
  if found then return to_jsonb(v_purchase)||jsonb_build_object('duplicate',true); end if;

  select * into v_profile from public.profiles where id=v_user for update;
  select * into v_item from public.shop_items where id=p_item_id and active=true;
  if not found then raise exception 'Item unavailable'; end if;
  if exists(select 1 from public.inventory where user_id=v_user and item_id=p_item_id) then
    raise exception 'Item already owned';
  end if;
  if v_profile.coins<v_item.price then raise exception 'Insufficient balance'; end if;

  insert into public.ledger(user_id,currency,amount,reason,reference_type,reference_id,idempotency_key)
  values(v_user,'COIN',-v_item.price,'SHOP_PURCHASE','shop_item',p_item_id,'purchase-ledger:'||p_idempotency_key);

  insert into public.purchases(user_id,item_id,price,idempotency_key)
  values(v_user,p_item_id,v_item.price,p_idempotency_key)
  returning * into v_purchase;

  insert into public.inventory(user_id,item_id) values(v_user,p_item_id);

  return to_jsonb(v_purchase)||jsonb_build_object('duplicate',false);
end;
$$;

create or replace function public.equip_cosmetic(p_item_id uuid)
returns jsonb
language plpgsql
security definer
set search_path=''
as $$
declare
  v_user uuid:=auth.uid();
  v_item public.shop_items%rowtype;
begin
  if v_user is null then raise exception 'Authentication required'; end if;
  select s.* into v_item
  from public.shop_items s
  join public.inventory i on i.item_id=s.id and i.user_id=v_user
  where s.id=p_item_id;
  if not found then raise exception 'Item not owned'; end if;

  insert into public.equipped_cosmetics(user_id,slot,item_id)
  values(v_user,v_item.item_type,p_item_id)
  on conflict(user_id,slot) do update set item_id=excluded.item_id,updated_at=now();

  return jsonb_build_object('slot',v_item.item_type,'item_id',p_item_id);
end;
$$;

revoke all on function public.submit_attempt(uuid,jsonb,boolean,text,boolean) from public,anon;
grant execute on function public.submit_attempt(uuid,jsonb,boolean,text,boolean) to authenticated;
revoke all on function public.complete_lesson(uuid,numeric) from public,anon;
grant execute on function public.complete_lesson(uuid,numeric) to authenticated;
revoke all on function public.purchase_shop_item(uuid,text) from public,anon;
grant execute on function public.purchase_shop_item(uuid,text) to authenticated;
revoke all on function public.equip_cosmetic(uuid) from public,anon;
grant execute on function public.equip_cosmetic(uuid) to authenticated;
