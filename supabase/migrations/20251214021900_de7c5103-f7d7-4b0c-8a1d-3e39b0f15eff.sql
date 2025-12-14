-- =============================================
-- TABELA: personal_savings_goals (Caixinhas/Metas de Economia)
-- =============================================
CREATE TABLE public.personal_savings_goals (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  goal_name TEXT NOT NULL,
  total_target_amount NUMERIC NOT NULL,
  timeframe_months INTEGER NOT NULL,
  monthly_amount NUMERIC GENERATED ALWAYS AS (total_target_amount / timeframe_months) STORED,
  bank_name TEXT,
  contribution_day INTEGER CHECK (contribution_day >= 1 AND contribution_day <= 31),
  start_date DATE NOT NULL DEFAULT CURRENT_DATE,
  status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'completed', 'cancelled')),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.personal_savings_goals ENABLE ROW LEVEL SECURITY;

-- RLS Policies
CREATE POLICY "Deny anonymous access to savings goals"
  ON public.personal_savings_goals
  FOR ALL
  USING (false);

CREATE POLICY "Users can manage own savings goals"
  ON public.personal_savings_goals
  FOR ALL
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- =============================================
-- TABELA: personal_savings_contributions (Contribuições mensais)
-- =============================================
CREATE TABLE public.personal_savings_contributions (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  goal_id UUID NOT NULL REFERENCES public.personal_savings_goals(id) ON DELETE CASCADE,
  user_id UUID NOT NULL,
  contribution_date DATE NOT NULL,
  amount NUMERIC NOT NULL,
  proof_file_url TEXT NOT NULL,
  proof_file_name TEXT,
  reference_month DATE NOT NULL,
  status TEXT NOT NULL DEFAULT 'completed' CHECK (status IN ('completed', 'late', 'pending')),
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.personal_savings_contributions ENABLE ROW LEVEL SECURITY;

-- RLS Policies
CREATE POLICY "Deny anonymous access to savings contributions"
  ON public.personal_savings_contributions
  FOR ALL
  USING (false);

CREATE POLICY "Users can manage own savings contributions"
  ON public.personal_savings_contributions
  FOR ALL
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- =============================================
-- STORAGE BUCKET para comprovantes
-- =============================================
INSERT INTO storage.buckets (id, name, public)
VALUES ('savings-proofs', 'savings-proofs', false)
ON CONFLICT (id) DO NOTHING;

-- Storage policies para o bucket savings-proofs
CREATE POLICY "Users can upload own savings proofs"
  ON storage.objects
  FOR INSERT
  WITH CHECK (bucket_id = 'savings-proofs' AND auth.uid()::text = (storage.foldername(name))[1]);

CREATE POLICY "Users can view own savings proofs"
  ON storage.objects
  FOR SELECT
  USING (bucket_id = 'savings-proofs' AND auth.uid()::text = (storage.foldername(name))[1]);

CREATE POLICY "Users can delete own savings proofs"
  ON storage.objects
  FOR DELETE
  USING (bucket_id = 'savings-proofs' AND auth.uid()::text = (storage.foldername(name))[1]);

-- Trigger para updated_at
CREATE TRIGGER update_personal_savings_goals_updated_at
  BEFORE UPDATE ON public.personal_savings_goals
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_personal_savings_contributions_updated_at
  BEFORE UPDATE ON public.personal_savings_contributions
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();