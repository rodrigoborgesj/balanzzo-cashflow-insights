
-- 1. cost_centers
CREATE TABLE public.cost_centers (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  company_id UUID NULL,
  name TEXT NOT NULL,
  type TEXT NOT NULL CHECK (type IN ('receita','custo')),
  color TEXT NOT NULL DEFAULT '#1A3423',
  is_default BOOLEAN NOT NULL DEFAULT false,
  active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (user_id, name, type)
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.cost_centers TO authenticated;
GRANT ALL ON public.cost_centers TO service_role;
ALTER TABLE public.cost_centers ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users manage own cost_centers" ON public.cost_centers
  FOR ALL USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
CREATE TRIGGER trg_cost_centers_updated BEFORE UPDATE ON public.cost_centers
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- 2. cost_subgroups
CREATE TABLE public.cost_subgroups (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  cost_center_id UUID NOT NULL REFERENCES public.cost_centers(id) ON DELETE CASCADE,
  user_id UUID NOT NULL,
  name TEXT NOT NULL,
  is_default BOOLEAN NOT NULL DEFAULT false,
  active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (cost_center_id, name)
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.cost_subgroups TO authenticated;
GRANT ALL ON public.cost_subgroups TO service_role;
ALTER TABLE public.cost_subgroups ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users manage own cost_subgroups" ON public.cost_subgroups
  FOR ALL USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
CREATE TRIGGER trg_cost_subgroups_updated BEFORE UPDATE ON public.cost_subgroups
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- 3. category_cost_center_map (learned rules)
CREATE TABLE public.category_cost_center_map (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  category_name TEXT NOT NULL,
  cost_center_id UUID NOT NULL REFERENCES public.cost_centers(id) ON DELETE CASCADE,
  cost_subgroup_id UUID NULL REFERENCES public.cost_subgroups(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (user_id, category_name)
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.category_cost_center_map TO authenticated;
GRANT ALL ON public.category_cost_center_map TO service_role;
ALTER TABLE public.category_cost_center_map ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users manage own category map" ON public.category_cost_center_map
  FOR ALL USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
CREATE TRIGGER trg_cat_map_updated BEFORE UPDATE ON public.category_cost_center_map
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- 4. Add cost center columns to existing tables
ALTER TABLE public.fluxo_caixa
  ADD COLUMN cost_center_id UUID NULL REFERENCES public.cost_centers(id) ON DELETE SET NULL,
  ADD COLUMN cost_subgroup_id UUID NULL REFERENCES public.cost_subgroups(id) ON DELETE SET NULL,
  ADD COLUMN cost_center_source TEXT NULL CHECK (cost_center_source IN ('ai','manual','rule'));

ALTER TABLE public.transacoes_conciliadas
  ADD COLUMN cost_center_id UUID NULL REFERENCES public.cost_centers(id) ON DELETE SET NULL,
  ADD COLUMN cost_subgroup_id UUID NULL REFERENCES public.cost_subgroups(id) ON DELETE SET NULL,
  ADD COLUMN cost_center_source TEXT NULL CHECK (cost_center_source IN ('ai','manual','rule'));

CREATE INDEX idx_fluxo_caixa_cost_center ON public.fluxo_caixa(cost_center_id);
CREATE INDEX idx_tc_cost_center ON public.transacoes_conciliadas(cost_center_id);

-- 5. Seed function: creates default centers + subgroups for a user (idempotent)
CREATE OR REPLACE FUNCTION public.seed_default_cost_centers(p_user_id UUID)
RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_id UUID;
  v_rec RECORD;
BEGIN
  -- Centros + subgrupos default
  FOR v_rec IN
    SELECT * FROM (VALUES
      ('Vendas de Produtos','receita','#1A3423', ARRAY[]::TEXT[]),
      ('Prestação de Serviços','receita','#1A3423', ARRAY[]::TEXT[]),
      ('Empréstimos Recebidos','receita','#2D5A3D', ARRAY[]::TEXT[]),
      ('Outras Receitas','receita','#4A7C59', ARRAY['Juros e Rendimentos','Reembolsos']),
      ('Pessoas','custo','#8B4513', ARRAY['Salários','Pró-labore','Benefícios','Encargos']),
      ('Operação','custo','#A0522D', ARRAY['Fornecedores','Insumos','Frete']),
      ('Estrutura','custo','#6B4423', ARRAY['Aluguel','Energia','Internet','Software','Manutenção']),
      ('Comercial & Marketing','custo','#B8860B', ARRAY['Anúncios','Materiais','Comissões']),
      ('Impostos e Tarifas','custo','#5C4033', ARRAY['Impostos','Tarifa Bancária']),
      ('Empréstimos e Financiamentos','custo','#7B3F00', ARRAY['Parcela','Juros']),
      ('Outras Saídas','custo','#696969', ARRAY[]::TEXT[])
    ) AS t(name, type, color, subgroups)
  LOOP
    INSERT INTO public.cost_centers (user_id, name, type, color, is_default)
    VALUES (p_user_id, v_rec.name, v_rec.type, v_rec.color, true)
    ON CONFLICT (user_id, name, type) DO UPDATE SET is_default = true
    RETURNING id INTO v_id;

    IF v_id IS NULL THEN
      SELECT id INTO v_id FROM public.cost_centers
        WHERE user_id = p_user_id AND name = v_rec.name AND type = v_rec.type;
    END IF;

    IF array_length(v_rec.subgroups, 1) > 0 THEN
      INSERT INTO public.cost_subgroups (cost_center_id, user_id, name, is_default)
      SELECT v_id, p_user_id, sg, true
      FROM unnest(v_rec.subgroups) AS sg
      ON CONFLICT (cost_center_id, name) DO NOTHING;
    END IF;
  END LOOP;
END;
$$;

GRANT EXECUTE ON FUNCTION public.seed_default_cost_centers(UUID) TO authenticated;
