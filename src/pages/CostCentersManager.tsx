import { useState } from 'react';
import { useCostCenters, CostCenter } from '@/hooks/useCostCenters';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Plus, Trash2, ArrowLeft } from 'lucide-react';
import { Link } from 'react-router-dom';

export default function CostCentersManager() {
  const { centers, subgroups, createCenter, deleteCenter, createSubgroup, deleteSubgroup } = useCostCenters();
  const [newName, setNewName] = useState('');
  const [newType, setNewType] = useState<'receita' | 'custo'>('custo');
  const [subgroupName, setSubgroupName] = useState<Record<string, string>>({});

  const receitas = centers.filter((c) => c.type === 'receita' && c.active);
  const custos = centers.filter((c) => c.type === 'custo' && c.active);

  const handleCreate = () => {
    if (!newName.trim()) return;
    createCenter({ name: newName, type: newType });
    setNewName('');
  };

  const handleAddSub = (centerId: string) => {
    const name = subgroupName[centerId]?.trim();
    if (!name) return;
    createSubgroup({ cost_center_id: centerId, name });
    setSubgroupName((s) => ({ ...s, [centerId]: '' }));
  };

  const renderCenter = (c: CostCenter) => {
    const subs = subgroups.filter((s) => s.cost_center_id === c.id && s.active);
    return (
      <Card key={c.id} className="border border-slate-200">
        <CardHeader className="pb-2">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className="w-3 h-3 rounded-full" style={{ backgroundColor: c.color }} />
              <CardTitle className="text-base">{c.name}</CardTitle>
              {c.is_default && <Badge variant="outline" className="text-[10px]">Padrão</Badge>}
            </div>
            {!c.is_default && (
              <Button variant="ghost" size="sm" onClick={() => deleteCenter(c.id)}>
                <Trash2 className="h-4 w-4 text-destructive" />
              </Button>
            )}
          </div>
        </CardHeader>
        <CardContent className="space-y-3 pt-0">
          <div className="flex flex-wrap gap-2">
            {subs.length === 0 && <p className="text-xs text-muted-foreground">Sem subcategorias</p>}
            {subs.map((s) => (
              <Badge key={s.id} variant="secondary" className="gap-1 pr-1">
                {s.name}
                <button
                  onClick={() => deleteSubgroup(s.id)}
                  className="ml-1 hover:text-destructive"
                  aria-label={`Remover ${s.name}`}
                >
                  <Trash2 className="h-3 w-3" />
                </button>
              </Badge>
            ))}
          </div>
          <div className="flex gap-2">
            <Input
              placeholder="Nova subcategoria"
              value={subgroupName[c.id] || ''}
              onChange={(e) => setSubgroupName((s) => ({ ...s, [c.id]: e.target.value }))}
              onKeyDown={(e) => e.key === 'Enter' && handleAddSub(c.id)}
              className="h-9 text-sm"
            />
            <Button size="sm" variant="outline" onClick={() => handleAddSub(c.id)}>
              <Plus className="h-4 w-4" />
            </Button>
          </div>
        </CardContent>
      </Card>
    );
  };

  return (
    <div className="p-4 md:p-6 space-y-6 bg-background min-h-full" style={{ fontFamily: 'Montserrat, sans-serif' }}>
      <div className="flex items-center justify-between">
        <div>
          <Button variant="ghost" size="sm" asChild className="mb-2">
            <Link to="/configuracoes"><ArrowLeft className="h-4 w-4 mr-2" />Configurações</Link>
          </Button>
          <h1 className="page-title">Centros de Receita e Custo</h1>
          <p className="text-muted-foreground text-sm max-w-2xl">
            Organize suas movimentações em grupos simples. A IA distribui automaticamente — você cria novos centros e
            subcategorias livremente.
          </p>
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Criar novo centro</CardTitle>
        </CardHeader>
        <CardContent className="flex flex-col md:flex-row gap-3 items-end">
          <div className="flex-1 space-y-2">
            <Label>Nome</Label>
            <Input value={newName} onChange={(e) => setNewName(e.target.value)} placeholder="Ex: Logística" />
          </div>
          <div className="w-full md:w-48 space-y-2">
            <Label>Tipo</Label>
            <Select value={newType} onValueChange={(v: any) => setNewType(v)}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="receita">Centro de Receita</SelectItem>
                <SelectItem value="custo">Centro de Custo</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <Button onClick={handleCreate}><Plus className="h-4 w-4 mr-2" />Criar</Button>
        </CardContent>
      </Card>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <section className="space-y-3">
          <h2 className="text-sm font-semibold uppercase tracking-wide text-slate-600">Centros de Receita</h2>
          {receitas.map(renderCenter)}
        </section>
        <section className="space-y-3">
          <h2 className="text-sm font-semibold uppercase tracking-wide text-slate-600">Centros de Custo</h2>
          {custos.map(renderCenter)}
        </section>
      </div>
    </div>
  );
}
