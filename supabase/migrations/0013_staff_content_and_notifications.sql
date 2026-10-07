
create or replace function private.create_question_draft(
  p_lesson_id uuid,
  p_unit_id uuid,
  p_skill_id uuid,
  p_question_type text,
  p_prompt_ar text,
  p_prompt_en text,
  p_choices_ar jsonb,
  p_choices_en jsonb,
  p_answer_spec jsonb,
  p_explanation_ar text,
  p_explanation_en text,
  p_difficulty numeric,
  p_metadata jsonb default '{}'::jsonb
)
returns uuid
language plpgsql
security definer
set search_path=''
as $$
declare
  v_actor uuid:=auth.uid();
  v_id uuid;
begin
  if v_actor is null or not private.is_staff() then
    raise exception 'Staff access required';
  end if;
  if p_question_type not in ('multiple-choice','numeric') then
    raise exception 'Unsupported question type';
  end if;
  if coalesce(length(trim(p_prompt_ar)),0)<4 or coalesce(length(trim(p_prompt_en)),0)<4 then
    raise exception 'Question prompts are required';
  end if;
  if p_lesson_id is not null and p_unit_id is not null then
    raise exception 'Question cannot belong to both lesson and unit';
  end if;
  if p_difficulty<=0 then raise exception 'Difficulty must be positive'; end if;

  insert into public.questions(
    lesson_id,unit_id,skill_id,difficulty,question_type,
    prompt_ar,prompt_en,choices_ar,choices_en,
    review_status,publication_status,created_by,metadata
  ) values(
    p_lesson_id,p_unit_id,p_skill_id,p_difficulty,p_question_type,
    p_prompt_ar,p_prompt_en,coalesce(p_choices_ar,'[]'::jsonb),coalesce(p_choices_en,'[]'::jsonb),
    'draft','draft',v_actor,coalesce(p_metadata,'{}'::jsonb)
  )
  returning id into v_id;

  insert into public.question_keys(
    question_id,answer_spec,explanation_ar,explanation_en
  ) values(
    v_id,p_answer_spec,coalesce(p_explanation_ar,''),coalesce(p_explanation_en,'')
  );

  insert into public.audit_events(actor_id,action,entity_type,entity_id,metadata)
  values(v_actor,'QUESTION_CREATED','question',v_id::text,jsonb_build_object('status','draft'));

  return v_id;
end;
$$;

revoke all on function private.create_question_draft(
  uuid,uuid,uuid,text,text,text,jsonb,jsonb,jsonb,text,text,numeric,jsonb
) from public,anon;
grant execute on function private.create_question_draft(
  uuid,uuid,uuid,text,text,text,jsonb,jsonb,jsonb,text,text,numeric,jsonb
) to authenticated;

create function public.create_question_draft(
  p_lesson_id uuid,
  p_unit_id uuid,
  p_skill_id uuid,
  p_question_type text,
  p_prompt_ar text,
  p_prompt_en text,
  p_choices_ar jsonb,
  p_choices_en jsonb,
  p_answer_spec jsonb,
  p_explanation_ar text,
  p_explanation_en text,
  p_difficulty numeric,
  p_metadata jsonb default '{}'::jsonb
)
returns uuid
language sql
security invoker
set search_path=''
as $$
  select private.create_question_draft(
    p_lesson_id,p_unit_id,p_skill_id,p_question_type,
    p_prompt_ar,p_prompt_en,p_choices_ar,p_choices_en,
    p_answer_spec,p_explanation_ar,p_explanation_en,p_difficulty,p_metadata
  );
$$;

revoke all on function public.create_question_draft(
  uuid,uuid,uuid,text,text,text,jsonb,jsonb,jsonb,text,text,numeric,jsonb
) from public,anon;
grant execute on function public.create_question_draft(
  uuid,uuid,uuid,text,text,text,jsonb,jsonb,jsonb,text,text,numeric,jsonb
) to authenticated;

create or replace function private.notify_assignment_published()
returns trigger
language plpgsql
security definer
set search_path=''
as $$
begin
  if new.published_at is not null
     and (tg_op='INSERT' or old.published_at is null) then
    insert into public.notifications(user_id,type,title,body,href)
    select
      m.student_id,
      'assignment',
      'واجب جديد: '||new.title,
      case when new.due_at is null then new.instructions
           else new.instructions||' · موعد التسليم '||to_char(new.due_at,'YYYY-MM-DD HH24:MI') end,
      '/assignments'
    from public.class_memberships m
    where m.class_id=new.class_id;
  end if;
  return new;
end;
$$;

drop trigger if exists assignment_publish_notifications on public.assignments;
create trigger assignment_publish_notifications
after insert or update of published_at on public.assignments
for each row execute procedure private.notify_assignment_published();

create or replace function private.notify_submission_graded()
returns trigger
language plpgsql
security definer
set search_path=''
as $$
declare
  v_title text;
begin
  if new.score is not null and (old.score is null or old.score<>new.score) then
    select title into v_title from public.assignments where id=new.assignment_id;
    insert into public.notifications(user_id,type,title,body,href)
    values(
      new.student_id,
      'grade',
      'تم تقييم واجبك',
      coalesce(v_title,'Assignment')||' · '||round(new.score,0)||'%',
      '/assignments'
    );
  end if;
  return new;
end;
$$;

drop trigger if exists submission_grade_notifications on public.assignment_submissions;
create trigger submission_grade_notifications
after update of score on public.assignment_submissions
for each row execute procedure private.notify_submission_graded();
