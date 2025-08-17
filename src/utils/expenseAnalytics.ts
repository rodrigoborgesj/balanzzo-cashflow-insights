import { toZonedTime, format } from 'date-fns-tz';

export interface Transaction {
  id: string;
  data_transacao: string;
  tipo: string;
  valor: number;
  categoria_final?: string | null;
  categoria_sugerida?: string | null;
}

export interface ExpenseCategory {
  category: string;
  amount: number;
  percent: number;
}

/**
 * Normalizes category names for consistent aggregation
 */
function normalizeCategory(category: string | null | undefined): string {
  if (!category || typeof category !== 'string') {
    return 'Uncategorized';
  }
  
  return category
    .trim()
    .replace(/\s+/g, ' ')
    .toLowerCase();
}

/**
 * Checks if a transaction is an expense based on type or negative amount
 */
function isExpenseTransaction(transaction: Transaction): boolean {
  const type = transaction.tipo?.toLowerCase();
  const amount = Number(transaction.valor);
  
  return type === 'expense' || type === 'saida' || amount < 0;
}

/**
 * Checks if a transaction belongs to the selected month in the specified timezone
 */
function isTransactionInMonth(
  transaction: Transaction,
  selectedMonth: string,
  timezone: string = 'America/Sao_Paulo'
): boolean {
  try {
    const transactionDate = new Date(transaction.data_transacao);
    const zonedDate = toZonedTime(transactionDate, timezone);
    const transactionMonthKey = format(zonedDate, 'yyyy-MM', { timeZone: timezone });
    
    return transactionMonthKey === selectedMonth;
  } catch (error) {
    console.warn('Invalid transaction date:', transaction.data_transacao);
    return false;
  }
}

/**
 * Pure function to get top 5 expenses by category for a specific month
 * @param transactions - Array of transaction objects
 * @param selectedMonth - Month in format 'YYYY-MM' (e.g., '2024-08')
 * @param timezone - Timezone for date calculations (default: 'America/Sao_Paulo')
 * @returns Array of top 5 expense categories with amounts and percentages
 */
export function getTop5ExpensesByCategory(
  transactions: Transaction[],
  selectedMonth: string,
  timezone: string = 'America/Sao_Paulo'
): ExpenseCategory[] {
  // Input validation
  if (!Array.isArray(transactions) || transactions.length === 0) {
    return [];
  }
  
  if (!selectedMonth || typeof selectedMonth !== 'string') {
    console.warn('Invalid selectedMonth provided:', selectedMonth);
    return [];
  }

  // Filter transactions for the selected month and expenses only
  const monthlyExpenses = transactions.filter(transaction => {
    return isExpenseTransaction(transaction) && 
           isTransactionInMonth(transaction, selectedMonth, timezone);
  });

  if (monthlyExpenses.length === 0) {
    return [];
  }

  // Aggregate expenses by normalized category
  const categoryTotals = new Map<string, number>();
  
  monthlyExpenses.forEach(transaction => {
    const rawCategory = transaction.categoria_final || transaction.categoria_sugerida;
    const normalizedCategory = normalizeCategory(rawCategory);
    const amount = Math.abs(Number(transaction.valor) || 0);
    
    if (amount > 0) {
      const currentTotal = categoryTotals.get(normalizedCategory) || 0;
      categoryTotals.set(normalizedCategory, currentTotal + amount);
    }
  });

  // Convert to array and sort by amount (descending)
  const sortedCategories = Array.from(categoryTotals.entries())
    .map(([category, amount]) => ({ category, amount }))
    .sort((a, b) => b.amount - a.amount);

  // Limit to maximum 5 categories
  const top5Categories = sortedCategories.slice(0, Math.min(5, sortedCategories.length));

  // Calculate total expenses for percentage calculation
  const totalExpenses = top5Categories.reduce((sum, cat) => sum + cat.amount, 0);

  // Add percentage calculation
  return top5Categories.map(({ category, amount }) => ({
    category,
    amount,
    percent: totalExpenses > 0 ? Number((amount / totalExpenses * 100).toFixed(1)) : 0
  }));
}

/**
 * Formats a number as Brazilian Real currency
 */
export function formatBRL(value: number): string {
  return new Intl.NumberFormat('pt-BR', {
    style: 'currency',
    currency: 'BRL'
  }).format(value);
}