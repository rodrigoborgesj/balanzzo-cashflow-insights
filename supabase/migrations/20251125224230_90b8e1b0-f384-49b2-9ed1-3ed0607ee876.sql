-- Create table for users with free access
CREATE TABLE IF NOT EXISTS public.free_access_users (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email TEXT NOT NULL UNIQUE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.free_access_users ENABLE ROW LEVEL SECURITY;

-- Policy: Anyone authenticated can check if an email has free access
CREATE POLICY "Anyone can check free access"
ON public.free_access_users
FOR SELECT
TO authenticated
USING (true);

-- Insert existing free access emails
INSERT INTO public.free_access_users (email) VALUES
  ('emerson.ocontador@gmail.com'),
  ('lucianalimacarmo2@gmail.com'),
  ('ellenfarias09@hotmail.com'),
  ('bilu.neto13@gmail.com'),
  ('rodrigoborgesjcontato@gmail.com'),
  ('eduardalopes.especialista@gmail.com')
ON CONFLICT (email) DO NOTHING;

-- Create function to check if user has free access
CREATE OR REPLACE FUNCTION public.has_free_access(user_email TEXT)
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.free_access_users
    WHERE LOWER(TRIM(email)) = LOWER(TRIM(user_email))
  );
$$;

-- Create trigger to update updated_at
CREATE TRIGGER update_free_access_users_updated_at
BEFORE UPDATE ON public.free_access_users
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();