import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { 
  CheckCircle, 
  AlertTriangle, 
  X, 
  TrendingUp, 
  TrendingDown,
  Eye,
  FileCheck
} from 'lucide-react';
import { ReconciliationResult, ReconciliationMatch } from '@/hooks/useAutomaticReconciliation';

interface ReconciliationResultsProps {
  result: ReconciliationResult;
  onApplyAutomatic: () => void;
  onReviewManual: (match: ReconciliationMatch) => void;
  isApplying?: boolean;
}

export function ReconciliationResults({ 
  result, 
  onApplyAutomatic, 
  onReviewManual,
  isApplying = false 
}: ReconciliationResultsProps) {
  const getMatchIcon = (match: ReconciliationMatch) => {
    switch (match.matchType) {
      case 'exact':
        return <CheckCircle className="h-4 w-4 text-success" />;
      case 'approximate':
        return <AlertTriangle className="h-4 w-4 text-warning" />;
      default:
        return <X className="h-4 w-4 text-destructive" />;
    }
  };

  const getConfidenceBadge = (confidence: string) => {
    const variants = {
      high: 'default',
      medium: 'secondary',
      low: 'outline'
    } as const;

    const colors = {
      high: 'text-success',
      medium: 'text-warning', 
      low: 'text-destructive'
    } as const;

    return (
      <Badge variant={variants[confidence as keyof typeof variants]} className={colors[confidence as keyof typeof colors]}>
        {confidence === 'high' ? 'Alta' : confidence === 'medium' ? 'Média' : 'Baixa'}
      </Badge>
    );
  };

  return (
    <div className="space-y-6">
      {/* Resumo da Conciliação */}
      <Card className="bg-gradient-to-br from-card to-card/80 border-border/50 shadow-soft">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <FileCheck className="h-5 w-5 text-primary" />
            Resultado da Conciliação Automática
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div className="text-center p-4 bg-accent/10 rounded-lg">
              <div className="text-2xl font-bold text-foreground">{result.totalTransactions}</div>
              <div className="text-sm text-muted-foreground">Total de Transações</div>
            </div>
            
            <div className="text-center p-4 bg-success/10 rounded-lg">
              <div className="text-2xl font-bold text-success">{result.automaticMatches}</div>
              <div className="text-sm text-muted-foreground">Conciliadas Automaticamente</div>
            </div>
            
            <div className="text-center p-4 bg-warning/10 rounded-lg">
              <div className="text-2xl font-bold text-warning">{result.manualReviewNeeded}</div>
              <div className="text-sm text-muted-foreground">Revisão Manual</div>
            </div>
            
            <div className="text-center p-4 bg-primary/10 rounded-lg">
              <div className="text-2xl font-bold text-primary">
                {result.totalTransactions > 0 
                  ? Math.round((result.automaticMatches / result.totalTransactions) * 100) 
                  : 0}%
              </div>
              <div className="text-sm text-muted-foreground">Taxa de Sucesso</div>
            </div>
          </div>

          {result.automaticMatches > 0 && (
            <div className="flex justify-center pt-4">
              <Button 
                onClick={onApplyAutomatic}
                className="bg-success hover:bg-success/90 text-white"
                disabled={isApplying}
              >
                {isApplying ? (
                  <>
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                    Aplicando...
                  </>
                ) : (
                  <>
                    <CheckCircle className="h-4 w-4 mr-2" />
                    Aplicar {result.automaticMatches} Conciliações Automáticas
                  </>
                )}
              </Button>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Detalhes por Tipo de Correspondência */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-success">Correspondências Exatas</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-success">{result.summary.exactMatches}</div>
            <p className="text-xs text-muted-foreground">Valor e data idênticos</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-warning">Correspondências Aproximadas</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-warning">{result.summary.approximateMatches}</div>
            <p className="text-xs text-muted-foreground">Valor e data similares</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-destructive">Sem Correspondência</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-destructive">{result.summary.noMatches}</div>
            <p className="text-xs text-muted-foreground">Requer categorização manual</p>
          </CardContent>
        </Card>
      </div>

      {/* Tabela Detalhada */}
      <Card>
        <CardHeader>
          <CardTitle>Detalhes da Conciliação</CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Data</TableHead>
                <TableHead>Descrição</TableHead>
                <TableHead>Valor</TableHead>
                <TableHead>Correspondência</TableHead>
                <TableHead>Confiança</TableHead>
                <TableHead>Score</TableHead>
                <TableHead>Ações</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {result.matches.map((match, index) => (
                <TableRow key={match.transaction.id || index}>
                  <TableCell>
                    {new Date(match.transaction.data_transacao).toLocaleDateString('pt-BR')}
                  </TableCell>
                  <TableCell className="max-w-xs truncate">
                    {match.transaction.descricao}
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-2">
                      {match.transaction.tipo === "entrada" ? (
                        <TrendingUp className="h-4 w-4 text-success" />
                      ) : (
                        <TrendingDown className="h-4 w-4 text-destructive" />
                      )}
                      <span className={match.transaction.tipo === "entrada" ? "text-success" : "text-destructive"}>
                        R$ {Math.abs(match.transaction.valor).toLocaleString("pt-BR", { minimumFractionDigits: 2 })}
                      </span>
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-2">
                      {getMatchIcon(match)}
                      <span className="text-sm">
                        {match.matchType === 'exact' ? 'Exata' : 
                         match.matchType === 'approximate' ? 'Aproximada' : 'Nenhuma'}
                      </span>
                    </div>
                  </TableCell>
                  <TableCell>
                    {getConfidenceBadge(match.confidence)}
                  </TableCell>
                  <TableCell>
                    <Badge variant="outline">
                      {Math.round(match.matchScore)}%
                    </Badge>
                  </TableCell>
                  <TableCell>
                    {match.confidence !== 'high' && match.matchType !== 'none' && (
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => onReviewManual(match)}
                      >
                        <Eye className="h-3 w-3 mr-1" />
                        Revisar
                      </Button>
                    )}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}