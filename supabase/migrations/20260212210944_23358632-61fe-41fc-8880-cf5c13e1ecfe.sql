INSERT INTO public.free_access_users (email, expires_at)
VALUES ('thiagoaugustintattoo@gmail.com', now() + interval '7 days')
ON CONFLICT (email) DO UPDATE SET 
  expires_at = now() + interval '7 days',
  updated_at = now();