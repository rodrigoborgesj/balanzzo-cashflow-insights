import { useMemo } from 'react';
import { Transaction } from '@/utils/fileParser';

export interface CashFlowData {
  date: string;
  entradas: number;
  saidas: number;
  saldo: number;
}

export interface CashFlowSummary {
  totalEntradas: number;
  totalSaidas: number;
  saldoFinal: number;
  saldoInicial: number;
}

export interface CategorySummary {
  category: string;
  amount: number;
  type: 'entrada' | 'saida';
  count: number;
  percent: number;
}

export function useCashFlow(transactions: Transaction[], saldoInicial: number = 0) {
  return useMemo(() => {
    // Filter only reconciled transactions
    const reconciledTransactions = transactions.filter(t => t.reconciled && t.status === 'conciliado');
    
    // Calculate summary
    const totalEntradas = reconciledTransactions
      .filter(t => t.type === 'entrada')
      .reduce((sum, t) => sum + Math.abs(t.amount), 0);
    
    const totalSaidas = reconciledTransactions
      .filter(t => t.type === 'saida')
      .reduce((sum, t) => sum + Math.abs(t.amount), 0);
    
    const saldoFinal = saldoInicial + totalEntradas - totalSaidas;
    
    const summary: CashFlowSummary = {
      totalEntradas,
      totalSaidas,
      saldoFinal,
      saldoInicial,
    };

    // Group by category
    const categoryGroups = reconciledTransactions.reduce((acc, transaction) => {
      if (!transaction.category) return acc;
      
      const key = `${transaction.category}_${transaction.type}`;
      if (!acc[key]) {
        acc[key] = {
          category: transaction.category,
          amount: 0,
          type: transaction.type,
          count: 0,
        };
      }
      
      acc[key].amount += Math.abs(transaction.amount);
      acc[key].count += 1;
      
      return acc;
    }, {} as Record<string, Omit<CategorySummary, 'percent'>>);

    // Calculate percentages and create final array
    const categorySummary: CategorySummary[] = Object.values(categoryGroups).map(item => ({
      ...item,
      percent: Math.round((item.amount / (item.type === 'entrada' ? totalEntradas : totalSaidas)) * 100),
    })).sort((a, b) => b.amount - a.amount);

    // Generate cash flow data by date
    const dateGroups = reconciledTransactions.reduce((acc, transaction) => {
      const date = transaction.date;
      if (!acc[date]) {
        acc[date] = { entradas: 0, saidas: 0 };
      }
      
      if (transaction.type === 'entrada') {
        acc[date].entradas += Math.abs(transaction.amount);
      } else {
        acc[date].saidas += Math.abs(transaction.amount);
      }
      
      return acc;
    }, {} as Record<string, { entradas: number; saidas: number }>);

    // Convert to array and sort by date
    const sortedDates = Object.keys(dateGroups).sort((a, b) => {
      const [dayA, monthA, yearA] = a.split('/').map(Number);
      const [dayB, monthB, yearB] = b.split('/').map(Number);
      const dateA = new Date(yearA, monthA - 1, dayA);
      const dateB = new Date(yearB, monthB - 1, dayB);
      return dateA.getTime() - dateB.getTime();
    });

    // Calculate cumulative balance
    let runningBalance = saldoInicial;
    const cashFlowData: CashFlowData[] = sortedDates.map(date => {
      const dayData = dateGroups[date];
      runningBalance += dayData.entradas - dayData.saidas;
      
      return {
        date: date.substring(0, 5), // Show only DD/MM
        entradas: dayData.entradas,
        saidas: dayData.saidas,
        saldo: runningBalance,
      };
    });

    // Get recent transactions (last 10)
    const recentTransactions = reconciledTransactions
      .sort((a, b) => {
        const [dayA, monthA, yearA] = a.date.split('/').map(Number);
        const [dayB, monthB, yearB] = b.date.split('/').map(Number);
        const dateA = new Date(yearA, monthA - 1, dayA);
        const dateB = new Date(yearB, monthB - 1, dayB);
        return dateB.getTime() - dateA.getTime();
      })
      .slice(0, 10);

    return {
      summary,
      categorySummary,
      cashFlowData,
      recentTransactions,
      hasData: reconciledTransactions.length > 0,
    };
  }, [transactions, saldoInicial]);
}