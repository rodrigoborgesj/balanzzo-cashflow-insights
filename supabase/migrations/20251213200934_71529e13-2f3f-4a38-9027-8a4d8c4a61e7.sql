-- Grant free access to test user rodrigoborgesjcontato@gmail.com
INSERT INTO public.free_access_users (email, expires_at)
SELECT 'rodrigoborgesjcontato@gmail.com', NULL
WHERE NOT EXISTS (
  SELECT 1 FROM public.free_access_users 
  WHERE LOWER(TRIM(email)) = LOWER(TRIM('rodrigoborgesjcontato@gmail.com'))
);
