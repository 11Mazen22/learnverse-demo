-- Stage 03 (M1): Persistent dashboard widget customization & weekly study goals.
-- Additive, idempotent, forward-only, and strictly owner-scoped via public.user_settings RLS.

alter table public.user_settings
  add column if not exists dashboard_preferences jsonb not null default '{}'::jsonb;

do $$
begin
  if not exists (
    select 1
    from pg_constraint
    where conrelid = 'public.user_settings'::regclass
      and conname = 'user_settings_dashboard_preferences_object'
  ) then
    alter table public.user_settings
      add constraint user_settings_dashboard_preferences_object
      check (jsonb_typeof(dashboard_preferences) = 'object');
  end if;
end $$;

revoke all on table public.user_settings from public, anon;
grant select, insert, update on table public.user_settings to authenticated;

comment on column public.user_settings.dashboard_preferences is
  'JSON object holding owner dashboard widget layout and weekly learning targets.';
