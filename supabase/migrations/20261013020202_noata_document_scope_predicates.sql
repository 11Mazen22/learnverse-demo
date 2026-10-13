-- Outer storage columns must be qualified: ai_document_files also has a name column.
alter policy "private document insert" on storage.objects with check(
 bucket_id='noata-documents' and (storage.foldername(objects.name))[1]=(select auth.uid())::text
 and exists(select 1 from public.ai_document_files d where d.storage_path=objects.name and d.user_id=(select auth.uid()) and d.expires_at>now()
  and d.mime_type=objects.metadata->>'mimetype'
  and d.size_bytes=coalesce((objects.metadata->>'size')::bigint,(objects.metadata->>'contentLength')::bigint)
  and exists(select 1 from public.ai_conversations c where c.id=d.conversation_id and c.user_id=(select auth.uid())))
);
alter policy "private document read before expiry" on storage.objects using(
 bucket_id='noata-documents' and exists(select 1 from public.ai_document_files d
 where d.storage_path=objects.name and d.user_id=(select auth.uid()) and d.expires_at>now()
 and exists(select 1 from public.ai_conversations c where c.id=d.conversation_id and c.user_id=(select auth.uid()))))
;
