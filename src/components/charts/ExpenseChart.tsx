import { ResponsiveContainer, BarChart, Bar, XAxis, YAxis, Cell } from 'recharts';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { BarChart3 } from 'lucide-react';
import { CustomTooltip } from '@/components/CustomTooltip';

interface ExpenseChartProps {
  data: Array<{ name: string; value: number; color?: string }>;
  formatCurrency: (value: number) => string;
}

export const ExpenseChart = ({ data, formatCurrency }: ExpenseChartProps) => {
  // Strictly limit to maximum 5 categories only
  const top5Data = data.slice(0, 5).map((item, index) => ({
    ...item,
    color: index === 0 ? '#1A3423' : '#A9C7A1' // Primary green for top, medium green for others
  }));

  // Ensure we never show more than 5 categories
  if (top5Data.length > 5) {
    console.warn('ExpenseChart: Data exceeds 5 categories, truncating to 5');
  }

  const maxValue = Math.max(...top5Data.map(item => item.value));

  return (
    <Card className="dashboard-card animate-slide-in">
      <CardHeader className="pb-4">
        <CardTitle className="flex items-center gap-2 text-foreground">
          <BarChart3 className="w-5 h-5 text-primary" />
          Top 5 Despesas por Categoria
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Custom horizontal bars */}
        <div className="space-y-3">
          {top5Data.map((item, index) => (
            <div key={item.name} className="group">
              <div className="flex items-center justify-between mb-1">
                <span className="text-sm font-medium text-foreground">{item.name}</span>
                <span className="text-sm font-bold text-primary">{formatCurrency(item.value)}</span>
              </div>
              <div className="relative">
                <div className="h-3 bg-muted rounded-full overflow-hidden">
                  <div 
                    className="h-full rounded-full transition-all duration-1000 ease-out"
                    style={{
                      width: `${(item.value / maxValue) * 100}%`,
                      backgroundColor: item.color,
                      animationDelay: `${index * 100}ms`
                    }}
                  />
                </div>
                <div className="absolute -top-1 -bottom-1 -left-1 -right-1 rounded-full opacity-0 group-hover:opacity-100 transition-opacity duration-200">
                  <div className="absolute inset-0 rounded-full bg-primary/10 animate-pulse" />
                </div>
              </div>
              <div className="text-xs text-muted-foreground mt-1">
                {((item.value / top5Data.reduce((sum, d) => sum + d.value, 0)) * 100).toFixed(1)}% do total
              </div>
            </div>
          ))}
        </div>

        {/* Recharts version for tooltip interaction */}
        <div className="h-64 mt-6">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={top5Data} layout="horizontal">
              <XAxis type="number" hide />
              <YAxis 
                type="category" 
                dataKey="name" 
                axisLine={false}
                tickLine={false}
                className="text-muted-foreground text-xs"
                width={80}
              />
              <Bar 
                dataKey="value" 
                radius={[0, 4, 4, 0]}
                cursor="pointer"
              >
                {top5Data.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={entry.color} />
                ))}
              </Bar>
              <CustomTooltip chartType="expense" />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </CardContent>
    </Card>
  );
};