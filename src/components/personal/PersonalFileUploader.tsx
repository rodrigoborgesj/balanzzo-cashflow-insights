import { useState, useRef } from 'react';
import { Upload, Loader2, FileText, X } from 'lucide-react';
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
import { parseCSV, parseOFX } from '@/utils/fileParser';
import { toast } from 'sonner';

export default function PersonalFileUploader() {
  const [isOpen, setIsOpen] = useState(false);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [parsedTransactions, setParsedTransactions] = useState<PersonalTransactionInput[]>([]);
  const [isParsing, setIsParsing] = useState(false);
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

    try {
      const text = await file.text();
      let transactions: any[] = [];

      if (extension === 'csv') {
        transactions = await parseCSV(text);
      } else if (extension === 'ofx') {
        transactions = await parseOFX(text);
      }

      // Convert to PersonalTransactionInput format
      const personalTransactions: PersonalTransactionInput[] = transactions.map(t => ({
        transaction_date: t.data || t.date,
        description: t.descricao || t.description || '',
        amount: Math.abs(Number(t.valor || t.value || 0)),
        type: (Number(t.valor || t.value || 0) >= 0 ? 'income' : 'expense') as 'income' | 'expense',
        source_file: file.name,
        reconciled: false
      }));

      setParsedTransactions(personalTransactions);
      toast.success(`${personalTransactions.length} transações encontradas`);
    } catch (error) {
      console.error('Error parsing file:', error);
      toast.error('Erro ao processar arquivo. Verifique o formato.');
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
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
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
            Selecione um arquivo CSV ou OFX do seu extrato bancário
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
