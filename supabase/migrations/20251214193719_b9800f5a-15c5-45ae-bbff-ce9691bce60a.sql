-- Create table to store user's bank balance for predictability analysis
CREATE TABLE public.personal_bank_balance (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  balance NUMERIC NOT NULL DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  UNIQUE(user_id)
);

-- Enable RLS
ALTER TABLE public.personal_bank_balance ENABLE ROW LEVEL SECURITY;

-- RLS policies
CREATE POLICY "Users can manage own bank balance"
ON public.personal_bank_balance
FOR ALL
USING (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Deny anonymous access to bank balance"
ON public.personal_bank_balance
FOR ALL
USING (false);

-- Trigger for updated_at
CREATE TRIGGER update_personal_bank_balance_updated_at
BEFORE UPDATE ON public.personal_bank_balance
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();