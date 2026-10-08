import { describe, expect, test } from 'bun:test';
import { calculateMonthlySavings, calculateRemainingSavingsPlan, calculateSavingsProgress, parseSavingsAmount } from '../src/utils/savingsGoalCalculations';

describe('Metas com saldo inicial', () => {
  test('divide somente o que falta pelo prazo', () => {
    expect(calculateMonthlySavings(10000, 4000, 12)).toBe(500);
  });
  test('mantém cálculo para quem começa do zero', () => {
    expect(calculateMonthlySavings(12000, 0, 12)).toBe(1000);
  });
  test('não sugere parcela negativa quando a meta já foi alcançada', () => {
    expect(calculateMonthlySavings(10000, 12000, 12)).toBe(0);
  });
  test('soma saldo inicial e contribuições sem duplicação', () => {
    expect(calculateSavingsProgress(10000, 4000, [{ amount: 500 }])).toEqual({ totalSaved: 4500, remaining: 5500, progressPercentage: 45 });
  });
  test('mostra saldo inicial mesmo sem contribuições', () => {
    expect(calculateSavingsProgress(10000, 4000, []).totalSaved).toBe(4000);
  });
  test('aceita valores em reais e rejeita valores negativos', () => {
    expect(parseSavingsAmount('4.000,50')).toBe(4000.5);
    expect(Number.isNaN(parseSavingsAmount('-100'))).toBe(true);
  });
});

describe('Parcelas após depósitos reais', () => {
  const plan = (deposits: { amount: number; reference_month: string; status?: string }[]) =>
    calculateRemainingSavingsPlan(10000, 4000, 12, '2026-10-08', deposits);

  test('depósito extra reduz saldo e parcela dos onze meses seguintes', () => {
    expect(plan([{ amount: 1000, reference_month: '2026-10-01', status: 'completed' }])).toEqual({
      totalSaved: 5000, remaining: 5000, progressPercentage: 50, remainingMonths: 11, monthlyAmount: 454.55,
    });
  });
  test('parcela normal mantém o valor previsto', () => {
    expect(plan([{ amount: 500, reference_month: '2026-10-01' }]).monthlyAmount).toBe(500);
  });
  test('dois depósitos no mesmo mês consomem apenas um mês', () => {
    const result = plan([{ amount: 500, reference_month: '2026-10-01' }, { amount: 500, reference_month: '2026-10-01' }]);
    expect(result.remainingMonths).toBe(11);
    expect(result.monthlyAmount).toBe(454.55);
  });
  test('preserva o prazo original atravessando o ano', () => {
    const result = plan([{ amount: 2000, reference_month: '2027-01-01' }]);
    expect(result.remainingMonths).toBe(8);
    expect(result.monthlyAmount).toBe(500);
  });
  test('depósito pendente não abate saldo nem consome mês', () => {
    expect(plan([{ amount: 1000, reference_month: '2026-10-01', status: 'pending' }]).monthlyAmount).toBe(500);
    expect(plan([{ amount: 1000, reference_month: '2026-10-01', status: 'pending' }]).totalSaved).toBe(4000);
  });
  test('depósito atrasado efetivamente guardado abate o saldo', () => {
    expect(plan([{ amount: 1000, reference_month: '2026-10-01', status: 'late' }]).monthlyAmount).toBe(454.55);
  });
  test('meta alcançada deixa de sugerir parcelas', () => {
    expect(plan([{ amount: 6000, reference_month: '2026-10-01' }]).monthlyAmount).toBe(0);
  });
  test('excluir depósito restaura a projeção', () => {
    expect(plan([]).monthlyAmount).toBe(500);
    expect(plan([]).remaining).toBe(6000);
  });
  test('prazo esgotado mostra saldo integral sem divisão por zero', () => {
    const result = plan([{ amount: 1000, reference_month: '2027-09-01' }]);
    expect(result.remainingMonths).toBe(0);
    expect(result.monthlyAmount).toBe(5000);
  });
});