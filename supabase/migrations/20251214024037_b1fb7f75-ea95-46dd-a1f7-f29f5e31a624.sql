-- Create personal_fixed_expenses table for recurring monthly bills
CREATE TABLE public.personal_fixed_expenses (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  description TEXT NOT NULL,
  amount NUMERIC NOT NULL,
  payment_day INTEGER NOT NULL CHECK (payment_day >= 1 AND payment_day <= 31),
  category TEXT,
  active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.personal_fixed_expenses ENABLE ROW LEVEL SECURITY;

-- RLS policies
CREATE POLICY "Deny anonymous access to fixed expenses"
ON public.personal_fixed_expenses
FOR ALL
USING (false);

CREATE POLICY "Users can manage own fixed expenses"
ON public.personal_fixed_expenses
FOR ALL
TO authenticated
USING (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id);

-- Trigger for updated_at
CREATE TRIGGER update_personal_fixed_expenses_updated_at
BEFORE UPDATE ON public.personal_fixed_expenses
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();