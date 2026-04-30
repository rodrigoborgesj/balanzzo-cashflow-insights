import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { TrendingUp, Users, Building2, ShoppingCart, Briefcase, Package, CreditCard, DollarSign, Receipt, Banknote, Wallet, HandCoins, Landmark } from 'lucide-react';
import { useMemo } from 'react';

interface Transaction {
  id: string;
  data_transacao: string;
  tipo: string;
  valor: number;
  categoria_final?: string | null;
  categoria_sugerida?: string | null;
}

interface IncomeRankingProps {
  transactions: Transaction[];
  selectedMonth: string;
  formatCurrency: (value: number) => string;
  limit?: number;
}

const getCategoryIcon = (category: string) => {
  const c = category.toLowerCase();
  if (c.includes('venda') || c.includes('produto') || c.includes('mercadoria')) return ShoppingCart;
  if (c.includes('serviço') || c.includes('servico') || c.includes('consultoria')) return Briefcase;
  if (c.includes('cliente') || c.includes('contrato')) return Users;
  if (c.includes('comissão') || c.includes('comissao')) return HandCoins;
  if (c.includes('investimento') || c.includes('rendimento') || c.includes('juros') || c.includes('aplicação') || c.includes('aplicacao')) return Landmark;
  if (c.includes('aluguel') || c.includes('locação') || c.includes('locacao')) return Building2;
  if (c.includes('reembolso') || c.includes('estorno')) return Receipt;
  if (c.includes('pix') || c.includes('transferência') || c.includes('transferencia') || c.includes('ted') || c.includes('doc')) return Banknote;
  if (c.includes('cartão') || c.includes('cartao') || c.includes('crédito') || c.includes('credito')) return CreditCard;
  if (c.includes('receita') || c.includes('entrada') || c.includes('faturamento')) return Wallet;
  if (c.includes('produto') || c.includes('estoque')) return Package;
  return DollarSign;
};

export const IncomeRanking = ({ transactions, selectedMonth, formatCurrency, limit = 5 }: IncomeRankingProps) => {
  const incomeData = useMemo(() => {
    const [year, month] = selectedMonth.split('-').map(Number);

    const monthIncomes = transactions.filter(t => {
      if (t.tipo !== 'entrada') return false;
      const transDate = new Date(t.data_transacao);
      return transDate.getFullYear() === year && (transDate.getMonth() + 1) === month;
    });

    const categoryTotals: Record<string, { total: number; count: number }> = {};

    monthIncomes.forEach(t => {
      const category = t.categoria_final || t.categoria_sugerida || 'Outros';
      if (!categoryTotals[category]) {
        categoryTotals[category] = { total: 0, count: 0 };
      }
      categoryTotals[category].total += Math.abs(t.valor);
      categoryTotals[category].count += 1;
    });

    const totalIncome = Object.values(categoryTotals).reduce((sum, c) => sum + c.total, 0);

    return Object.entries(categoryTotals)
      .map(([category, data]) => ({
        category,
        amount: data.total,
        count: data.count,
        percentage: totalIncome > 0 ? (data.total / totalIncome) * 100 : 0,
        Icon: getCategoryIcon(category)
      }))
      .sort((a, b) => b.amount - a.amount)
      .slice(0, limit);
  }, [transactions, selectedMonth, limit]);

  if (incomeData.length === 0) {
    return (
      <Card className="border-0 shadow-lg bg-card">
        <CardHeader className="pb-3">
          <CardTitle className="text-lg font-semibold flex items-center gap-2">
            <TrendingUp className="w-5 h-5 text-success" />
            Ranking de Receitas
          </CardTitle>
        </CardHeader>
        <CardContent className="py-8 text-center">
          <TrendingUp className="w-10 h-10 text-muted-foreground mx-auto mb-2" />
          <p className="text-muted-foreground">Nenhuma receita neste mês</p>
        </CardContent>
      </Card>
    );
  }

  const maxAmount = incomeData[0]?.amount || 1;

  return (
    <Card className="border-0 shadow-lg bg-card">
      <CardHeader className="pb-3">
        <CardTitle className="text-lg font-semibold flex items-center gap-2">
          <TrendingUp className="w-5 h-5 text-success" />
          Ranking de Receitas
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {incomeData.map((item, index) => {
          const IconComponent = item.Icon;
          const barWidth = (item.amount / maxAmount) * 100;

          return (
            <div key={item.category} className="group">
              <div className="flex items-center gap-3">
                <div className="w-6 h-6 rounded-full bg-success/10 flex items-center justify-center flex-shrink-0">
                  <span className="text-xs font-bold text-success">{index + 1}</span>
                </div>

                <div className="w-10 h-10 rounded-xl bg-muted flex items-center justify-center flex-shrink-0 group-hover:bg-success/10 transition-colors">
                  <IconComponent className="w-5 h-5 text-success" />
                </div>

                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-sm font-medium text-foreground truncate">
                      {item.category}
                    </span>
                    <span className="text-sm font-bold text-foreground ml-2">
                      {formatCurrency(item.amount)}
                    </span>
                  </div>

                  <div className="h-2 bg-muted rounded-full overflow-hidden">
                    <div
                      className="h-full rounded-full bg-gradient-to-r from-success to-success/70 transition-all duration-700 ease-out"
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
