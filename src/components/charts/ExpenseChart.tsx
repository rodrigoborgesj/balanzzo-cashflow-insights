import { ResponsiveContainer, BarChart, Bar, XAxis, YAxis, Cell, Tooltip } from 'recharts';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { BarChart3 } from 'lucide-react';
import { getTop5ExpensesByCategory, formatBRL, type Transaction } from '@/utils/expenseAnalytics';
import { useMemo } from 'react';

interface ExpenseChartProps {
  transactions: Transaction[];
  selectedMonth: string;
  formatCurrency: (value: number) => string;
}

export const ExpenseChart = ({ transactions, selectedMonth, formatCurrency }: ExpenseChartProps) => {
  // Process data using the pure function with strict 5-category limit
  const expenseData = useMemo(() => {
    const categories = getTop5ExpensesByCategory(transactions, selectedMonth);
    
    return categories.map((item, index) => ({
      name: item.category.charAt(0).toUpperCase() + item.category.slice(1), // Capitalize first letter
      value: item.amount,
      percent: item.percent,
      color: index === 0 ? '#1A3423' : '#A9C7A1' // Primary green for top, medium green for others
    }));
  }, [transactions, selectedMonth]);

  // Early return for empty state
  if (expenseData.length === 0) {
    return (
      <Card className="dashboard-card animate-slide-in">
        <CardHeader className="pb-4">
          <CardTitle className="flex items-center gap-2 text-foreground">
            <BarChart3 className="w-5 h-5 text-primary" />
            Top 5 Despesas por Categoria
          </CardTitle>
        </CardHeader>
        <CardContent className="flex items-center justify-center py-8">
          <p className="text-muted-foreground text-center">
            Sem despesas registradas neste mês.
          </p>
        </CardContent>
      </Card>
    );
  }

  const maxValue = Math.max(...expenseData.map(item => item.value));

  // Custom tooltip component
  const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      const data = payload[0].payload;
      return (
        <div className="bg-popover border border-border rounded-lg p-3 shadow-lg">
          <p className="font-semibold text-foreground">{data.name}</p>
          <p className="text-primary font-bold">{formatBRL(data.value)}</p>
          <p className="text-muted-foreground text-sm">{data.percent}% do total mensal</p>
        </div>
      );
    }
    return null;
  };

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
          {expenseData.map((item, index) => (
            <div key={item.name} className="group">
              <div className="flex items-center justify-between mb-1">
                <span className="text-sm font-medium text-foreground">{item.name}</span>
                <span className="text-sm font-bold text-primary">{formatBRL(item.value)}</span>
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
                {item.percent}% do total mensal
              </div>
            </div>
          ))}
        </div>

        {/* Recharts version for tooltip interaction */}
        <div className="h-64 mt-6">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={expenseData} layout="horizontal">
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
                {expenseData.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={entry.color} />
                ))}
              </Bar>
              <Tooltip content={<CustomTooltip />} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </CardContent>
    </Card>
  );
};