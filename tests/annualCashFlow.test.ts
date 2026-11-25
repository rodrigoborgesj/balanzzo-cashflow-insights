import { describe, expect, test } from 'bun:test';
import { buildAnnualCashFlow } from '../src/utils/annualCashFlow';
import type { Transaction } from '@/hooks/useConciliacao';

const tx = (values: Partial<Transaction>): Transaction => ({ data_transacao: '2026-09-01', descricao: 'Venda', valor: 100, tipo: 'entrada', status_conciliacao: true, categoria_final: 'Delivery', cost_center_id: 'sales', cost_subgroup_id: 'online', ...values });
const centers = [{ id: 'sales', name: 'Vendas' }];
const subgroups = [{ id: 'online', name: 'Online' }];

describe('annual reconciled cash flow', () => {
  test('shows only reconciled months in the selected year, without shifting September 1', () => {
    const data = buildAnnualCashFlow([tx({}), tx({data_transacao:'2026-10-13'}), tx({data_transacao:'2026-08-01',status_conciliacao:false}), tx({data_transacao:'2025-12-31'})], '2026', centers, subgroups);
    expect(data.months).toEqual(['2026-09','2026-10']);
    expect(data.inflow.months['2026-09']).toBe(10000);
  });
  test('preserves cost center, subgroup and category values across months and annual totals', () => {
    const data = buildAnnualCashFlow([tx({valor:986.83,data_transacao:'2026-10-01'}),tx({valor:210.03,data_transacao:'2026-09-01'})], '2026', centers, subgroups);
    const center = data.inflow.children[0];
    expect(center.name).toBe('Vendas');
    expect(center.children[0].name).toBe('Online');
    expect(center.children[0].children[0].name).toBe('Delivery');
    expect(center.total).toBe(119686);
    expect(center.months['2026-10']).toBe(98683);
  });
  test('excludes pending validation from amounts and retains signed expenses and net result', () => {
    const data = buildAnnualCashFlow([tx({valor:100}), tx({valor:-30,tipo:'saida'}), tx({valor:999,status_validacao:'pendente'})], '2026', centers, subgroups);
    expect(data.inflow.total).toBe(10000);
    expect(data.outflow.total).toBe(-3000);
    expect(data.result.total).toBe(7000);
    expect(data.count).toBe(2);
  });
  test('type and category filters apply equally to every subtotal without hiding reconciled month columns', () => {
    const data = buildAnnualCashFlow([tx({}),tx({data_transacao:'2026-10-01',categoria_final:'Cartão',valor:210.03}),tx({valor:-30,tipo:'saida'})], '2026', centers, subgroups, {type:'entradas',categories:['Delivery']});
    expect(data.months).toEqual(['2026-09','2026-10']);
    expect(data.inflow.total).toBe(10000);
    expect(data.result.total).toBe(10000);
    expect(data.outflow.total).toBe(0);
  });
  test('uses the same reconciliation reference month as the existing monthly view', () => {
    const data = buildAnnualCashFlow([tx({data_transacao:'2025-12-31',mes_referencia:'2026-01-01'})], '2026', [], []);
    expect(data.months).toEqual(['2026-01']);
    expect(data.inflow.children[0].name).toBe('Sem centro definido');
    expect(data.inflow.total).toBe(10000);
  });
});