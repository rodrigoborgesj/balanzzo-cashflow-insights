INSERT INTO free_access_users (email, expires_at)
VALUES ('gabrielamullet75@gmail.com', NULL)
ON CONFLICT (email) DO UPDATE SET expires_at = NULL, updated_at = now();