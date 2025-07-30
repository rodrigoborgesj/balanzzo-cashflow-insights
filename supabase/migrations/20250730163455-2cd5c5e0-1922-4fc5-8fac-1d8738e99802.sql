-- Create table to store password history for validation
CREATE TABLE public.password_history (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  password_hash TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable Row Level Security
ALTER TABLE public.password_history ENABLE ROW LEVEL SECURITY;

-- Create policy for users to manage their own password history
CREATE POLICY "Users can manage their own password history" 
ON public.password_history 
FOR ALL 
USING (auth.uid() = user_id);

-- Create index for better performance
CREATE INDEX idx_password_history_user_id ON public.password_history(user_id);
CREATE INDEX idx_password_history_created_at ON public.password_history(created_at);

-- Create function to clean old password history (keep last 5 passwords)
CREATE OR REPLACE FUNCTION public.cleanup_password_history()
RETURNS TRIGGER AS $$
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
$$ LANGUAGE plpgsql;

-- Create trigger to automatically clean password history
CREATE TRIGGER cleanup_password_history_trigger
  AFTER INSERT ON public.password_history
  FOR EACH ROW
  EXECUTE FUNCTION public.cleanup_password_history();