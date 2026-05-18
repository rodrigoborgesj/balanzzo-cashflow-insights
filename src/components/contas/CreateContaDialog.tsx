import { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Plus } from 'lucide-react';
import { useContasAPagar, ContaTipo, ContaRecorrencia } from '@/hooks/useContasAPagar';

export function CreateContaDialog() {
  const [open, setOpen] = useState(false);
  const { createConta } = useContasAPagar();

  const [nome, setNome] = useState('');
  const [fornecedor, setFornecedor] = useState('');
  const [categoria, setCategoria] = useState('');
  const [valor, setValor] = useState('');
  const [dataVencimento, setDataVencimento] = useState('');
  const [tipo, setTipo] = useState<ContaTipo>('fixa');
  const [recorrencia, setRecorrencia] = useState<ContaRecorrencia>('mensal');
  const [parcelas, setParcelas] = useState('');
  const [observacoes, setObservacoes] = useState('');

  const reset = () => {
    setNome(''); setFornecedor(''); setCategoria(''); setValor('');
    setDataVencimento(''); setTipo('fixa'); setRecorrencia('mensal');
    setParcelas(''); setObservacoes('');
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!nome || !valor || !dataVencimento) return;
    await createConta.mutateAsync({
      nome,
      fornecedor: fornecedor || undefined,
      categoria: categoria || undefined,
      valor: parseFloat(valor.replace(',', '.')),
      data_vencimento: dataVencimento,
      tipo,
      recorrencia,
      parcelas_total: recorrencia === 'parcelada' ? Number(parcelas) || 1 : undefined,
      observacoes: observacoes || undefined,
    });
    reset();
    setOpen(false);
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button className="bg-primary text-white hover:bg-primary/90">
          <Plus className="h-4 w-4 mr-2" /> Nova conta
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-lg" translate="no">
        <DialogHeader>
          <DialogTitle>Nova conta a pagar</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-3">
          <div>
            <Label>Nome *</Label>
            <Input value={nome} onChange={e => setNome(e.target.value)} required />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <Label>Valor (R$) *</Label>
              <Input type="text" inputMode="decimal" value={valor} onChange={e => setValor(e.target.value)} required placeholder="0,00" />
            </div>
            <div>
              <Label>Vencimento *</Label>
              <Input type="date" value={dataVencimento} onChange={e => setDataVencimento(e.target.value)} required />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <Label>Tipo *</Label>
              <Select value={tipo} onValueChange={(v) => setTipo(v as ContaTipo)}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="fixa">Fixa</SelectItem>
                  <SelectItem value="variavel">Variável</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label>Recorrência *</Label>
              <Select value={recorrencia} onValueChange={(v) => setRecorrencia(v as ContaRecorrencia)}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="unica">Única</SelectItem>
                  <SelectItem value="mensal">Mensal</SelectItem>
                  <SelectItem value="parcelada">Parcelada</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          {recorrencia === 'parcelada' && (
            <div>
              <Label>Número de parcelas</Label>
              <Input type="number" min="1" value={parcelas} onChange={e => setParcelas(e.target.value)} />
            </div>
          )}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <Label>Fornecedor / Credor</Label>
              <Input value={fornecedor} onChange={e => setFornecedor(e.target.value)} />
            </div>
            <div>
              <Label>Categoria</Label>
              <Input value={categoria} onChange={e => setCategoria(e.target.value)} placeholder="Ex: Aluguel" />
            </div>
          </div>
          <div>
            <Label>Observações</Label>
            <Textarea value={observacoes} onChange={e => setObservacoes(e.target.value)} rows={2} />
          </div>
          <p className="text-xs text-muted-foreground">
            Contas <strong>fixas</strong> são automaticamente refletidas como despesas no Fluxo de Caixa.
          </p>
          <DialogFooter>
            <Button type="button" variant="ghost" onClick={() => setOpen(false)}>Cancelar</Button>
            <Button type="submit" disabled={createConta.isPending} className="bg-primary text-white hover:bg-primary/90">
              {createConta.isPending ? 'Salvando...' : 'Salvar'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
