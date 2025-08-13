-- Security Fix 1: Update the update_updated_at_column function to be SECURITY DEFINER with proper search_path
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $function$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$function$;

-- Security Fix 2: Make user_id NOT NULL in transacoes_conciliadas
-- First, delete any orphaned records with null user_id (they're security risks)
DELETE FROM public.transacoes_conciliadas WHERE user_id IS NULL;

-- Now make user_id NOT NULL
ALTER TABLE public.transacoes_conciliadas 
ALTER COLUMN user_id SET NOT NULL;

-- Security Fix 3: Add trigger for automatic password history cleanup
DROP TRIGGER IF EXISTS trigger_cleanup_password_history ON public.password_history;
CREATE TRIGGER trigger_cleanup_password_history
  AFTER INSERT ON public.password_history
  FOR EACH ROW
  EXECUTE FUNCTION public.cleanup_password_history();