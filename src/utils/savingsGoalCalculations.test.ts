import { describe, expect, test } from 'bun:test';
import { calculateMonthlySavings, calculateSavingsProgress, parseSavingsAmount } from './savingsGoalCalculations';

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