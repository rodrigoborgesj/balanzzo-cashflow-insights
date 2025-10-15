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
          value: value,
          rawValue: formatCurrency(value),
          description: `Valor exato da despesa nesta categoria`,
          details: [
            `Valor exato: ${formatCurrency(value)}`,
            `Percentual do total: ${((value / (payload[0].payload?.total || value)) * 100).toFixed(1)}%`,
            'Fonte: Transações conciliadas'
          ]
        };
      
      case 'income':
        return {
          title: `Receita: ${category}`,
          value: value,
          rawValue: formatCurrency(value),
          description: `Valor exato da receita nesta categoria`,
          details: [
            `Valor exato: ${formatCurrency(value)}`,
            `Percentual do total: ${((value / (payload[0].payload?.total || value)) * 100).toFixed(1)}%`,
            'Fonte: Transações de entrada'
          ]
        };
      
      case 'monthly':
        return {
          title: `Movimento: ${label}`,
          value: value,
          rawValue: formatCurrency(value),
          description: `Valores exatos do mês ${label}`,
          details: [
            `Entradas: ${formatCurrency(data.payload?.entradas || 0)}`,
            `Saídas: ${formatCurrency(data.payload?.saidas || 0)}`,
            `Saldo: ${formatCurrency((data.payload?.entradas || 0) - (data.payload?.saidas || 0))}`
          ]
        };
      
      case 'projection':
        // Valores exatos de realizado e projetado
        const realizedValue = payload.find(p => p.dataKey === 'realizado')?.value || 0;
        const projectedValue = payload.find(p => p.dataKey === 'projetado')?.value || 0;
        return {
          title: `Data: ${label}`,
          value: realizedValue,
          rawValue: formatCurrency(realizedValue),
          projectedValue: projectedValue,
          projectedRaw: formatCurrency(projectedValue),
          description: `Valores exatos esperados para esta data`,
          details: [
            `Realizado: ${formatCurrency(realizedValue)}`,
            `Projetado: ${formatCurrency(projectedValue)}`,
            `Diferença: ${formatCurrency(Math.abs(realizedValue - projectedValue))}`
          ]
        };
      
      case 'expense_projection':
        // Valores exatos de despesas realizadas e projetadas
        const realizedExpense = payload.find(p => p.dataKey === 'realizado')?.value || 0;
        const projectedExpense = payload.find(p => p.dataKey === 'projetado')?.value || 0;
        return {
          title: `Data: ${label}`,
          value: realizedExpense,
          rawValue: formatCurrency(realizedExpense),
          projectedValue: projectedExpense,
          projectedRaw: formatCurrency(projectedExpense),
          description: `Valores exatos de despesas para esta data`,
          details: [
            `Despesa Realizada: ${formatCurrency(realizedExpense)}`,
            `Despesa Projetada: ${formatCurrency(projectedExpense)}`,
            `Diferença: ${formatCurrency(Math.abs(realizedExpense - projectedExpense))}`
          ]
        };
      
      default:
        return {
          title: category,
          value: value,
          rawValue: formatCurrency(value),
          description: 'Valor exato da transação',
          details: [`Valor exato: ${formatCurrency(value)}`]
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
          <p className="text-2xl font-bold text-primary">{content.rawValue || formatCurrency(content.value)}</p>
        </div>
        
        {/* Valores projetados (se existirem) */}
        {content.projectedValue !== undefined && (
          <div className="bg-blue-50 dark:bg-blue-950 p-2 rounded-lg">
            <p className="text-xs text-blue-600 dark:text-blue-400 font-medium mb-1">Projetado</p>
            <p className="text-lg font-bold text-blue-700 dark:text-blue-300">
              {content.projectedRaw || formatCurrency(content.projectedValue)}
            </p>
          </div>
        )}
        
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