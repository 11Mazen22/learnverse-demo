-- AI Design Studio, account-isolated and additive. Already applied to the
-- authorized Noata staging project; kept in source control for review and
-- reproducible fresh environments. No production operation is implied.
CREATE TABLE IF NOT EXISTS public.user_theme_designs (
 id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
 user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
 name text NOT NULL CHECK (char_length(name) BETWEEN 2 AND 50),
 description text NOT NULL DEFAULT '' CHECK (char_length(description)<=180),
 tokens jsonb NOT NULL CHECK (jsonb_typeof(tokens)='object' AND pg_column_size(tokens)<2500),
 visible boolean NOT NULL DEFAULT true,
 created_at timestamptz NOT NULL DEFAULT now(),
 updated_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_user_theme_designs_owner_created ON public.user_theme_designs(user_id,created_at DESC);
ALTER TABLE public.user_theme_designs ENABLE ROW LEVEL SECURITY;
DO $$
BEGIN
 IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE schemaname='public' AND tablename='user_theme_designs' AND policyname='design own read') THEN
  CREATE POLICY "design own read" ON public.user_theme_designs FOR SELECT TO authenticated
   USING (user_id=(SELECT auth.uid()));
 END IF;
 IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE schemaname='public' AND tablename='user_theme_designs' AND policyname='design own insert') THEN
  CREATE POLICY "design own insert" ON public.user_theme_designs FOR INSERT TO authenticated
   WITH CHECK (user_id=(SELECT auth.uid()));
 END IF;
 IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE schemaname='public' AND tablename='user_theme_designs' AND policyname='design own update') THEN
  CREATE POLICY "design own update" ON public.user_theme_designs FOR UPDATE TO authenticated
   USING (user_id=(SELECT auth.uid())) WITH CHECK (user_id=(SELECT auth.uid()));
 END IF;
 IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE schemaname='public' AND tablename='user_theme_designs' AND policyname='design own delete') THEN
  CREATE POLICY "design own delete" ON public.user_theme_designs FOR DELETE TO authenticated
   USING (user_id=(SELECT auth.uid()));
 END IF;
END $$;
REVOKE ALL ON public.user_theme_designs FROM anon;
GRANT SELECT,INSERT,UPDATE,DELETE ON public.user_theme_designs TO authenticated;
ALTER TABLE public.user_settings ADD COLUMN IF NOT EXISTS active_design_id uuid
 REFERENCES public.user_theme_designs(id) ON DELETE SET NULL;
COMMENT ON TABLE public.user_theme_designs IS 'Authenticated user-owned palette suggestions; only validated color tokens are applied to CSS by trusted client code. Never execute AI-generated CSS or HTML.';
