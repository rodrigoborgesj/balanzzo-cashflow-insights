import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { BarChart3 } from 'lucide-react';
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
  Legend,
} from 'recharts';

interface PainelItem {
  ano: number;
  mes: number;
  total_entradas: number | string;
  total_saidas: number | string;
}

interface YearlyRevenueChartProps {
  painelData: PainelItem[];
  formatCurrency: (value: number) => string;
  year?: number;
}

const MONTH_LABELS = ['Jan', 'Fev', 'Mar', 'Abr', 'Mai', 'Jun', 'Jul', 'Ago', 'Set', 'Out', 'Nov', 'Dez'];

export const YearlyRevenueChart = ({ painelData, formatCurrency, year }: YearlyRevenueChartProps) => {
  const targetYear = year ?? new Date().getFullYear();

  const data = MONTH_LABELS.map((label, idx) => {
    const item = painelData.find(p => p.ano === targetYear && p.mes === idx + 1);
    const entradas = item ? Number(item.total_entradas) : 0;
    const saidas = item ? Number(item.total_saidas) : 0;
    return {
      mes: label,
      entradas,
      saidas,
      hasData: !!item && (entradas > 0 || saidas > 0),
    };
  });

  const hasAny = data.some(d => d.hasData);

  const CustomTooltip = ({ active, payload, label }: any) => {
    if (!active || !payload?.length) return null;
    const entradas = payload.find((p: any) => p.dataKey === 'entradas')?.value || 0;
    const saidas = payload.find((p: any) => p.dataKey === 'saidas')?.value || 0;
    const saldo = entradas - saidas;
    return (
      <div className="bg-popover border border-border rounded-xl p-4 shadow-xl">
        <p className="font-semibold text-foreground mb-2">{label} / {targetYear}</p>
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 rounded-full bg-primary" />
            <span className="text-sm text-muted-foreground">Faturamento:</span>
            <span className="text-sm font-bold text-foreground">{formatCurrency(entradas)}</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 rounded-full bg-muted-foreground" />
            <span className="text-sm text-muted-foreground">Despesas:</span>
            <span className="text-sm font-bold text-foreground">{formatCurrency(saidas)}</span>
          </div>
          <div className="flex items-center gap-2 pt-1 border-t border-border mt-1">
            <span className="text-sm text-muted-foreground">Resultado:</span>
            <span className={`text-sm font-bold ${saldo >= 0 ? 'text-success' : 'text-destructive'}`}>
              {formatCurrency(saldo)}
            </span>
          </div>
        </div>
      </div>
    );
  };

  return (
    <Card className="border-0 shadow-sm bg-card">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between flex-wrap gap-2">
          <CardTitle className="text-lg font-semibold flex items-center gap-2">
            <BarChart3 className="w-5 h-5 text-primary" />
            Faturamento x Despesas — {targetYear}
          </CardTitle>
          <p className="text-xs text-muted-foreground">Meses conciliados na plataforma</p>
        </div>
      </CardHeader>
      <CardContent>
        {!hasAny ? (
          <div className="py-12 text-center">
            <BarChart3 className="w-12 h-12 text-muted-foreground mx-auto mb-2" />
            <p className="text-muted-foreground">Nenhum mês conciliado em {targetYear}</p>
          </div>
        ) : (
          <div className="h-[320px] w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={data} margin={{ top: 20, right: 10, left: 0, bottom: 5 }} barCategoryGap="20%">
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="hsl(var(--border))" />
                <XAxis
                  dataKey="mes"
                  axisLine={false}
                  tickLine={false}
                  tick={{ fontSize: 12, fill: 'hsl(var(--muted-foreground))' }}
                />
                <YAxis
                  axisLine={false}
                  tickLine={false}
                  tick={{ fontSize: 12, fill: 'hsl(var(--muted-foreground))' }}
                  tickFormatter={(value) => {
                    if (value >= 1000000) return `${(value / 1000000).toFixed(1)}M`;
                    if (value >= 1000) return `${(value / 1000).toFixed(0)}K`;
                    return value.toString();
                  }}
                />
                <Tooltip content={<CustomTooltip />} cursor={{ fill: 'hsl(var(--muted) / 0.3)' }} />
                <Legend
                  wrapperStyle={{ paddingTop: '12px' }}
                  formatter={(value) => <span className="text-sm text-muted-foreground">{value}</span>}
                />
                <Bar dataKey="entradas" fill="hsl(var(--primary))" radius={[4, 4, 0, 0]} name="Faturamento" maxBarSize={48} />
                <Bar dataKey="saidas" fill="hsl(var(--muted-foreground))" radius={[4, 4, 0, 0]} name="Despesas" maxBarSize={48} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        )}
      </CardContent>
    </Card>
  );
};
