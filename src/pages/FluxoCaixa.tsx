import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { 
  TrendingUp, 
  TrendingDown, 
  Calendar, 
  Filter,
  Download,
  Plus,
  ArrowUpCircle,
  ArrowDownCircle,
  AlertCircle,
  Settings
} from "lucide-react";
import { 
  ResponsiveContainer, 
  AreaChart, 
  Area, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip,
  BarChart,
  Bar
} from "recharts";
import { useCashFlow } from "@/hooks/useCashFlow";
import { Transaction } from "@/utils/fileParser";

export default function FluxoCaixa() {
  // State for managing transactions and settings
  const [transactions] = useState<Transaction[]>([]);
  const [saldoInicial, setSaldoInicial] = useState(0);
  const [showSettings, setShowSettings] = useState(false);

  // Use cash flow hook to calculate everything
  const { 
    summary, 
    categorySummary, 
    cashFlowData, 
    recentTransactions, 
    hasData 
  } = useCashFlow(transactions, saldoInicial);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-foreground">Fluxo de Caixa</h1>
          <p className="text-muted-foreground">
            Baseado nas transações conciliadas - Saldo inicial: R$ {saldoInicial.toLocaleString("pt-BR")}
          </p>
        </div>
        <div className="flex items-center gap-3">
          <Button 
            variant="outline" 
            size="sm"
            onClick={() => setShowSettings(!showSettings)}
          >
            <Settings className="h-4 w-4 mr-2" />
            Configurações
          </Button>
          <Button variant="outline" size="sm" disabled={!hasData}>
            <Download className="h-4 w-4 mr-2" />
            Exportar
          </Button>
        </div>
      </div>

      {/* Settings Panel */}
      {showSettings && (
        <Card className="bg-accent/10 border-accent/20">
          <CardHeader>
            <CardTitle className="text-lg">Configurações do Fluxo de Caixa</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="saldo-inicial">Saldo Inicial (R$)</Label>
                  <Input
                    id="saldo-inicial"
                    type="number"
                    value={saldoInicial}
                    onChange={(e) => setSaldoInicial(Number(e.target.value) || 0)}
                    placeholder="0,00"
                  />
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Empty State */}
      {!hasData && (
        <Card className="bg-muted/20 border-muted/40">
          <CardContent className="p-8 text-center">
            <AlertCircle className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
            <h3 className="text-lg font-semibold mb-2">Nenhuma transação conciliada</h3>
            <p className="text-muted-foreground mb-4">
              Para visualizar o fluxo de caixa, você precisa primeiro importar e conciliar transações.
            </p>
            <Button variant="outline">
              Ir para Conciliação
            </Button>
          </CardContent>
        </Card>
      )}

      {/* Resumo Cards */}
      {hasData && (
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <Card className="bg-gradient-to-br from-primary/10 to-primary/5 border-primary/20">
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-primary">Saldo Inicial</p>
                  <p className="text-xl font-bold text-foreground">
                    R$ {summary.saldoInicial.toLocaleString("pt-BR")}
                  </p>
                </div>
                <Calendar className="h-6 w-6 text-primary" />
              </div>
            </CardContent>
          </Card>

          <Card className="bg-gradient-to-br from-success/10 to-success/5 border-success/20">
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-success">Total Entradas</p>
                  <p className="text-xl font-bold text-foreground">
                    R$ {summary.totalEntradas.toLocaleString("pt-BR")}
                  </p>
                </div>
                <ArrowUpCircle className="h-6 w-6 text-success" />
              </div>
            </CardContent>
          </Card>

          <Card className="bg-gradient-to-br from-destructive/10 to-destructive/5 border-destructive/20">
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-destructive">Total Saídas</p>
                  <p className="text-xl font-bold text-foreground">
                    R$ {summary.totalSaidas.toLocaleString("pt-BR")}
                  </p>
                </div>
                <ArrowDownCircle className="h-6 w-6 text-destructive" />
              </div>
            </CardContent>
          </Card>

          <Card className={`bg-gradient-to-br border-2 ${
            summary.saldoFinal >= 0 
              ? 'from-success/10 to-success/5 border-success/20' 
              : 'from-destructive/10 to-destructive/5 border-destructive/20'
          }`}>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className={`text-sm font-medium ${
                    summary.saldoFinal >= 0 ? 'text-success' : 'text-destructive'
                  }`}>
                    Saldo Final
                  </p>
                  <p className="text-xl font-bold text-foreground">
                    R$ {summary.saldoFinal.toLocaleString("pt-BR")}
                  </p>
                </div>
                {summary.saldoFinal >= 0 ? (
                  <TrendingUp className="h-6 w-6 text-success" />
                ) : (
                  <TrendingDown className="h-6 w-6 text-destructive" />
                )}
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Gráfico de Evolução */}
      {hasData && cashFlowData.length > 0 && (
        <Card className="bg-gradient-to-br from-card to-card/80 border-border/50 shadow-soft">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <TrendingUp className="h-5 w-5" />
              Evolução do Fluxo de Caixa
            </CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <AreaChart data={cashFlowData}>
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                <XAxis 
                  dataKey="date" 
                  stroke="hsl(var(--muted-foreground))"
                  fontSize={12}
                />
                <YAxis 
                  stroke="hsl(var(--muted-foreground))"
                  fontSize={12}
                  tickFormatter={(value) => `R$ ${(value / 1000).toFixed(0)}k`}
                />
                <Tooltip 
                  formatter={(value: number) => [`R$ ${value.toLocaleString("pt-BR")}`, ""]}
                  labelFormatter={(label) => `Data: ${label}`}
                />
                <Area 
                  type="monotone" 
                  dataKey="saldo" 
                  stroke="hsl(var(--primary))" 
                  fill="hsl(var(--primary))"
                  fillOpacity={0.3}
                  name="Saldo Acumulado"
                />
                <Area 
                  type="monotone" 
                  dataKey="entradas" 
                  stroke="hsl(var(--success))" 
                  fill="hsl(var(--success))"
                  fillOpacity={0.2}
                  name="Entradas"
                />
                <Area 
                  type="monotone" 
                  dataKey="saidas" 
                  stroke="hsl(var(--destructive))" 
                  fill="hsl(var(--destructive))"
                  fillOpacity={0.2}
                  name="Saídas"
                />
              </AreaChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      )}

      {hasData && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Resumo por Categoria */}
          <Card className="bg-gradient-to-br from-card to-card/80 border-border/50 shadow-soft">
            <CardHeader>
              <CardTitle>Resumo por Categoria</CardTitle>
            </CardHeader>
            <CardContent>
              {categorySummary.length > 0 ? (
                <div className="space-y-3">
                  {categorySummary.map((item, index) => (
                    <div key={index} className="flex items-center justify-between p-3 bg-muted/30 rounded-lg">
                      <div className="flex items-center gap-3">
                        <div className={`w-3 h-3 rounded-full ${
                          item.type === "entrada" ? "bg-success" : "bg-destructive"
                        }`} />
                        <div>
                          <span className="font-medium text-sm">{item.category}</span>
                          <div className="text-xs text-muted-foreground">{item.count} transações</div>
                        </div>
                      </div>
                      <div className="text-right">
                        <div className={`font-bold ${
                          item.type === "entrada" ? "text-success" : "text-destructive"
                        }`}>
                          R$ {item.amount.toLocaleString("pt-BR")}
                        </div>
                        <div className="text-xs text-muted-foreground">{item.percent}%</div>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-8 text-muted-foreground">
                  <AlertCircle className="h-8 w-8 mx-auto mb-2" />
                  <p>Nenhuma categoria disponível</p>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Últimas Transações */}
          <Card className="bg-gradient-to-br from-card to-card/80 border-border/50 shadow-soft">
            <CardHeader>
              <CardTitle>Últimas Transações Conciliadas</CardTitle>
            </CardHeader>
            <CardContent>
              {recentTransactions.length > 0 ? (
                <div className="space-y-3">
                  {recentTransactions.map((transaction) => (
                    <div key={transaction.id} className="flex items-center justify-between p-3 border border-border rounded-lg">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-1">
                          <span className="font-medium text-sm truncate">{transaction.description}</span>
                          {transaction.category && (
                            <Badge variant="outline" className="text-xs">
                              {transaction.category}
                            </Badge>
                          )}
                        </div>
                        <div className="text-xs text-muted-foreground">{transaction.date}</div>
                      </div>
                      <div className={`font-bold text-sm ${
                        transaction.type === "entrada" ? "text-success" : "text-destructive"
                      }`}>
                        {transaction.type === "entrada" ? "+" : "-"}
                        R$ {Math.abs(transaction.amount).toLocaleString("pt-BR")}
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-8 text-muted-foreground">
                  <AlertCircle className="h-8 w-8 mx-auto mb-2" />
                  <p>Nenhuma transação conciliada</p>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
}