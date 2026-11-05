-- Noata foreign-key covering indexes.
--
-- Addresses every "unindexed foreign keys" performance-advisor finding for the
-- public schema (2026-11-05 advisor snapshot):
--
--   ai_artifacts.artifact_document_owner (source_document_id, user_id)
--   ai_artifacts.artifact_own_project    (project_id, user_id)
--   ai_artifacts.artifact_parent_owner   (parent_artifact_id, user_id)
--   ai_document_files.user_id
--   curriculum_tracks.course_id
--   flashcards.deck_id,user_id
--   user_settings.active_design_id
--   user_settings.active_design_id,user_id
--
-- Each index places the foreign-key columns first so referential-integrity
-- lookups (and owner-scoped reads) can use a direct index scan. The
-- user_settings composite covers both active-design constraints with one
-- index; ai_document_files keeps expires_at in the index because the quota
-- trigger scans per owner.

create index if not exists ai_artifacts_document_owner_idx
  on public.ai_artifacts (source_document_id, user_id);

create index if not exists ai_artifacts_own_project_idx
  on public.ai_artifacts (project_id, user_id);

create index if not exists ai_artifacts_parent_owner_idx
  on public.ai_artifacts (parent_artifact_id, user_id);

create index if not exists ai_document_files_user_recent_idx
  on public.ai_document_files (user_id, expires_at);

create index if not exists curriculum_tracks_course_idx
  on public.curriculum_tracks (course_id);

create index if not exists flashcards_owner_deck_idx
  on public.flashcards (deck_id, user_id);

create index if not exists user_settings_active_design_idx
  on public.user_settings (active_design_id, user_id);
