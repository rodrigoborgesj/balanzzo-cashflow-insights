import { useMemo, useState } from 'react';
import { ChevronDown, ChevronRight, MoveRight, ArrowDownCircle, ArrowUpCircle } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { useCostCenters } from '@/hooks/useCostCenters';
import { MoveCostCenterDialog } from './MoveCostCenterDialog';
import type { Transaction } from '@/hooks/useConciliacao';

interface Props {
  transactions: Transaction[];
  onUpdated?: () => void;
}

const NO_SUBGROUP_KEY = '__no_subgroup__';

const fmt = (v: number) =>
  v.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 });

export function CostCenterHierarchy({ transactions, onUpdated }: Props) {
  const { centers, subgroups } = useCostCenters();
  const [openCenters, setOpenCenters] = useState<Record<string, boolean>>({});
  const [openSubgroups, setOpenSubgroups] = useState<Record<string, boolean>>({});
  const [moveTarget, setMoveTarget] = useState<Transaction | null>(null);

  const grouped = useMemo(() => {
    // type -> centerId(or 'unassigned') -> subgroupId('__no_subgroup__' or id) -> Transaction[]
    const build = (type: 'receita' | 'custo') => {
      const map = new Map<string, Map<string, Transaction[]>>();
      const isEntrada = type === 'receita';
      for (const t of transactions) {
        const entrada = t.valor > 0;
        if (isEntrada !== entrada) continue;
        const centerId = t.cost_center_id || 'unassigned';
        const subgroupId = t.cost_subgroup_id || NO_SUBGROUP_KEY;
        if (!map.has(centerId)) map.set(centerId, new Map());
        const sub = map.get(centerId)!;
        if (!sub.has(subgroupId)) sub.set(subgroupId, []);
        sub.get(subgroupId)!.push(t);
      }

      const centerList = centers
        .filter((c) => c.type === type)
        .map((c) => {
          const subMap = map.get(c.id);
          if (!subMap) return null;
          const subs: { id: string; name: string; total: number; transactions: Transaction[] }[] = [];
          for (const [sgId, txs] of subMap.entries()) {
            const total = txs.reduce((s, t) => s + Math.abs(t.valor), 0);
            const name =
              sgId === NO_SUBGROUP_KEY
                ? 'Sem subgrupo'
                : subgroups.find((s) => s.id === sgId)?.name || 'Subgrupo removido';
            subs.push({ id: sgId, name, total, transactions: txs });
          }
          subs.sort((a, b) => {
            if (a.id === NO_SUBGROUP_KEY) return 1;
            if (b.id === NO_SUBGROUP_KEY) return -1;
            return b.total - a.total;
          });
          const total = subs.reduce((s, sg) => s + sg.total, 0);
          return { center: c, total, subs };
        })
        .filter((x): x is NonNullable<typeof x> => x !== null && x.total > 0)
        .sort((a, b) => b.total - a.total);

      const unassignedMap = map.get('unassigned');
      let unassigned:
        | { total: number; subs: { id: string; name: string; total: number; transactions: Transaction[] }[] }
        | null = null;
      if (unassignedMap) {
        const txs = Array.from(unassignedMap.values()).flat();
        const total = txs.reduce((s, t) => s + Math.abs(t.valor), 0);
        if (total > 0) {
          unassigned = {
            total,
            subs: [{ id: NO_SUBGROUP_KEY, name: 'Sem subgrupo', total, transactions: txs }],
          };
        }
      }

      const grandTotal = centerList.reduce((s, c) => s + c.total, 0) + (unassigned?.total || 0);
      return { centerList, unassigned, grandTotal };
    };

    return { receitas: build('receita'), custos: build('custo') };
  }, [transactions, centers, subgroups]);

  const toggleCenter = (key: string) =>
    setOpenCenters((p) => ({ ...p, [key]: !p[key] }));
  const toggleSubgroup = (key: string) =>
    setOpenSubgroups((p) => ({ ...p, [key]: !p[key] }));

  const renderSection = (
    label: string,
    icon: JSX.Element,
    accentColor: string,
    data: typeof grouped.receitas,
    type: 'receita' | 'custo',
  ) => {
    const all = [
      ...data.centerList.map((c) => ({
        keyPrefix: type + ':' + c.center.id,
        title: c.center.name,
        color: c.center.color || accentColor,
        total: c.total,
        subs: c.subs,
        unassignedCenter: false,
      })),
      ...(data.unassigned
        ? [
            {
              keyPrefix: type + ':unassigned',
              title: 'Sem centro definido',
              color: '#94a3b8',
              total: data.unassigned.total,
              subs: data.unassigned.subs,
              unassignedCenter: true,
            },
          ]
        : []),
    ];

    return (
      <div className="space-y-3">
        <div className="flex items-center justify-between border-b border-black/10 pb-2">
          <div className="flex items-center gap-2">
            {icon}
            <h4 className="text-sm md:text-base font-semibold text-black uppercase tracking-wide">
              {label}
            </h4>
          </div>
          <span className="text-sm md:text-base font-bold text-black">
            R$ {fmt(data.grandTotal)}
          </span>
        </div>

        {all.length === 0 && (
          <p className="text-xs text-gray-400 italic px-1">Sem movimentações no período.</p>
        )}

        <div className="space-y-2">
          {all.map((c) => {
            const centerOpen = !!openCenters[c.keyPrefix];
            return (
              <div key={c.keyPrefix} className="rounded-lg border border-gray-200 bg-white overflow-hidden">
                <button
                  type="button"
                  onClick={() => toggleCenter(c.keyPrefix)}
                  className="w-full flex items-center gap-2 px-3 py-2.5 hover:bg-gray-50 transition-colors text-left"
                >
                  {centerOpen ? (
                    <ChevronDown className="h-4 w-4 text-gray-500 flex-shrink-0" />
                  ) : (
                    <ChevronRight className="h-4 w-4 text-gray-500 flex-shrink-0" />
                  )}
                  <span
                    className="w-2.5 h-2.5 rounded-full flex-shrink-0"
                    style={{ backgroundColor: c.color }}
                  />
                  <span className="flex-1 text-sm font-semibold text-black truncate">
                    {c.title}
                  </span>
                  <span className="text-xs text-gray-500 hidden sm:inline">
                    {c.subs.reduce((s, sg) => s + sg.transactions.length, 0)} mov.
                  </span>
                  <span
                    className={`text-sm font-bold whitespace-nowrap ${
                      type === 'receita' ? 'text-green-700' : 'text-red-700'
                    }`}
                  >
                    {type === 'receita' ? '+' : '-'}R$ {fmt(c.total)}
                  </span>
                </button>

                {centerOpen && (
                  <div className="border-t border-gray-100 bg-gray-50/40">
                    {c.subs.map((sg) => {
                      const sgKey = c.keyPrefix + ':' + sg.id;
                      const sgOpen = !!openSubgroups[sgKey];
                      return (
                        <div key={sgKey} className="border-b border-gray-100 last:border-b-0">
                          <button
                            type="button"
                            onClick={() => toggleSubgroup(sgKey)}
                            className="w-full flex items-center gap-2 pl-8 pr-3 py-2 hover:bg-white transition-colors text-left"
                          >
                            {sgOpen ? (
                              <ChevronDown className="h-3.5 w-3.5 text-gray-400 flex-shrink-0" />
                            ) : (
                              <ChevronRight className="h-3.5 w-3.5 text-gray-400 flex-shrink-0" />
                            )}
                            <span className="flex-1 text-xs md:text-sm text-gray-800 truncate">
                              {sg.name}
                            </span>
                            <span className="text-[10px] md:text-xs text-gray-500">
                              {sg.transactions.length}
                            </span>
                            <span className="text-xs md:text-sm font-semibold text-gray-900 whitespace-nowrap">
                              R$ {fmt(sg.total)}
                            </span>
                          </button>

                          {sgOpen && (
                            <ul className="bg-white">
                              {sg.transactions
                                .slice()
                                .sort(
                                  (a, b) =>
                                    new Date(b.data_transacao).getTime() -
                                    new Date(a.data_transacao).getTime(),
                                )
                                .map((t) => (
                                  <li
                                    key={t.id}
                                    className="flex items-center gap-2 pl-14 pr-3 py-2 border-t border-gray-100 hover:bg-gray-50"
                                  >
                                    <span className="text-[10px] md:text-xs text-gray-500 w-14 flex-shrink-0">
                                      {new Date(t.data_transacao).toLocaleDateString('pt-BR', {
                                        day: '2-digit',
                                        month: '2-digit',
                                      })}
                                    </span>
                                    <div className="flex-1 min-w-0">
                                      <p
                                        className="text-xs md:text-sm text-black truncate"
                                        title={t.descricao}
                                      >
                                        {t.descricao}
                                      </p>
                                      <Badge variant="outline" className="text-[10px] mt-0.5">
                                        {t.categoria_final || t.categoria_sugerida || 'Outros'}
                                      </Badge>
                                    </div>
                                    <span
                                      className={`text-xs md:text-sm font-semibold whitespace-nowrap ${
                                        t.valor > 0 ? 'text-green-700' : 'text-red-700'
                                      }`}
                                    >
                                      {t.valor > 0 ? '+' : '-'}R${' '}
                                      {fmt(Math.abs(t.valor))}
                                    </span>
                                    <Button
                                      type="button"
                                      variant="ghost"
                                      size="sm"
                                      className="h-7 w-7 p-0"
                                      title="Mover para outro centro"
                                      onClick={() => setMoveTarget(t)}
                                    >
                                      <MoveRight className="h-3.5 w-3.5" />
                                    </Button>
                                  </li>
                                ))}
                            </ul>
                          )}
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>
    );
  };

  return (
    <div className="space-y-6">
      {renderSection(
        'Centros de Receita',
        <ArrowUpCircle className="h-4 w-4 text-[#1A3423]" />,
        '#1A3423',
        grouped.receitas,
        'receita',
      )}
      {renderSection(
        'Centros de Custo',
        <ArrowDownCircle className="h-4 w-4 text-[#8B2F2F]" />,
        '#8B2F2F',
        grouped.custos,
        'custo',
      )}

      {moveTarget && (
        <MoveCostCenterDialog
          open={!!moveTarget}
          onOpenChange={(o) => !o && setMoveTarget(null)}
          transactionId={moveTarget.id}
          sourceTable="transacoes_conciliadas"
          type={moveTarget.valor > 0 ? 'entrada' : 'saida'}
          currentCategoryName={moveTarget.categoria_final || moveTarget.categoria_sugerida || null}
          currentCenterId={moveTarget.cost_center_id || null}
          currentSubgroupId={moveTarget.cost_subgroup_id || null}
          onMoved={() => {
            setMoveTarget(null);
            onUpdated?.();
          }}
        />
      )}
    </div>
  );
}
