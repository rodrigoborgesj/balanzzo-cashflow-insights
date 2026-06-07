
-- 1) email_logs: restrict policies to authenticated, deny anon
DROP POLICY IF EXISTS "Authenticated users can insert own email logs" ON public.email_logs;
DROP POLICY IF EXISTS "Users can view their own email logs" ON public.email_logs;

CREATE POLICY "auth_users_insert_own_email_logs"
  ON public.email_logs FOR INSERT TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "auth_users_view_own_email_logs"
  ON public.email_logs FOR SELECT TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "deny_anonymous_email_logs"
  ON public.email_logs FOR ALL TO anon
  USING (false) WITH CHECK (false);

-- 2) subscriptions: remove user-side UPDATE/INSERT (handled by service role/edge functions)
DROP POLICY IF EXISTS "Users can update their own subscriptions" ON public.subscriptions;
DROP POLICY IF EXISTS "Users can insert their own subscriptions" ON public.subscriptions;
DROP POLICY IF EXISTS "Users can view their own subscriptions" ON public.subscriptions;

CREATE POLICY "auth_users_view_own_subscriptions"
  ON public.subscriptions FOR SELECT TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "deny_anonymous_subscriptions"
  ON public.subscriptions FOR ALL TO anon
  USING (false) WITH CHECK (false);

-- 3) Revoke EXECUTE on trigger-only / internal SECURITY DEFINER functions from anon/authenticated
REVOKE EXECUTE ON FUNCTION public.grant_professional_free_access() FROM anon, authenticated, public;
REVOKE EXECUTE ON FUNCTION public.cleanup_password_history() FROM anon, authenticated, public;
REVOKE EXECUTE ON FUNCTION public.trigger_welcome_email() FROM anon, authenticated, public;
REVOKE EXECUTE ON FUNCTION public.trigger_welcome_email_on_profile() FROM anon, authenticated, public;
REVOKE EXECUTE ON FUNCTION public.update_updated_at_column() FROM anon, authenticated, public;
REVOKE EXECUTE ON FUNCTION public.handle_new_user() FROM anon, authenticated, public;
REVOKE EXECUTE ON FUNCTION public.sugerir_categoria(text) FROM anon, public;

-- Keep client-callable RPCs accessible only to authenticated
REVOKE EXECUTE ON FUNCTION public.get_user_subscription(uuid) FROM anon, public;
REVOKE EXECUTE ON FUNCTION public.get_subscription_plans() FROM anon, public;
REVOKE EXECUTE ON FUNCTION public.has_active_subscription(uuid, public.subscription_type) FROM anon, public;
REVOKE EXECUTE ON FUNCTION public.is_personal_profile_complete(uuid) FROM anon, public;
REVOKE EXECUTE ON FUNCTION public.get_user_context(uuid) FROM anon, public;
REVOKE EXECUTE ON FUNCTION public.has_professional_access(uuid, uuid) FROM anon, public;
REVOKE EXECUTE ON FUNCTION public.has_free_access(text) FROM anon, public;
REVOKE EXECUTE ON FUNCTION public.validate_coupon(text, uuid) FROM anon, public;

-- 4) Realtime: deny direct broadcast/presence subscriptions (postgres_changes still works via publication+RLS)
ALTER TABLE IF EXISTS realtime.messages ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "deny_all_realtime_messages" ON realtime.messages;
CREATE POLICY "deny_all_realtime_messages"
  ON realtime.messages FOR ALL
  USING (false) WITH CHECK (false);
