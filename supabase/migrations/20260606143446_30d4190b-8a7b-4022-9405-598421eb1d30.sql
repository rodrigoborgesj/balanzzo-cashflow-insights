
-- ============= professional_access table =============
CREATE TABLE public.professional_access (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id uuid NOT NULL REFERENCES public.companies(id) ON DELETE CASCADE,
  owner_user_id uuid NOT NULL,
  professional_email text NOT NULL,
  professional_name text,
  professional_user_id uuid,
  role text NOT NULL DEFAULT 'contador',
  permission_level text NOT NULL DEFAULT 'view_only',
  status text NOT NULL DEFAULT 'pending',
  invite_token uuid NOT NULL DEFAULT gen_random_uuid(),
  accepted_at timestamptz,
  revoked_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT professional_access_role_check CHECK (role IN ('contador', 'consultor_financeiro', 'outro')),
  CONSTRAINT professional_access_permission_check CHECK (permission_level IN ('view_only', 'reports', 'full_access')),
  CONSTRAINT professional_access_status_check CHECK (status IN ('pending', 'accepted', 'revoked')),
  CONSTRAINT professional_access_unique UNIQUE (company_id, professional_email)
);

CREATE INDEX idx_prof_access_owner ON public.professional_access(owner_user_id);
CREATE INDEX idx_prof_access_email ON public.professional_access(lower(professional_email));
CREATE INDEX idx_prof_access_prof_user ON public.professional_access(professional_user_id);
CREATE INDEX idx_prof_access_token ON public.professional_access(invite_token);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.professional_access TO authenticated;
GRANT ALL ON public.professional_access TO service_role;

ALTER TABLE public.professional_access ENABLE ROW LEVEL SECURITY;

-- Owner manages all rows for their companies
CREATE POLICY "owner_manages_professional_access"
ON public.professional_access
FOR ALL
TO authenticated
USING (auth.uid() = owner_user_id)
WITH CHECK (auth.uid() = owner_user_id);

-- Professional can view their own access rows (matched by user id OR email)
CREATE POLICY "professional_views_own_access"
ON public.professional_access
FOR SELECT
TO authenticated
USING (
  auth.uid() = professional_user_id
  OR lower(professional_email) = lower((auth.jwt() ->> 'email'))
);

-- Professional can update only to bind their user_id when accepting
CREATE POLICY "professional_accepts_own_access"
ON public.professional_access
FOR UPDATE
TO authenticated
USING (
  lower(professional_email) = lower((auth.jwt() ->> 'email'))
  AND status IN ('pending', 'accepted')
)
WITH CHECK (
  lower(professional_email) = lower((auth.jwt() ->> 'email'))
);

CREATE TRIGGER update_professional_access_updated_at
BEFORE UPDATE ON public.professional_access
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- ============= Helper function =============
CREATE OR REPLACE FUNCTION public.has_professional_access(
  p_user_id uuid,
  p_company_id uuid
)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.professional_access pa
    WHERE pa.company_id = p_company_id
      AND pa.status = 'accepted'
      AND (
        pa.professional_user_id = p_user_id
        OR lower(pa.professional_email) = lower(COALESCE(
          (SELECT email FROM auth.users WHERE id = p_user_id),
          ''
        ))
      )
  );
$$;

GRANT EXECUTE ON FUNCTION public.has_professional_access(uuid, uuid) TO authenticated;

-- ============= Extend RLS to allow professional read access =============

-- companies: allow professional to SELECT companies shared with them
CREATE POLICY "professionals_view_shared_companies"
ON public.companies
FOR SELECT
TO authenticated
USING (public.has_professional_access(auth.uid(), id));

-- fluxo_caixa: allow professional to SELECT shared company's data
CREATE POLICY "professionals_view_shared_cash_flow"
ON public.fluxo_caixa
FOR SELECT
TO authenticated
USING (
  company_id IS NOT NULL
  AND public.has_professional_access(auth.uid(), company_id)
);

-- transacoes_conciliadas: allow professional to SELECT shared company's data
CREATE POLICY "professionals_view_shared_transactions"
ON public.transacoes_conciliadas
FOR SELECT
TO authenticated
USING (
  company_id IS NOT NULL
  AND public.has_professional_access(auth.uid(), company_id)
);
