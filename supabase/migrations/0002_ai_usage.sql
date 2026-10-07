create table public.ai_usage_events (
  id bigint generated always as identity primary key,
  user_id uuid not null references public.profiles(id) on delete cascade,
  capability text not null,
  created_at timestamptz not null default now()
);

alter table public.ai_usage_events enable row level security;
create index ai_usage_events_quota_idx on public.ai_usage_events(user_id,capability,created_at desc);

create or replace function public.claim_ai_quota(
  p_user_id uuid,
  p_capability text,
  p_limit int,
  p_window_seconds int
)
returns table(allowed boolean,remaining int,reset_at timestamptz)
language plpgsql
security definer
set search_path=''
as $$
declare
  v_count int;
  v_oldest timestamptz;
  v_since timestamptz := now() - make_interval(secs => p_window_seconds);
begin
  if p_limit <= 0 or p_window_seconds <= 0 then
    raise exception 'Invalid quota configuration';
  end if;

  perform pg_advisory_xact_lock(hashtextextended(p_user_id::text || ':' || p_capability,0));

  delete from public.ai_usage_events
  where user_id=p_user_id
    and capability=p_capability
    and created_at < v_since - interval '1 day';

  select count(*),min(created_at)
  into v_count,v_oldest
  from public.ai_usage_events
  where user_id=p_user_id
    and capability=p_capability
    and created_at >= v_since;

  if v_count >= p_limit then
    allowed := false;
    remaining := 0;
    reset_at := coalesce(v_oldest,now()) + make_interval(secs => p_window_seconds);
    return next;
    return;
  end if;

  insert into public.ai_usage_events(user_id,capability)
  values(p_user_id,p_capability);

  allowed := true;
  remaining := greatest(0,p_limit-v_count-1);
  reset_at := now()+make_interval(secs => p_window_seconds);
  return next;
end;
$$;

revoke all on function public.claim_ai_quota(uuid,text,int,int) from public,anon,authenticated;
grant execute on function public.claim_ai_quota(uuid,text,int,int) to service_role;
