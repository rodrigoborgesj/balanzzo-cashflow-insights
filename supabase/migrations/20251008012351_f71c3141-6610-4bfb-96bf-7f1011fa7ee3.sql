-- Fix Critical Payment Fraud Vulnerability
-- Drop existing INSERT policy that allows inserting payments for any subscription
DROP POLICY IF EXISTS "Users can insert their own payments" ON public.payments;

-- Create new INSERT policy that validates subscription ownership
CREATE POLICY "Users can only insert payments for their own subscriptions" 
ON public.payments 
FOR INSERT 
TO authenticated
WITH CHECK (
  auth.uid() = user_id 
  AND subscription_id IN (
    SELECT id FROM public.subscriptions WHERE user_id = auth.uid()
  )
);

-- Add UPDATE policy for system-only operations (via service role)
-- Regular users cannot update payment status
CREATE POLICY "Only system can update payment status" 
ON public.payments 
FOR UPDATE 
TO service_role
USING (true)
WITH CHECK (true);

-- Fix Subscription Plans Public Exposure
-- Drop existing public SELECT policy
DROP POLICY IF EXISTS "Anyone can view active subscription plans" ON public.subscription_plans;

-- Create new policy requiring authentication
CREATE POLICY "Authenticated users can view active subscription plans" 
ON public.subscription_plans 
FOR SELECT 
TO authenticated
USING (active = true);

-- Create a public view for unauthenticated landing page access (minimal info only)
CREATE OR REPLACE VIEW public.public_subscription_plans AS
SELECT 
  id,
  name,
  price_cents,
  billing_cycle,
  features
FROM public.subscription_plans
WHERE active = true;

-- Allow public access to the view
GRANT SELECT ON public.public_subscription_plans TO anon;