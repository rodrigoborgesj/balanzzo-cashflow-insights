-- Insert Nikolas into free_access_users table
INSERT INTO public.free_access_users (email, expires_at)
VALUES ('contato.nikotaylor@gmail.com', NULL)
ON CONFLICT (email) DO NOTHING;