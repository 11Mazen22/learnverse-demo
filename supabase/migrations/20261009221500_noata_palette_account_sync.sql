-- Staging-only additive migration; keeps color mode theme independent.
-- NULL represents an existing account without a saved color world.
ALTER TABLE public.user_settings ADD COLUMN IF NOT EXISTS palette text;
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_constraint
      WHERE conrelid = 'public.user_settings'::regclass
      AND conname = 'user_settings_palette_check') THEN
    ALTER TABLE public.user_settings ADD CONSTRAINT user_settings_palette_check
    CHECK (palette IS NULL OR palette IN
      ('classic','aura','ocean','forest','sunset','rose','midnight'));
  END IF;
END $$;
COMMENT ON COLUMN public.user_settings.palette IS
  'Optional account-synced visual world. NULL preserves device-local fallback.';
