import { ResponsiveContainer, LineChart, Line, XAxis, YAxis, AreaChart, Area } from 'recharts';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { TrendingDown, Calendar } from 'lucide-react';
import { CustomTooltip } from '@/components/CustomTooltip';
import { useState } from 'react';
import { Button } from '@/components/ui/button';

interface ExpenseProjectionData {
  period: string;
  projected: number;
  category: string;
  description?: string;
}

interface ExpenseProjectionChartProps {
  data: ExpenseProjectionData[];
  formatCurrency: (value: number) => string;
  title: string;
  type: 'annual' | 'monthly';
}

export const ExpenseProjectionChart = ({ data, formatCurrency, title, type }: ExpenseProjectionChartProps) => {
  const [viewType, setViewType] = useState<'line' | 'area'>('area');

  // Use provided data only
  const sampleData = data;
  
  const maxValue = sampleData.length > 0 ? Math.max(...sampleData.map(item => item.projected)) : 0;
  const avgValue = sampleData.length > 0 ? sampleData.reduce((sum, item) => sum + item.projected, 0) / sampleData.length : 0;

  return (
    <Card className="dashboard-card animate-slide-in">
      <CardHeader className="pb-4">
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2 text-foreground">
            <TrendingDown className="w-5 h-5 text-destructive" />
            {title}
          </CardTitle>
          <div className="flex gap-2">
            <Button
              variant={viewType === 'area' ? 'default' : 'outline'}
              size="sm"
              onClick={() => setViewType('area')}
              className="h-8 px-3"
            >
              Área
            </Button>
            <Button
              variant={viewType === 'line' ? 'default' : 'outline'}
              size="sm"
              onClick={() => setViewType('line')}
              className="h-8 px-3"
            >
              Linha
            </Button>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        {/* Summary Stats */}
        <div className="grid grid-cols-3 gap-4 mb-6">
          {sampleData.length > 0 && (
            <>
              <div className="text-center p-3 bg-muted/20 rounded-lg">
                <div className="text-xs text-muted-foreground">Total Projetado</div>
                <div className="text-lg font-bold text-destructive">
                  {formatCurrency(sampleData.reduce((sum, item) => sum + item.projected, 0))}
                </div>
              </div>
              <div className="text-center p-3 bg-muted/20 rounded-lg">
                <div className="text-xs text-muted-foreground">Média {type === 'annual' ? 'Mensal' : 'Diária'}</div>
                <div className="text-lg font-bold text-foreground">
                  {formatCurrency(avgValue)}
                </div>
              </div>
              <div className="text-center p-3 bg-muted/20 rounded-lg">
                <div className="text-xs text-muted-foreground">Pico Máximo</div>
                <div className="text-lg font-bold text-destructive">
                  {formatCurrency(maxValue)}
                </div>
              </div>
            </>
          )}
        </div>

        {/* Chart */}
        <div className="h-80">
          {sampleData.length > 0 ? (
            <ResponsiveContainer width="100%" height="100%">
              {viewType === 'area' ? (
                <AreaChart data={sampleData}>
                  <defs>
                    <linearGradient id="expenseProjectionGradient" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#dc2626" stopOpacity={0.3}/>
                      <stop offset="95%" stopColor="#dc2626" stopOpacity={0.05}/>
                    </linearGradient>
                  </defs>
                  <XAxis 
                    dataKey="period" 
                    axisLine={false}
                    tickLine={false}
                    className="text-muted-foreground text-xs"
                  />
                  <YAxis 
                    axisLine={false}
                    tickLine={false}
                    className="text-muted-foreground text-xs"
                    tickFormatter={(value) => formatCurrency(value).replace(/\s/, '').slice(0, -3) + 'k'}
                  />
                  <Area
                    type="monotone"
                    dataKey="projected"
                    stroke="#dc2626"
                    strokeWidth={3}
                    fill="url(#expenseProjectionGradient)"
                    dot={{ fill: '#dc2626', strokeWidth: 2, r: 4 }}
                    activeDot={{ r: 6, strokeWidth: 0, fill: '#dc2626' }}
                  />
                  <CustomTooltip chartType="expense_projection" />
                </AreaChart>
              ) : (
                <LineChart data={sampleData}>
                  <XAxis 
                    dataKey="period" 
                    axisLine={false}
                    tickLine={false}
                    className="text-muted-foreground text-xs"
                  />
                  <YAxis 
                    axisLine={false}
                    tickLine={false}
                    className="text-muted-foreground text-xs"
                    tickFormatter={(value) => formatCurrency(value).replace(/\s/, '').slice(0, -3) + 'k'}
                  />
                  <Line
                    type="monotone"
                    dataKey="projected"
                    stroke="#dc2626"
                    strokeWidth={3}
                    dot={{ fill: '#dc2626', strokeWidth: 2, r: 4 }}
                    activeDot={{ r: 6, strokeWidth: 0, fill: '#dc2626' }}
                  />
                  <CustomTooltip chartType="expense_projection" />
                </LineChart>
              )}
            </ResponsiveContainer>
          ) : (
            <div className="h-full flex items-center justify-center text-muted-foreground">
              <div className="text-center">
                <p className="text-sm mb-2">Nenhuma projeção de despesas disponível</p>
                <p className="text-xs">Adicione transações futuras de despesas no Fluxo de Caixa</p>
              </div>
            </div>
          )}
        </div>

        {/* Projection Info */}
        <div className="mt-4 p-3 bg-secondary/20 rounded-lg">
          <div className="flex items-center gap-2 mb-2">
            <Calendar className="w-4 h-4 text-destructive" />
            <span className="text-sm font-medium text-foreground">
              Informações da Projeção de Despesas
            </span>
          </div>
          <p className="text-xs text-muted-foreground">
            {type === 'annual' 
              ? 'Projeção de despesas baseada APENAS em transações futuras registradas no Fluxo de Caixa. Utilize o botão "Adicionar Transação" para incluir projeções de gastos.'
              : 'Detalhamento mensal das despesas futuras registradas. Utilize o botão "Adicionar Transação" no Fluxo de Caixa para personalizar estas projeções de gastos.'
            }
          </p>
        </div>
      </CardContent>
    </Card>
  );
};