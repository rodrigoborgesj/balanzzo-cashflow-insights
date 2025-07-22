import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { TrendingUp, Calculator, Download, FileSpreadsheet } from "lucide-react";
import { Transaction } from "@/hooks/useConciliacao";
import { exportDREToPDF, exportDREToExcel } from "@/utils/dreExports";

interface DREStatementProps {
  transactions: Transaction[];
  selectedMonth: string;
}

interface DREData {
  grossRevenue: number;
  deductions: number;
  netRevenue: number;
  operatingExpenses: {
    administrative: number;
    commercial: number;
    financial: number;
    other: number;
  };
  operatingResult: number;
  otherIncome: number;
  otherLosses: number;
  netProfit: number;
}

const DRE_CATEGORY_MAPPING = {
  // Revenues
  'Vendas': 'grossRevenue',
  'Receitas': 'grossRevenue',
  'Serviços': 'grossRevenue',
  'Produtos': 'grossRevenue',
  
  // Deductions
  'Impostos': 'deductions',
  'Taxas': 'deductions',
  'Devoluções': 'deductions',
  
  // Operating Expenses
  'Administrativo': 'administrative',
  'Administração': 'administrative',
  'Salários': 'administrative',
  'Aluguel': 'administrative',
  'Utilidades': 'administrative',
  
  'Marketing': 'commercial',
  'Comercial': 'commercial',
  
  'Financeiro': 'financial',
  'Juros': 'financial',
  'Empréstimos': 'financial',
  
  // Other
  'Outros Ganhos': 'otherIncome',
  'Outros': 'other'
};

