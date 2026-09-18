INSERT INTO public.free_access_users (email, expires_at)
SELECT email, NULL::timestamptz
FROM auth.users
WHERE email IN ('contato.umbucajadigital@gmail.com', 'mreventosfinanceiro@gmail.com')
ON CONFLICT (email) DO UPDATE SET expires_at = NULL, updated_at = now();