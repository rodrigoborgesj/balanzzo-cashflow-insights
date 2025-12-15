
-- Insert free access for Eduarda Lopes
INSERT INTO public.free_access_users (email) 
VALUES 
  ('eduardalopes.especialista@gmail.com'),
  ('lopsduda@gmail.com')
ON CONFLICT (email) DO NOTHING;
