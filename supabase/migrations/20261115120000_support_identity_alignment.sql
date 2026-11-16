-- Support identity alignment (Phase 4)
-- The support inbox is the official Noäta support address, never an individual
-- mailbox. The original support_tickets migration pinned both the column default
-- and the anonymous insert policy to a personal Gmail address, so the API could
-- not persist an officially routed ticket. This migration is additive and safe
-- to replay: it moves the default, rewrites historical rows, and recreates the
-- insert policy against the official address.

alter table public.support_tickets
  alter column email_destination set default 'support@noata.app';

-- Historical rows created before this alignment still point at the personal
-- mailbox. Rewrite them with a pattern match so the address itself is not kept
-- in the repository.
update public.support_tickets
set email_destination = 'support@noata.app'
where email_destination like '%@gmail.com';

-- Recreate the anonymous insert policy against the official destination with
-- identical constraints. Nothing else about ticket creation changes.
drop policy if exists "Anyone can create a support ticket" on public.support_tickets;
create policy "Anyone can create a support ticket"
  on public.support_tickets
  for insert
  to anon, authenticated
  with check (
    (user_id is null or user_id = (select auth.uid()))
    and status = 'open'
    and email_delivery_status = 'pending'
    and email_destination = 'support@noata.app'
    and provider_response = '{}'::jsonb
    and admin_notes is null
  );

comment on column public.support_tickets.email_destination is
  'Official Noäta support inbox. Overridable at the API layer with NOATA_SUPPORT_EMAIL, never a personal address.';
