import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell } from 'recharts';

interface FixedExpense {
  id: string;
  description: string;
  amount: number;
  payment_day: number;
  category?: string;
}

interface PersonalFixedExpensesChartProps {
  fixedExpenses: FixedExpense[];
}

export function PersonalFixedExpensesChart({ fixedExpenses }: PersonalFixedExpensesChartProps) {
  const totalFixed = fixedExpenses.reduce((sum, exp) => sum + Number(exp.amount), 0);
  
  const chartData = fixedExpenses.map(expense => ({
    name: expense.description.length > 15 
      ? expense.description.substring(0, 15) + '...' 
      : expense.description,
    fullName: expense.description,
    value: Number(expense.amount),
    day: expense.payment_day
  })).sort((a, b) => b.value - a.value).slice(0, 8);

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL'
    }).format(value);
  };

  const colors = [
    'hsl(var(--primary))',
    'hsl(var(--chart-2))',
    'hsl(var(--chart-3))',
    'hsl(var(--chart-4))',
    'hsl(var(--chart-5))',
    'hsl(220, 70%, 50%)',
    'hsl(280, 60%, 55%)',
    'hsl(320, 60%, 50%)'
  ];

  if (fixedExpenses.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Contas Fixas Mensais</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-muted-foreground text-center py-8">
            Nenhuma conta fixa cadastrada
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader className="pb-2">
        <div className="flex items-center justify-between">
          <CardTitle className="text-lg">Contas Fixas Mensais</CardTitle>
          <span className="text-lg font-bold text-destructive">
            {formatCurrency(totalFixed)}
          </span>
        </div>
      </CardHeader>
      <CardContent>
        <ResponsiveContainer width="100%" height={250}>
          <BarChart data={chartData} layout="vertical" margin={{ left: 10, right: 20 }}>
            <XAxis type="number" tickFormatter={(value) => formatCurrency(value)} fontSize={11} />
            <YAxis type="category" dataKey="name" width={100} fontSize={11} />
            <Tooltip 
              formatter={(value: number, name: string, props: any) => [
                formatCurrency(value), 
                `${props.payload.fullName} (dia ${props.payload.day})`
              ]}
              contentStyle={{ 
                backgroundColor: 'hsl(var(--background))',
                border: '1px solid hsl(var(--border))',
                borderRadius: '8px'
              }}
            />
            <Bar dataKey="value" radius={[0, 4, 4, 0]}>
              {chartData.map((_, index) => (
                <Cell key={`cell-${index}`} fill={colors[index % colors.length]} />
              ))}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </CardContent>
    </Card>
  );
}
