import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { TrendingDown, Users, Building2, Truck, Zap, ShoppingCart, Wrench, FileText, CreditCard, Briefcase, Package, Phone, Wifi, Car, Home, Coffee, Utensils, HeartPulse, GraduationCap, Plane, Receipt, DollarSign } from 'lucide-react';
import { useMemo } from 'react';

interface Transaction {
  id: string;
  data_transacao: string;
  tipo: string;
  valor: number;
  categoria_final?: string | null;
  categoria_sugerida?: string | null;
}

interface ExpenseRankingProps {
  transactions: Transaction[];
  selectedMonth: string;
  formatCurrency: (value: number) => string;
  limit?: number;
}

// Map categories to icons
const getCategoryIcon = (category: string) => {
  const lowerCategory = category.toLowerCase();
  
  if (lowerCategory.includes('pessoal') || lowerCategory.includes('salário') || lowerCategory.includes('salario') || lowerCategory.includes('funcionário') || lowerCategory.includes('funcionario') || lowerCategory.includes('rh')) {
    return Users;
  }
  if (lowerCategory.includes('aluguel') || lowerCategory.includes('imóvel') || lowerCategory.includes('imovel') || lowerCategory.includes('condomínio') || lowerCategory.includes('condominio')) {
    return Home;
  }
  if (lowerCategory.includes('transporte') || lowerCategory.includes('combustível') || lowerCategory.includes('combustivel') || lowerCategory.includes('frota') || lowerCategory.includes('veículo') || lowerCategory.includes('veiculo')) {
    return Car;
  }
  if (lowerCategory.includes('energia') || lowerCategory.includes('luz') || lowerCategory.includes('elétrica') || lowerCategory.includes('eletrica')) {
    return Zap;
  }
  if (lowerCategory.includes('internet') || lowerCategory.includes('telecomunicação') || lowerCategory.includes('telecomunicacao') || lowerCategory.includes('telefone')) {
    return Wifi;
  }
  if (lowerCategory.includes('fornecedor') || lowerCategory.includes('mercadoria') || lowerCategory.includes('estoque') || lowerCategory.includes('compra')) {
    return Package;
  }
  if (lowerCategory.includes('serviço') || lowerCategory.includes('servico') || lowerCategory.includes('manutenção') || lowerCategory.includes('manutencao') || lowerCategory.includes('reparo')) {
    return Wrench;
  }
  if (lowerCategory.includes('imposto') || lowerCategory.includes('taxa') || lowerCategory.includes('tributo') || lowerCategory.includes('fiscal')) {
    return FileText;
  }
  if (lowerCategory.includes('banco') || lowerCategory.includes('juros') || lowerCategory.includes('empréstimo') || lowerCategory.includes('emprestimo') || lowerCategory.includes('financeiro')) {
    return CreditCard;
  }
  if (lowerCategory.includes('marketing') || lowerCategory.includes('propaganda') || lowerCategory.includes('publicidade')) {
    return Briefcase;
  }
  if (lowerCategory.includes('alimentação') || lowerCategory.includes('alimentacao') || lowerCategory.includes('refeição') || lowerCategory.includes('refeicao') || lowerCategory.includes('restaurante')) {
    return Utensils;
  }
  if (lowerCategory.includes('saúde') || lowerCategory.includes('saude') || lowerCategory.includes('médico') || lowerCategory.includes('medico') || lowerCategory.includes('plano')) {
    return HeartPulse;
  }
  if (lowerCategory.includes('educação') || lowerCategory.includes('educacao') || lowerCategory.includes('treinamento') || lowerCategory.includes('curso')) {
    return GraduationCap;
  }
  if (lowerCategory.includes('viagem') || lowerCategory.includes('hospedagem') || lowerCategory.includes('passagem')) {
    return Plane;
  }
  if (lowerCategory.includes('despesa') || lowerCategory.includes('gasto') || lowerCategory.includes('custo')) {
    return Receipt;
  }
  
  // Default icon
  return DollarSign;
};

