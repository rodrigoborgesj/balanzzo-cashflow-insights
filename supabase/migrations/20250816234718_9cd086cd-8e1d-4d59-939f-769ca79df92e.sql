-- Clean up duplicate RLS policies on profiles table
-- Remove the duplicate Portuguese SELECT policy, keeping the English one
DROP POLICY IF EXISTS "Acesso ao próprio perfil" ON public.profiles;

-- Verify we still have proper RLS coverage:
-- 1. Users can view their own profile (SELECT) ✓ - already exists
-- 2. Users can insert their own profile (INSERT) ✓ - already exists  
-- 3. Users can update their own profile (UPDATE) ✓ - already exists
-- 4. Users cannot delete profiles (DELETE) ✓ - no policy = no access

-- Add explicit comment for clarity
COMMENT ON TABLE public.profiles IS 'User profiles with RLS protecting personal data - users can only access their own profile data';