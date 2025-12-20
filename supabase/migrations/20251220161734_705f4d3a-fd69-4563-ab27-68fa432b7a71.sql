-- Adicionar usuário ao acesso gratuito
INSERT INTO public.free_access_users (email)
VALUES ('rodrigoborgesjcontato@gmail.com')
ON CONFLICT (email) DO NOTHING;