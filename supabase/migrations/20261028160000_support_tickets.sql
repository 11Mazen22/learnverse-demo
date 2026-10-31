-- Support Tickets and Inquiries Migration
-- Creates a dedicated support ticket table with RLS, audit timestamps, and email delivery status.

create table if not exists public.support_tickets (
  id uuid primary key default gen_random_uuid(),
  ticket_code text not null unique,
  user_id uuid references auth.users(id) on delete set null,
  name text not null,
  email text not null,
  subject text not null,
  category text not null check (category in ('curriculum', 'tracks', 'lessons', 'ai', 'account', 'bug', 'general')),
  message text not null,
  status text not null default 'open' check (status in ('open', 'in_progress', 'resolved', 'closed')),
  email_delivery_status text not null default 'pending' check (email_delivery_status in ('sent', 'queued_no_provider', 'failed', 'pending')),
  email_destination text not null default 'mazenshazly011@gmail.com',
  provider_response jsonb default '{}'::jsonb check (pg_column_size(provider_response) <= 8192),
  delivery_token_hash text not null check (delivery_token_hash ~ '^[0-9a-f]{64}$'),
  admin_notes text default null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- Enable Row Level Security
alter table public.support_tickets enable row level security;

-- Index for efficient user and status lookup
create index if not exists idx_support_tickets_user_id on public.support_tickets(user_id);
create index if not exists idx_support_tickets_status on public.support_tickets(status);
create index if not exists idx_support_tickets_created_at on public.support_tickets(created_at desc);

-- Policy 1: Authenticated users can view their own tickets
drop policy if exists "Users can view own support tickets" on public.support_tickets;
create policy "Users can view own support tickets"
  on public.support_tickets
  for select
  using (
    (select auth.uid()) = user_id
    or exists (
       select 1 from public.profiles
       where profiles.id = (select auth.uid()) and profiles.role = 'admin'
    )
  );

-- Policy 2: Anyone (including visitors) can submit a support ticket
drop policy if exists "Anyone can create a support ticket" on public.support_tickets;
create policy "Anyone can create a support ticket"
  on public.support_tickets
  for insert
  to anon, authenticated
  with check (
    (user_id is null or user_id = (select auth.uid()))
    and status = 'open'
    and email_delivery_status = 'pending'
    and email_destination = 'mazenshazly011@gmail.com'
    and provider_response = '{}'::jsonb
    and admin_notes is null
  );

-- Policy 3: Staff/Admins can update ticket status and notes
drop policy if exists "Staff can update support tickets" on public.support_tickets;
create policy "Staff can update support tickets"
  on public.support_tickets
  for update
  using (
    exists (
       select 1 from public.profiles
       where profiles.id = (select auth.uid()) and profiles.role = 'admin'
    )
  )
  with check (
    exists (
      select 1 from public.profiles
      where profiles.id = (select auth.uid()) and profiles.role = 'admin'
    )
  );

drop policy if exists "Staff can delete support tickets" on public.support_tickets;

-- Updated_at trigger
drop trigger if exists set_support_tickets_updated_at on public.support_tickets;
create trigger set_support_tickets_updated_at
  before update on public.support_tickets
  for each row
  execute function private.touch_updated_at();

revoke all on public.support_tickets from anon, authenticated;
grant insert on public.support_tickets to anon, authenticated;
grant select on public.support_tickets to authenticated;
grant update (status, admin_notes) on public.support_tickets to authenticated;

create function private.record_support_ticket_delivery(
  p_ticket_id uuid,
  p_delivery_token text,
  p_status text,
  p_provider_response jsonb default '{}'::jsonb
) returns boolean
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_updated uuid;
begin
  if p_status not in ('sent', 'queued_no_provider', 'failed') then
    raise exception 'Invalid delivery status';
  end if;
  if char_length(coalesce(p_delivery_token, '')) < 32 then
    raise exception 'Invalid delivery token';
  end if;
  update public.support_tickets
  set email_delivery_status = p_status,
      provider_response = coalesce(p_provider_response, '{}'::jsonb),
      updated_at = now()
  where id = p_ticket_id
    and delivery_token_hash = pg_catalog.encode(
      pg_catalog.sha256(pg_catalog.convert_to(p_delivery_token, 'UTF8')),
      'hex'
    )
    and created_at > now() - interval '1 hour'
  returning id into v_updated;
  return v_updated is not null;
end;
$$;

revoke all on function private.record_support_ticket_delivery(uuid, text, text, jsonb) from public;
grant execute on function private.record_support_ticket_delivery(uuid, text, text, jsonb) to anon, authenticated;

create function public.record_support_ticket_delivery(
  p_ticket_id uuid,
  p_delivery_token text,
  p_status text,
  p_provider_response jsonb default '{}'::jsonb
) returns boolean
language sql
security invoker
set search_path = ''
as $$
  select private.record_support_ticket_delivery(
    p_ticket_id,
    p_delivery_token,
    p_status,
    p_provider_response
  );
$$;

revoke all on function public.record_support_ticket_delivery(uuid, text, text, jsonb) from public;
grant execute on function public.record_support_ticket_delivery(uuid, text, text, jsonb) to anon, authenticated;
