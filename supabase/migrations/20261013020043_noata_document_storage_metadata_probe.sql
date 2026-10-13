-- Storage's permission probe supplies contentLength; finalized objects supply size.
-- Preserve owner, conversation, MIME and exact byte quota enforcement at both checks.
alter policy "private document insert" on storage.objects with check(
 bucket_id='noata-documents' and (storage.foldername(name))[1]=(select auth.uid())::text
 and exists(select 1 from public.ai_document_files d where d.storage_path=name and d.user_id=(select auth.uid()) and d.expires_at>now()
  and d.mime_type=metadata->>'mimetype'
  and d.size_bytes=coalesce((metadata->>'size')::bigint,(metadata->>'contentLength')::bigint)
  and exists(select 1 from public.ai_conversations c where c.id=d.conversation_id and c.user_id=(select auth.uid())))
);
