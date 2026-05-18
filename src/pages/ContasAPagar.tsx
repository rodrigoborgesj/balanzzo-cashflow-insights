import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { CheckCircle2, Trash2, Upload, FileText } from 'lucide-react';
import { useContasAPagar, ContaAPagar } from '@/hooks/useContasAPagar';
import { CreateContaDialog } from '@/components/contas/CreateContaDialog';
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
  AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger,
} from '@/components/ui/alert-dialog';

function currentMonth() {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
}

const formatBRL = (v: number) =>
  new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(v);

function ContaRow({ conta }: { conta: ContaAPagar }) {
  const { markAsPaid, deleteConta, uploadComprovante } = useContasAPagar();
  const [uploading, setUploading] = useState(false);

  const handlePaid = async (file?: File) => {
    let url: string | undefined;
    if (file) {
      setUploading(true);
      try {
        url = await uploadComprovante(conta.id, file);
      } finally {
        setUploading(false);
      }
    }
    await markAsPaid.mutateAsync({ id: conta.id, comprovante_url: url });
  };

  const isPago = conta.status === 'pago';
  const isAtrasada = !isPago && conta.data_vencimento < new Date().toISOString().slice(0, 10);

  return (
    <div className="flex flex-col md:flex-row md:items-center justify-between p-4 rounded-lg border border-border bg-card gap-3">
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2 flex-wrap">
          <p className="font-medium text-foreground truncate">{conta.nome}</p>
          <Badge variant={conta.tipo === 'fixa' ? 'default' : 'secondary'} className="text-xs">
            {conta.tipo === 'fixa' ? 'Fixa' : 'Variável'}
          </Badge>
          {conta.parcelas_total && conta.parcela_atual && (
            <Badge variant="outline" className="text-xs">
              {conta.parcela_atual}/{conta.parcelas_total}
            </Badge>
          )}
          {isPago && <Badge className="bg-green-600 text-white text-xs">Pago</Badge>}
          {isAtrasada && <Badge variant="destructive" className="text-xs">Atrasada</Badge>}
        </div>
        <p className="text-sm text-muted-foreground mt-1">
          Vence em {conta.data_vencimento.split('-').reverse().join('/')}
          {conta.fornecedor && <span className="ml-2">• {conta.fornecedor}</span>}
          {conta.categoria && <span className="ml-2">• {conta.categoria}</span>}
        </p>
      </div>
      <div className="flex items-center gap-3">
        <span className="font-semibold text-foreground whitespace-nowrap">{formatBRL(Number(conta.valor))}</span>
        {!isPago && (
          <>
            <label className="cursor-pointer">
              <input
                type="file"
                accept="image/*,application/pdf"
                className="hidden"
                onChange={(e) => e.target.files?.[0] && handlePaid(e.target.files[0])}
              />
              <Button size="sm" variant="outline" asChild disabled={uploading}>
                <span><Upload className="h-4 w-4 mr-1" />{uploading ? 'Enviando...' : 'Pagar c/ comprovante'}</span>
              </Button>
            </label>
            <Button size="sm" onClick={() => handlePaid()} className="bg-primary text-white hover:bg-primary/90">
              <CheckCircle2 className="h-4 w-4 mr-1" /> Marcar pago
            </Button>
          </>
        )}
        {isPago && conta.comprovante_url && (
          <Badge variant="outline" className="text-xs"><FileText className="h-3 w-3 mr-1" />Comprovante</Badge>
        )}
        <AlertDialog>
          <AlertDialogTrigger asChild>
            <Button size="icon" variant="ghost" className="h-8 w-8 text-muted-foreground hover:text-destructive">
              <Trash2 className="h-4 w-4" />
            </Button>
          </AlertDialogTrigger>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Remover conta?</AlertDialogTitle>
              <AlertDialogDescription>Esta ação também remove os lançamentos previstos no Fluxo de Caixa.</AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>Cancelar</AlertDialogCancel>
              <AlertDialogAction onClick={() => deleteConta.mutate(conta.id)} className="bg-destructive text-destructive-foreground">Remover</AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </div>
    </div>
  );
}

