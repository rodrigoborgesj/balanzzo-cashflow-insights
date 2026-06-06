import { useEffect, useMemo, useState } from "react";
import { Link, useParams } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from "@/components/ui/table";
import { ArrowLeft, TrendingUp, TrendingDown, Wallet, Loader2 } from "lucide-react";
import { useProfessionalAccessForMe } from "@/hooks/useProfessionalAccess";

interface Row {
  id: string;
  data_competencia: string;
  tipo: string;
  descricao: string | null;
  categoria: string | null;
  valor: number;
}

const fmt = (v: number) =>
  v.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });

export default function ProfessionalCompanyView() {
  const { companyId } = useParams<{ companyId: string }>();
  const { data: accessRows } = useProfessionalAccessForMe();
  const access = accessRows?.find((a) => a.company_id === companyId);

  const [rows, setRows] = useState<Row[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!companyId) return;
    setLoading(true);
    supabase
      .from("fluxo_caixa")
      .select("id, data_competencia, tipo, descricao, categoria, valor")
      .eq("company_id", companyId)
      .order("data_competencia", { ascending: false })
      .limit(500)
      .then(({ data, error }) => {
        if (!error && data) setRows(data as Row[]);
        setLoading(false);
      });
  }, [companyId]);

  const totals = useMemo(() => {
    const entradas = rows
      .filter((r) => r.tipo === "entrada")
      .reduce((s, r) => s + Number(r.valor), 0);
    const saidas = rows
      .filter((r) => r.tipo === "saida")
      .reduce((s, r) => s + Number(r.valor), 0);
    return { entradas, saidas, saldo: entradas - saidas };
  }, [rows]);

  return (
    <div
      className="min-h-screen bg-background"
      style={{ fontFamily: "Montserrat, sans-serif" }}
    >
      <header className="border-b border-border">
        <div className="max-w-6xl mx-auto px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Link to="/profissional">
              <Button variant="ghost" size="sm">
                <ArrowLeft className="h-4 w-4 mr-2" /> Voltar
              </Button>
            </Link>
            <div>
              <h1 className="text-base font-semibold">
                {access?.companies?.company_name ?? "Empresa"}
              </h1>
              <p className="text-xs text-muted-foreground">Visualização profissional · somente leitura</p>
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-6xl mx-auto p-6 space-y-6">
        {loading ? (
          <div className="flex justify-center py-16"><Loader2 className="h-6 w-6 animate-spin" /></div>
        ) : (
          <>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm text-muted-foreground flex items-center gap-2">
                    <TrendingUp className="h-4 w-4 text-emerald-600" /> Entradas
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-2xl font-semibold text-emerald-600">{fmt(totals.entradas)}</p>
                </CardContent>
              </Card>
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm text-muted-foreground flex items-center gap-2">
                    <TrendingDown className="h-4 w-4 text-red-600" /> Saídas
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-2xl font-semibold text-red-600">{fmt(totals.saidas)}</p>
                </CardContent>
              </Card>
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm text-muted-foreground flex items-center gap-2">
                    <Wallet className="h-4 w-4" /> Saldo
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-2xl font-semibold">{fmt(totals.saldo)}</p>
                </CardContent>
              </Card>
            </div>

            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Últimas movimentações</CardTitle>
              </CardHeader>
              <CardContent>
                {rows.length === 0 ? (
                  <p className="text-sm text-muted-foreground text-center py-8">
                    Nenhuma movimentação encontrada.
                  </p>
                ) : (
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Data</TableHead>
                        <TableHead>Descrição</TableHead>
                        <TableHead>Categoria</TableHead>
                        <TableHead>Tipo</TableHead>
                        <TableHead className="text-right">Valor</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {rows.map((r) => (
                        <TableRow key={r.id}>
                          <TableCell className="whitespace-nowrap">
                            {new Date(r.data_competencia + "T00:00:00").toLocaleDateString("pt-BR")}
                          </TableCell>
                          <TableCell>{r.descricao ?? "—"}</TableCell>
                          <TableCell className="text-muted-foreground">{r.categoria ?? "—"}</TableCell>
                          <TableCell>
                            <span className={r.tipo === "entrada" ? "text-emerald-600" : "text-red-600"}>
                              {r.tipo === "entrada" ? "Entrada" : "Saída"}
                            </span>
                          </TableCell>
                          <TableCell className="text-right font-medium">{fmt(Number(r.valor))}</TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                )}
              </CardContent>
            </Card>
          </>
        )}
      </main>
    </div>
  );
}
