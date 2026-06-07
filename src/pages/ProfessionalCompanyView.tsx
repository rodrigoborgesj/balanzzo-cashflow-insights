import { useEffect, useMemo, useState } from "react";
import { Link, useParams } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from "@/components/ui/table";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import {
  ArrowLeft, TrendingUp, TrendingDown, Wallet, Loader2,
  FileSpreadsheet, FileText, CalendarRange,
} from "lucide-react";
import { useProfessionalAccessForMe } from "@/hooks/useProfessionalAccess";
import * as XLSX from "xlsx";
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";

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

const fmtDateBR = (iso: string) => {
  const [y, m, d] = iso.split("-");
  return `${d}/${m}/${y}`;
};

const todayISO = () => new Date().toISOString().split("T")[0];

const monthKeyToRange = (ym: string) => {
  // ym format: YYYY-MM (parsed manually, no Date)
  const [y, m] = ym.split("-").map(Number);
  const start = `${y}-${String(m).padStart(2, "0")}-01`;
  const lastDay = new Date(y, m, 0).getDate();
  const end = `${y}-${String(m).padStart(2, "0")}-${String(lastDay).padStart(2, "0")}`;
  return { start, end };
};

export default function ProfessionalCompanyView() {
  const { companyId } = useParams<{ companyId: string }>();
  const { data: accessRows } = useProfessionalAccessForMe();
  const access = accessRows?.find((a) => a.company_id === companyId);

  const [rows, setRows] = useState<Row[]>([]);
  const [loading, setLoading] = useState(true);

  // Filters
  const now = new Date();
  const defaultMonth = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}`;
  const [month, setMonth] = useState<string>(defaultMonth);
  const [categoria, setCategoria] = useState<string>("all");
  const [tipo, setTipo] = useState<string>("all");

  useEffect(() => {
    if (!companyId) return;
    setLoading(true);
    supabase
      .from("fluxo_caixa")
      .select("id, data_competencia, tipo, descricao, categoria, valor")
      .eq("company_id", companyId)
      .order("data_competencia", { ascending: false })
      .limit(5000)
      .then(({ data, error }) => {
        if (!error && data) setRows(data as Row[]);
        setLoading(false);
      });
  }, [companyId]);

  // Split past/current vs future
  const today = todayISO();
  const pastRows = useMemo(() => rows.filter((r) => r.data_competencia <= today), [rows, today]);
  const futureRows = useMemo(() => rows.filter((r) => r.data_competencia > today), [rows, today]);

  // Apply month + filters to pastRows
  const filteredRows = useMemo(() => {
    const { start, end } = monthKeyToRange(month);
    return pastRows.filter((r) => {
      if (r.data_competencia < start || r.data_competencia > end) return false;
      if (tipo !== "all" && r.tipo !== tipo) return false;
      if (categoria !== "all" && (r.categoria ?? "Sem categoria") !== categoria) return false;
      return true;
    });
  }, [pastRows, month, tipo, categoria]);

  const totals = useMemo(() => {
    const entradas = filteredRows
      .filter((r) => r.tipo === "entrada")
      .reduce((s, r) => s + Number(r.valor), 0);
    const saidas = filteredRows
      .filter((r) => r.tipo === "saida")
      .reduce((s, r) => s + Number(r.valor), 0);
    return { entradas, saidas, saldo: entradas - saidas };
  }, [filteredRows]);

  const categoriasDisponiveis = useMemo(() => {
    const set = new Set<string>();
    pastRows.forEach((r) => set.add(r.categoria ?? "Sem categoria"));
    return Array.from(set).sort();
  }, [pastRows]);

  // Group by category for the categorized view
  const grouped = useMemo(() => {
    const map = new Map<string, { entradas: number; saidas: number; count: number }>();
    filteredRows.forEach((r) => {
      const key = r.categoria ?? "Sem categoria";
      const cur = map.get(key) ?? { entradas: 0, saidas: 0, count: 0 };
      if (r.tipo === "entrada") cur.entradas += Number(r.valor);
      else cur.saidas += Number(r.valor);
      cur.count += 1;
      map.set(key, cur);
    });
    return Array.from(map.entries())
      .map(([categoria, v]) => ({ categoria, ...v, total: v.entradas - v.saidas }))
      .sort((a, b) => Math.abs(b.entradas + b.saidas) - Math.abs(a.entradas + a.saidas));
  }, [filteredRows]);

  // Future grouped by month
  const futureByMonth = useMemo(() => {
    const map = new Map<string, { entradas: number; saidas: number }>();
    futureRows.forEach((r) => {
      const ym = r.data_competencia.slice(0, 7);
      const cur = map.get(ym) ?? { entradas: 0, saidas: 0 };
      if (r.tipo === "entrada") cur.entradas += Number(r.valor);
      else cur.saidas += Number(r.valor);
      map.set(ym, cur);
    });
    return Array.from(map.entries())
      .sort(([a], [b]) => a.localeCompare(b))
      .map(([ym, v]) => ({ ym, ...v, saldo: v.entradas - v.saidas }));
  }, [futureRows]);

  const companyName = access?.companies?.company_name ?? "Empresa";

  const exportExcel = () => {
    const wb = XLSX.utils.book_new();

    const movSheet = XLSX.utils.json_to_sheet(
      filteredRows.map((r) => ({
        Data: fmtDateBR(r.data_competencia),
        Tipo: r.tipo === "entrada" ? "Entrada" : "Saída",
        Categoria: r.categoria ?? "Sem categoria",
        Descrição: r.descricao ?? "",
        Valor: Number(r.valor),
      })),
    );
    XLSX.utils.book_append_sheet(wb, movSheet, "Movimentações");

    const catSheet = XLSX.utils.json_to_sheet(
      grouped.map((g) => ({
        Categoria: g.categoria,
        Entradas: g.entradas,
        Saídas: g.saidas,
        Saldo: g.total,
        Lançamentos: g.count,
      })),
    );
    XLSX.utils.book_append_sheet(wb, catSheet, "Por categoria");

    const futSheet = XLSX.utils.json_to_sheet(
      futureRows.map((r) => ({
        Data: fmtDateBR(r.data_competencia),
        Tipo: r.tipo === "entrada" ? "Entrada" : "Saída",
        Categoria: r.categoria ?? "Sem categoria",
        Descrição: r.descricao ?? "",
        Valor: Number(r.valor),
      })),
    );
    XLSX.utils.book_append_sheet(wb, futSheet, "Lançamentos futuros");

    XLSX.writeFile(wb, `${companyName}_${month}.xlsx`);
  };

  const exportPDF = () => {
    const doc = new jsPDF();
    doc.setFontSize(14);
    doc.text(`${companyName} — Relatório financeiro`, 14, 16);
    doc.setFontSize(10);
    doc.text(`Mês de referência: ${month}`, 14, 23);
    doc.text(
      `Entradas: ${fmt(totals.entradas)}  |  Saídas: ${fmt(totals.saidas)}  |  Saldo: ${fmt(totals.saldo)}`,
      14, 29,
    );

    autoTable(doc, {
      startY: 35,
      head: [["Categoria", "Entradas", "Saídas", "Saldo", "Lanç."]],
      body: grouped.map((g) => [
        g.categoria, fmt(g.entradas), fmt(g.saidas), fmt(g.total), String(g.count),
      ]),
      styles: { fontSize: 8 },
      headStyles: { fillColor: [26, 52, 35] },
    });

    autoTable(doc, {
      head: [["Data", "Tipo", "Categoria", "Descrição", "Valor"]],
      body: filteredRows.map((r) => [
        fmtDateBR(r.data_competencia),
        r.tipo === "entrada" ? "Entrada" : "Saída",
        r.categoria ?? "Sem categoria",
        r.descricao ?? "",
        fmt(Number(r.valor)),
      ]),
      styles: { fontSize: 7 },
      headStyles: { fillColor: [26, 52, 35] },
    });

    if (futureRows.length > 0) {
      doc.addPage();
      doc.setFontSize(12);
      doc.text("Lançamentos futuros", 14, 16);
      autoTable(doc, {
        startY: 22,
        head: [["Data", "Tipo", "Categoria", "Descrição", "Valor"]],
        body: futureRows.map((r) => [
          fmtDateBR(r.data_competencia),
          r.tipo === "entrada" ? "Entrada" : "Saída",
          r.categoria ?? "Sem categoria",
          r.descricao ?? "",
          fmt(Number(r.valor)),
        ]),
        styles: { fontSize: 7 },
        headStyles: { fillColor: [26, 52, 35] },
      });
    }

    doc.save(`${companyName}_${month}.pdf`);
  };

  return (
    <div
      className="min-h-screen bg-background"
      style={{ fontFamily: "Montserrat, sans-serif" }}
    >
      <header className="border-b border-border">
        <div className="max-w-6xl mx-auto px-6 py-4 flex items-center justify-between gap-3 flex-wrap">
          <div className="flex items-center gap-3">
            <Link to="/profissional">
              <Button variant="ghost" size="sm">
                <ArrowLeft className="h-4 w-4 mr-2" /> Voltar
              </Button>
            </Link>
            <div>
              <h1 className="text-base font-semibold">{companyName}</h1>
              <p className="text-xs text-muted-foreground">Visualização profissional · somente leitura</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Button variant="outline" size="sm" onClick={exportExcel}>
              <FileSpreadsheet className="h-4 w-4 mr-2" /> Excel
            </Button>
            <Button variant="outline" size="sm" onClick={exportPDF}>
              <FileText className="h-4 w-4 mr-2" /> PDF
            </Button>
          </div>
        </div>
      </header>

      <main className="max-w-6xl mx-auto p-6 space-y-6">
        {loading ? (
          <div className="flex justify-center py-16"><Loader2 className="h-6 w-6 animate-spin" /></div>
        ) : (
          <>
            {/* Filters */}
            <Card>
              <CardContent className="pt-6 flex flex-wrap items-end gap-3">
                <div className="flex flex-col gap-1">
                  <label className="text-xs text-muted-foreground flex items-center gap-1">
                    <CalendarRange className="h-3 w-3" /> Mês
                  </label>
                  <Input
                    type="month"
                    value={month}
                    onChange={(e) => setMonth(e.target.value || defaultMonth)}
                    className="h-9 w-[170px]"
                  />
                </div>
                <div className="flex flex-col gap-1">
                  <label className="text-xs text-muted-foreground">Tipo</label>
                  <select
                    value={tipo}
                    onChange={(e) => setTipo(e.target.value)}
                    className="h-9 rounded-md border border-input bg-background px-2 text-sm"
                  >
                    <option value="all">Todos</option>
                    <option value="entrada">Entradas</option>
                    <option value="saida">Saídas</option>
                  </select>
                </div>
                <div className="flex flex-col gap-1">
                  <label className="text-xs text-muted-foreground">Categoria</label>
                  <select
                    value={categoria}
                    onChange={(e) => setCategoria(e.target.value)}
                    className="h-9 rounded-md border border-input bg-background px-2 text-sm min-w-[180px]"
                  >
                    <option value="all">Todas</option>
                    {categoriasDisponiveis.map((c) => (
                      <option key={c} value={c}>{c}</option>
                    ))}
                  </select>
                </div>
              </CardContent>
            </Card>

            {/* KPIs */}
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

            <Tabs defaultValue="categorias" className="w-full">
              <TabsList>
                <TabsTrigger value="categorias">Por categoria</TabsTrigger>
                <TabsTrigger value="movimentacoes">Movimentações</TabsTrigger>
                <TabsTrigger value="futuras">
                  Lançamentos futuros
                  {futureRows.length > 0 && (
                    <Badge variant="secondary" className="ml-2 h-5">{futureRows.length}</Badge>
                  )}
                </TabsTrigger>
              </TabsList>

              <TabsContent value="categorias">
                <Card>
                  <CardContent className="pt-6">
                    {grouped.length === 0 ? (
                      <p className="text-sm text-muted-foreground text-center py-8">
                        Nenhuma movimentação no período.
                      </p>
                    ) : (
                      <Table>
                        <TableHeader>
                          <TableRow>
                            <TableHead>Categoria</TableHead>
                            <TableHead className="text-right">Entradas</TableHead>
                            <TableHead className="text-right">Saídas</TableHead>
                            <TableHead className="text-right">Saldo</TableHead>
                            <TableHead className="text-right">Lanç.</TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {grouped.map((g) => (
                            <TableRow key={g.categoria}>
                              <TableCell className="font-medium">{g.categoria}</TableCell>
                              <TableCell className="text-right text-emerald-600">{fmt(g.entradas)}</TableCell>
                              <TableCell className="text-right text-red-600">{fmt(g.saidas)}</TableCell>
                              <TableCell className="text-right font-medium">{fmt(g.total)}</TableCell>
                              <TableCell className="text-right text-muted-foreground">{g.count}</TableCell>
                            </TableRow>
                          ))}
                        </TableBody>
                      </Table>
                    )}
                  </CardContent>
                </Card>
              </TabsContent>

              <TabsContent value="movimentacoes">
                <Card>
                  <CardContent className="pt-6">
                    {filteredRows.length === 0 ? (
                      <p className="text-sm text-muted-foreground text-center py-8">
                        Nenhuma movimentação no período.
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
                          {filteredRows.map((r) => (
                            <TableRow key={r.id}>
                              <TableCell className="whitespace-nowrap">{fmtDateBR(r.data_competencia)}</TableCell>
                              <TableCell>{r.descricao ?? "—"}</TableCell>
                              <TableCell className="text-muted-foreground">{r.categoria ?? "Sem categoria"}</TableCell>
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
              </TabsContent>

              <TabsContent value="futuras">
                <Card>
                  <CardContent className="pt-6 space-y-6">
                    {futureRows.length === 0 ? (
                      <p className="text-sm text-muted-foreground text-center py-8">
                        Nenhum lançamento futuro programado.
                      </p>
                    ) : (
                      <>
                        <div>
                          <h3 className="text-sm font-semibold mb-3">Resumo mensal</h3>
                          <Table>
                            <TableHeader>
                              <TableRow>
                                <TableHead>Mês</TableHead>
                                <TableHead className="text-right">Entradas</TableHead>
                                <TableHead className="text-right">Saídas</TableHead>
                                <TableHead className="text-right">Saldo</TableHead>
                              </TableRow>
                            </TableHeader>
                            <TableBody>
                              {futureByMonth.map((m) => (
                                <TableRow key={m.ym}>
                                  <TableCell className="font-medium">{m.ym}</TableCell>
                                  <TableCell className="text-right text-emerald-600">{fmt(m.entradas)}</TableCell>
                                  <TableCell className="text-right text-red-600">{fmt(m.saidas)}</TableCell>
                                  <TableCell className="text-right font-medium">{fmt(m.saldo)}</TableCell>
                                </TableRow>
                              ))}
                            </TableBody>
                          </Table>
                        </div>

                        <div>
                          <h3 className="text-sm font-semibold mb-3">Lançamentos detalhados</h3>
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
                              {futureRows.map((r) => (
                                <TableRow key={r.id}>
                                  <TableCell className="whitespace-nowrap">{fmtDateBR(r.data_competencia)}</TableCell>
                                  <TableCell>{r.descricao ?? "—"}</TableCell>
                                  <TableCell className="text-muted-foreground">{r.categoria ?? "Sem categoria"}</TableCell>
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
                        </div>
                      </>
                    )}
                  </CardContent>
                </Card>
              </TabsContent>
            </Tabs>
          </>
        )}
      </main>
    </div>
  );
}
