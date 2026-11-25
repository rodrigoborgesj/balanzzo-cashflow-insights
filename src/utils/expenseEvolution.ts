import type { Transaction } from '@/hooks/useConciliacao';
import { annualReferenceMonth } from './annualCashFlow';

export type EvolutionGroup = 'fornecedor' | 'categoria';

export function expenseKey(t: Transaction, group: EvolutionGroup) {
  if (group === 'categoria') return t.categoria_final || t.categoria_sugerida || 'Outros';
  return (t.descricao || 'Sem descrição').trim().replace(/\s+/g, ' ').toUpperCase();
}

const isExpense = (t: Transaction, year: string) =>
  t.status_conciliacao && t.status_validacao !== 'pendente' && Number(t.valor) < 0 && annualReferenceMonth(t).startsWith(`${year}-`);

/** Ranking de despesas do ano (centavos), maior primeiro. */
export function expenseRanking(transactions: Transaction[], year: string, group: EvolutionGroup) {
  const totals = new Map<string, number>();
  for (const t of transactions) {
    if (!isExpense(t, year)) continue;
    const k = expenseKey(t, group);
    totals.set(k, (totals.get(k) || 0) + Math.round(Math.abs(Number(t.valor)) * 100));
  }
  return [...totals.entries()].map(([name, cents]) => ({ name, cents })).sort((a, b) => b.cents - a.cents);
}

/** Evolução mensal (Jan–Dez, centavos) de uma despesa. */
export function expenseEvolution(transactions: Transaction[], year: string, group: EvolutionGroup, name: string) {
  const months = Array(12).fill(0) as number[];
  for (const t of transactions) {
    if (!isExpense(t, year) || expenseKey(t, group) !== name) continue;
    const m = Number(annualReferenceMonth(t).slice(5, 7)) - 1;
    months[m] += Math.round(Math.abs(Number(t.valor)) * 100);
  }
  const withData = months.map((c, i) => ({ c, i })).filter(x => x.c > 0);
  const first = withData[0]?.c ?? 0;
  const last = withData[withData.length - 1]?.c ?? 0;
  const variation = withData.length >= 2 && first > 0 ? ((last - first) / first) * 100 : null;
  return { months, variation };
}
