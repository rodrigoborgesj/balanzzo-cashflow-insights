-- Create functions to access subscription data since the tables are not in types.ts
CREATE OR REPLACE FUNCTION public.get_user_subscription(p_user_id uuid)
RETURNS TABLE (
  id uuid,
  user_id uuid,
  plan_id uuid,
  status text,
  current_period_start timestamptz,
  current_period_end timestamptz,
  cancel_at_period_end boolean,
  pagarme_subscription_id text,
  created_at timestamptz,
  updated_at timestamptz
)
LANGUAGE sql
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT 
    s.id,
    s.user_id,
    s.plan_id,
    s.status,
    s.current_period_start,
    s.current_period_end,
    s.cancel_at_period_end,
    s.pagarme_subscription_id,
    s.created_at,
    s.updated_at
  FROM subscriptions s
  WHERE s.user_id = p_user_id
  ORDER BY s.created_at DESC;
$$;

CREATE OR REPLACE FUNCTION public.get_subscription_plans()
RETURNS TABLE (
  id uuid,
  name text,
  price_cents integer,
  billing_cycle text,
  features jsonb,
  active boolean
)
LANGUAGE sql
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT 
    sp.id,
    sp.name,
    sp.price_cents,
    sp.billing_cycle,
    sp.features,
    sp.active
  FROM subscription_plans sp
  WHERE sp.active = true
  ORDER BY sp.price_cents ASC;
$$;