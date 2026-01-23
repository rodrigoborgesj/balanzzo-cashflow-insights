INSERT INTO free_access_users (email, expires_at)
VALUES ('dinnyalmeida123@gmail.com', CURRENT_DATE + INTERVAL '3 months')
ON CONFLICT (email) DO UPDATE SET expires_at = CURRENT_DATE + INTERVAL '3 months', updated_at = now();