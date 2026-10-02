import { supabase } from '@/integrations/supabase/client';

export interface ScheduledMatch {
  importedId: string;
  importedDate: string;
  importedDescription: string | null;
  scheduledId: string;
  scheduledDate: string;
  scheduledDescription: string | null;
  scheduledCategory: string | null;
  tipo: 'entrada' | 'saida';
  valor: number;
}

const addDays = (ymd: string, days: number) => {
  const [y, m, d] = ymd.slice(0, 10).split('-').map(Number);
  const dt = new Date(Date.UTC(y, m - 1, d + days));
  return dt.toISOString().slice(0, 10);
};

const diffDays = (a: string, b: string) => {
  const pa = a.slice(0, 10).split('-').map(Number);
  const pb = b.slice(0, 10).split('-').map(Number);
  return Math.abs(Date.UTC(pa[0], pa[1] - 1, pa[2]) - Date.UTC(pb[0], pb[1] - 1, pb[2])) / 86400000;
};

/**
 * Encontra lançamentos programados (futuros) no fluxo de caixa com o mesmo valor e tipo
 * das transações importadas no extrato, numa janela de +-10 dias.
 */
export async function findScheduledMatches(userId: string, imported: any[]): Promise<ScheduledMatch[]> {
  if (!imported?.length) return [];
  const dates = imported.map(t => String(t.data_transacao).slice(0, 10)).sort();
  const from = addDays(dates[0], -10);
  const to = addDays(dates[dates.length - 1], 10);
  const importedIds = new Set(imported.map(t => t.id));

  const { data: rows, error } = await supabase
    .from('fluxo_caixa')
    .select('id, data_competencia, tipo, categoria, descricao, valor, transacao_origem_id')
    .eq('user_id', userId)
    .gte('data_competencia', from)
    .lte('data_competencia', to);
  if (error || !rows?.length) return [];

  const candidates = rows.filter(r => !r.transacao_origem_id || !importedIds.has(r.transacao_origem_id));
  if (!candidates.length) return [];

  // Um lançamento é "programado" quando sua data difere da data da transação de origem
  const originIds = [...new Set(candidates.map(r => r.transacao_origem_id).filter(Boolean))] as string[];
  const originDates = new Map<string, string>();
  if (originIds.length) {
    const { data: origins } = await supabase
      .from('transacoes_conciliadas')
      .select('id, data_transacao, origem_arquivo')
      .in('id', originIds);
    origins?.forEach(o => originDates.set(o.id, `${String(o.data_transacao).slice(0, 10)}|${o.origem_arquivo || ''}`));
  }
  const scheduled = candidates.filter(r => {
    if (!r.transacao_origem_id) return true;
    const info = originDates.get(r.transacao_origem_id);
    if (!info) return true;
    const [date, origem] = info.split('|');
    if (origem === 'manual_entry') return true;
    return date !== String(r.data_competencia).slice(0, 10);
  });

  const used = new Set<string>();
  const matches: ScheduledMatch[] = [];
  for (const t of imported) {
    const tipo = Number(t.valor) >= 0 ? 'entrada' : 'saida';
    const valor = Math.abs(Number(t.valor));
    const date = String(t.data_transacao).slice(0, 10);
    const best = scheduled
      .filter(s => !used.has(s.id) && s.tipo === tipo && Math.abs(Number(s.valor) - valor) < 0.01)
      .sort((a, b) => diffDays(a.data_competencia, date) - diffDays(b.data_competencia, date))[0];
    if (best && diffDays(best.data_competencia, date) <= 10) {
      used.add(best.id);
      matches.push({
        importedId: t.id,
        importedDate: date,
        importedDescription: t.descricao,
        scheduledId: best.id,
        scheduledDate: String(best.data_competencia).slice(0, 10),
        scheduledDescription: best.descricao,
        scheduledCategory: best.categoria,
        tipo,
        valor,
      });
    }
  }
  return matches;
}
