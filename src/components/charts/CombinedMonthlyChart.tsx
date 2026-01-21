import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { BarChart3, TrendingUp, TrendingDown } from 'lucide-react';
import { 
  ResponsiveContainer, 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  Tooltip, 
  Legend,
  CartesianGrid
} from 'recharts';

interface MonthlyData {
  mes: string;
  entradas: number;
  saidas: number;
  saldo: number;
}

interface CombinedMonthlyChartProps {
  data: MonthlyData[];
  formatCurrency: (value: number) => string;
}

export const CombinedMonthlyChart = ({ data, formatCurrency }: CombinedMonthlyChartProps) => {
  // Custom tooltip
  const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      const entradas = payload.find((p: any) => p.dataKey === 'entradas')?.value || 0;
      const saidas = payload.find((p: any) => p.dataKey === 'saidas')?.value || 0;
      const saldo = entradas - saidas;
      
      return (
        <div className="bg-popover border border-border rounded-xl p-4 shadow-xl">
          <p className="font-semibold text-foreground mb-2">{label}</p>
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 rounded-full bg-success" />
              <span className="text-sm text-muted-foreground">Entradas:</span>
              <span className="text-sm font-bold text-success">{formatCurrency(entradas)}</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 rounded-full bg-destructive" />
              <span className="text-sm text-muted-foreground">Saídas:</span>
              <span className="text-sm font-bold text-destructive">{formatCurrency(saidas)}</span>
            </div>
            <div className="flex items-center gap-2 pt-1 border-t border-border mt-1">
              <div className="w-3 h-3 rounded-full bg-primary" />
              <span className="text-sm text-muted-foreground">Saldo:</span>
              <span className={`text-sm font-bold ${saldo >= 0 ? 'text-success' : 'text-destructive'}`}>
                {formatCurrency(saldo)}
              </span>
            </div>
          </div>
        </div>
      );
    }
    return null;
  };

  // Custom legend
  const CustomLegend = () => (
    <div className="flex items-center justify-center gap-6 mt-4">
      <div className="flex items-center gap-2">
        <div className="w-3 h-3 rounded-full bg-success" />
        <span className="text-sm text-muted-foreground">Entradas</span>
      </div>
      <div className="flex items-center gap-2">
        <div className="w-3 h-3 rounded-full bg-destructive" />
        <span className="text-sm text-muted-foreground">Saídas</span>
      </div>
    </div>
  );

  if (!data || data.length === 0) {
    return (
      <Card className="border-0 shadow-lg bg-card">
        <CardHeader className="pb-3">
          <CardTitle className="text-lg font-semibold flex items-center gap-2">
            <BarChart3 className="w-5 h-5 text-primary" />
            Fluxo Mensal
          </CardTitle>
        </CardHeader>
        <CardContent className="py-12 text-center">
          <BarChart3 className="w-12 h-12 text-muted-foreground mx-auto mb-2" />
          <p className="text-muted-foreground">Sem dados disponíveis</p>
        </CardContent>
      </Card>
    );
  }

  // Calculate totals for summary
  const totalEntradas = data.reduce((sum, item) => sum + item.entradas, 0);
  const totalSaidas = data.reduce((sum, item) => sum + item.saidas, 0);

  return (
    <Card className="border-0 shadow-lg bg-card">
      <CardHeader className="pb-2">
        <div className="flex items-center justify-between flex-wrap gap-2">
          <CardTitle className="text-lg font-semibold flex items-center gap-2">
            <BarChart3 className="w-5 h-5 text-primary" />
            Fluxo Mensal
          </CardTitle>
          <div className="flex items-center gap-4 text-sm">
            <div className="flex items-center gap-1">
              <TrendingUp className="w-4 h-4 text-success" />
              <span className="text-muted-foreground">Total:</span>
              <span className="font-bold text-success">{formatCurrency(totalEntradas)}</span>
            </div>
            <div className="flex items-center gap-1">
              <TrendingDown className="w-4 h-4 text-destructive" />
              <span className="text-muted-foreground">Total:</span>
              <span className="font-bold text-destructive">{formatCurrency(totalSaidas)}</span>
            </div>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <div className="h-[300px] w-full">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart 
              data={data} 
              margin={{ top: 20, right: 10, left: 0, bottom: 5 }}
              barCategoryGap="20%"
            >
              <CartesianGrid 
                strokeDasharray="3 3" 
                vertical={false}
                stroke="hsl(var(--border))"
              />
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
              <Tooltip content={<CustomTooltip />} cursor={false} />
              <Bar 
                dataKey="entradas" 
                fill="hsl(var(--success))"
                radius={[4, 4, 0, 0]}
                name="Entradas"
              />
              <Bar 
                dataKey="saidas" 
                fill="hsl(var(--destructive))"
                radius={[4, 4, 0, 0]}
                name="Saídas"
              />
            </BarChart>
          </ResponsiveContainer>
        </div>
        <CustomLegend />
      </CardContent>
    </Card>
  );
};
