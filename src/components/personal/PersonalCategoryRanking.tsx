import { TrendingUp, TrendingDown } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

interface CategoryTotal {
  categoryId: string | null;
  categoryName: string;
  categoryColor: string;
  total: number;
  count: number;
}

interface PersonalCategoryRankingProps {
  title: string;
  data: CategoryTotal[];
  type: 'income' | 'expense';
}

const formatCurrency = (value: number) => {
  return new Intl.NumberFormat('pt-BR', {
    style: 'currency',
    currency: 'BRL',
  }).format(value);
};

export function PersonalCategoryRanking({ title, data, type }: PersonalCategoryRankingProps) {
  const Icon = type === 'income' ? TrendingUp : TrendingDown;
  const iconColor = type === 'income' ? 'text-green-500' : 'text-red-500';
  const maxValue = data.length > 0 ? Math.max(...data.map(d => d.total)) : 0;

  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="text-base font-semibold flex items-center gap-2">
          <Icon className={`h-4 w-4 ${iconColor}`} />
          {title}
        </CardTitle>
      </CardHeader>
      <CardContent>
        {data.length === 0 ? (
          <p className="text-sm text-muted-foreground text-center py-4">
            Nenhum dado disponível
          </p>
        ) : (
          <div className="space-y-3">
            {data.map((item, index) => (
              <div key={item.categoryId || index} className="space-y-1">
                <div className="flex items-center justify-between text-sm">
                  <div className="flex items-center gap-2">
                    <div 
                      className="w-3 h-3 rounded-full"
                      style={{ backgroundColor: item.categoryColor }}
                    />
                    <span className="font-medium truncate max-w-[120px]">
                      {item.categoryName}
                    </span>
                  </div>
                  <span className="font-semibold">
                    {formatCurrency(item.total)}
                  </span>
                </div>
                <div className="h-2 bg-muted rounded-full overflow-hidden">
                  <div 
                    className="h-full rounded-full transition-all duration-500"
                    style={{ 
                      width: `${(item.total / maxValue) * 100}%`,
                      backgroundColor: item.categoryColor
                    }}
                  />
                </div>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
