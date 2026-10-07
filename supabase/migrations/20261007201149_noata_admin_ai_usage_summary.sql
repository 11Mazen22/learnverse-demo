create or replace function public.admin_ai_usage_summary()
returns table(capability text, attempts bigint)
language plpgsql stable security definer set search_path = ''
as $$
begin
  if not private.is_admin() then
    raise exception 'Administrator access required' using errcode = '42501';
  end if;
  return query select recent.capability, count(*) from
    (select e.capability from public.ai_usage_events e order by e.created_at desc limit 500) recent
    group by recent.capability;
end;
$$;
revoke all on function public.admin_ai_usage_summary() from public, anon;
grant execute on function public.admin_ai_usage_summary() to authenticated;

