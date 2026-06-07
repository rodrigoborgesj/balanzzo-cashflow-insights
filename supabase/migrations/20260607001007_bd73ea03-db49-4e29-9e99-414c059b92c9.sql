
-- Auto-grant free access to professionals when invited
CREATE OR REPLACE FUNCTION public.grant_professional_free_access()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  INSERT INTO public.free_access_users (email, expires_at)
  VALUES (LOWER(TRIM(NEW.professional_email)), NULL)
  ON CONFLICT DO NOTHING;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_grant_professional_free_access ON public.professional_access;
CREATE TRIGGER trg_grant_professional_free_access
AFTER INSERT ON public.professional_access
FOR EACH ROW EXECUTE FUNCTION public.grant_professional_free_access();

-- Ensure unique email in free_access_users (needed for ON CONFLICT to work)
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_indexes
    WHERE schemaname='public' AND indexname='free_access_users_email_unique_idx'
  ) THEN
    CREATE UNIQUE INDEX free_access_users_email_unique_idx
      ON public.free_access_users (LOWER(TRIM(email)));
  END IF;
END$$;
