begin;
-- The owner-scoped metadata probe is used only by signed-in Storage policies.
revoke execute on function public.noata_document_object_exists(text) from public, anon;
grant execute on function public.noata_document_object_exists(text) to authenticated;
commit;
