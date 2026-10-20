-- Server-only provider credential reader.
-- The Edge Function uses its service-role client; browser roles cannot execute
-- this function and the secret never appears in a response, log or client bundle.
--
-- The lookup uses dynamic SQL so this migration also applies to the lightweight
-- Postgres fixture used by CI, where the Supabase Vault schema is absent. In a
-- real Supabase database the view exists and the allowlist is enforced before a
-- value is returned.
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
