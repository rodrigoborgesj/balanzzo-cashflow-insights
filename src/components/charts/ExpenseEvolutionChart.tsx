import { useEffect, useMemo, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { TrendingDown, TrendingUp, LineChart } from 'lucide-react';
import { ResponsiveContainer, BarChart, Bar, XAxis, YAxis, Tooltip, CartesianGrid, LabelList } from 'recharts';
import { useAnnualCashFlow } from '@/hooks/useAnnualCashFlow';
import { expenseEvolution, expenseRanking, type EvolutionGroup } from '@/utils/expenseEvolution';

const MONTHS = ['Jan', 'Fev', 'Mar', 'Abr', 'Mai', 'Jun', 'Jul', 'Ago', 'Set', 'Out', 'Nov', 'Dez'];
const fmt = (cents: number) => (cents / 100).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
const short = (v: number) => { const r = v / 100; return r >= 1000 ? `${(r / 1000).toFixed(1)}K` : r.toFixed(0); };

export const ExpenseEvolutionChart = () => {
  const thisYear = new Date().getFullYear();
  const [year, setYear] = useState(String(thisYear));
  const [group, setGroup] = useState<EvolutionGroup>('fornecedor');
  const [selected, setSelected] = useState('');
  const { data = [], isLoading } = useAnnualCashFlow(year);

  const ranking = useMemo(() => expenseRanking(data, year, group), [data, year, group]);
  useEffect(() => {
    if (!ranking.find(r => r.name === selected)) setSelected(ranking[0]?.name || '');
  }, [ranking, selected]);
  const evo = useMemo(() => expenseEvolution(data, year, group, selected), [data, year, group, selected]);
  const chart = MONTHS.map((mes, i) => ({ mes, valor: evo.months[i] }));
  const total = evo.months.reduce((a, b) => a + b, 0);

  return (
    <Card className="border-0 shadow-sm bg-card notranslate" translate="no">
      <CardHeader className="pb-3 space-y-3">
        <CardTitle className="text-lg font-semibold flex items-center gap-2">
          <LineChart className="w-5 h-5 text-primary" /> Ranking de despesas por evolução
        </CardTitle>
        <div className="grid grid-cols-1 sm:grid-cols-[120px_150px_1fr] gap-2">
          <Select value={year} onValueChange={setYear}>
            <SelectTrigger className="h-11"><SelectValue /></SelectTrigger>
            <SelectContent>{[0, 1, 2, 3].map(o => <SelectItem key={o} value={String(thisYear - o)}>{thisYear - o}</SelectItem>)}</SelectContent>
          </Select>
          <Select value={group} onValueChange={v => setGroup(v as EvolutionGroup)}>
            <SelectTrigger className="h-11"><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="fornecedor">Por fornecedor</SelectItem>
              <SelectItem value="categoria">Por categoria</SelectItem>
            </SelectContent>
          </Select>
          <Select value={selected || undefined} onValueChange={setSelected} disabled={!ranking.length}>
            <SelectTrigger className="h-11"><SelectValue placeholder="Selecione a despesa" /></SelectTrigger>
            <SelectContent className="max-h-80">
              {ranking.map((r, i) => <SelectItem key={r.name} value={r.name}>{i + 1}º {r.name} — {fmt(r.cents)}</SelectItem>)}
            </SelectContent>
          </Select>
        </div>
      </CardHeader>
      <CardContent>
        {isLoading ? <p className="py-12 text-center text-muted-foreground">Carregando...</p> : !ranking.length ? (
          <p className="py-12 text-center text-muted-foreground">Nenhuma despesa conciliada em {year}</p>
        ) : (
          <>
            <div className="flex flex-wrap gap-4 mb-4 text-sm">
              <div><span className="text-muted-foreground">Total no ano: </span><span className="font-semibold">{fmt(total)}</span></div>
              {evo.variation !== null && (
                <div className={`flex items-center gap-1 font-semibold ${evo.variation > 0 ? 'text-destructive' : 'text-success'}`}>
                  {evo.variation > 0 ? <TrendingUp className="w-4 h-4" /> : <TrendingDown className="w-4 h-4" />}
                  {evo.variation > 0 ? 'Aumentou' : 'Diminuiu'} {Math.abs(evo.variation).toFixed(1)}% (primeiro x último mês)
                </div>
              )}
            </div>
            <div className="h-[300px] w-full">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={chart} margin={{ top: 24, right: 8, left: 0, bottom: 5 }}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="hsl(var(--border))" />
                  <XAxis dataKey="mes" axisLine={false} tickLine={false} tick={{ fontSize: 11, fill: 'hsl(var(--muted-foreground))' }} />
                  <YAxis axisLine={false} tickLine={false} width={44} tick={{ fontSize: 11, fill: 'hsl(var(--muted-foreground))' }} tickFormatter={short} />
                  <Tooltip formatter={(v: number) => [fmt(v), 'Despesa']} labelFormatter={l => `${l} / ${year}`} cursor={{ fill: 'hsl(var(--muted) / 0.3)' }} />
                  <Bar dataKey="valor" fill="hsl(var(--primary))" radius={[4, 4, 0, 0]} maxBarSize={44}>
                    <LabelList dataKey="valor" position="top" formatter={(v: number) => (v ? short(v) : '')} style={{ fontSize: 10, fill: 'hsl(var(--muted-foreground))' }} />
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
          </>
        )}
      </CardContent>
    </Card>
  );
};
