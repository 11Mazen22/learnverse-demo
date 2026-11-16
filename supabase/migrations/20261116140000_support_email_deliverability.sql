-- Support email deliverability alignment.
--
-- The previous identity pass moved support to `support@noata.app`, but
-- `noata.app` is not a registered domain (NXDOMAIN) and has no MX or Resend
-- verification. The live product domain is `enterpriseworkhub.online`, which
-- has working MX records and a published Resend DKIM key, so the operational
-- support inbox and sender must live on that verified domain.
--
-- Additive and safe to replay: move the default, rewrite historical rows, and
-- recreate the anonymous insert policy against the deliverable address.

alter table public.support_tickets
  alter column email_destination set default 'support@enterpriseworkhub.online';

update public.support_tickets
set email_destination = 'support@enterpriseworkhub.online'
where email_destination in (
  'support@noata.app',
  'mazenshazly011@gmail.com'
);

drop policy if exists "Anyone can create a support ticket" on public.support_tickets;
create policy "Anyone can create a support ticket"
  on public.support_tickets
  for insert
  to anon, authenticated
  with check (
    (user_id is null or user_id = (select auth.uid()))
    and status = 'open'
    and email_delivery_status = 'pending'
    and email_destination = 'support@enterpriseworkhub.online'
    and provider_response = '{}'::jsonb
    and admin_notes is null
  );

comment on column public.support_tickets.email_destination is
  'Official support inbox on the verified product domain. Overridable at the API layer with NOATA_SUPPORT_EMAIL, never a personal address.';
