-- Renaissance 2.0: private project workspaces and persistent generated artifacts.
-- Staging-first, additive, no destructive DDL or production application.
create table public.ai_projects (
 id uuid primary key default gen_random_uuid(),
 user_id uuid not null references auth.users(id) on delete cascade,
 name text not null check (char_length(name) between 2 and 80),
 instructions text not null default '' check (char_length(instructions)<=2000),
 created_at timestamptz not null default now(),
 updated_at timestamptz not null default now(),
 unique(id,user_id)
);
create index ai_projects_owner_updated_idx on public.ai_projects(user_id,updated_at desc);
create table public.ai_artifacts (
 id uuid primary key,
 user_id uuid not null references auth.users(id) on delete cascade,
 project_id uuid,
 filename text not null check (char_length(filename) between 3 and 180 and filename !~ '[/\\]'),
 mime_type text not null check (mime_type in (
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
  'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
  'application/vnd.openxmlformats-officedocument.presentationml.presentation',
  'text/markdown','text/plain'
 )),
 storage_path text not null unique,
 byte_size integer not null check (byte_size>0 and byte_size<=12582912),
 version integer not null default 1 check (version>0),
 created_at timestamptz not null default now(),
 constraint artifact_own_project foreign key(project_id,user_id) references public.ai_projects(id,user_id) on delete set null (project_id)
);
create index ai_artifacts_owner_recent_idx on public.ai_artifacts(user_id,created_at desc);
alter table public.ai_projects enable row level security;
alter table public.ai_artifacts enable row level security;
create policy "ai projects owner select" on public.ai_projects for select to authenticated using(user_id=(select auth.uid()));
create policy "ai projects owner insert" on public.ai_projects for insert to authenticated with check(user_id=(select auth.uid()));
create policy "ai projects owner update" on public.ai_projects for update to authenticated using(user_id=(select auth.uid())) with check(user_id=(select auth.uid()));
create policy "ai projects owner delete" on public.ai_projects for delete to authenticated using(user_id=(select auth.uid()));
create policy "ai artifacts owner select" on public.ai_artifacts for select to authenticated using(user_id=(select auth.uid()));
create policy "ai artifacts owner insert" on public.ai_artifacts for insert to authenticated with check(
 user_id=(select auth.uid()) and storage_path like ((select auth.uid())::text || '/%')
);
create policy "ai artifacts owner update" on public.ai_artifacts for update to authenticated
 using(user_id=(select auth.uid())) with check(user_id=(select auth.uid()) and storage_path like ((select auth.uid())::text || '/%'));
create policy "ai artifacts owner delete" on public.ai_artifacts for delete to authenticated using(user_id=(select auth.uid()));
revoke all on public.ai_projects,public.ai_artifacts from anon;
grant select,insert,update,delete on public.ai_projects,public.ai_artifacts to authenticated;

insert into storage.buckets(id,name,public,file_size_limit,allowed_mime_types)
values ('noata-ai-artifacts','noata-ai-artifacts',false,12582912,
 array['application/vnd.openxmlformats-officedocument.wordprocessingml.document',
       'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
       'application/vnd.openxmlformats-officedocument.presentationml.presentation',
       'text/markdown','text/plain'])
on conflict(id) do nothing;
create policy "ai artifact owner upload" on storage.objects for insert to authenticated
 with check(bucket_id='noata-ai-artifacts' and split_part(name,'/',1)=(select auth.uid())::text);
create policy "ai artifact owner download" on storage.objects for select to authenticated
 using(bucket_id='noata-ai-artifacts' and split_part(name,'/',1)=(select auth.uid())::text);
create policy "ai artifact owner remove" on storage.objects for delete to authenticated
 using(bucket_id='noata-ai-artifacts' and split_part(name,'/',1)=(select auth.uid())::text);
