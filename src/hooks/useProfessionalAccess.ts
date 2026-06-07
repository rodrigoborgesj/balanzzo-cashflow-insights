import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";

export type ProfessionalRole = "contador" | "consultor_financeiro" | "outro";
export type PermissionLevel = "view_only" | "reports" | "full_access";
export type AccessStatus = "pending" | "accepted" | "revoked";

export interface ProfessionalAccessRow {
  id: string;
  company_id: string;
  owner_user_id: string;
  professional_email: string;
  professional_name: string | null;
  professional_user_id: string | null;
  role: ProfessionalRole;
  permission_level: PermissionLevel;
  status: AccessStatus;
  invite_token: string;
  accepted_at: string | null;
  revoked_at: string | null;
  created_at: string;
  updated_at: string;
}

export const ROLE_LABELS: Record<ProfessionalRole, string> = {
  contador: "Contador",
  consultor_financeiro: "Consultor Financeiro",
  outro: "Outro",
};

export const PERMISSION_LABELS: Record<PermissionLevel, string> = {
  view_only: "Somente visualizar",
  reports: "Relatórios",
  full_access: "Acesso completo",
};

export const STATUS_LABELS: Record<AccessStatus, string> = {
  pending: "Pendente",
  accepted: "Ativo",
  revoked: "Revogado",
};

// Owner: list professionals invited for their companies
export function useOwnerProfessionalAccess() {
  const { user } = useAuth();
  return useQuery({
    queryKey: ["professional-access", "owner", user?.id],
    enabled: !!user?.id,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("professional_access")
        .select("*, companies:company_id(id, company_name)")
        .eq("owner_user_id", user!.id)
        .order("created_at", { ascending: false });
      if (error) throw error;
      return data as (ProfessionalAccessRow & {
        companies: { id: string; company_name: string } | null;
      })[];
    },
  });
}

// Professional: list companies that shared access with them
export function useProfessionalAccessForMe() {
  const { user } = useAuth();
  return useQuery({
    queryKey: ["professional-access", "me", user?.id],
    enabled: !!user?.id,
    queryFn: async () => {
      const email = user?.email?.toLowerCase() ?? "";
      const { data, error } = await supabase
        .from("professional_access")
        .select("*, companies:company_id(id, company_name)")
        .or(`professional_user_id.eq.${user!.id},professional_email.eq.${email}`)
        .neq("status", "revoked")
        .order("created_at", { ascending: false });
      if (error) throw error;
      return data as (ProfessionalAccessRow & {
        companies: { id: string; company_name: string } | null;
      })[];
    },
  });
}

export function useInviteProfessional() {
  const qc = useQueryClient();
  const { user } = useAuth();
  return useMutation({
    mutationFn: async (input: {
      company_id: string;
      professional_email: string;
      professional_name?: string;
      role: ProfessionalRole;
      permission_level: PermissionLevel;
    }) => {
      if (!user?.id) throw new Error("Não autenticado");
      const { data, error } = await supabase
        .from("professional_access")
        .insert({
          ...input,
          owner_user_id: user.id,
          professional_email: input.professional_email.trim().toLowerCase(),
          status: "pending",
        })
        .select()
        .single();
      if (error) throw error;
      return data as ProfessionalAccessRow;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["professional-access"] }),
  });
}

export function useRevokeProfessional() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from("professional_access")
        .update({ status: "revoked", revoked_at: new Date().toISOString() })
        .eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["professional-access"] }),
  });
}

export function useReactivateProfessional() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from("professional_access")
        .update({ status: "pending", revoked_at: null })
        .eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["professional-access"] }),
  });
}

export function useUpdateProfessionalPermission() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (input: {
      id: string;
      permission_level?: PermissionLevel;
      role?: ProfessionalRole;
    }) => {
      const { id, ...patch } = input;
      const { error } = await supabase
        .from("professional_access")
        .update(patch)
        .eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["professional-access"] }),
  });
}

export function useAcceptProfessionalInvite() {
  const qc = useQueryClient();
  const { user } = useAuth();
  return useMutation({
    mutationFn: async (id: string) => {
      if (!user?.id) throw new Error("Não autenticado");
      const { error } = await supabase
        .from("professional_access")
        .update({
          status: "accepted",
          professional_user_id: user.id,
          accepted_at: new Date().toISOString(),
        })
        .eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["professional-access"] }),
  });
}