export const ExpenseRanking = ({ transactions, selectedMonth, formatCurrency, limit = 5 }: ExpenseRankingProps) => {
  const expenseData = useMemo(() => {
    // Filter expenses for the selected month
    const [year, month] = selectedMonth.split('-').map(Number);
    
    const monthExpenses = transactions.filter(t => {
      if (t.tipo !== 'saida') return false;
      const transDate = new Date(t.data_transacao);
      return transDate.getFullYear() === year && (transDate.getMonth() + 1) === month;
    });

    // Group by category
    const categoryTotals: Record<string, { total: number; count: number }> = {};
    
    monthExpenses.forEach(t => {
      const category = t.categoria_final || t.categoria_sugerida || 'Outros';
      if (!categoryTotals[category]) {
        categoryTotals[category] = { total: 0, count: 0 };
      }
      categoryTotals[category].total += Math.abs(t.valor);
      categoryTotals[category].count += 1;
    });

    // Convert to array and sort
    const totalExpenses = Object.values(categoryTotals).reduce((sum, c) => sum + c.total, 0);
    
    return Object.entries(categoryTotals)
      .map(([category, data]) => ({
        category,
        amount: data.total,
        count: data.count,
        percentage: totalExpenses > 0 ? (data.total / totalExpenses) * 100 : 0,
        Icon: getCategoryIcon(category)
      }))
      .sort((a, b) => b.amount - a.amount)
      .slice(0, limit);
  }, [transactions, selectedMonth, limit]);

  if (expenseData.length === 0) {
    return (
      <Card className="border-0 shadow-lg bg-card">
        <CardHeader className="pb-3">
          <CardTitle className="text-lg font-semibold flex items-center gap-2">
            <TrendingDown className="w-5 h-5 text-primary" />
            Ranking de Despesas
          </CardTitle>
        </CardHeader>
        <CardContent className="py-8 text-center">
          <TrendingDown className="w-10 h-10 text-muted-foreground mx-auto mb-2" />
          <p className="text-muted-foreground">Nenhuma despesa neste mês</p>
        </CardContent>
      </Card>
    );
  }

  const maxAmount = expenseData[0]?.amount || 1;

  return (
    <Card className="border-0 shadow-lg bg-card">
      <CardHeader className="pb-3">
        <CardTitle className="text-lg font-semibold flex items-center gap-2">
          <TrendingDown className="w-5 h-5 text-primary" />
          Ranking de Despesas
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {expenseData.map((item, index) => {
          const IconComponent = item.Icon;
          const barWidth = (item.amount / maxAmount) * 100;
          
          return (
            <div key={item.category} className="group">
              <div className="flex items-center gap-3">
                {/* Rank number */}
                <div className="w-6 h-6 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0">
                  <span className="text-xs font-bold text-primary">{index + 1}</span>
                </div>
                
                {/* Icon */}
                <div className="w-10 h-10 rounded-xl bg-muted flex items-center justify-center flex-shrink-0 group-hover:bg-primary/10 transition-colors">
                  <IconComponent className="w-5 h-5 text-primary" />
                </div>
                
                {/* Content */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-sm font-medium text-foreground truncate">
                      {item.category}
                    </span>
                    <span className="text-sm font-bold text-foreground ml-2">
                      {formatCurrency(item.amount)}
                    </span>
                  </div>
                  
                  {/* Progress bar */}
                  <div className="h-2 bg-muted rounded-full overflow-hidden">
                    <div 
                      className="h-full rounded-full bg-gradient-to-r from-primary to-primary/70 transition-all duration-700 ease-out"
                      style={{ width: `${barWidth}%` }}
                    />
                  </div>
                  
                  <div className="flex items-center justify-between mt-1">
                    <span className="text-xs text-muted-foreground">
                      {item.count} transaç{item.count === 1 ? 'ão' : 'ões'}
                    </span>
                    <span className="text-xs text-muted-foreground">
                      {item.percentage.toFixed(1)}%
                    </span>
                  </div>
                </div>
              </div>
            </div>
          );
        })}
      </CardContent>
    </Card>
  );
};
