import { useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Building2, BarChart3, Settings, Users } from "lucide-react";
import { useHolding } from "@/hooks/useHolding";
import { ConsolidatedDashboard } from "@/components/ConsolidatedDashboard";
import { CompanyManager } from "@/components/CompanyManager";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

export default function Holding() {
  const { isHoldingEnabled, enableHolding, companies, isLoading } = useHolding();

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
          <p>Carregando...</p>
        </div>
      </div>
    );
  }

  if (!isHoldingEnabled) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="max-w-4xl mx-auto">
          <Card className="text-center">
            <CardHeader>
              <div className="mx-auto w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center mb-4">
                <Building2 className="h-8 w-8 text-primary" />
              </div>
              <CardTitle className="text-2xl mb-2">Painel Consolidado para Holdings</CardTitle>
              <p className="text-muted-foreground">
                Gerencie múltiplas empresas e visualize informações financeiras consolidadas
              </p>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6 text-left">
                <div className="flex flex-col items-center text-center p-4">
                  <BarChart3 className="h-10 w-10 text-primary mb-3" />
                  <h3 className="font-semibold mb-2">Visão Consolidada</h3>
                  <p className="text-sm text-muted-foreground">
                    Visualize receitas, despesas e lucros de todas as empresas em um só lugar
                  </p>
                </div>
                <div className="flex flex-col items-center text-center p-4">
                  <Users className="h-10 w-10 text-primary mb-3" />
                  <h3 className="font-semibold mb-2">Análise Individual</h3>
                  <p className="text-sm text-muted-foreground">
                    Filtre e analise cada empresa separadamente quando necessário
                  </p>
                </div>
                <div className="flex flex-col items-center text-center p-4">
                  <Settings className="h-10 w-10 text-primary mb-3" />
                  <h3 className="font-semibold mb-2">Gestão Simplificada</h3>
                  <p className="text-sm text-muted-foreground">
                    Adicione, edite e gerencie todas as empresas do grupo facilmente
                  </p>
                </div>
              </div>
              
              <div className="bg-muted/50 rounded-lg p-6">
                <h4 className="font-semibold mb-3">O que você pode fazer:</h4>
                <ul className="text-sm text-muted-foreground space-y-2 text-left max-w-2xl mx-auto">
                  <li>• Visualizar saldo geral, entradas e saídas consolidadas</li>
                  <li>• Identificar quais empresas estão performando melhor</li>
                  <li>• Analisar gastos por empresa ou categoria</li>
                  <li>• Tomar decisões baseadas em dados do grupo todo</li>
                  <li>• Filtrar informações por empresa específica</li>
                </ul>
              </div>

              <Button onClick={enableHolding} size="lg" className="gap-2">
                <Building2 className="h-5 w-5" />
                Ativar Painel Consolidado
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <Tabs defaultValue="dashboard" className="space-y-6">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="dashboard" className="gap-2">
            <BarChart3 className="h-4 w-4" />
            Dashboard
          </TabsTrigger>
          <TabsTrigger value="companies" className="gap-2">
            <Building2 className="h-4 w-4" />
            Empresas
          </TabsTrigger>
        </TabsList>
        
        <TabsContent value="dashboard">
          <ConsolidatedDashboard />
        </TabsContent>
        
        <TabsContent value="companies">
          <CompanyManager />
        </TabsContent>
      </Tabs>
    </div>
  );
}