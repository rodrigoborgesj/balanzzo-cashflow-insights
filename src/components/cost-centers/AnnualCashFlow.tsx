import { Fragment, useMemo, useState } from 'react';
import { ChevronDown, ChevronRight, Download, Filter, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Checkbox } from '@/components/ui/checkbox';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { useAnnualCashFlow } from '@/hooks/useAnnualCashFlow';
import { useCostCenters } from '@/hooks/useCostCenters';
import { buildAnnualCashFlow, type AnnualRow } from '@/utils/annualCashFlow';

const money = (cents: number) => cents === 0 ? '—' : (cents / 100).toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
const monthLabel = (month: string) => `${month.slice(5, 7)}/${month.slice(0, 4)}`;

export function AnnualCashFlow({ year }: { year: string }) {
  const query = useAnnualCashFlow(year);
  const { centers, subgroups } = useCostCenters();
  const [type, setType] = useState<'todas' | 'entradas' | 'saidas'>('todas');
  const [categories, setCategories] = useState<string[]>([]);
  const [collapsed, setCollapsed] = useState<Record<string, boolean>>({});
  const data = useMemo(() => buildAnnualCashFlow(query.data || [], year, centers, subgroups, { type, categories }), [query.data, year, centers, subgroups, type, categories]);
  const exportCSV = () => {
    const rows: (string | number)[][] = [['Centro / Subgrupo / Categoria', ...data.months.map(monthLabel), 'Total']];
    const add = (row: AnnualRow, level = 0) => {
      rows.push([`${'  '.repeat(level)}${row.name}`, ...data.months.map(m => ((row.months[m] || 0) / 100).toFixed(2).replace('.', ',')), (row.total / 100).toFixed(2).replace('.', ',')]);
      row.children.forEach(r => add(r, level + 1));
    };
    [data.inflow, data.outflow, data.result].forEach(row => add(row));
    const csv = rows.map(row => row.map(value => {
      const text = String(value);
      return `"${(/^[=+@]/.test(text.trimStart()) ? `'${text}` : text).replace(/"/g, '""')}"`;
    }).join(';')).join('\r\n');
    const url = URL.createObjectURL(new Blob(['\uFEFF' + csv], { type: 'text/csv;charset=utf-8;' }));
    const link = document.createElement('a');
    link.href = url; link.download = `fluxo-caixa-anual-${year}.csv`; link.click();
    URL.revokeObjectURL(url);
  };
  const cells = (row: AnnualRow, emphasis = false) => <>
    {data.months.map(month => <TableCell key={month} className={`min-w-36 text-right tabular-nums whitespace-nowrap ${emphasis ? 'font-semibold' : ''} ${(row.months[month] || 0) < 0 ? 'text-destructive' : ''}`}>{money(row.months[month] || 0)}</TableCell>)}
    <TableCell className={`min-w-36 text-right tabular-nums whitespace-nowrap font-semibold ${row.total < 0 ? 'text-destructive' : ''}`}>{money(row.total)}</TableCell>
  </>;
  const renderRow = (row: AnnualRow, level = 0): React.ReactNode => <>
    <TableRow key={row.key} className={level === 0 ? 'bg-muted/30' : ''}>
      <TableCell className="sticky left-0 z-10 min-w-56 max-w-80 bg-background">
        <div className={`flex items-center gap-1 ${level === 1 ? 'pl-5' : level === 2 ? 'pl-10' : ''}`}>
          {row.children.length > 0 ? <Button variant="ghost" size="icon" className="h-11 w-11 shrink-0" aria-label={`${collapsed[row.key] ? 'Expandir' : 'Recolher'} ${row.name}`} aria-expanded={!collapsed[row.key]} onClick={() => setCollapsed(current => ({ ...current, [row.key]: !current[row.key] }))}>
            {collapsed[row.key] ? <ChevronRight className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
          </Button> : <span className="w-11 shrink-0" />}
          <span className={`break-words text-sm ${level === 0 ? 'font-semibold' : level === 2 ? 'text-muted-foreground' : ''}`}>{row.name}</span>
        </div>
      </TableCell>
      {cells(row, level === 0)}
    </TableRow>
    {!collapsed[row.key] && row.children.map(child => <Fragment key={child.key}>{renderRow(child, level + 1)}</Fragment>)}
  </>;
  const subtotal = (row: AnnualRow) => <TableRow className="bg-muted font-semibold"><TableCell className="sticky left-0 z-10 bg-muted">Total de {row.name.toLowerCase()}</TableCell>{cells(row, true)}</TableRow>;

  return <section className="space-y-4 border-t border-border py-5 text-foreground notranslate" translate="no">
    <div className="flex flex-wrap items-center justify-between gap-3">
      <div><h2 className="text-lg font-semibold">Fluxo de caixa mensal · {year}</h2><p className="mt-1 text-xs text-muted-foreground">{data.count} movimentações conciliadas · Valores em R$</p></div>
      <div className="flex flex-wrap items-center gap-2">
        <Select value={type} onValueChange={(value: typeof type) => setType(value)}><SelectTrigger className="min-h-11 w-32"><SelectValue /></SelectTrigger><SelectContent><SelectItem value="todas">Todas</SelectItem><SelectItem value="entradas">Entradas</SelectItem><SelectItem value="saidas">Saídas</SelectItem></SelectContent></Select>
        <Popover modal={false}><PopoverTrigger asChild><Button variant="outline" className="min-h-11 gap-2"><Filter className="h-4 w-4" />Categorias{categories.length > 0 ? ` (${categories.length})` : ''}</Button></PopoverTrigger>
          <PopoverContent className="w-64"><div className="flex items-center justify-between"><span className="text-sm font-semibold">Categorias</span><Button variant="ghost" className="min-h-11" onClick={() => setCategories([])}>Limpar</Button></div><div className="max-h-72 overflow-auto">{data.categories.map(category => <label key={category} className="flex min-h-11 cursor-pointer items-center gap-2 text-sm"><Checkbox checked={categories.includes(category)} onCheckedChange={checked => setCategories(current => checked ? [...current, category] : current.filter(c => c !== category))} />{category}</label>)}</div></PopoverContent>
        </Popover>
        <Button variant="outline" className="min-h-11 gap-2" onClick={exportCSV} disabled={!data.months.length || query.isFetching}><Download className="h-4 w-4" />Exportar</Button>
      </div>
    </div>
    {query.isLoading ? <div className="flex min-h-48 items-center justify-center gap-2 text-muted-foreground"><Loader2 className="h-5 w-5 animate-spin motion-reduce:animate-none" />Carregando meses conciliados…</div> : query.isError ? <div role="alert" className="py-8 text-center"><p>Não foi possível carregar o fluxo de caixa anual.</p><Button variant="outline" className="mt-3 min-h-11" onClick={() => query.refetch()}>Tentar novamente</Button></div> : !data.months.length ? <p className="py-12 text-center text-muted-foreground">Nenhuma movimentação conciliada em {year}.</p> : <div className="overflow-x-auto border-y border-border">
      <Table className="text-sm"><TableHeader><TableRow><TableHead className="sticky left-0 z-20 min-w-56 bg-background">Centro / Subgrupo / Categoria</TableHead>{data.months.map(month => <TableHead key={month} className="min-w-36 text-right">{monthLabel(month)}</TableHead>)}<TableHead className="min-w-36 text-right font-bold">Total</TableHead></TableRow></TableHeader>
        <TableBody>
          {type !== 'saidas' && <><TableRow className="bg-primary/5"><TableCell colSpan={data.months.length + 2} className="font-semibold text-primary">Entradas</TableCell></TableRow>{data.inflow.children.map(row => <Fragment key={row.key}>{renderRow(row)}</Fragment>)}{subtotal(data.inflow)}</>}
          {type !== 'entradas' && <><TableRow className="bg-muted/50"><TableCell colSpan={data.months.length + 2} className="font-semibold">Saídas</TableCell></TableRow>{data.outflow.children.map(row => <Fragment key={row.key}>{renderRow(row)}</Fragment>)}{subtotal(data.outflow)}</>}
          <TableRow className="border-t-2 border-primary font-bold"><TableCell className="sticky left-0 z-10 bg-background">Resultado líquido</TableCell>{cells(data.result, true)}</TableRow>
        </TableBody>
      </Table>
    </div>}
  </section>;
}
