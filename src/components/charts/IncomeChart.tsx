import { ResponsiveContainer, PieChart as RechartsPieChart, Pie, Cell } from 'recharts';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { PieChart } from 'lucide-react';
import { CustomTooltip } from '@/components/CustomTooltip';

interface IncomeChartProps {
  data: Array<{ name: string; value: number; color?: string }>;
  formatCurrency: (value: number) => string;
}

export const IncomeChart = ({ data, formatCurrency }: IncomeChartProps) => {
  // Use brand colors for income chart
  const brandColors = ['#1A3423', '#A9C7A1', '#E4F8CA', '#E9E9E9', '#E0E0E0'];
  
  const chartData = data.map((item, index) => ({
    ...item,
    color: brandColors[index % brandColors.length]
  }));

  const total = chartData.reduce((sum, item) => sum + item.value, 0);

  if (total === 0) {
    return (
      <Card className="dashboard-card animate-slide-in">
        <CardHeader className="pb-4">
          <CardTitle className="flex items-center gap-2 text-foreground">
            <PieChart className="w-5 h-5 text-primary" />
            Receitas por Tipo
          </CardTitle>
        </CardHeader>
        <CardContent className="flex items-center justify-center h-64">
          <div className="text-center">
            <PieChart className="w-12 h-12 text-muted-foreground mx-auto mb-2" />
            <p className="text-muted-foreground">Nenhuma receita encontrada</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="dashboard-card animate-slide-in">
      <CardHeader className="pb-4">
        <CardTitle className="flex items-center gap-2 text-foreground">
          <PieChart className="w-5 h-5 text-primary" />
          Receitas por Tipo
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Chart */}
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <RechartsPieChart>
                <Pie
                  data={chartData}
                  cx="50%"
                  cy="50%"
                  innerRadius={40}
                  outerRadius={80}
                  paddingAngle={2}
                  dataKey="value"
                  stroke="none"
                  animationBegin={0}
                  animationDuration={1000}
                >
                  {chartData.map((entry, index) => (
                    <Cell 
                      key={`cell-${index}`} 
                      fill={entry.color}
                      className="hover:opacity-80 transition-opacity duration-200"
                    />
                  ))}
                </Pie>
                <CustomTooltip chartType="income" />
              </RechartsPieChart>
            </ResponsiveContainer>
          </div>

          {/* Legend */}
          <div className="space-y-3">
            {chartData.map((item, index) => (
              <div key={item.name} className="flex items-center gap-3 group cursor-pointer">
                <div 
                  className="w-4 h-4 rounded-full flex-shrink-0 group-hover:scale-110 transition-transform duration-200"
                  style={{ backgroundColor: item.color }}
                />
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium text-foreground truncate">
                      {item.name}
                    </span>
                    <span className="text-sm font-bold text-primary ml-2">
                      {formatCurrency(item.value)}
                    </span>
                  </div>
                  <div className="text-xs text-muted-foreground">
                    {((item.value / total) * 100).toFixed(1)}% do total
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </CardContent>
    </Card>
  );
};