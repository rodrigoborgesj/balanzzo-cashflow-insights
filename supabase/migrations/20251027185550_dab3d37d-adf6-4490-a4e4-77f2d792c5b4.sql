-- Remove trigger incorreto da tabela auth.users (não podemos modificar schemas reservados)
DROP TRIGGER IF EXISTS on_user_created_send_welcome ON auth.users;

-- Criar trigger na tabela profiles (que é criada quando um novo usuário é inserido)
-- Este trigger vai inserir um registro de email pendente quando um perfil é criado
CREATE OR REPLACE FUNCTION public.trigger_welcome_email_on_profile()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  user_email TEXT;
BEGIN
  -- Buscar o email do usuário na tabela auth.users
  SELECT email INTO user_email
  FROM auth.users
  WHERE id = NEW.id;
  
  -- Verificar se já existe um log de email de boas-vindas para este usuário
  IF NOT EXISTS (
    SELECT 1 FROM public.email_logs 
    WHERE user_id = NEW.id AND (email_type = 'welcome' OR email_type = 'welcome_pending')
  ) THEN
    -- Inserir um registro pendente para disparar o envio do email
    INSERT INTO public.email_logs (user_id, email_type, email_address, success)
    VALUES (NEW.id, 'welcome_pending', user_email, false);
  END IF;
  
  RETURN NEW;
END;
$$;

-- Criar trigger na tabela profiles
DROP TRIGGER IF EXISTS on_profile_created_send_welcome ON public.profiles;
CREATE TRIGGER on_profile_created_send_welcome
  AFTER INSERT ON public.profiles
  FOR EACH ROW 
  EXECUTE FUNCTION public.trigger_welcome_email_on_profile();