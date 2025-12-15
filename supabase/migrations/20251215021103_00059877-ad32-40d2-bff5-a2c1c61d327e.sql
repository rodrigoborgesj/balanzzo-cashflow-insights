-- Add age column to personal_profiles table
ALTER TABLE public.personal_profiles 
ADD COLUMN age integer;

-- Update the profile_complete check to include the new simplified requirements
-- (full_name, email, phone, address_zip_code, address_city, age)