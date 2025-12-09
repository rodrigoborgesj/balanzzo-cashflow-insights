
-- Remover Luciana Lima do Carmo da lista de acesso livre
DELETE FROM public.free_access_users 
WHERE LOWER(TRIM(email)) = LOWER(TRIM('lucianalimacarmo2@gmail.com'));
