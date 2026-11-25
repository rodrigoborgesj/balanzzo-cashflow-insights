import { describe, it, expect } from 'bun:test';
import { expenseRanking, expenseEvolution } from './expenseEvolution';

const t = (d: string, valor: number, descricao: string, extra: any = {}) => ({ id: d + descricao + valor, data_transacao: d, mes_referencia: null, valor, descricao, status_conciliacao: true, categoria_final: 'Fornecedores', ...extra }) as any;
const rows = [
  t('2026-01-10', -100, 'Fornecedor A'), t('2026-03-05', -150.1, 'fornecedor  a'),
  t('2026-03-06', -50, 'Fornecedor B'), t('2026-03-07', 500, 'Fornecedor A'),
  t('2025-12-31', -999, 'Fornecedor A'), t('2026-02-01', -70, 'Fornecedor A', { status_validacao: 'pendente' }),
];

describe('expense evolution', () => {
  it('ranks only reconciled expenses of the year', () => {
    expect(expenseRanking(rows, '2026', 'fornecedor')).toEqual([{ name: 'FORNECEDOR A', cents: 25010 }, { name: 'FORNECEDOR B', cents: 5000 }]);
  });
  it('builds January to December bars and variation', () => {
    const r = expenseEvolution(rows, '2026', 'fornecedor', 'FORNECEDOR A');
    expect(r.months[0]).toBe(10000); expect(r.months[1]).toBe(0); expect(r.months[2]).toBe(15010);
    expect(r.variation).toBeCloseTo(50.1);
  });
});
