import { useEffect } from "react";
import { Link, useSearchParams, useNavigate } from "react-router-dom";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useAuth } from "@/hooks/useAuth";
import {
  useProfessionalAccessForMe, useAcceptProfessionalInvite,
  ROLE_LABELS, PERMISSION_LABELS,
} from "@/hooks/useProfessionalAccess";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { Building2, LogOut, ArrowRight, Loader2 } from "lucide-react";

export default function ProfessionalPortal() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [params, setParams] = useSearchParams();
  const token = params.get("token");
  const { data, isLoading, refetch } = useProfessionalAccessForMe();
  const accept = useAcceptProfessionalInvite();
  const { toast } = useToast();

  // If user arrived with a token, find the matching pending invite and accept
  useEffect(() => {
    if (!token || !user?.email) return;
    (async () => {
      const { data: row } = await supabase
        .from("professional_access")
        .select("*")
        .eq("invite_token", token)
        .maybeSingle();
      if (!row) {
        toast({ title: "Convite inválido ou expirado", variant: "destructive" });
        setParams({});
        return;
      }
      if (row.professional_email.toLowerCase() !== user.email.toLowerCase()) {
        toast({
          title: "E-mail não corresponde",
          description: `Entre com a conta ${row.professional_email}`,
          variant: "destructive",
        });
        setParams({});
        return;
      }
      if (row.status === "pending") {
        await accept.mutateAsync(row.id);
        toast({ title: "Acesso aceito" });
      }
      setParams({});
      refetch();
    })();
  }, [token, user?.email]);

  const accepted = data?.filter((r) => r.status === "accepted") ?? [];
  const pending = data?.filter((r) => r.status === "pending") ?? [];

  return (
    <div
      className="min-h-screen bg-background"
      style={{ fontFamily: "Montserrat, sans-serif" }}
    >
      <header className="border-b border-border">
        <div className="max-w-5xl mx-auto px-6 py-4 flex items-center justify-between">
          <h1 className="text-lg font-bold text-foreground">BALANZZO</h1>
          <Button variant="ghost" size="sm" onClick={() => logout()}>
            <LogOut className="h-4 w-4 mr-2" /> Sair
          </Button>
        </div>
      </header>

      <main className="max-w-5xl mx-auto p-6 space-y-6">
        <div>
          <h2 className="text-2xl font-semibold">Portal Profissional</h2>
          <p className="text-sm text-muted-foreground mt-1">
            Empresas que compartilharam acesso com você.
          </p>
        </div>

        {isLoading ? (
          <div className="flex justify-center py-12"><Loader2 className="h-6 w-6 animate-spin" /></div>
        ) : (
          <>
            {pending.length > 0 && (
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">Convites pendentes</CardTitle>
                  <CardDescription>Aceite para visualizar os dados.</CardDescription>
                </CardHeader>
                <CardContent className="space-y-3">
                  {pending.map((r) => (
                    <div key={r.id} className="flex items-center justify-between border border-border rounded-md p-4">
                      <div>
                        <div className="font-medium">{r.companies?.company_name ?? "Empresa"}</div>
                        <div className="text-xs text-muted-foreground">
                          {ROLE_LABELS[r.role]} · {PERMISSION_LABELS[r.permission_level]}
                        </div>
                      </div>
                      <Button
                        size="sm"
                        onClick={() => accept.mutate(r.id)}
                        disabled={accept.isPending}
                      >
                        Aceitar
                      </Button>
                    </div>
                  ))}
                </CardContent>
              </Card>
            )}

            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Empresas vinculadas</CardTitle>
                <CardDescription>Selecione uma empresa para visualizar.</CardDescription>
              </CardHeader>
              <CardContent>
                {accepted.length === 0 ? (
                  <p className="text-sm text-muted-foreground text-center py-8">
                    Nenhuma empresa vinculada ainda.
                  </p>
                ) : (
                  <div className="space-y-2">
                    {accepted.map((r) => (
                      <Link
                        key={r.id}
                        to={`/profissional/empresa/${r.company_id}`}
                        className="flex items-center justify-between border border-border rounded-md p-4 hover:bg-muted/50 transition-colors"
                      >
                        <div className="flex items-center gap-3">
                          <div className="bg-primary/10 text-primary rounded-md p-2">
                            <Building2 className="h-5 w-5" />
                          </div>
                          <div>
                            <div className="font-medium">{r.companies?.company_name ?? "Empresa"}</div>
                            <div className="text-xs text-muted-foreground flex gap-2 mt-0.5">
                              <Badge variant="secondary" className="text-[10px]">
                                {ROLE_LABELS[r.role]}
                              </Badge>
                              <Badge variant="outline" className="text-[10px]">
                                {PERMISSION_LABELS[r.permission_level]}
                              </Badge>
                            </div>
                          </div>
                        </div>
                        <ArrowRight className="h-4 w-4 text-muted-foreground" />
                      </Link>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </>
        )}
      </main>
    </div>
  );
}