export default function ContasAPagar() {
  const [selectedMonth, setSelectedMonth] = useState(currentMonth());
  const [statusFilter, setStatusFilter] = useState<string>('todos');
  const [tipoFilter, setTipoFilter] = useState<string>('todos');

  const { contas, isLoading, totalMes, totalPago, totalPendente } = useContasAPagar(selectedMonth);

  const filtered = contas.filter(c => {
    if (statusFilter !== 'todos' && c.status !== statusFilter) return false;
    if (tipoFilter !== 'todos' && c.tipo !== tipoFilter) return false;
    return true;
  });

  const venceProx7 = contas.filter(c => {
    if (c.status === 'pago') return false;
    const today = new Date().toISOString().slice(0, 10);
    const limit = new Date(); limit.setDate(limit.getDate() + 7);
    const limitISO = limit.toISOString().slice(0, 10);
    return c.data_vencimento >= today && c.data_vencimento <= limitISO;
  }).reduce((s, c) => s + Number(c.valor), 0);

  return (
    <div className="container mx-auto px-4 py-6 max-w-6xl" style={{ fontFamily: 'Montserrat, sans-serif' }}>
      <div className="flex flex-col md:flex-row md:items-center justify-between mb-6 gap-3">
        <div>
          <h1 className="text-2xl md:text-3xl font-bold text-foreground">Contas a Pagar</h1>
          <p className="text-sm text-muted-foreground">Controladoria de despesas previstas e realizadas</p>
        </div>
        <CreateContaDialog />
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-6">
        <Card><CardHeader className="pb-2"><CardTitle className="text-xs text-muted-foreground font-normal">Total do mês</CardTitle></CardHeader><CardContent><p className="text-xl font-bold">{formatBRL(totalMes)}</p></CardContent></Card>
        <Card><CardHeader className="pb-2"><CardTitle className="text-xs text-muted-foreground font-normal">Pago</CardTitle></CardHeader><CardContent><p className="text-xl font-bold text-green-600">{formatBRL(totalPago)}</p></CardContent></Card>
        <Card><CardHeader className="pb-2"><CardTitle className="text-xs text-muted-foreground font-normal">Pendente</CardTitle></CardHeader><CardContent><p className="text-xl font-bold text-orange-600">{formatBRL(totalPendente)}</p></CardContent></Card>
        <Card><CardHeader className="pb-2"><CardTitle className="text-xs text-muted-foreground font-normal">Vence em 7 dias</CardTitle></CardHeader><CardContent><p className="text-xl font-bold text-destructive">{formatBRL(venceProx7)}</p></CardContent></Card>
      </div>

      <Card>
        <CardHeader className="flex flex-col md:flex-row md:items-center justify-between gap-3">
          <CardTitle className="text-lg">Lançamentos</CardTitle>
          <div className="flex flex-wrap gap-2">
            <Input type="month" value={selectedMonth} onChange={(e) => setSelectedMonth(e.target.value)} className="w-40" />
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-32"><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="todos">Todos</SelectItem>
                <SelectItem value="pendente">Pendentes</SelectItem>
                <SelectItem value="pago">Pagos</SelectItem>
              </SelectContent>
            </Select>
            <Select value={tipoFilter} onValueChange={setTipoFilter}>
              <SelectTrigger className="w-32"><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="todos">Todos tipos</SelectItem>
                <SelectItem value="fixa">Fixas</SelectItem>
                <SelectItem value="variavel">Variáveis</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardHeader>
        <CardContent className="space-y-2">
          {isLoading ? (
            <p className="text-muted-foreground py-8 text-center">Carregando...</p>
          ) : filtered.length === 0 ? (
            <p className="text-muted-foreground py-8 text-center">Nenhuma conta encontrada para o filtro selecionado.</p>
          ) : (
            filtered.map(c => <ContaRow key={c.id} conta={c} />)
          )}
        </CardContent>
      </Card>
    </div>
  );
}
