// formatCurrency utility function
const formatCurrency = (value: number) => {
  return new Intl.NumberFormat('pt-BR', {
    style: 'currency',
    currency: 'BRL'
  }).format(value);
};

interface CustomTooltipProps {
  active?: boolean;
  payload?: any[];
  label?: string;
  chartType?: 'expense' | 'income' | 'monthly' | 'projection' | 'expense_projection';
}

export const CustomTooltip = ({ active, payload, label, chartType }: CustomTooltipProps) => {
  if (!active || !payload || !payload.length) return null;

  const data = payload[0];
  const value = data.value;
  const category = data.payload?.name || label;

  const getTooltipContent = () => {
    switch (chartType) {
      case 'expense':
        return {
          title: `Despesa: ${category}`,
          value: formatCurrency(value),
          description: `Esta categoria representa ${((value / (payload[0].payload?.total || value)) * 100).toFixed(1)}% do total de despesas do mês. Baseado no histórico de transações categorizadas automaticamente pelo sistema.`,
          details: [
            `Valor total: ${formatCurrency(value)}`,
            `Percentual do total: ${((value / (payload[0].payload?.total || value)) * 100).toFixed(1)}%`,
            'Fonte: Transações conciliadas'
          ]
        };
      
      case 'income':
        return {
          title: `Receita: ${category}`,
          value: formatCurrency(value),
          description: `Esta fonte de receita contribui com ${((value / (payload[0].payload?.total || value)) * 100).toFixed(1)}% do total de entradas do mês. Dados extraídos do seu histórico financeiro.`,
          details: [
            `Valor total: ${formatCurrency(value)}`,
            `Percentual do total: ${((value / (payload[0].payload?.total || value)) * 100).toFixed(1)}%`,
            'Fonte: Transações de entrada'
          ]
        };
      
      case 'monthly':
        return {
          title: `Movimento: ${label}`,
          value: formatCurrency(value),
          description: `Dados consolidados do mês ${label}. Valores calculados a partir de todas as transações processadas e conciliadas no período.`,
          details: [
            `Entradas: ${formatCurrency(data.payload?.entradas || 0)}`,
            `Saídas: ${formatCurrency(data.payload?.saidas || 0)}`,
            `Saldo: ${formatCurrency((data.payload?.entradas || 0) - (data.payload?.saidas || 0))}`
          ]
        };
      
      case 'projection':
        return {
          title: `Projeção: ${label}`,
          value: formatCurrency(value),
          description: `Projeção baseada EXCLUSIVAMENTE em transações futuras registradas no Fluxo de Caixa através do botão "Adicionar Transação". Não inclui dados históricos.`,
          details: [
            `Valor projetado: ${formatCurrency(value)}`,
            `Período: ${label}`,
            'Fonte: Transações futuras manuais'
          ]
        };
      
      case 'expense_projection':
        return {
          title: `Projeção de Despesas: ${label}`,
          value: formatCurrency(value),
          description: `Projeção de gastos baseada EXCLUSIVAMENTE em despesas futuras registradas no Fluxo de Caixa através do botão "Adicionar Transação". Não inclui dados históricos.`,
          details: [
            `Valor projetado: ${formatCurrency(value)}`,
            `Período: ${label}`,
            'Fonte: Despesas futuras manuais'
          ]
        };
      
      default:
        return {
          title: category,
          value: formatCurrency(value),
          description: 'Informações baseadas no histórico financeiro processado.',
          details: [`Valor: ${formatCurrency(value)}`]
        };
    }
  };

  const content = getTooltipContent();

  return (
    <div className="bg-card border border-border rounded-2xl p-4 shadow-xl max-w-sm">
      <div className="space-y-3">
        {/* Header */}
        <div className="border-b border-border pb-2">
          <h4 className="font-semibold text-foreground text-sm">{content.title}</h4>
          <p className="text-2xl font-bold text-primary">{content.value}</p>
        </div>
        
        {/* Description */}
        <p className="text-sm text-muted-foreground leading-relaxed">
          {content.description}
        </p>
        
        {/* Details */}
        <div className="space-y-1">
          {content.details.map((detail, index) => (
            <div key={index} className="flex items-center text-xs text-muted-foreground">
              <div className="w-1 h-1 bg-primary rounded-full mr-2" />
              {detail}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};