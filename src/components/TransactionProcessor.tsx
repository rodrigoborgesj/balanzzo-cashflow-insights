import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Transaction } from "@/hooks/useConciliacao";
import { CheckCircle, Clock, TrendingUp, TrendingDown, Edit, Save, X } from "lucide-react";

interface ProcessedTransaction extends Transaction {
  isEditing?: boolean;
  tempCategory?: string;
  tempDescription?: string;
}

interface TransactionProcessorProps {
  transactions: Transaction[];
  availableCategories: string[];
  onUpdateTransaction: (transactionId: string, updates: Partial<Transaction>) => Promise<boolean>;
  onCreateCategory: (name: string) => Promise<boolean>;
}

export function TransactionProcessor({ 
  transactions, 
  availableCategories,
  onUpdateTransaction,
  onCreateCategory 
}: TransactionProcessorProps) {
  const [processedTransactions, setProcessedTransactions] = useState<ProcessedTransaction[]>(
    transactions.map(t => ({ ...t, isEditing: false }))
  );
  const [newCategoryName, setNewCategoryName] = useState("");

  const startEditing = (transactionId: string) => {
    setProcessedTransactions(prev => 
      prev.map(t => 
        t.id === transactionId 
          ? { 
              ...t, 
              isEditing: true, 
              tempCategory: t.categoria_final || t.categoria_sugerida || "",
              tempDescription: t.descricao 
            }
          : t
      )
    );
  };

  const cancelEditing = (transactionId: string) => {
    setProcessedTransactions(prev => 
      prev.map(t => 
        t.id === transactionId 
          ? { ...t, isEditing: false, tempCategory: undefined, tempDescription: undefined }
          : t
      )
    );
  };

  const saveChanges = async (transactionId: string) => {
    const transaction = processedTransactions.find(t => t.id === transactionId);
    if (!transaction) return;

    const updates: Partial<Transaction> = {};
    
    if (transaction.tempCategory && transaction.tempCategory !== transaction.categoria_final) {
      updates.categoria_final = transaction.tempCategory;
    }
    
    if (transaction.tempDescription && transaction.tempDescription !== transaction.descricao) {
      updates.descricao = transaction.tempDescription;
    }

    const success = await onUpdateTransaction(transactionId, updates);
    
    if (success) {
      setProcessedTransactions(prev => 
        prev.map(t => 
          t.id === transactionId 
            ? { 
                ...t, 
                isEditing: false, 
                categoria_final: transaction.tempCategory || t.categoria_final,
                descricao: transaction.tempDescription || t.descricao,
                status_conciliacao: true,
                tempCategory: undefined,
                tempDescription: undefined
              }
            : t
        )
      );
    }
  };

  const updateTempValue = (transactionId: string, field: 'tempCategory' | 'tempDescription', value: string) => {
    setProcessedTransactions(prev => 
      prev.map(t => 
        t.id === transactionId 
          ? { ...t, [field]: value }
          : t
      )
    );
  };

  const handleCreateCategory = async () => {
    if (!newCategoryName.trim()) return;
    
    const success = await onCreateCategory(newCategoryName.trim());
    if (success) {
      setNewCategoryName("");
    }
  };

  const pendingTransactions = processedTransactions.filter(t => !t.status_conciliacao);
  const categorizedTransactions = processedTransactions.filter(t => t.status_conciliacao);

  return (
    <div className="space-y-6">
      {/* Resumo */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <div className="text-2xl font-bold">{processedTransactions.length}</div>
                <div className="text-sm text-muted-foreground">Total de Transações</div>
              </div>
              <TrendingUp className="h-8 w-8 text-primary" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <div className="text-2xl font-bold text-amber-600">{pendingTransactions.length}</div>
                <div className="text-sm text-muted-foreground">Pendentes</div>
              </div>
              <Clock className="h-8 w-8 text-amber-600" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <div className="text-2xl font-bold text-success">{categorizedTransactions.length}</div>
                <div className="text-sm text-muted-foreground">Categorizadas</div>
              </div>
              <CheckCircle className="h-8 w-8 text-success" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Criar Nova Categoria */}
      <Card>
        <CardHeader>
          <CardTitle>Gerenciar Categorias</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex gap-2">
            <Input
              placeholder="Nome da nova categoria"
              value={newCategoryName}
              onChange={(e) => setNewCategoryName(e.target.value)}
              onKeyPress={(e) => e.key === 'Enter' && handleCreateCategory()}
            />
            <Button onClick={handleCreateCategory} disabled={!newCategoryName.trim()}>
              Criar Categoria
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Transações Processadas */}
      <Card>
        <CardHeader>
          <CardTitle>Movimentações do Extrato</CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Data</TableHead>
                <TableHead>Descrição</TableHead>
                <TableHead>Valor</TableHead>
                <TableHead>Tipo</TableHead>
                <TableHead>Categoria</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Ações</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {processedTransactions.map((transaction) => (
                <TableRow key={transaction.id}>
                  <TableCell>
                    {new Date(transaction.data_transacao).toLocaleDateString('pt-BR')}
                  </TableCell>
                  
                  <TableCell className="max-w-xs">
                    {transaction.isEditing ? (
                      <Input
                        value={transaction.tempDescription || ""}
                        onChange={(e) => updateTempValue(transaction.id, 'tempDescription', e.target.value)}
                        className="w-full"
                      />
                    ) : (
                      <span className="truncate">{transaction.descricao}</span>
                    )}
                  </TableCell>
                  
                  <TableCell>
                    <div className="flex items-center gap-2">
                      {transaction.valor >= 0 ? (
                        <TrendingUp className="h-4 w-4 text-success" />
                      ) : (
                        <TrendingDown className="h-4 w-4 text-destructive" />
                      )}
                      <span className={transaction.valor >= 0 ? "text-success" : "text-destructive"}>
                        R$ {Math.abs(transaction.valor).toLocaleString("pt-BR", { minimumFractionDigits: 2 })}
                      </span>
                    </div>
                  </TableCell>
                  
                  <TableCell>
                    <Badge variant={transaction.tipo === "entrada" ? "default" : "destructive"}>
                      {transaction.tipo === "entrada" ? "Receita" : "Despesa"}
                    </Badge>
                  </TableCell>
                  
                  <TableCell>
                    {transaction.isEditing ? (
                      <Select
                        value={transaction.tempCategory || ""}
                        onValueChange={(value) => updateTempValue(transaction.id, 'tempCategory', value)}
                      >
                        <SelectTrigger className="w-48">
                          <SelectValue placeholder="Selecionar categoria" />
                        </SelectTrigger>
                        <SelectContent>
                          {availableCategories.map((category) => (
                            <SelectItem key={category} value={category}>
                              {category}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    ) : (
                      <div className="space-y-1">
                        {transaction.categoria_final ? (
                          <Badge variant="default">{transaction.categoria_final}</Badge>
                        ) : transaction.categoria_sugerida ? (
                          <Badge variant="outline">{transaction.categoria_sugerida}</Badge>
                        ) : (
                          <span className="text-muted-foreground">Não categorizada</span>
                        )}
                      </div>
                    )}
                  </TableCell>
                  
                  <TableCell>
                    <Badge variant={transaction.status_conciliacao ? "default" : "secondary"}>
                      {transaction.status_conciliacao ? (
                        <>
                          <CheckCircle className="h-3 w-3 mr-1" />
                          Categorizada
                        </>
                      ) : (
                        <>
                          <Clock className="h-3 w-3 mr-1" />
                          Pendente
                        </>
                      )}
                    </Badge>
                  </TableCell>
                  
                  <TableCell>
                    {transaction.isEditing ? (
                      <div className="flex gap-1">
                        <Button
                          size="sm"
                          onClick={() => saveChanges(transaction.id)}
                          disabled={!transaction.tempCategory}
                        >
                          <Save className="h-4 w-4" />
                        </Button>
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => cancelEditing(transaction.id)}
                        >
                          <X className="h-4 w-4" />
                        </Button>
                      </div>
                    ) : (
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => startEditing(transaction.id)}
                      >
                        <Edit className="h-4 w-4" />
                      </Button>
                    )}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
          
          {processedTransactions.length === 0 && (
            <div className="text-center py-8 text-muted-foreground">
              Nenhuma transação importada ainda.
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}