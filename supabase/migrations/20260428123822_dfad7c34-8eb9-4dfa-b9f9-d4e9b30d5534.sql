INSERT INTO public.free_access_users (email, expires_at, updated_at)
VALUES ('b5lavagemautomotivasls@gmail.com', now() + interval '32 days', now())
ON CONFLICT (email) DO UPDATE
SET expires_at = now() + interval '32 days', updated_at = now();