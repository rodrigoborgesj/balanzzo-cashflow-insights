import { useState, useRef } from 'react';
import { Upload, Loader2, FileText, X, AlertCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { usePersonalTransactions, PersonalTransactionInput } from '@/hooks/usePersonalTransactions';
import { StandardizedBankStatementParser } from '@/utils/standardizedBankStatementParser';
import { toast } from 'sonner';
import { Alert, AlertDescription } from '@/components/ui/alert';

export default function PersonalFileUploader() {
  const [isOpen, setIsOpen] = useState(false);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [parsedTransactions, setParsedTransactions] = useState<PersonalTransactionInput[]>([]);
  const [isParsing, setIsParsing] = useState(false);
  const [parseWarnings, setParseWarnings] = useState<string[]>([]);
  const [parseErrors, setParseErrors] = useState<string[]>([]);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const { createBulkTransactions, isBulkCreating } = usePersonalTransactions();

  const handleFileSelect = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    const extension = file.name.split('.').pop()?.toLowerCase();
    if (!['csv', 'ofx'].includes(extension || '')) {
      toast.error('Formato não suportado. Use arquivos CSV ou OFX.');
      return;
    }

    setSelectedFile(file);
    setIsParsing(true);
    setParseWarnings([]);
    setParseErrors([]);

    try {
      console.log('📄 Parsing personal bank statement:', file.name);
      
      // Use standardized parser that supports CSV, OFX and PDF
      const result = await StandardizedBankStatementParser.parseFile(file);
      
      console.log('📊 Parse result:', {
        transactions: result.transactions.length,
        errors: result.errors.length,
        warnings: result.warnings.length
      });

      if (result.errors.length > 0) {
        setParseErrors(result.errors);
      }
      
      if (result.warnings.length > 0) {
        setParseWarnings(result.warnings.slice(0, 5)); // Show max 5 warnings
      }

      // Convert to PersonalTransactionInput format
      const personalTransactions: PersonalTransactionInput[] = result.transactions.map(t => ({
        transaction_date: t.date,
        description: t.description || '',
        amount: Math.abs(t.value),
        type: (t.value >= 0 ? 'income' : 'expense') as 'income' | 'expense',
        source_file: file.name,
        reconciled: false
      }));

      setParsedTransactions(personalTransactions);
      
      if (personalTransactions.length > 0) {
        toast.success(`${personalTransactions.length} transações encontradas`);
      } else if (result.errors.length === 0) {
        toast.warning('Nenhuma transação encontrada no arquivo.');
      }
    } catch (error) {
      console.error('Error parsing file:', error);
      toast.error('Erro ao processar arquivo. Verifique o formato.');
      setParseErrors([error instanceof Error ? error.message : 'Erro desconhecido']);
    } finally {
      setIsParsing(false);
    }
  };

  const handleImport = () => {
    if (parsedTransactions.length === 0) return;

    createBulkTransactions(parsedTransactions, {
      onSuccess: () => {
        setIsOpen(false);
        setSelectedFile(null);
        setParsedTransactions([]);
      }
    });
  };

  const handleClear = () => {
    setSelectedFile(null);
    setParsedTransactions([]);
    setParseWarnings([]);
    setParseErrors([]);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const handleOpenChange = (open: boolean) => {
    setIsOpen(open);
    if (!open) {
      // Reset state when dialog closes
      setSelectedFile(null);
      setParsedTransactions([]);
      setParseWarnings([]);
      setParseErrors([]);
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={handleOpenChange}>
      <DialogTrigger asChild>
        <Button variant="outline">
          <Upload className="h-4 w-4 mr-2" />
          Importar Extrato
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Importar Extrato Bancário</DialogTitle>
          <DialogDescription>
            Selecione um arquivo CSV ou OFX do seu extrato bancário pessoal
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          {!selectedFile ? (
            <div
              className="border-2 border-dashed rounded-lg p-8 text-center cursor-pointer hover:border-primary/50 transition-colors"
              onClick={() => fileInputRef.current?.click()}
            >
              <Upload className="h-10 w-10 mx-auto text-muted-foreground mb-4" />
              <p className="text-sm text-muted-foreground">
                Clique para selecionar ou arraste um arquivo
              </p>
              <p className="text-xs text-muted-foreground mt-2">
                Formatos aceitos: CSV, OFX
              </p>
            </div>
          ) : (
            <div className="border rounded-lg p-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <FileText className="h-8 w-8 text-primary" />
                  <div>
                    <p className="font-medium">{selectedFile.name}</p>
                    <p className="text-sm text-muted-foreground">
                      {isParsing 
                        ? 'Processando...' 
                        : `${parsedTransactions.length} transações encontradas`
                      }
                    </p>
                  </div>
                </div>
                <Button variant="ghost" size="icon" onClick={handleClear}>
                  <X className="h-4 w-4" />
                </Button>
              </div>
            </div>
          )}

          <input
            ref={fileInputRef}
            type="file"
            accept=".csv,.ofx"
            onChange={handleFileSelect}
            className="hidden"
          />

          {parseErrors.length > 0 && (
            <Alert variant="destructive">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>
                <ul className="list-disc list-inside">
                  {parseErrors.map((error, idx) => (
                    <li key={idx}>{error}</li>
                  ))}
                </ul>
              </AlertDescription>
            </Alert>
          )}

          {parseWarnings.length > 0 && (
            <Alert>
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>
                <p className="font-medium mb-1">Avisos:</p>
                <ul className="list-disc list-inside text-xs">
                  {parseWarnings.map((warning, idx) => (
                    <li key={idx}>{warning}</li>
                  ))}
                </ul>
              </AlertDescription>
            </Alert>
          )}

          {parsedTransactions.length > 0 && (
            <div className="text-sm text-muted-foreground">
              <p>Resumo:</p>
              <ul className="mt-1 space-y-1">
                <li>
                  • Receitas: {parsedTransactions.filter(t => t.type === 'income').length} transações
                </li>
                <li>
                  • Despesas: {parsedTransactions.filter(t => t.type === 'expense').length} transações
                </li>
              </ul>
            </div>
          )}
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => setIsOpen(false)}>
            Cancelar
          </Button>
          <Button 
            onClick={handleImport} 
            disabled={parsedTransactions.length === 0 || isParsing || isBulkCreating}
          >
            {(isParsing || isBulkCreating) && (
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            )}
            Importar {parsedTransactions.length} Transações
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
