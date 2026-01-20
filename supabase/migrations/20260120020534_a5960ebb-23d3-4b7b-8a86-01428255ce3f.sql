-- Liberar acesso gratuito para Dessa Silva
INSERT INTO public.free_access_users (email)
VALUES ('dessasilva1622@gmail.com')
ON CONFLICT (email) DO NOTHING;