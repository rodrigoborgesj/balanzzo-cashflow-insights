import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Building2, Plus, Settings, Eye, EyeOff } from "lucide-react";
import { useHolding } from "@/hooks/useHolding";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";

export function CompanyManager() {
  const { companies, addCompany, updateCompany, isLoading } = useHolding();
  const { toast } = useToast();
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [newCompany, setNewCompany] = useState({
    company_name: "",
    cnpj: "",
    revenue_range: "",
    address_street: "",
    address_number: "",
    address_complement: "",
    address_neighborhood: "",
    address_city: "",
    address_state: "",
    address_zip_code: "",
    is_holding: false,
    status: "active" as const,
    display_order: 0,
  });

  const revenueRanges = [
    "Até R$ 360 mil/ano",
    "R$ 360 mil a R$ 4,8 milhões/ano", 
    "R$ 4,8 milhões a R$ 300 milhões/ano",
    "Acima de R$ 300 milhões/ano"
  ];

  const handleAddCompany = async () => {
    if (!newCompany.company_name || !newCompany.cnpj) {
      toast({
        title: "Erro",
        description: "Nome da empresa e CNPJ são obrigatórios",
        variant: "destructive",
      });
      return;
    }

    await addCompany(newCompany);
    setIsAddDialogOpen(false);
    setNewCompany({
      company_name: "",
      cnpj: "",
      revenue_range: "",
      address_street: "",
      address_number: "",
      address_complement: "",
      address_neighborhood: "",
      address_city: "",
      address_state: "",
      address_zip_code: "",
      is_holding: false,
      status: "active",
      display_order: 0,
    });
    
    toast({
      title: "Sucesso",
      description: "Empresa adicionada com sucesso!",
    });
  };

  const toggleCompanyStatus = async (companyId: string, currentStatus: string) => {
    const newStatus = currentStatus === "active" ? "inactive" : "active";
    await updateCompany(companyId, { status: newStatus });
    
    toast({
      title: "Status atualizado",
      description: `Empresa ${newStatus === "active" ? "ativada" : "desativada"} com sucesso!`,
    });
  };

  if (isLoading) {
    return <div>Carregando empresas...</div>;
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-foreground">Gerenciar Empresas</h2>
          <p className="text-muted-foreground">
            Adicione e gerencie todas as empresas do seu grupo
          </p>
        </div>
        
        <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
          <DialogTrigger asChild>
            <Button className="gap-2">
              <Plus className="h-4 w-4" />
              Nova Empresa
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>Adicionar Nova Empresa</DialogTitle>
            </DialogHeader>
            <div className="grid gap-4 py-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="company-name">Nome da Empresa *</Label>
                  <Input
                    id="company-name"
                    value={newCompany.company_name}
                    onChange={(e) => setNewCompany(prev => ({ ...prev, company_name: e.target.value }))}
                    placeholder="Razão social da empresa"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="cnpj">CNPJ *</Label>
                  <Input
                    id="cnpj"
                    value={newCompany.cnpj}
                    onChange={(e) => setNewCompany(prev => ({ ...prev, cnpj: e.target.value }))}
                    placeholder="00.000.000/0000-00"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="revenue-range">Faixa de Faturamento</Label>
                <Select value={newCompany.revenue_range} onValueChange={(value) => setNewCompany(prev => ({ ...prev, revenue_range: value }))}>
                  <SelectTrigger>
                    <SelectValue placeholder="Selecione a faixa de faturamento" />
                  </SelectTrigger>
                  <SelectContent>
                    {revenueRanges.map((range) => (
                      <SelectItem key={range} value={range}>
                        {range}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="grid grid-cols-3 gap-4">
                <div className="space-y-2 col-span-2">
                  <Label htmlFor="street">Endereço</Label>
                  <Input
                    id="street"
                    value={newCompany.address_street}
                    onChange={(e) => setNewCompany(prev => ({ ...prev, address_street: e.target.value }))}
                    placeholder="Rua, Avenida..."
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="number">Número</Label>
                  <Input
                    id="number"
                    value={newCompany.address_number}
                    onChange={(e) => setNewCompany(prev => ({ ...prev, address_number: e.target.value }))}
                    placeholder="123"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="neighborhood">Bairro</Label>
                  <Input
                    id="neighborhood"
                    value={newCompany.address_neighborhood}
                    onChange={(e) => setNewCompany(prev => ({ ...prev, address_neighborhood: e.target.value }))}
                    placeholder="Centro"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="complement">Complemento</Label>
                  <Input
                    id="complement"
                    value={newCompany.address_complement}
                    onChange={(e) => setNewCompany(prev => ({ ...prev, address_complement: e.target.value }))}
                    placeholder="Sala 101"
                  />
                </div>
              </div>

              <div className="grid grid-cols-3 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="city">Cidade</Label>
                  <Input
                    id="city"
                    value={newCompany.address_city}
                    onChange={(e) => setNewCompany(prev => ({ ...prev, address_city: e.target.value }))}
                    placeholder="São Paulo"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="state">Estado</Label>
                  <Input
                    id="state"
                    value={newCompany.address_state}
                    onChange={(e) => setNewCompany(prev => ({ ...prev, address_state: e.target.value }))}
                    placeholder="SP"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="zip">CEP</Label>
                  <Input
                    id="zip"
                    value={newCompany.address_zip_code}
                    onChange={(e) => setNewCompany(prev => ({ ...prev, address_zip_code: e.target.value }))}
                    placeholder="00000-000"
                  />
                </div>
              </div>
            </div>
            <div className="flex justify-end gap-2">
              <Button variant="outline" onClick={() => setIsAddDialogOpen(false)}>
                Cancelar
              </Button>
              <Button onClick={handleAddCompany}>
                Adicionar Empresa
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      <div className="grid gap-4">
        {companies.length === 0 ? (
          <Card>
            <CardContent className="text-center py-8">
              <Building2 className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
              <h3 className="text-lg font-medium mb-2">Nenhuma empresa cadastrada</h3>
              <p className="text-muted-foreground mb-4">
                Adicione empresas para começar a usar o painel consolidado
              </p>
              <Button onClick={() => setIsAddDialogOpen(true)} className="gap-2">
                <Plus className="h-4 w-4" />
                Adicionar Primeira Empresa
              </Button>
            </CardContent>
          </Card>
        ) : (
          companies.map((company) => (
            <Card key={company.id}>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <Building2 className="h-5 w-5" />
                    <div>
                      <CardTitle className="text-lg">{company.company_name}</CardTitle>
                      <p className="text-sm text-muted-foreground">CNPJ: {company.cnpj}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <Badge variant={company.status === "active" ? "default" : "secondary"}>
                      {company.status === "active" ? "Ativa" : "Inativa"}
                    </Badge>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => toggleCompanyStatus(company.id, company.status)}
                      className="gap-2"
                    >
                      {company.status === "active" ? (
                        <>
                          <EyeOff className="h-4 w-4" />
                          Desativar
                        </>
                      ) : (
                        <>
                          <Eye className="h-4 w-4" />
                          Ativar
                        </>
                      )}
                    </Button>
                    <Button variant="outline" size="sm" className="gap-2">
                      <Settings className="h-4 w-4" />
                      Editar
                    </Button>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                  <div>
                    <p className="font-medium">Endereço:</p>
                    <p className="text-muted-foreground">
                      {company.address_street}, {company.address_number}
                      {company.address_complement && ` - ${company.address_complement}`}
                      <br />
                      {company.address_neighborhood} - {company.address_city}/{company.address_state}
                      <br />
                      CEP: {company.address_zip_code}
                    </p>
                  </div>
                  <div>
                    <p className="font-medium">Faturamento:</p>
                    <p className="text-muted-foreground">{company.revenue_range}</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))
        )}
      </div>
    </div>
  );
}