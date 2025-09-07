-- Create email logs table to track sent emails
CREATE TABLE public.email_logs (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  email_type TEXT NOT NULL,
  sent_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  email_address TEXT NOT NULL,
  success BOOLEAN NOT NULL DEFAULT true,
  error_message TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable Row Level Security
ALTER TABLE public.email_logs ENABLE ROW LEVEL SECURITY;

-- Create policies for email logs
CREATE POLICY "Users can view their own email logs" 
ON public.email_logs 
FOR SELECT 
USING (auth.uid() = user_id);

CREATE POLICY "System can insert email logs" 
ON public.email_logs 
FOR INSERT 
WITH CHECK (true);

-- Create index for performance
CREATE INDEX idx_email_logs_user_email_type ON public.email_logs (user_id, email_type);
CREATE INDEX idx_email_logs_sent_at ON public.email_logs (sent_at);

-- Create function to trigger welcome email
CREATE OR REPLACE FUNCTION public.trigger_welcome_email()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
BEGIN
  -- Check if this user already has a welcome email log
  IF NOT EXISTS (
    SELECT 1 FROM public.email_logs 
    WHERE user_id = NEW.id AND email_type = 'welcome'
  ) THEN
    -- Call the edge function to send welcome email
    -- This will be handled by the edge function we'll create
    INSERT INTO public.email_logs (user_id, email_type, email_address, success)
    VALUES (NEW.id, 'welcome_pending', NEW.email, false);
  END IF;
  
  RETURN NEW;
END;
$$;

-- Create trigger to send welcome email on user creation
CREATE TRIGGER on_user_created_send_welcome
  AFTER INSERT ON auth.users
  FOR EACH ROW 
  EXECUTE FUNCTION public.trigger_welcome_email();