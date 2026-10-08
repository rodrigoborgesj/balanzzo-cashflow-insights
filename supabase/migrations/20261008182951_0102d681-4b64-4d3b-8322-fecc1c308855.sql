ALTER TABLE public.personal_savings_goals ADD COLUMN initial_saved_amount numeric NOT NULL DEFAULT 0;
ALTER TABLE public.personal_savings_goals ALTER COLUMN monthly_amount DROP EXPRESSION;
CREATE OR REPLACE FUNCTION public.calculate_personal_savings_monthly_amount()
RETURNS trigger LANGUAGE plpgsql SET search_path = public AS $$
BEGIN
  IF NEW.total_target_amount IS NULL OR NEW.total_target_amount <= 0 THEN
    RAISE EXCEPTION 'O valor da meta deve ser maior que zero';
  END IF;
  IF NEW.initial_saved_amount IS NULL OR NEW.initial_saved_amount < 0 THEN
    RAISE EXCEPTION 'O valor já guardado não pode ser negativo';
  END IF;
  IF NEW.timeframe_months IS NULL OR NEW.timeframe_months <= 0 THEN
    RAISE EXCEPTION 'O prazo deve ser maior que zero';
  END IF;
  NEW.monthly_amount := ROUND(GREATEST(0, NEW.total_target_amount - NEW.initial_saved_amount) / NEW.timeframe_months, 2);
  RETURN NEW;
END;
$$;
CREATE TRIGGER calculate_personal_savings_monthly_amount
BEFORE INSERT OR UPDATE ON public.personal_savings_goals
FOR EACH ROW EXECUTE FUNCTION public.calculate_personal_savings_monthly_amount();