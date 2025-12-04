-- Adicionar coluna de expiração para acesso temporário
ALTER TABLE public.free_access_users 
ADD COLUMN expires_at timestamp with time zone DEFAULT NULL;

-- Atualizar função para verificar expiração
CREATE OR REPLACE FUNCTION public.has_free_access(user_email text)
 RETURNS boolean
 LANGUAGE sql
 STABLE SECURITY DEFINER
 SET search_path TO 'public'
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.free_access_users
    WHERE LOWER(TRIM(email)) = LOWER(TRIM(user_email))
    AND (expires_at IS NULL OR expires_at > now())
  );
$$;

-- Inserir Fernanda Hikari com acesso por 7 dias
INSERT INTO public.free_access_users (email, expires_at)
VALUES ('feehikari@gmail.com', now() + interval '7 days');