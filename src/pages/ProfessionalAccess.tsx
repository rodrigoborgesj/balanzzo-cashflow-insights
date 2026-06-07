import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from "@/components/ui/table";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import { InviteProfessionalDialog } from "@/components/professional/InviteProfessionalDialog";
import {
  useOwnerProfessionalAccess, useRevokeProfessional, useReactivateProfessional,
  useUpdateProfessionalPermission,
  ROLE_LABELS, PERMISSION_LABELS, STATUS_LABELS,
  type PermissionLevel,
} from "@/hooks/useProfessionalAccess";
import { UserPlus, Copy, Loader2, ShieldOff, RefreshCw } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

export default function ProfessionalAccess() {
  const [open, setOpen] = useState(false);
  const { data, isLoading } = useOwnerProfessionalAccess();
  const revoke = useRevokeProfessional();
  const reactivate = useReactivateProfessional();
  const updatePerm = useUpdateProfessionalPermission();
  const { toast } = useToast();

  const copyInvite = async (token: string) => {
    const link = `${window.location.origin}/profissional?token=${token}`;
    await navigator.clipboard.writeText(link);
    toast({ title: "Link copiado" });
  };

  const active = data?.filter((r) => r.status !== "revoked") ?? [];
  const history = data?.filter((r) => r.status === "revoked") ?? [];

  return (
    <div className="max-w-5xl mx-auto p-6 space-y-6" style={{ fontFamily: "Montserrat, sans-serif" }}>
      <div className="flex items-start justify-between gap-4 flex-wrap">
        <div>
          <h1 className="text-2xl font-semibold text-foreground">Acesso Profissional</h1>
          <p className="text-sm text-muted-foreground mt-1">
            Compartilhe os dados financeiros com seu contador ou consultor.
          </p>
        </div>
        <Button onClick={() => setOpen(true)}>
          <UserPlus className="h-4 w-4 mr-2" /> Convidar profissional
        </Button>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Profissionais ativos</CardTitle>
          <CardDescription>Convites pendentes e acessos ativos.</CardDescription>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="flex justify-center py-8"><Loader2 className="h-5 w-5 animate-spin" /></div>
          ) : active.length === 0 ? (
            <p className="text-sm text-muted-foreground text-center py-8">
              Nenhum profissional vinculado. Clique em "Convidar profissional" para começar.
            </p>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Profissional</TableHead>
                  <TableHead>Empresa</TableHead>
                  <TableHead>Função</TableHead>
                  <TableHead>Permissão</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="text-right">Ações</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {active.map((r) => (
                  <TableRow key={r.id}>
                    <TableCell>
                      <div className="font-medium">{r.professional_name || "—"}</div>
                      <div className="text-xs text-muted-foreground">{r.professional_email}</div>
                    </TableCell>
                    <TableCell>{r.companies?.company_name ?? "—"}</TableCell>
                    <TableCell>{ROLE_LABELS[r.role]}</TableCell>
                    <TableCell>
                      <Select
                        value={r.permission_level}
                        onValueChange={(v) =>
                          updatePerm.mutate({ id: r.id, permission_level: v as PermissionLevel })
                        }
                      >
                        <SelectTrigger className="h-8 w-[170px] text-xs">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          {Object.entries(PERMISSION_LABELS).map(([k, v]) => (
                            <SelectItem key={k} value={k}>{v}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </TableCell>
                    <TableCell>
                      <Badge variant={r.status === "accepted" ? "default" : "secondary"}>
                        {STATUS_LABELS[r.status]}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-right space-x-1">
                      {r.status === "pending" && (
                        <Button size="sm" variant="ghost" onClick={() => copyInvite(r.invite_token)}>
                          <Copy className="h-4 w-4 mr-1" /> Link
                        </Button>
                      )}
                      <Button
                        size="sm" variant="ghost"
                        onClick={() => revoke.mutate(r.id)}
                        disabled={revoke.isPending}
                      >
                        <ShieldOff className="h-4 w-4 mr-1" /> Revogar
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      {history.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Histórico</CardTitle>
            <CardDescription>Acessos revogados.</CardDescription>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Profissional</TableHead>
                  <TableHead>Empresa</TableHead>
                  <TableHead>Revogado em</TableHead>
                  <TableHead className="text-right">Ações</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {history.map((r) => (
                  <TableRow key={r.id}>
                    <TableCell>
                      <div className="font-medium">{r.professional_name || "—"}</div>
                      <div className="text-xs text-muted-foreground">{r.professional_email}</div>
                    </TableCell>
                    <TableCell>{r.companies?.company_name ?? "—"}</TableCell>
                    <TableCell>
                      {r.revoked_at ? new Date(r.revoked_at).toLocaleDateString("pt-BR") : "—"}
                    </TableCell>
                    <TableCell className="text-right">
                      <Button
                        size="sm" variant="ghost"
                        onClick={() => reactivate.mutate(r.id)}
                        disabled={reactivate.isPending}
                      >
                        <RefreshCw className="h-4 w-4 mr-1" /> Reativar
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      )}

      <InviteProfessionalDialog open={open} onOpenChange={setOpen} />
    </div>
  );
}
