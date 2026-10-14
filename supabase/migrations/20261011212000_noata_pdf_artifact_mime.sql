-- Genesis 3.0: allow actual PDF artifacts without altering any other bucket.
-- Additive and rollback-safe; applied only to approved staging until release gates.
update storage.buckets
set allowed_mime_types = coalesce(allowed_mime_types,array[]::text[]) || array['application/pdf']::text[]
where id='noata-ai-artifacts'
  and not ('application/pdf'=any(coalesce(allowed_mime_types,array[]::text[])));
