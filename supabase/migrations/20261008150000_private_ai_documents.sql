-- REVIEW/APPLY TO ISOLATED STAGING FIRST. Not applied by the application.
begin;
insert into storage.buckets(id,name,public,file_size_limit,allowed_mime_types)
values ('noata-documents','noata-documents',false,8388608,array['application/pdf','application/vnd.openxmlformats-officedocument.wordprocessingml.document','text/plain','text/markdown','text/csv','application/json'])
on conflict(id) do nothing;
create table public.ai_document_files (
  id uuid primary key,
  user_id uuid not null references auth.users(id) on delete cascade,
  -- Retain cleanup records after conversation deletion; cleanup uses the Storage API.
  conversation_id uuid references public.ai_conversations(id) on delete set null,
  name text not null check(length(name) between 1 and 120),
  storage_path text unique not null,
  mime_type text not null,
  size_bytes integer not null check(size_bytes between 1 and 8388608),
  created_at timestamptz not null default now(),
  expires_at timestamptz not null default (now()+interval '30 days'),
  check(expires_at>created_at and expires_at<=created_at+interval '30 days'),
  check(split_part(storage_path,'/',1)=user_id::text)
);
alter table public.ai_document_files enable row level security;
revoke all on public.ai_document_files from anon, authenticated;
grant select,insert,delete on public.ai_document_files to authenticated;
create policy "document metadata owner read" on public.ai_document_files for select to authenticated
using(user_id=(select auth.uid()));
create policy "document metadata owner insert" on public.ai_document_files for insert to authenticated
with check(user_id=(select auth.uid()) and exists(select 1 from public.ai_conversations c where c.id=conversation_id and c.user_id=(select auth.uid()))
  and storage_path like user_id::text||'/'||conversation_id::text||'/'||id::text||'.%');
-- A user cannot drop the quota/cleanup record while its bytes still exist.
-- Definer visibility is needed because expired objects are intentionally unreadable.
create function public.noata_document_object_exists(object_path text) returns boolean
language sql stable security definer set search_path='' as $$
  select case when split_part(object_path,'/',1)=(select auth.uid())::text then
    exists(select 1 from storage.objects where bucket_id='noata-documents' and name=object_path)
    else true end;
$$;
revoke all on function public.noata_document_object_exists(text) from public;
grant execute on function public.noata_document_object_exists(text) to authenticated;
create policy "document metadata owner delete" on public.ai_document_files for delete to authenticated
using(user_id=(select auth.uid()) and not public.noata_document_object_exists(storage_path));
create policy "private document insert" on storage.objects for insert to authenticated
with check(bucket_id='noata-documents' and (storage.foldername(name))[1]=(select auth.uid())::text
  and exists(select 1 from public.ai_document_files d where d.storage_path=name and d.user_id=(select auth.uid()) and d.expires_at>now()
    and d.mime_type=metadata->>'mimetype' and d.size_bytes=(metadata->>'size')::bigint
    and exists(select 1 from public.ai_conversations c where c.id=d.conversation_id and c.user_id=(select auth.uid()))));
create policy "private document read before expiry" on storage.objects for select to authenticated
using(bucket_id='noata-documents' and exists(select 1 from public.ai_document_files d where d.storage_path=name and d.user_id=(select auth.uid()) and d.expires_at>now()
  and exists(select 1 from public.ai_conversations c where c.id=d.conversation_id and c.user_id=(select auth.uid()))));
create policy "private document owner delete" on storage.objects for delete to authenticated
using(bucket_id='noata-documents' and (storage.foldername(name))[1]=(select auth.uid())::text);
create index ai_document_files_expiry_idx on public.ai_document_files(expires_at);
create index ai_document_files_conversation_idx on public.ai_document_files(conversation_id);
-- Serialize inserts for each conversation so simultaneous tabs cannot bypass the cap.
create function public.limit_ai_document_files() returns trigger language plpgsql set search_path=public as $$
begin
  new.created_at=now();
  new.expires_at=now()+interval '30 days';
  perform pg_advisory_xact_lock(hashtextextended(new.user_id::text,1));
  perform pg_advisory_xact_lock(hashtextextended(new.conversation_id::text,0));
  if (select count(*) from public.ai_document_files where conversation_id=new.conversation_id)>=40 then
    raise exception 'Document limit exceeded';
  end if;
  if (select coalesce(sum(size_bytes),0) from public.ai_document_files where user_id=new.user_id)+new.size_bytes>134217728 then
    raise exception 'Document storage quota exceeded';
  end if;
  return new;
end;
$$;
revoke all on function public.limit_ai_document_files() from public;
create trigger limit_ai_document_files before insert on public.ai_document_files for each row execute function public.limit_ai_document_files();
commit;
