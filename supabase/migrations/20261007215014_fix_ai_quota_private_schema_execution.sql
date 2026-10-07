create or replace function public.claim_ai_quota(
  p_user_id uuid,
  p_capability text,
  p_limit int,
  p_window_seconds int
)
returns table(allowed boolean, remaining int, reset_at timestamptz)
language sql
security definer
set search_path=''
as $$
  select * from private.claim_ai_quota(
    p_user_id,
    p_capability,
    p_limit,
    p_window_seconds
  );
$$;

revoke all on function public.claim_ai_quota(uuid,text,int,int) from public, anon, authenticated;
grant execute on function public.claim_ai_quota(uuid,text,int,int) to service_role;

comment on function public.claim_ai_quota(uuid,text,int,int)
  is 'Service-role quota gate wrapper. SECURITY DEFINER permits the wrapper to call private.claim_ai_quota without granting private schema access to client roles.';
