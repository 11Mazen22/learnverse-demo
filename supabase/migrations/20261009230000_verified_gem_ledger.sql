-- Noata verified Gems: additive staging-only currency backed by immutable ledger.
-- All awards are earned from server-validated, unassisted lesson mastery.
-- Never accept GEM balances or grant requests from browser or Fanar prompts.
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS gems bigint NOT NULL DEFAULT 0;
DO $$
BEGIN
 IF NOT EXISTS (
  SELECT 1 FROM pg_constraint
  WHERE conrelid='public.profiles'::regclass AND conname='profiles_gems_check'
 ) THEN
  ALTER TABLE public.profiles ADD CONSTRAINT profiles_gems_check CHECK (gems >= 0);
 END IF;
END $$;
-- Replace the non-data currency CHECK atomically inside this migration.
ALTER TABLE public.ledger DROP CONSTRAINT ledger_currency_check;
ALTER TABLE public.ledger ADD CONSTRAINT ledger_currency_check
 CHECK (currency IN ('XP','COIN','GEM'));

CREATE OR REPLACE FUNCTION private.apply_ledger_to_profile()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path = ''
AS $$
BEGIN
 IF NEW.currency='XP' THEN
   UPDATE public.profiles SET xp=xp+NEW.amount, updated_at=now()
   WHERE id=NEW.user_id;
 ELSIF NEW.currency='COIN' THEN
   UPDATE public.profiles SET coins=coins+NEW.amount, updated_at=now()
   WHERE id=NEW.user_id;
 ELSIF NEW.currency='GEM' THEN
   UPDATE public.profiles SET gems=gems+NEW.amount, updated_at=now()
   WHERE id=NEW.user_id;
 END IF;
 RETURN NEW;
END;
$$;

-- Session-authenticated callers cannot INSERT lesson_progress, attempts,
-- or ledger. This trigger executes only when the verified RPC commits
-- progress, then independently checks actual question/attempt evidence.
CREATE OR REPLACE FUNCTION private.award_verified_lesson_gems()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path = ''
AS $$
DECLARE
 v_required integer;
 v_verified integer;
BEGIN
 IF NEW.completed_at IS NULL OR NEW.best_score < 90 THEN
   RETURN NEW;
 END IF;

 SELECT COUNT(*), COUNT(*) FILTER (
   WHERE EXISTS (
      SELECT 1
      FROM public.attempts a
      LEFT JOIN public.questions variant ON variant.id=a.question_id
      WHERE a.user_id=NEW.user_id
        AND a.correct IS TRUE
        AND a.assisted IS FALSE
        AND a.practice_repeat IS FALSE
        AND (a.question_id=q.id OR variant.variant_of=q.id)
   )
 ) INTO v_required, v_verified
 FROM public.questions q
 WHERE q.lesson_id=NEW.lesson_id
   AND q.variant_of IS NULL
   AND q.publication_status IN ('published','published_demo');

 IF v_required=0 OR v_verified<>v_required THEN
   RETURN NEW;
 END IF;

 INSERT INTO public.ledger(user_id,currency,amount,reason,reference_type,reference_id,idempotency_key)
 VALUES(NEW.user_id,'GEM',5,'VERIFIED_LESSON_MASTERY','lesson',NEW.lesson_id,
        'verified-mastery-gem:'||NEW.lesson_id)
 ON CONFLICT(user_id,currency,idempotency_key) DO NOTHING;

 IF NEW.best_score=100 THEN
   INSERT INTO public.ledger(user_id,currency,amount,reason,reference_type,reference_id,idempotency_key)
   VALUES(NEW.user_id,'GEM',3,'PERFECT_LESSON','lesson',NEW.lesson_id,
          'perfect-lesson-gem:'||NEW.lesson_id)
   ON CONFLICT(user_id,currency,idempotency_key) DO NOTHING;
 END IF;

 RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS lesson_progress_verified_gems ON public.lesson_progress;
CREATE TRIGGER lesson_progress_verified_gems
AFTER INSERT OR UPDATE OF completed_at,best_score ON public.lesson_progress
FOR EACH ROW EXECUTE FUNCTION private.award_verified_lesson_gems();
REVOKE ALL ON FUNCTION private.award_verified_lesson_gems() FROM PUBLIC,anon,authenticated;
-- Authenticated clients retain only read access to Gems and their ledger.
REVOKE UPDATE (gems) ON public.profiles FROM authenticated;
COMMENT ON COLUMN public.profiles.gems IS
 'Ledger-backed earned Gems; 5 for verified unassisted >=90% lesson mastery, plus 3 for 100%. Not client-writable.';
