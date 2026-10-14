-- Staging safety: user_settings.active_design_id must refer to a design
-- belonging to that same account, even if a malicious client guesses a UUID.
-- Transactional additive keys; no row deletions or production modifications.
ALTER TABLE public.user_theme_designs
  ADD CONSTRAINT user_theme_designs_id_owner_key UNIQUE(id,user_id);
ALTER TABLE public.user_settings
  ADD CONSTRAINT user_settings_active_design_owner_fkey
  FOREIGN KEY(active_design_id,user_id)
  REFERENCES public.user_theme_designs(id,user_id)
  ON DELETE SET NULL(active_design_id);
COMMENT ON CONSTRAINT user_settings_active_design_owner_fkey ON public.user_settings
 IS 'A user cannot point their active design preference at another account custom palette.';
