-- Security Fix: Strengthen RLS policies for profiles table
-- Drop existing policies that are too permissive
DROP POLICY IF EXISTS "Users can insert their own profile" ON public.profiles;
DROP POLICY IF EXISTS "Users can update their own profile" ON public.profiles;
DROP POLICY IF EXISTS "Users can view their own profile" ON public.profiles;

-- Create new restrictive policies that only apply to authenticated users
-- and ensure complete isolation of user data

-- Policy for SELECT: Only authenticated users can view their own profile
CREATE POLICY "authenticated_users_view_own_profile" 
ON public.profiles 
FOR SELECT 
TO authenticated 
USING (auth.uid() = id);

-- Policy for INSERT: Only authenticated users can create their own profile
CREATE POLICY "authenticated_users_insert_own_profile" 
ON public.profiles 
FOR INSERT 
TO authenticated 
WITH CHECK (auth.uid() = id);

-- Policy for UPDATE: Only authenticated users can update their own profile
CREATE POLICY "authenticated_users_update_own_profile" 
ON public.profiles 
FOR UPDATE 
TO authenticated 
USING (auth.uid() = id)
WITH CHECK (auth.uid() = id);

-- Policy for DELETE: Only authenticated users can delete their own profile
CREATE POLICY "authenticated_users_delete_own_profile" 
ON public.profiles 
FOR DELETE 
TO authenticated 
USING (auth.uid() = id);

-- Ensure no access for anonymous/service role users
CREATE POLICY "deny_anonymous_access" 
ON public.profiles 
FOR ALL 
TO anon, service_role 
USING (false);

-- Add comment for security documentation
COMMENT ON TABLE public.profiles IS 'User profiles with enhanced RLS security - only authenticated users can access their own data';