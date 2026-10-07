-- Additive candidate-only inference ledger. No client role may read prompts/results.
create table public.ai_request_receipts (
  user_id uuid not null references auth.users(id) on delete cascade,
  request_id uuid not null,
  payload_hash text not null,
  status text not null default 'pending' check(status in ('pending','complete','failed')),
  response jsonb,
  created_at timestamptz not null default now(),
  primary key(user_id,request_id)
);
alter table public.ai_request_receipts enable row level security;
revoke all on public.ai_request_receipts from public,anon,authenticated;
grant select,insert,update,delete on public.ai_request_receipts to service_role;
create index ai_request_receipts_created_idx on public.ai_request_receipts(created_at);
comment on table public.ai_request_receipts is 'Inference idempotency receipts. Service-role only. Expired receipts are pruned by the candidate AI function after 24 hours.';
-- Rollback after disabling candidate traffic: drop table public.ai_request_receipts;