export function DREStatement({ transactions, selectedMonth }: DREStatementProps) {
  const calculateDRE = (): DREData => {
    const dre: DREData = {
      grossRevenue: 0,
      deductions: 0,
      netRevenue: 0,
      operatingExpenses: {
        administrative: 0,
        commercial: 0,
        financial: 0,
        other: 0
      },
      operatingResult: 0,
      otherIncome: 0,
      otherLosses: 0,
      netProfit: 0
    };

    transactions.forEach(transaction => {
      const category = transaction.categoria_final || transaction.categoria_sugerida || 'Outros';
      const value = transaction.valor;
      
      // Map category to DRE line item
      const mapping = DRE_CATEGORY_MAPPING[category as keyof typeof DRE_CATEGORY_MAPPING];
      
      if (value > 0) {
        // Positive values (income)
        if (mapping === 'grossRevenue' || !mapping) {
          dre.grossRevenue += value;
        } else if (mapping === 'otherIncome') {
          dre.otherIncome += value;
        }
      } else {
        // Negative values (expenses)
        const absValue = Math.abs(value);
        
        switch (mapping) {
          case 'deductions':
            dre.deductions += absValue;
            break;
          case 'administrative':
            dre.operatingExpenses.administrative += absValue;
            break;
          case 'commercial':
            dre.operatingExpenses.commercial += absValue;
            break;
          case 'financial':
            dre.operatingExpenses.financial += absValue;
            break;
          default:
            if (category.toLowerCase().includes('outros') && value < 0) {
              dre.otherLosses += absValue;
            } else {
              dre.operatingExpenses.other += absValue;
            }
        }
      }
    });

    // Calculate derived values
    dre.netRevenue = dre.grossRevenue - dre.deductions;
    const totalOperatingExpenses = Object.values(dre.operatingExpenses).reduce((sum, val) => sum + val, 0);
    dre.operatingResult = dre.netRevenue - totalOperatingExpenses;
    dre.netProfit = dre.operatingResult + dre.otherIncome - dre.otherLosses;

    return dre;
  };

  const dre = calculateDRE();
  const formatCurrency = (value: number) => {
    return value.toLocaleString("pt-BR", { minimumFractionDigits: 2 });
  };

  const DRELine = ({ 
    label, 
    value, 
    isTotal = false, 
    isSubtotal = false,
    isNegative = false,
    indent = 0 
  }: {
    label: string;
    value: number;
    isTotal?: boolean;
    isSubtotal?: boolean;
    isNegative?: boolean;
    indent?: number;
  }) => (
    <div className={`flex justify-between items-center py-1 ${
      isTotal ? 'font-bold text-lg border-t-2 border-primary pt-3 mt-2' : 
      isSubtotal ? 'font-semibold border-t border-border pt-2 mt-1' : ''
    }`} style={{ paddingLeft: `${indent * 1.5}rem` }}>
      <span className={isTotal ? 'text-primary' : ''}>{label}</span>
      <span className={`font-mono ${
        isTotal ? (value >= 0 ? 'text-success' : 'text-destructive') :
        isSubtotal ? 'font-semibold' :
        isNegative ? 'text-destructive' : 'text-foreground'
      }`}>
        {isNegative && value > 0 ? '(' : ''}
        R$ {formatCurrency(Math.abs(value))}
        {isNegative && value > 0 ? ')' : ''}
      </span>
    </div>
  );

  return (
    <Card className="bg-gradient-to-br from-card to-card/80 border-border/50 shadow-soft">
      <CardHeader>
        <div className="flex justify-between items-start">
          <div>
            <CardTitle className="flex items-center gap-2">
              <Calculator className="h-5 w-5" />
              Demonstração do Resultado do Exercício (DRE)
            </CardTitle>
            <p className="text-sm text-muted-foreground">
              Demonstrativo financeiro baseado nas transações categorizadas - {selectedMonth}
            </p>
          </div>
          <div className="flex gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => exportDREToPDF(transactions, selectedMonth)}
              className="flex items-center gap-2"
            >
              <Download className="h-4 w-4" />
              PDF
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => exportDREToExcel(transactions, selectedMonth)}
              className="flex items-center gap-2"
            >
              <FileSpreadsheet className="h-4 w-4" />
              Excel
            </Button>
          </div>
        </div>
      </CardHeader>
      <CardContent className="space-y-2">
        {/* Revenue Section */}
        <DRELine label="Receita Bruta" value={dre.grossRevenue} />
        <DRELine label="(-) Deduções" value={dre.deductions} isNegative indent={1} />
        <DRELine label="= Receita Líquida" value={dre.netRevenue} isSubtotal />
        
        {/* Operating Expenses Section */}
        <div className="mt-4">
          <DRELine label="(-) Despesas Operacionais:" value={0} />
          {dre.operatingExpenses.administrative > 0 && (
            <DRELine label="Administrativas" value={dre.operatingExpenses.administrative} isNegative indent={1} />
          )}
          {dre.operatingExpenses.commercial > 0 && (
            <DRELine label="Comerciais" value={dre.operatingExpenses.commercial} isNegative indent={1} />
          )}
          {dre.operatingExpenses.financial > 0 && (
            <DRELine label="Financeiras" value={dre.operatingExpenses.financial} isNegative indent={1} />
          )}
          {dre.operatingExpenses.other > 0 && (
            <DRELine label="Outras Despesas" value={dre.operatingExpenses.other} isNegative indent={1} />
          )}
        </div>
        
        <DRELine label="= Resultado Operacional" value={dre.operatingResult} isSubtotal />
        
        {/* Non-Operating Section */}
        {(dre.otherIncome > 0 || dre.otherLosses > 0) && (
          <div className="mt-4">
            {dre.otherIncome > 0 && (
              <DRELine label="(+) Outras Receitas" value={dre.otherIncome} />
            )}
            {dre.otherLosses > 0 && (
              <DRELine label="(-) Outras Perdas" value={dre.otherLosses} isNegative />
            )}
          </div>
        )}
        
        {/* Final Result */}
        <DRELine 
          label="= Lucro/Prejuízo Líquido do Período" 
          value={dre.netProfit} 
          isTotal 
        />
        
        {/* Summary Metrics */}
        <div className="mt-6 p-4 bg-muted/30 rounded-lg space-y-2">
          <h4 className="font-semibold text-sm text-muted-foreground mb-3">INDICADORES:</h4>
          <div className="grid grid-cols-2 gap-4 text-sm">
            <div>
              <span className="text-muted-foreground">Margem Bruta:</span>
              <span className="font-semibold ml-2">
                {dre.grossRevenue > 0 ? ((dre.netRevenue / dre.grossRevenue) * 100).toFixed(1) : '0.0'}%
              </span>
            </div>
            <div>
              <span className="text-muted-foreground">Margem Líquida:</span>
              <span className="font-semibold ml-2">
                {dre.grossRevenue > 0 ? ((dre.netProfit / dre.grossRevenue) * 100).toFixed(1) : '0.0'}%
              </span>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
