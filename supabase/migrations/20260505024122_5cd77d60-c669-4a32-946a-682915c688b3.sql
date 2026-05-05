
CREATE TABLE public.coupons (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  code text NOT NULL UNIQUE,
  plan_id uuid REFERENCES public.subscription_plans(id) ON DELETE CASCADE,
  final_price_cents integer NOT NULL,
  active boolean NOT NULL DEFAULT true,
  expires_at timestamptz,
  max_uses integer,
  uses_count integer NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.coupons ENABLE ROW LEVEL SECURITY;

CREATE POLICY "deny_all_coupons" ON public.coupons FOR ALL USING (false) WITH CHECK (false);

CREATE OR REPLACE FUNCTION public.validate_coupon(p_code text, p_plan_id uuid)
RETURNS TABLE(valid boolean, final_price_cents integer, original_price_cents integer, discount_cents integer, message text)
LANGUAGE plpgsql
STABLE SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_coupon public.coupons%ROWTYPE;
  v_plan public.subscription_plans%ROWTYPE;
BEGIN
  SELECT * INTO v_plan FROM public.subscription_plans WHERE id = p_plan_id AND active = true;
  IF NOT FOUND THEN
    RETURN QUERY SELECT false, 0, 0, 0, 'Plano não encontrado'::text;
    RETURN;
  END IF;

  SELECT * INTO v_coupon FROM public.coupons WHERE LOWER(TRIM(code)) = LOWER(TRIM(p_code));
  IF NOT FOUND THEN
    RETURN QUERY SELECT false, v_plan.price_cents, v_plan.price_cents, 0, 'Cupom inválido'::text;
    RETURN;
  END IF;

  IF NOT v_coupon.active THEN
    RETURN QUERY SELECT false, v_plan.price_cents, v_plan.price_cents, 0, 'Cupom inativo'::text;
    RETURN;
  END IF;

  IF v_coupon.expires_at IS NOT NULL AND v_coupon.expires_at < now() THEN
    RETURN QUERY SELECT false, v_plan.price_cents, v_plan.price_cents, 0, 'Cupom expirado'::text;
    RETURN;
  END IF;

  IF v_coupon.max_uses IS NOT NULL AND v_coupon.uses_count >= v_coupon.max_uses THEN
    RETURN QUERY SELECT false, v_plan.price_cents, v_plan.price_cents, 0, 'Cupom esgotado'::text;
    RETURN;
  END IF;

  IF v_coupon.plan_id IS NOT NULL AND v_coupon.plan_id <> p_plan_id THEN
    RETURN QUERY SELECT false, v_plan.price_cents, v_plan.price_cents, 0, 'Cupom não válido para este plano'::text;
    RETURN;
  END IF;

  RETURN QUERY SELECT true, v_coupon.final_price_cents, v_plan.price_cents, (v_plan.price_cents - v_coupon.final_price_cents), 'Cupom aplicado com sucesso'::text;
END;
$$;

GRANT EXECUTE ON FUNCTION public.validate_coupon(text, uuid) TO authenticated, anon;

-- Insere os cupons procurando os planos pelo preço atual
INSERT INTO public.coupons (code, plan_id, final_price_cents)
SELECT 'PESSOAL999', id, 999 FROM public.subscription_plans
WHERE subscription_type = 'personal' AND price_cents = 1990 AND active = true
LIMIT 1;

INSERT INTO public.coupons (code, plan_id, final_price_cents)
SELECT 'GESTAO59', id, 5900 FROM public.subscription_plans
WHERE subscription_type = 'company' AND price_cents = 7800 AND active = true
LIMIT 1;
