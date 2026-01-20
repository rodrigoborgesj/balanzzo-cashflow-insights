import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { ArrowUpRight, ArrowDownRight, Receipt, Users, Building2, Truck, Zap, ShoppingCart, Wrench, FileText, CreditCard, Briefcase, Package, Phone, Wifi, Car, Home, Coffee, Utensils, HeartPulse, GraduationCap, Plane, DollarSign } from 'lucide-react';
import { useMemo } from 'react';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';

interface Transaction {
  id: string;
  data_transacao: string;
  tipo: string;
  valor: number;
  descricao?: string | null;
  categoria_final?: string | null;
  categoria_sugerida?: string | null;
}

interface RecentTransactionsProps {
  transactions: Transaction[];
  formatCurrency: (value: number) => string;
  limit?: number;
}

// Map categories to icons
const getCategoryIcon = (category: string, tipo: string) => {
  const lowerCategory = category.toLowerCase();
  
  if (tipo === 'entrada') {
    return ArrowUpRight;
  }
  
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
  
  // Default icon for expenses
  return DollarSign;
};

export const RecentTransactions = ({ transactions, formatCurrency, limit = 7 }: RecentTransactionsProps) => {
  const recentTransactions = useMemo(() => {
    return [...transactions]
      .sort((a, b) => new Date(b.data_transacao).getTime() - new Date(a.data_transacao).getTime())
      .slice(0, limit)
      .map(t => ({
        ...t,
        category: t.categoria_final || t.categoria_sugerida || 'Outros',
        Icon: getCategoryIcon(t.categoria_final || t.categoria_sugerida || 'Outros', t.tipo)
      }));
  }, [transactions, limit]);

  if (recentTransactions.length === 0) {
    return (
      <Card className="border-0 shadow-lg bg-card">
        <CardHeader className="pb-3">
          <CardTitle className="text-lg font-semibold flex items-center gap-2">
            <Receipt className="w-5 h-5 text-primary" />
            Transações Recentes
          </CardTitle>
        </CardHeader>
        <CardContent className="py-8 text-center">
          <Receipt className="w-10 h-10 text-muted-foreground mx-auto mb-2" />
          <p className="text-muted-foreground">Nenhuma transação encontrada</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="border-0 shadow-lg bg-card">
      <CardHeader className="pb-3">
        <CardTitle className="text-lg font-semibold flex items-center gap-2">
          <Receipt className="w-5 h-5 text-primary" />
          Transações Recentes
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        {recentTransactions.map((transaction) => {
          const IconComponent = transaction.Icon;
          const isIncome = transaction.tipo === 'entrada';
          
          return (
            <div 
              key={transaction.id} 
              className="flex items-center gap-3 p-2 rounded-lg hover:bg-muted/50 transition-colors group"
            >
              {/* Icon */}
              <div className={`w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0 ${
                isIncome ? 'bg-success/10' : 'bg-muted'
              } group-hover:scale-105 transition-transform`}>
                <IconComponent className={`w-5 h-5 ${
                  isIncome ? 'text-success' : 'text-primary'
                }`} />
              </div>
              
              {/* Content */}
              <div className="flex-1 min-w-0">
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium text-foreground truncate">
                    {transaction.descricao || transaction.category}
                  </span>
                  <span className={`text-sm font-bold ml-2 ${
                    isIncome ? 'text-success' : 'text-foreground'
                  }`}>
                    {isIncome ? '+' : '-'}{formatCurrency(Math.abs(transaction.valor))}
                  </span>
                </div>
                <div className="flex items-center justify-between mt-0.5">
                  <span className="text-xs text-muted-foreground truncate">
                    {transaction.category}
                  </span>
                  <span className="text-xs text-muted-foreground">
                    {format(new Date(transaction.data_transacao), "dd MMM", { locale: ptBR })}
                  </span>
                </div>
              </div>
            </div>
          );
        })}
      </CardContent>
    </Card>
  );
};
