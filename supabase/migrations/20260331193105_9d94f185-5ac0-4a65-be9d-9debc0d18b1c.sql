INSERT INTO public.free_access_users (email, expires_at)
VALUES ('priscillacouto2@hotmail.com', now() + interval '3 days');

UPDATE public.free_access_users
SET expires_at = NULL, updated_at = now()
WHERE LOWER(TRIM(email)) = 'alex_fritsch@hotmail.com';