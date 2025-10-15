-- Fix Security Definer View Issue
-- Remove SECURITY DEFINER from public_subscription_plans view
-- This view exposes subscription plans and should use SECURITY INVOKER for proper RLS enforcement

DROP VIEW IF EXISTS public.public_subscription_plans;

CREATE VIEW public.public_subscription_plans 
WITH (security_invoker = true) AS
SELECT 
  id,
  name,
  price_cents,
  billing_cycle,
  features
FROM public.subscription_plans
WHERE active = true;

-- Add comment explaining the security decision
COMMENT ON VIEW public.public_subscription_plans IS 
'Public view for active subscription plans. Uses SECURITY INVOKER to enforce RLS policies properly.';

-- Enable RLS on the underlying table if not already enabled
ALTER TABLE public.subscription_plans ENABLE ROW LEVEL SECURITY;

-- Ensure authenticated users can view active plans
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE schemaname = 'public' 
    AND tablename = 'subscription_plans' 
    AND policyname = 'Authenticated users can view active subscription plans'
  ) THEN
    -- Policy already exists, no action needed
    NULL;
  END IF;
END $$;