-- Reassert the provider-secret reader with a Vault-optional body.
-- Production already has the first definition; this migration records the
-- portable function in migration history and keeps fresh databases identical.
-- It remains readable only by the service role.
create or replace function public.noata_provider_secret(secret_name text)
returns text
language plpgsql
stable
security definer
set search_path = ''
as $$
declare
  result text;
begin
  if to_regclass('vault.decrypted_secrets') is null then
    return null;
  end if;
  execute
    'select decrypted_secret from vault.decrypted_secrets where name = $1 and name in (''LANGSEARCH_API_KEY'', ''NOATA_SEARCH_ENABLED'') limit 1'
    into result
    using secret_name;
  return result;
end;
$$;

revoke all on function public.noata_provider_secret(text) from public;
revoke all on function public.noata_provider_secret(text) from anon, authenticated;
grant execute on function public.noata_provider_secret(text) to service_role;

comment on function public.noata_provider_secret(text)
  is 'Returns an allowlisted provider credential to the service role only.';
