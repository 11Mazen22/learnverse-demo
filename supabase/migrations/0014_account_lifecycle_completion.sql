
create or replace function private.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path=''
as $$
begin
  insert into public.profiles(id,display_name,role)
  values(new.id,coalesce(new.raw_user_meta_data->>'display_name',''),'student');

  insert into public.user_settings(user_id)
  values(new.id)
  on conflict(user_id) do nothing;

  insert into public.notifications(user_id,type,title,body,href)
  values(
    new.id,
    'welcome',
    'أهلاً بيك في Noata 👋',
    'ابدأ أول Mission، وابني mastery حقيقي من أول محاولة.',
    '/learn'
  );

  return new;
end;
$$;

revoke all on function private.handle_new_user() from public,anon,authenticated;

create or replace function private.set_user_role(
  p_user_id uuid,
  p_role public.noata_role
)
returns jsonb
language plpgsql
security definer
set search_path=''
as $$
declare
  v_actor uuid:=auth.uid();
  v_old public.noata_role;
begin
  if v_actor is null or not private.is_admin() then
    raise exception 'Admin access required';
  end if;
  if p_user_id=v_actor then
    raise exception 'Use another admin account to change your own role';
  end if;

  select role into v_old from public.profiles where id=p_user_id for update;
  if not found then raise exception 'User not found'; end if;

  update public.profiles
  set role=p_role,updated_at=now()
  where id=p_user_id;

  if p_role<>'student' then
    delete from public.class_memberships where student_id=p_user_id;
  end if;

  if p_role<>'teacher' then
    delete from public.teacher_class_access where teacher_id=p_user_id;
  end if;

  insert into public.audit_events(actor_id,action,entity_type,entity_id,metadata)
  values(
    v_actor,'ROLE_CHANGED','profile',p_user_id::text,
    jsonb_build_object('from',v_old,'to',p_role)
  );

  insert into public.notifications(user_id,type,title,body,href)
  values(
    p_user_id,
    'role',
    'تم تحديث صلاحية حسابك',
    'صلاحية حسابك أصبحت: '||p_role::text,
    '/'
  );

  return jsonb_build_object('user_id',p_user_id,'role',p_role);
end;
$$;
