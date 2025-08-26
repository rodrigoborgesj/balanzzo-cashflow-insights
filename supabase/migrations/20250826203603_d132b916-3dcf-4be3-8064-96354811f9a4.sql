-- Add trial tracking fields to profiles table
ALTER TABLE public.profiles 
ADD COLUMN trial_start_date TIMESTAMPTZ,
ADD COLUMN trial_used BOOLEAN DEFAULT FALSE;

-- Create index for better performance on trial queries
CREATE INDEX idx_profiles_trial_start ON public.profiles(trial_start_date);
CREATE INDEX idx_profiles_trial_used ON public.profiles(trial_used);