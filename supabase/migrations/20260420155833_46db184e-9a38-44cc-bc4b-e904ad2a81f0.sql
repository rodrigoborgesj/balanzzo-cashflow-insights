UPDATE public.free_access_users
SET expires_at = now() + interval '7 days', updated_at = now()
WHERE LOWER(TRIM(email)) = 'atrosa9@icloud.com';