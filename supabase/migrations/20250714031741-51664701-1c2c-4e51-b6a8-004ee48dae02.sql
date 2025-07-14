-- Verificar se a função sugerir_categoria existe e funcionando corretamente
-- Se não existir, será criada

CREATE OR REPLACE FUNCTION public.sugerir_categoria(descricao_input text)
RETURNS text
LANGUAGE plpgsql
AS $function$
begin
  -- Converter descrição para minúscula para comparação
  descricao_input := lower(descricao_input);
  
  -- Categorias de Alimentação
  if descricao_input ~ '(mercado|supermercado|padaria|acougue|hortifruti|feira|alimentacao)' then
    return 'Alimentação';
  
  -- Categorias de Transporte
  elsif descricao_input ~ '(uber|99|taxi|combustivel|posto|gasolina|alcool|etanol|transporte|onibus|metro)' then
    return 'Transporte';
  
  -- Categorias de Delivery/Alimentação Externa
  elsif descricao_input ~ '(ifood|rappi|delivery|pizza|restaurante|lanchonete)' then
    return 'Delivery';
  
  -- Categorias de Saúde
  elsif descricao_input ~ '(farmacia|drogaria|clinica|hospital|medico|consulta|exame)' then
    return 'Saúde';
  
  -- Categorias de Educação
  elsif descricao_input ~ '(escola|faculdade|universidade|curso|livro|material escolar)' then
    return 'Educação';
  
  -- Categorias de Serviços
  elsif descricao_input ~ '(energia|luz|agua|gas|telefone|internet|celular|tim|vivo|claro|oi)' then
    return 'Utilidades';
  
  -- Categorias de Lazer
  elsif descricao_input ~ '(cinema|teatro|show|festa|bar|balada|streaming|netflix|spotify)' then
    return 'Lazer';
  
  -- Categorias de Compras
  elsif descricao_input ~ '(shopping|loja|magazine|americanas|extra|casas bahia)' then
    return 'Compras';
  
  -- Default
  else
    return 'Outros';
  end if;
end;
$function$;

-- Atualizar função de timestamp para usar NOW() ao invés de CURRENT_TIMESTAMP
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS trigger
LANGUAGE plpgsql
AS $function$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$function$;