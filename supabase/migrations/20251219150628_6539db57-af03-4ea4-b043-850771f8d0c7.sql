-- Remove free access for user rodrigoborgesjcontato@gmail.com
DELETE FROM public.free_access_users 
WHERE LOWER(email) = LOWER('rodrigoborgesjcontato@gmail.com');