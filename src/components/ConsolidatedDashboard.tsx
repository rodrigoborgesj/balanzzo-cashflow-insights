import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Building2, TrendingUp, TrendingDown, DollarSign, BarChart3, Plus } from "lucide-react";
import { useHolding } from "@/hooks/useHolding";
import { KPICard } from "./KPICard";

export function ConsolidatedDashboard() {
  const { 
    companies, 
    consolidatedData, 
    selectedCompanyId, 
    setSelectedCompanyId, 
    getFilteredData,
    isLoading 
  } = useHolding();
  
  const [viewMode, setViewMode] = useState<"consolidated" | "individual">("consolidated");

  if (isLoading) {
    return <div>Carregando painel consolidado...</div>;
  }

  if (!consolidatedData) {
    return <div>Nenhum dado financeiro encontrado.</div>;
  }

  const displayData = viewMode === "consolidated" 
    ? consolidatedData 
    : getFilteredData(selectedCompanyId || undefined);

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL',
    }).format(value);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-foreground">Painel Consolidado</h1>
          <p className="text-muted-foreground">
            Visão unificada de todas as suas empresas
          </p>
        </div>
        <Button className="gap-2">
          <Plus className="h-4 w-4" />
          Nova Empresa
        </Button>
      </div>

      {/* Controls */}
      <div className="flex flex-col sm:flex-row gap-4">
        <Select value={viewMode} onValueChange={(value: "consolidated" | "individual") => setViewMode(value)}>
          <SelectTrigger className="w-full sm:w-[200px]">
            <SelectValue placeholder="Modo de visualização" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="consolidated">
              <div className="flex items-center gap-2">
                <BarChart3 className="h-4 w-4" />
                Consolidado
              </div>
            </SelectItem>
            <SelectItem value="individual">
              <div className="flex items-center gap-2">
                <Building2 className="h-4 w-4" />
                Individual
              </div>
            </SelectItem>
          </SelectContent>
        </Select>

        {viewMode === "individual" && (
          <Select value={selectedCompanyId || ""} onValueChange={setSelectedCompanyId}>
            <SelectTrigger className="w-full sm:w-[250px]">
              <SelectValue placeholder="Selecione uma empresa" />
            </SelectTrigger>
            <SelectContent>
              {companies.map((company) => (
                <SelectItem key={company.id} value={company.id}>
                  <div className="flex items-center gap-2">
                    <Building2 className="h-4 w-4" />
                    {company.company_name}
                  </div>
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        )}
      </div>

      {/* Companies Overview */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Building2 className="h-5 w-5" />
            {viewMode === "consolidated" ? "Empresas do Grupo" : "Empresa Selecionada"}
          </CardTitle>
        </CardHeader>
        <CardContent>
          {viewMode === "consolidated" ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {companies.map((company) => (
                <div key={company.id} className="flex items-center justify-between p-3 border rounded-lg">
                  <div>
                    <h4 className="font-medium">{company.company_name}</h4>
                    <p className="text-sm text-muted-foreground">{company.cnpj}</p>
                  </div>
                  <Badge variant={company.status === "active" ? "default" : "secondary"}>
                    {company.status === "active" ? "Ativa" : "Inativa"}
                  </Badge>
                </div>
              ))}
            </div>
          ) : (
            selectedCompanyId && (
              <div className="text-center p-4">
                {(() => {
                  const company = companies.find(c => c.id === selectedCompanyId);
                  return company ? (
                    <div>
                      <h3 className="text-xl font-bold">{company.company_name}</h3>
                      <p className="text-muted-foreground">CNPJ: {company.cnpj}</p>
                      <p className="text-sm text-muted-foreground mt-2">
                        {company.address_street}, {company.address_number} - {company.address_city}/{company.address_state}
                      </p>
                    </div>
                  ) : null;
                })()}
              </div>
            )
          )}
        </CardContent>
      </Card>

      {/* KPIs */}
      {displayData && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <KPICard
            title="Receita Total"
            value={formatCurrency(displayData.total_revenue)}
            change="+12.5% vs mês anterior"
            changeType="positive"
            icon={DollarSign}
            description={viewMode === "consolidated" ? `${displayData.company_count} empresas` : "Receita mensal"}
          />
          
          <KPICard
            title="Despesas Totais"
            value={formatCurrency(displayData.total_expenses)}
            change="+5.2% vs mês anterior"
            changeType="negative"
            icon={TrendingDown}
            description="Gastos operacionais"
          />
          
          <KPICard
            title="Lucro Líquido"
            value={formatCurrency(displayData.total_profit)}
            change="+18.7% vs mês anterior"
            changeType="positive"
            icon={TrendingUp}
            description="Resultado consolidado"
          />
          
          <KPICard
            title="Fluxo de Caixa"
            value={formatCurrency(displayData.total_cash_flow)}
            change="+8.9% vs mês anterior"
            changeType="positive"
            icon={BarChart3}
            description="Saldo disponível"
          />
        </div>
      )}

      {/* Performance by Company */}
      {viewMode === "consolidated" && (
        <Card>
          <CardHeader>
            <CardTitle>Performance por Empresa</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {companies.map((company) => {
                const companyData = getFilteredData(company.id);
                if (!companyData) return null;

                return (
                  <div key={company.id} className="flex items-center justify-between p-4 border rounded-lg">
                    <div className="flex items-center gap-3">
                      <Building2 className="h-5 w-5 text-muted-foreground" />
                      <div>
                        <h4 className="font-medium">{company.company_name}</h4>
                        <p className="text-sm text-muted-foreground">
                          Receita: {formatCurrency(companyData.total_revenue)}
                        </p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="font-medium text-lg">
                        {formatCurrency(companyData.total_profit)}
                      </p>
                      <p className="text-sm text-muted-foreground">Lucro</p>
                    </div>
                  </div>
                );
              })}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}