
CREATE OR REPLACE FUNCTION public.handle_new_user()
 RETURNS trigger
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
BEGIN
  -- Insert into profiles table with trial period initialized
  INSERT INTO public.profiles (id, full_name, phone, position, trial_start_date, trial_used)
  VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data->>'full_name', 'Usuário'),
    COALESCE(NEW.raw_user_meta_data->>'phone', ''),
    COALESCE(NEW.raw_user_meta_data->>'position', ''),
    now(),
    false
  );

  -- Grant 3 days of free access to all new users
  INSERT INTO public.free_access_users (email, expires_at)
  VALUES (NEW.email, now() + interval '3 days')
  ON CONFLICT (email) DO NOTHING;
  
  RETURN NEW;
END;
$function$;
