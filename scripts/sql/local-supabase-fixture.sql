-- Minimal infrastructure contracts for local SQL/RLS validation, not hosted Auth.
create role anon nologin;
create role authenticated nologin;
create role service_role nologin bypassrls;
grant usage on schema public to anon,authenticated,service_role;
alter default privileges in schema public grant all on tables to anon,authenticated,service_role;
alter default privileges in schema public grant all on sequences to anon,authenticated,service_role;
create schema auth;
grant usage on schema auth to anon,authenticated,service_role;
create table auth.users(id uuid primary key,raw_user_meta_data jsonb not null default '{}');
create function auth.uid() returns uuid language sql stable as $$
 select nullif(current_setting('request.jwt.claim.sub',true),'')::uuid;
$$;
create schema storage;
grant usage on schema storage to anon,authenticated,service_role;
create table storage.buckets(id text primary key,name text,public boolean,file_size_limit bigint,allowed_mime_types text[]);
-- Source-only fixture: the private-ai-documents migration is intentionally
-- skipped in isolated rollback tests because it has an internal COMMIT.
-- Model its existing private bucket so subsequent guarded migrations can be
-- tested without weakening their protection on real Supabase projects.
insert into storage.buckets(id,name,public,file_size_limit,allowed_mime_types)
values ('noata-documents','noata-documents',false,8388608,
 array['application/pdf','application/vnd.openxmlformats-officedocument.wordprocessingml.document',
 'text/plain','text/markdown','text/csv','application/json']);

create table storage.objects(id uuid primary key default gen_random_uuid(),bucket_id text references storage.buckets(id),name text);
alter table storage.objects enable row level security;
grant all on storage.objects to anon,authenticated,service_role;
create function storage.foldername(name text) returns text[] language sql immutable as $$
 select (string_to_array(name,'/'))[1:array_length(string_to_array(name,'/'),1)-1];
$$;
