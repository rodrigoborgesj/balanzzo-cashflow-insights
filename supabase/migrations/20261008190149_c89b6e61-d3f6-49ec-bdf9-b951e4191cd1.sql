CREATE OR REPLACE FUNCTION public.calculate_personal_savings_monthly_amount()
RETURNS trigger LANGUAGE plpgsql SET search_path = public AS $$
DECLARE
  deposited numeric := 0;
  last_month date;
  elapsed_months integer := 0;
  remaining_months integer;
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
  SELECT COALESCE(SUM(amount), 0), MAX(reference_month)
    INTO deposited, last_month
    FROM public.personal_savings_contributions
    WHERE goal_id = NEW.id AND user_id = NEW.user_id
      AND status IN ('completed', 'late');
  IF last_month IS NOT NULL THEN
    elapsed_months := GREATEST(0,
      (EXTRACT(YEAR FROM last_month)::integer - EXTRACT(YEAR FROM NEW.start_date)::integer) * 12
      + EXTRACT(MONTH FROM last_month)::integer - EXTRACT(MONTH FROM NEW.start_date)::integer + 1);
  END IF;
  remaining_months := GREATEST(1, NEW.timeframe_months - elapsed_months);
  NEW.monthly_amount := ROUND(GREATEST(0, NEW.total_target_amount - NEW.initial_saved_amount - deposited) / remaining_months, 2);
  RETURN NEW;
END;
$$;

CREATE OR REPLACE FUNCTION public.refresh_savings_goal_after_contribution()
RETURNS trigger LANGUAGE plpgsql SET search_path = public AS $$
BEGIN
  IF TG_OP IN ('UPDATE', 'DELETE') THEN
    UPDATE public.personal_savings_goals SET updated_at = now()
      WHERE id = OLD.goal_id AND user_id = OLD.user_id;
  END IF;
  IF TG_OP = 'INSERT' THEN
    UPDATE public.personal_savings_goals SET updated_at = now()
      WHERE id = NEW.goal_id AND user_id = NEW.user_id;
  ELSIF TG_OP = 'UPDATE' AND (NEW.goal_id IS DISTINCT FROM OLD.goal_id OR NEW.user_id IS DISTINCT FROM OLD.user_id) THEN
    UPDATE public.personal_savings_goals SET updated_at = now()
      WHERE id = NEW.goal_id AND user_id = NEW.user_id;
  END IF;
  RETURN NULL;
END;
$$;

CREATE TRIGGER refresh_savings_goal_after_contribution
AFTER INSERT OR UPDATE OR DELETE ON public.personal_savings_contributions
FOR EACH ROW EXECUTE FUNCTION public.refresh_savings_goal_after_contribution();