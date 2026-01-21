-- Add columns for manual transaction validation with receipts
ALTER TABLE public.transacoes_conciliadas
ADD COLUMN IF NOT EXISTS status_validacao TEXT DEFAULT 'validado' CHECK (status_validacao IN ('pendente', 'validado', 'rejeitado')),
ADD COLUMN IF NOT EXISTS comprovante_url TEXT,
ADD COLUMN IF NOT EXISTS valor_comprovante NUMERIC;

-- Update existing manual transactions to be 'pendente' (yellow status)
-- Comment out since existing transactions should remain validated
-- UPDATE public.transacoes_conciliadas SET status_validacao = 'pendente' WHERE origem_arquivo = 'manual_entry';

-- Create storage bucket for receipts/comprovantes
INSERT INTO storage.buckets (id, name, public)
VALUES ('comprovantes', 'comprovantes', false)
ON CONFLICT (id) DO NOTHING;

-- RLS Policy: Users can view their own receipts
CREATE POLICY "Users can view their own receipts"
ON storage.objects
FOR SELECT
USING (
  bucket_id = 'comprovantes' 
  AND auth.uid()::text = (storage.foldername(name))[1]
);

-- RLS Policy: Users can upload their own receipts
CREATE POLICY "Users can upload their own receipts"
ON storage.objects
FOR INSERT
WITH CHECK (
  bucket_id = 'comprovantes' 
  AND auth.uid()::text = (storage.foldername(name))[1]
);

-- RLS Policy: Users can update their own receipts
CREATE POLICY "Users can update their own receipts"
ON storage.objects
FOR UPDATE
USING (
  bucket_id = 'comprovantes' 
  AND auth.uid()::text = (storage.foldername(name))[1]
);

-- RLS Policy: Users can delete their own receipts
CREATE POLICY "Users can delete their own receipts"
ON storage.objects
FOR DELETE
USING (
  bucket_id = 'comprovantes' 
  AND auth.uid()::text = (storage.foldername(name))[1]
);