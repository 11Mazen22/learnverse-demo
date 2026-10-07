insert into storage.buckets(id,name,public,file_size_limit,allowed_mime_types)
values(
  'noata-uploads','noata-uploads',false,10485760,
  array['image/jpeg','image/png','image/webp','audio/mpeg','audio/wav','audio/x-wav','audio/mp4','audio/ogg','audio/webm']
)
on conflict(id) do update set
  public=false,
  file_size_limit=excluded.file_size_limit,
  allowed_mime_types=excluded.allowed_mime_types;

insert into storage.buckets(id,name,public,file_size_limit,allowed_mime_types)
values(
  'noata-generated','noata-generated',false,15728640,
  array['image/png','image/jpeg','audio/mpeg','audio/wav']
)
on conflict(id) do update set
  public=false,
  file_size_limit=excluded.file_size_limit,
  allowed_mime_types=excluded.allowed_mime_types;

create policy "uploads own read"
on storage.objects for select to authenticated
using(bucket_id='noata-uploads' and (storage.foldername(name))[1]=auth.uid()::text);

create policy "uploads own insert"
on storage.objects for insert to authenticated
with check(bucket_id='noata-uploads' and (storage.foldername(name))[1]=auth.uid()::text);

create policy "uploads own delete"
on storage.objects for delete to authenticated
using(bucket_id='noata-uploads' and (storage.foldername(name))[1]=auth.uid()::text);

create policy "generated own read"
on storage.objects for select to authenticated
using(bucket_id='noata-generated' and (storage.foldername(name))[1]=auth.uid()::text);

create policy "generated own delete"
on storage.objects for delete to authenticated
using(bucket_id='noata-generated' and (storage.foldername(name))[1]=auth.uid()::text);
