-- Server-only provider credential reader.
-- The Edge Function uses its service-role client; browser roles cannot execute
-- this function and the secret never appears in a response, log or client bundle.
create or replace function public.noata_provider_secret(secret_name text)
returns text
language sql
stable
security definer
set search_path = ''
as $$
  select decrypted_secret
  from vault.decrypted_secrets
  where name = secret_name
    and name in ('LANGSEARCH_API_KEY', 'NOATA_SEARCH_ENABLED')
  limit 1
$$;

revoke all on function public.noata_provider_secret(text) from public;
revoke all on function public.noata_provider_secret(text) from anon, authenticated;
grant execute on function public.noata_provider_secret(text) to service_role;

comment on function public.noata_provider_secret(text)
  is 'Returns an allowlisted provider credential to the service role only.';
