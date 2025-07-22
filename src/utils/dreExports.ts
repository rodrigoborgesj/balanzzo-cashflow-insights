import jsPDF from 'jspdf';
import 'jspdf-autotable';
import * as XLSX from 'xlsx';
import { Transaction } from '@/hooks/useConciliacao';

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

const calculateDRE = (transactions: Transaction[]): DREData => {
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
      // Positive values (income) - ALL positive values should be revenue unless specifically mapped otherwise
      if (mapping === 'otherIncome') {
        dre.otherIncome += value;
      } else {
        // Default: all positive values are gross revenue
        dre.grossRevenue += value;
      }
    } else {
      // Negative values (expenses) - categorize by type
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
          // All unmapped negative values go to "other operating expenses"
          dre.operatingExpenses.other += absValue;
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

const formatCurrency = (value: number): string => {
  return `R$ ${value.toLocaleString("pt-BR", { minimumFractionDigits: 2 })}`;
};

export const exportDREToPDF = (transactions: Transaction[], selectedMonth: string) => {
  const dre = calculateDRE(transactions);
  const doc = new jsPDF();

  // Header
  doc.setFontSize(20);
  doc.text('BASICOO', 20, 30);
  doc.setFontSize(16);
  doc.text('Demonstração do Resultado do Exercício (DRE)', 20, 45);
  doc.setFontSize(12);
  doc.text(`Período: ${selectedMonth}`, 20, 55);
  doc.text(`Gerado em: ${new Date().toLocaleDateString('pt-BR')}`, 20, 65);

  // Create table data
  const tableData = [
    ['RECEITA BRUTA', formatCurrency(dre.grossRevenue)],
    ['(-) Deduções', formatCurrency(-dre.deductions)],
    ['= RECEITA LÍQUIDA', formatCurrency(dre.netRevenue)],
    ['', ''],
    ['(-) DESPESAS OPERACIONAIS:', ''],
  ];

  // Add operating expenses details
  if (dre.operatingExpenses.administrative > 0) {
    tableData.push(['  Administrativas', formatCurrency(-dre.operatingExpenses.administrative)]);
  }
  if (dre.operatingExpenses.commercial > 0) {
    tableData.push(['  Comerciais', formatCurrency(-dre.operatingExpenses.commercial)]);
  }
  if (dre.operatingExpenses.financial > 0) {
    tableData.push(['  Financeiras', formatCurrency(-dre.operatingExpenses.financial)]);
  }
  if (dre.operatingExpenses.other > 0) {
    tableData.push(['  Outras Despesas', formatCurrency(-dre.operatingExpenses.other)]);
  }

  tableData.push
  (
    ['', ''],
    ['= RESULTADO OPERACIONAL', formatCurrency(dre.operatingResult)],
  );

  // Add non-operating items if they exist
  if (dre.otherIncome > 0) {
    tableData.push(['(+) Outras Receitas', formatCurrency(dre.otherIncome)]);
  }
  if (dre.otherLosses > 0) {
    tableData.push(['(-) Outras Perdas', formatCurrency(-dre.otherLosses)]);
  }

  tableData.push
  (
    ['', ''],
    ['= LUCRO/PREJUÍZO LÍQUIDO', formatCurrency(dre.netProfit)]
  );

  // Add indicators
  const grossMargin = dre.grossRevenue > 0 ? ((dre.netRevenue / dre.grossRevenue) * 100).toFixed(1) : '0.0';
  const netMargin = dre.grossRevenue > 0 ? ((dre.netProfit / dre.grossRevenue) * 100).toFixed(1) : '0.0';

  tableData.push
  (
    ['', ''],
    ['INDICADORES:', ''],
    ['Margem Bruta', `${grossMargin}%`],
    ['Margem Líquida', `${netMargin}%`]
  );

  // Create table
  (doc as any).autoTable({
    startY: 80,
    head: [['Descrição', 'Valor']],
    body: tableData,
    styles: {
      fontSize: 10,
      cellPadding: 3,
    },
    headStyles: {
      fillColor: [41, 128, 185],
      textColor: [255, 255, 255],
      fontStyle: 'bold',
    },
    columnStyles: {
      0: { cellWidth: 120 },
      1: { cellWidth: 60, halign: 'right' },
    },
    didParseCell: function(data: any) {
      // Style total rows
      if (data.cell.text[0]?.includes('RECEITA LÍQUIDA') || 
          data.cell.text[0]?.includes('RESULTADO OPERACIONAL') || 
          data.cell.text[0]?.includes('LUCRO/PREJUÍZO')) {
        data.cell.styles.fontStyle = 'bold';
        data.cell.styles.fillColor = [240, 240, 240];
      }
      // Style section headers
      if (data.cell.text[0]?.includes('DESPESAS OPERACIONAIS') || 
          data.cell.text[0]?.includes('INDICADORES')) {
        data.cell.styles.fontStyle = 'bold';
        data.cell.styles.fillColor = [220, 220, 220];
      }
    }
  });

  // Save the PDF
  doc.save(`DRE_${selectedMonth}_BASICOO.pdf`);
};

export const exportDREToExcel = (transactions: Transaction[], selectedMonth: string) => {
  const dre = calculateDRE(transactions);

  // Create worksheet data
  const wsData = [
    ['BASICOO'],
    ['Demonstração do Resultado do Exercício (DRE)'],
    [`Período: ${selectedMonth}`],
    [`Gerado em: ${new Date().toLocaleDateString('pt-BR')}`],
    [],
    ['Descrição', 'Valor'],
    ['RECEITA BRUTA', dre.grossRevenue],
    ['(-) Deduções', -dre.deductions],
    ['= RECEITA LÍQUIDA', dre.netRevenue],
    [],
    ['(-) DESPESAS OPERACIONAIS:', ''],
  ];

  // Add operating expenses details
  if (dre.operatingExpenses.administrative > 0) {
    wsData.push(['  Administrativas', -dre.operatingExpenses.administrative]);
  }
  if (dre.operatingExpenses.commercial > 0) {
    wsData.push(['  Comerciais', -dre.operatingExpenses.commercial]);
  }
  if (dre.operatingExpenses.financial > 0) {
    wsData.push(['  Financeiras', -dre.operatingExpenses.financial]);
  }
  if (dre.operatingExpenses.other > 0) {
    wsData.push(['  Outras Despesas', -dre.operatingExpenses.other]);
  }

  wsData.push
  (
    [],
    ['= RESULTADO OPERACIONAL', dre.operatingResult],
  );

  // Add non-operating items if they exist
  if (dre.otherIncome > 0) {
    wsData.push(['(+) Outras Receitas', dre.otherIncome]);
  }
  if (dre.otherLosses > 0) {
    wsData.push(['(-) Outras Perdas', -dre.otherLosses]);
  }

  wsData.push
  (
    [],
    ['= LUCRO/PREJUÍZO LÍQUIDO', dre.netProfit],
    [],
    ['INDICADORES:', ''],
    ['Margem Bruta (%)', dre.grossRevenue > 0 ? ((dre.netRevenue / dre.grossRevenue) * 100) : 0],
    ['Margem Líquida (%)', dre.grossRevenue > 0 ? ((dre.netProfit / dre.grossRevenue) * 100) : 0]
  );

  // Create workbook and worksheet
  const wb = XLSX.utils.book_new();
  const ws = XLSX.utils.aoa_to_sheet(wsData);

  // Style the worksheet (set column widths)
  ws['!cols'] = [
    { width: 30 }, // Description column
    { width: 15 }  // Value column
  ];

  // Add worksheet to workbook
  XLSX.utils.book_append_sheet(wb, ws, 'DRE');

  // Save the file
  XLSX.writeFile(wb, `DRE_${selectedMonth}_BASICOO.xlsx`);
};
