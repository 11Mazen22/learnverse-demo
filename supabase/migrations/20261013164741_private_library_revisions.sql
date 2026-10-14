-- Staging first. Additive private library persistence and owner-bound revision lineage.
begin;
alter table public.ai_document_files add column library_saved boolean not null default false;
alter table public.ai_document_files add constraint document_owner_identity unique(id,user_id);
-- New regular uploads opt into library retention; legacy expiry semantics remain.
alter policy "private document read before expiry" on storage.objects using(
 bucket_id='noata-documents' and exists(select 1 from public.ai_document_files d
 where d.storage_path=objects.name and d.user_id=(select auth.uid())
 and (d.library_saved or d.expires_at>now())
 and (d.library_saved or exists(select 1 from public.ai_conversations c where c.id=d.conversation_id and c.user_id=(select auth.uid())))));
alter table public.ai_attachments drop constraint ai_attachments_conversation_id_fkey;
alter table public.ai_attachments add constraint ai_attachments_conversation_id_fkey
 foreign key(conversation_id) references public.ai_conversations(id) on delete set null;
alter table public.ai_attachments add column library_saved boolean not null default false;
alter table public.ai_attachments add column filename text check(filename is null or (char_length(filename) between 1 and 180 and filename !~ '[/\\\\]'));
alter table public.ai_artifacts add constraint artifact_owner_identity unique(id,user_id);
alter table public.ai_artifacts add column parent_artifact_id uuid;
alter table public.ai_artifacts add column source_document_id uuid;
alter table public.ai_artifacts add column source_content text check(source_content is null or char_length(source_content)<=160000);
alter table public.ai_artifacts add constraint artifact_parent_owner
 foreign key(parent_artifact_id,user_id) references public.ai_artifacts(id,user_id) on delete set null(parent_artifact_id);
alter table public.ai_artifacts add constraint artifact_document_owner
 foreign key(source_document_id,user_id) references public.ai_document_files(id,user_id) on delete set null(source_document_id);
alter table public.ai_artifacts add constraint artifact_no_self_parent check(parent_artifact_id is null or parent_artifact_id<>id);
alter table public.ai_artifacts add constraint artifact_one_source check(parent_artifact_id is null or source_document_id is null);
create function public.noata_artifact_revision() returns trigger
 language plpgsql set search_path='' as $$
declare parent_version integer; parent_project uuid;
begin
 new.version=1;
 if new.parent_artifact_id is not null then
  select a.version,a.project_id into parent_version,parent_project from public.ai_artifacts a
   where a.id=new.parent_artifact_id and a.user_id=new.user_id;
  if parent_version is null then raise exception 'Source artifact is unavailable for this owner'; end if;
  new.version=parent_version+1;
  new.project_id=parent_project;
 elsif new.source_document_id is not null then
  if not exists(select 1 from public.ai_document_files d where d.id=new.source_document_id and d.user_id=new.user_id
   and (d.library_saved or d.expires_at>now())) then raise exception 'Source document is unavailable for this owner'; end if;
  new.version=2;
 end if;
 return new;
end $$;
revoke all on function public.noata_artifact_revision() from public;
create trigger noata_artifact_revision before insert on public.ai_artifacts for each row execute function public.noata_artifact_revision();
-- Every revision has new bytes and a new row. Owners may only reorganize its project.
revoke update on public.ai_artifacts from authenticated;
grant update(project_id) on public.ai_artifacts to authenticated;
update storage.buckets set allowed_mime_types=array_append(allowed_mime_types,'application/vnd.openxmlformats-officedocument.presentationml.presentation')
 where id='noata-documents' and not ('application/vnd.openxmlformats-officedocument.presentationml.presentation'=any(allowed_mime_types));
commit;
