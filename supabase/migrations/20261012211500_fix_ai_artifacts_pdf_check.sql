-- Genesis 3.0: repair the PDF artifact metadata/storage MIME mismatch.
-- Reviewed Staging-first migration. Existing owner/RLS, size, FK, path, and Storage policies remain unchanged.
-- PostgreSQL applies the DROP/ADD atomically in the migration transaction.
do $guard$
begin
 if not exists (
  select 1 from pg_constraint
  where conrelid='public.ai_artifacts'::regclass and conname='ai_artifacts_mime_type_check'
 ) then
  raise exception 'Expected ai_artifacts_mime_type_check constraint absent; inspect schema before proceeding';
 end if;
end $guard$;

alter table public.ai_artifacts
 drop constraint ai_artifacts_mime_type_check,
 add constraint ai_artifacts_mime_type_check check (
  mime_type in (
   'application/pdf',
   'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
   'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
   'application/vnd.openxmlformats-officedocument.presentationml.presentation',
   'text/markdown',
   'text/plain'
  )
 );
