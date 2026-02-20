INSERT INTO public.free_access_users (email, expires_at)
VALUES ('iziellesantos@gmail.com', now() + interval '30 days')
ON CONFLICT (email) DO UPDATE SET expires_at = now() + interval '30 days', updated_at = now();