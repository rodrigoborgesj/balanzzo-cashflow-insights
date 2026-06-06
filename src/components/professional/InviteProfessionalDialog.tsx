import { useEffect, useState } from "react";
import {
  Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/use-toast";
import {
  useInviteProfessional, ROLE_LABELS, PERMISSION_LABELS,
  type ProfessionalRole, type PermissionLevel,
} from "@/hooks/useProfessionalAccess";
import { Copy } from "lucide-react";

interface Props {
  open: boolean;
  onOpenChange: (o: boolean) => void;
}

export function InviteProfessionalDialog({ open, onOpenChange }: Props) {
  const { user } = useAuth();
  const { toast } = useToast();
  const invite = useInviteProfessional();

  const [companies, setCompanies] = useState<{ id: string; company_name: string }[]>([]);
  const [companyId, setCompanyId] = useState("");
  const [email, setEmail] = useState("");
  const [name, setName] = useState("");
  const [role, setRole] = useState<ProfessionalRole>("contador");
  const [permission, setPermission] = useState<PermissionLevel>("view_only");
  const [inviteLink, setInviteLink] = useState<string | null>(null);

  useEffect(() => {
    if (!open || !user?.id) return;
    setInviteLink(null);
    supabase
      .from("companies")
      .select("id, company_name")
      .eq("user_id", user.id)
      .then(({ data }) => {
        setCompanies(data ?? []);
        if (data && data.length === 1) setCompanyId(data[0].id);
      });
  }, [open, user?.id]);

  const handleSubmit = async () => {
    if (!companyId || !email) {
      toast({ title: "Preencha empresa e e-mail", variant: "destructive" });
      return;
    }
    try {
      const row = await invite.mutateAsync({
        company_id: companyId,
        professional_email: email,
        professional_name: name || undefined,
        role,
        permission_level: permission,
      });
      const link = `${window.location.origin}/profissional?token=${row.invite_token}`;
      setInviteLink(link);
      toast({ title: "Convite criado", description: "Compartilhe o link com o profissional." });
    } catch (e: any) {
      toast({
        title: "Erro ao convidar",
        description: e?.message ?? "Tente novamente",
        variant: "destructive",
      });
    }
  };

  const copyLink = async () => {
    if (!inviteLink) return;
    await navigator.clipboard.writeText(inviteLink);
    toast({ title: "Link copiado" });
  };

  const reset = () => {
    setEmail(""); setName(""); setRole("contador");
    setPermission("view_only"); setInviteLink(null);
    if (companies.length !== 1) setCompanyId("");
  };

  return (
    <Dialog open={open} onOpenChange={(o) => { if (!o) reset(); onOpenChange(o); }} modal={false}>
      <DialogContent translate="no" className="notranslate sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Convidar profissional</DialogTitle>
          <DialogDescription>
            Compartilhe o acesso financeiro com seu contador ou consultor.
          </DialogDescription>
        </DialogHeader>

        {!inviteLink ? (
          <div className="space-y-4">
            <div className="space-y-1.5">
              <Label>Empresa</Label>
              <Select value={companyId} onValueChange={setCompanyId}>
                <SelectTrigger><SelectValue placeholder="Selecione a empresa" /></SelectTrigger>
                <SelectContent>
                  {companies.map((c) => (
                    <SelectItem key={c.id} value={c.id}>{c.company_name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5">
              <Label>E-mail do profissional</Label>
              <Input type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="contador@exemplo.com" />
            </div>
            <div className="space-y-1.5">
              <Label>Nome (opcional)</Label>
              <Input value={name} onChange={(e) => setName(e.target.value)} placeholder="Nome do profissional" />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label>Função</Label>
                <Select value={role} onValueChange={(v) => setRole(v as ProfessionalRole)}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {Object.entries(ROLE_LABELS).map(([k, v]) => (
                      <SelectItem key={k} value={k}>{v}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-1.5">
                <Label>Permissão</Label>
                <Select value={permission} onValueChange={(v) => setPermission(v as PermissionLevel)}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {Object.entries(PERMISSION_LABELS).map(([k, v]) => (
                      <SelectItem key={k} value={k}>{v}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
          </div>
        ) : (
          <div className="space-y-3">
            <p className="text-sm text-muted-foreground">
              Envie o link abaixo para o profissional. Ele precisa criar uma conta
              (ou entrar) usando o mesmo e-mail convidado.
            </p>
            <div className="flex gap-2">
              <Input readOnly value={inviteLink} className="text-xs" />
              <Button type="button" variant="outline" size="icon" onClick={copyLink}>
                <Copy className="h-4 w-4" />
              </Button>
            </div>
          </div>
        )}

        <DialogFooter>
          {!inviteLink ? (
            <>
              <Button variant="outline" onClick={() => onOpenChange(false)}>Cancelar</Button>
              <Button onClick={handleSubmit} disabled={invite.isPending}>
                {invite.isPending ? "Enviando..." : "Gerar convite"}
              </Button>
            </>
          ) : (
            <Button onClick={() => { reset(); onOpenChange(false); }}>Concluir</Button>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
