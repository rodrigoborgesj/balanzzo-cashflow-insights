import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { 
  Banknote, 
  Plus, 
  CheckCircle, 
  AlertCircle,
  Settings,
  RefreshCw
} from "lucide-react";

const bancos = [
  { id: 1, nome: "Banco do Brasil", status: "conectado", ultima_sync: "2024-06-29 14:30", saldo: 25000 },
  { id: 2, nome: "Itaú", status: "conectado", ultima_sync: "2024-06-29 14:30", saldo: 15000 },
  { id: 3, nome: "Bradesco", status: "erro", ultima_sync: "2024-06-28 10:15", saldo: 0 },
  { id: 4, nome: "Santander", status: "desconectado", ultima_sync: "Nunca", saldo: 0 },
];

export default function IntegracaoBancaria() {
  const totalConectados = bancos.filter(b => b.status === "conectado").length;
  const saldoTotal = bancos.filter(b => b.status === "conectado").reduce((acc, b) => acc + b.saldo, 0);

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "conectado": return <CheckCircle className="h-5 w-5 text-success" />;
      case "erro": return <AlertCircle className="h-5 w-5 text-destructive" />;
      default: return <AlertCircle className="h-5 w-5 text-muted-foreground" />;
    }
  };

  const getStatusText = (status: string) => {
    switch (status) {
      case "conectado": return "Conectado";
      case "erro": return "Erro na Conexão";
      default: return "Desconectado";
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "conectado": return "text-success";
      case "erro": return "text-destructive";
      default: return "text-muted-foreground";
    }
  };

  return (
    <div className="p-6 space-y-6 bg-background min-h-full">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-foreground">Integração Bancária</h1>
          <p className="text-muted-foreground">
            Conecte suas contas bancárias para sincronização automática
          </p>
        </div>
        <div className="flex items-center gap-3">
          <Button variant="outline" size="sm">
            <RefreshCw className="h-4 w-4 mr-2" />
            Sincronizar Tudo
          </Button>
          <Button size="sm">
            <Plus className="h-4 w-4 mr-2" />
            Conectar Banco
          </Button>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card className="bg-gradient-to-br from-success/10 to-success/5 border-success/20">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="font-semibold text-foreground">Bancos Conectados</h3>
                <p className="text-2xl font-bold text-success">{totalConectados}</p>
              </div>
              <Banknote className="h-8 w-8 text-success" />
            </div>
          </CardContent>
        </Card>
        
        <Card className="bg-gradient-to-br from-primary/10 to-primary/5 border-primary/20">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="font-semibold text-foreground">Saldo Total</h3>
                <p className="text-2xl font-bold text-primary">R$ {saldoTotal.toLocaleString("pt-BR")}</p>
              </div>
              <CheckCircle className="h-8 w-8 text-primary" />
            </div>
          </CardContent>
        </Card>
        
        <Card className="bg-gradient-to-br from-accent/10 to-accent/5 border-accent/20">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="font-semibold text-foreground">Última Sincronização</h3>
                <p className="text-lg font-bold text-accent">Hoje às 14:30</p>
              </div>
              <RefreshCw className="h-8 w-8 text-accent" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Bancos List */}
      <Card className="bg-gradient-to-br from-card to-card/80 border-border/50 shadow-soft">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Banknote className="h-5 w-5" />
            Contas Bancárias
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {bancos.map((banco) => (
              <div 
                key={banco.id} 
                className="flex items-center justify-between p-4 border border-border rounded-lg hover:bg-accent/5 transition-colors"
              >
                <div className="flex items-center gap-4">
                  <div className="p-3 bg-accent/20 rounded-lg">
                    <Banknote className="h-6 w-6 text-accent-foreground" />
                  </div>
                  <div>
                    <h3 className="font-semibold text-foreground">{banco.nome}</h3>
                    <div className="flex items-center gap-2 mt-1">
                      {getStatusIcon(banco.status)}
                      <span className={`text-sm font-medium ${getStatusColor(banco.status)}`}>
                        {getStatusText(banco.status)}
                      </span>
                    </div>
                    <p className="text-xs text-muted-foreground">
                      Última sincronização: {banco.ultima_sync}
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-4">
                  {banco.status === "conectado" && (
                    <div className="text-right">
                      <p className="text-sm text-muted-foreground">Saldo</p>
                      <p className="font-bold">R$ {banco.saldo.toLocaleString("pt-BR")}</p>
                    </div>
                  )}
                  <div className="flex gap-2">
                    {banco.status === "conectado" && (
                      <Button variant="outline" size="sm">
                        <RefreshCw className="h-4 w-4" />
                      </Button>
                    )}
                    <Button variant="outline" size="sm">
                      <Settings className="h-4 w-4" />
                    </Button>
                    {banco.status !== "conectado" && (
                      <Button size="sm">
                        Conectar
                      </Button>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}