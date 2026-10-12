-- Genesis 3.0: preserve private original-file protection while enabling real XLSX conversation analysis.
-- This does not alter MIME validation for other buckets or other file types.
do $guard$
begin
 if not exists(select 1 from storage.buckets where id='noata-documents' and public=false and file_size_limit=8388608) then
  raise exception 'Expected private noata-documents bucket and 8MiB cap missing; review before migration';
 end if;
end $guard$;
update storage.buckets set
 allowed_mime_types=array_append(coalesce(allowed_mime_types,array[]::text[]),
  'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet')
where id='noata-documents'
 and not ('application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'=any(coalesce(allowed_mime_types,array[]::text[])));
