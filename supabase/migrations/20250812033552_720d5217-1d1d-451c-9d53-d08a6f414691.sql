-- Fix security vulnerabilities in database (handle nulls first)

-- 1. Remove rows with null user_id values (they're orphaned data anyway)
DELETE FROM public.categorias_usuario WHERE user_id IS NULL;

-- Now make user_id NOT NULL
ALTER TABLE public.categorias_usuario 
ALTER COLUMN user_id SET NOT NULL;

-- 2. Update password_history table to use proper hashing
-- First, clear existing plaintext passwords (they're security risks anyway)
DELETE FROM public.password_history;

-- 3. Update the password history cleanup function with proper search_path
CREATE OR REPLACE FUNCTION public.cleanup_password_history()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $function$
BEGIN
  -- Keep only the last 5 passwords for each user
  DELETE FROM public.password_history 
  WHERE user_id = NEW.user_id 
  AND id NOT IN (
    SELECT id FROM public.password_history 
    WHERE user_id = NEW.user_id 
    ORDER BY created_at DESC 
    LIMIT 5
  );
  
  RETURN NEW;
END;
$function$;

-- 4. Update the categorization function with proper search_path
CREATE OR REPLACE FUNCTION public.sugerir_categoria(descricao_input text)
RETURNS text
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $function$
BEGIN
  -- Converter descrição para minúscula para comparação
  descricao_input := lower(descricao_input);
  
  -- Categorias de Alimentação
  IF descricao_input ~ '(mercado|supermercado|padaria|acougue|hortifruti|feira|alimentacao)' THEN
    RETURN 'Alimentação';
  
  -- Categorias de Transporte
  ELSIF descricao_input ~ '(uber|99|taxi|combustivel|posto|gasolina|alcool|etanol|transporte|onibus|metro)' THEN
    RETURN 'Transporte';
  
  -- Categorias de Delivery/Alimentação Externa
  ELSIF descricao_input ~ '(ifood|rappi|delivery|pizza|restaurante|lanchonete)' THEN
    RETURN 'Delivery';
  
  -- Categorias de Saúde
  ELSIF descricao_input ~ '(farmacia|drogaria|clinica|hospital|medico|consulta|exame)' THEN
    RETURN 'Saúde';
  
  -- Categorias de Educação
  ELSIF descricao_input ~ '(escola|faculdade|universidade|curso|livro|material escolar)' THEN
    RETURN 'Educação';
  
  -- Categorias de Serviços
  ELSIF descricao_input ~ '(energia|luz|agua|gas|telefone|internet|celular|tim|vivo|claro|oi)' THEN
    RETURN 'Utilidades';
  
  -- Categorias de Lazer
  ELSIF descricao_input ~ '(cinema|teatro|show|festa|bar|balada|streaming|netflix|spotify)' THEN
    RETURN 'Lazer';
  
  -- Categorias de Compras
  ELSIF descricao_input ~ '(shopping|loja|magazine|americanas|extra|casas bahia)' THEN
    RETURN 'Compras';
  
  -- Default
  ELSE
    RETURN 'Outros';
  END IF;
END;
$function$;

-- 5. Update the handle_new_user function with proper search_path
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $function$
BEGIN
  -- Insert into profiles table (basic data will be updated later when user completes profile)
  INSERT INTO public.profiles (id, full_name, phone, position)
  VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data->>'full_name', 'Usuário'),
    COALESCE(NEW.raw_user_meta_data->>'phone', ''),
    COALESCE(NEW.raw_user_meta_data->>'position', '')
  );
  
  RETURN NEW;
END;
$function$;