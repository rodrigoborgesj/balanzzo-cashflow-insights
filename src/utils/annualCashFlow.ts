import type { Transaction } from '@/hooks/useConciliacao';

export interface AnnualRow {
  key: string;
  name: string;
  months: Record<string, number>;
  total: number;
  children: AnnualRow[];
}

export function annualReferenceMonth(t: Transaction) {
  return (t.mes_referencia || t.data_transacao).slice(0, 7);
}

export function buildAnnualCashFlow(
  transactions: Transaction[],
  year: string,
  centers: { id: string; name: string }[],
  subgroups: { id: string; name: string }[],
  filter: { type: 'todas' | 'entradas' | 'saidas'; categories: string[] } = { type: 'todas', categories: [] },
) {
  const reconciled = transactions.filter(t => t.status_conciliacao && annualReferenceMonth(t).startsWith(`${year}-`));
  const months = [...new Set(reconciled.map(annualReferenceMonth))].sort();
  const category = (t: Transaction) => t.categoria_final || t.categoria_sugerida || 'Outros';
  const categories = [...new Set(reconciled.map(category))].sort();
  const eligible = reconciled.filter(t => t.status_validacao !== 'pendente' &&
    (filter.type === 'todas' || (filter.type === 'entradas' ? t.valor > 0 : t.valor < 0)) &&
    (!filter.categories.length || filter.categories.includes(category(t))));
  const makeRow = (key: string, name: string): AnnualRow => ({ key, name, months: {}, total: 0, children: [] });
  const inflow = makeRow('inflow', 'Entradas');
  const outflow = makeRow('outflow', 'Saídas');
  const add = (row: AnnualRow, month: string, cents: number) => {
    row.months[month] = (row.months[month] || 0) + cents;
    row.total += cents;
  };
  const child = (parent: AnnualRow, key: string, name: string) => {
    let found = parent.children.find(r => r.key === key);
    if (!found) { found = makeRow(key, name); parent.children.push(found); }
    return found;
  };
  for (const t of eligible) {
    const root = t.valor >= 0 ? inflow : outflow;
    const centerId = t.cost_center_id || 'unassigned';
    const center = child(root, `${root.key}:${centerId}`, centers.find(c => c.id === centerId)?.name || 'Sem centro definido');
    const subgroupId = t.cost_subgroup_id || 'unassigned';
    const subgroup = child(center, `${center.key}:${subgroupId}`, subgroups.find(s => s.id === subgroupId)?.name || 'Sem subgrupo');
    const leaf = child(subgroup, `${subgroup.key}:${category(t)}`, category(t));
    const cents = Math.round(Number(t.valor) * 100);
    for (const row of [root, center, subgroup, leaf]) add(row, annualReferenceMonth(t), cents);
  }
  const sort = (row: AnnualRow) => {
    row.children.sort((a, b) => a.name.localeCompare(b.name, 'pt-BR'));
    row.children.forEach(sort);
  };
  [inflow, outflow].forEach(sort);
  const result = makeRow('result', 'Resultado líquido');
  for (const month of months) add(result, month, (inflow.months[month] || 0) + (outflow.months[month] || 0));
  return { months, categories, inflow, outflow, result, count: eligible.length };
}