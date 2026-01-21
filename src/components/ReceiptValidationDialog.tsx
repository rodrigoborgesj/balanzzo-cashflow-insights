import { useState, useCallback } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { Upload, CheckCircle, XCircle, FileText, Loader2 } from "lucide-react";

interface Transaction {
  id?: string;
  descricao: string | null;
  valor: number;
  tipo: string | null;
  data_transacao: string;
  status_validacao?: string | null;
  comprovante_url?: string | null;
  valor_comprovante?: number | null;
}

interface ReceiptValidationDialogProps {
  isOpen: boolean;
  onClose: () => void;
  transaction: Transaction | null;
  onValidationComplete: () => void;
}

export function ReceiptValidationDialog({
  isOpen,
  onClose,
  transaction,
  onValidationComplete
}: ReceiptValidationDialogProps) {
  const [isUploading, setIsUploading] = useState(false);
  const [isValidating, setIsValidating] = useState(false);
  const [uploadedFile, setUploadedFile] = useState<File | null>(null);
  const [receiptValue, setReceiptValue] = useState('');
  const [validationStatus, setValidationStatus] = useState<'idle' | 'matched' | 'mismatch'>('idle');
  const { toast } = useToast();
  const { user } = useAuth();

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL'
    }).format(Math.abs(value));
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      // Validate file type
      const allowedTypes = ['image/jpeg', 'image/png', 'image/webp', 'application/pdf'];
      if (!allowedTypes.includes(file.type)) {
        toast({
          title: "Tipo de arquivo inválido",
          description: "Por favor, envie uma imagem (JPG, PNG, WebP) ou PDF.",
          variant: "destructive"
        });
        return;
      }

      // Validate file size (max 10MB)
      if (file.size > 10 * 1024 * 1024) {
        toast({
          title: "Arquivo muito grande",
          description: "O arquivo deve ter no máximo 10MB.",
          variant: "destructive"
        });
        return;
      }

      setUploadedFile(file);
      setValidationStatus('idle');
    }
  };

  const handleValueChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    // Allow only numbers, comma, and dot
    const value = e.target.value.replace(/[^\d,\.]/g, '');
    setReceiptValue(value);
    setValidationStatus('idle');
  };

  const parseReceiptValue = (valueStr: string): number => {
    // Handle Brazilian format (1.234,56) or international (1,234.56)
    let cleaned = valueStr.trim();
    
    // If has comma as decimal separator (Brazilian format)
    if (cleaned.includes(',') && cleaned.indexOf(',') > cleaned.lastIndexOf('.')) {
      cleaned = cleaned.replace(/\./g, '').replace(',', '.');
    } else if (cleaned.includes(',') && !cleaned.includes('.')) {
      cleaned = cleaned.replace(',', '.');
    }
    
    return parseFloat(cleaned) || 0;
  };

  const handleValidate = async () => {
    if (!transaction || !transaction.id || !user || !uploadedFile || !receiptValue) {
      toast({
        title: "Dados incompletos",
        description: "Por favor, envie o comprovante e informe o valor.",
        variant: "destructive"
      });
      return;
    }

    setIsValidating(true);

    try {
      // Parse the receipt value
      const parsedReceiptValue = parseReceiptValue(receiptValue);
      const transactionValue = Math.abs(transaction.valor);

      // Check if values match (with 1% tolerance for rounding differences)
      const tolerance = transactionValue * 0.01;
      const valuesMatch = Math.abs(parsedReceiptValue - transactionValue) <= tolerance;

      if (valuesMatch) {
        setValidationStatus('matched');

        // Upload the receipt to Supabase Storage
        const fileExt = uploadedFile.name.split('.').pop();
        const fileName = `${user.id}/${transaction.id}-${Date.now()}.${fileExt}`;

        setIsUploading(true);
        const { data: uploadData, error: uploadError } = await supabase.storage
          .from('comprovantes')
          .upload(fileName, uploadedFile);

        if (uploadError) {
          throw new Error(`Erro ao enviar comprovante: ${uploadError.message}`);
        }

        // Get the public URL
        const { data: urlData } = supabase.storage
          .from('comprovantes')
          .getPublicUrl(fileName);

        // Update the transaction with validation status
        const { error: updateError } = await supabase
          .from('transacoes_conciliadas')
          .update({
            status_validacao: 'validado',
            comprovante_url: urlData.publicUrl,
            valor_comprovante: parsedReceiptValue
          })
          .eq('id', transaction.id);

        if (updateError) {
          throw new Error(`Erro ao atualizar transação: ${updateError.message}`);
        }

        toast({
          title: "Transação validada!",
          description: "O comprovante foi verificado e a transação foi validada com sucesso.",
        });

        onValidationComplete();
        handleClose();
      } else {
        setValidationStatus('mismatch');
        toast({
          title: "Valores não conferem",
          description: `O valor do comprovante (${formatCurrency(parsedReceiptValue)}) não confere com o valor da transação (${formatCurrency(transactionValue)}).`,
          variant: "destructive"
        });
      }
    } catch (error: any) {
      console.error('Validation error:', error);
      toast({
        title: "Erro na validação",
        description: error.message || "Ocorreu um erro ao validar a transação.",
        variant: "destructive"
      });
    } finally {
      setIsValidating(false);
      setIsUploading(false);
    }
  };

  const handleClose = () => {
    setUploadedFile(null);
    setReceiptValue('');
    setValidationStatus('idle');
    onClose();
  };

  if (!transaction) return null;

  const isManualEntry = transaction.status_validacao === 'pendente';

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <FileText className="h-5 w-5 text-primary" />
            Validar Transação
          </DialogTitle>
          <DialogDescription>
            Envie o comprovante desta transação para validá-la.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          {/* Transaction Info */}
          <div className="p-3 rounded-lg bg-muted/50 space-y-2">
            <div className="flex justify-between items-center">
              <span className="text-sm text-muted-foreground">Descrição:</span>
              <span className="text-sm font-medium">{transaction.descricao || 'Sem descrição'}</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-sm text-muted-foreground">Data:</span>
              <span className="text-sm font-medium">
                {new Date(transaction.data_transacao).toLocaleDateString('pt-BR')}
              </span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-sm text-muted-foreground">Valor:</span>
              <span className={`text-sm font-bold ${transaction.valor > 0 ? 'text-green-600' : 'text-red-600'}`}>
                {formatCurrency(transaction.valor)}
              </span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-sm text-muted-foreground">Status:</span>
              <Badge variant="outline" className="bg-yellow-100 text-yellow-700 border-yellow-300">
                Pendente de validação
              </Badge>
            </div>
          </div>

          {/* File Upload */}
          <div className="space-y-2">
            <Label htmlFor="receipt-file">Comprovante</Label>
            <div className="flex items-center gap-2">
              <Input
                id="receipt-file"
                type="file"
                accept="image/*,.pdf"
                onChange={handleFileChange}
                className="cursor-pointer"
              />
            </div>
            {uploadedFile && (
              <p className="text-xs text-muted-foreground flex items-center gap-1">
                <Upload className="h-3 w-3" />
                {uploadedFile.name}
              </p>
            )}
          </div>

          {/* Receipt Value Input */}
          <div className="space-y-2">
            <Label htmlFor="receipt-value">Valor no Comprovante</Label>
            <div className="relative">
              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground text-sm">R$</span>
              <Input
                id="receipt-value"
                type="text"
                placeholder="0,00"
                value={receiptValue}
                onChange={handleValueChange}
                className="pl-10"
              />
            </div>
            <p className="text-xs text-muted-foreground">
              Insira o valor exato que aparece no comprovante
            </p>
          </div>

          {/* Validation Status */}
          {validationStatus !== 'idle' && (
            <div className={`p-3 rounded-lg flex items-center gap-2 ${
              validationStatus === 'matched' 
                ? 'bg-green-50 text-green-700 border border-green-200' 
                : 'bg-red-50 text-red-700 border border-red-200'
            }`}>
              {validationStatus === 'matched' ? (
                <>
                  <CheckCircle className="h-5 w-5" />
                  <span className="text-sm font-medium">Valores conferem! Transação validada.</span>
                </>
              ) : (
                <>
                  <XCircle className="h-5 w-5" />
                  <span className="text-sm font-medium">Valores não conferem. Verifique e tente novamente.</span>
                </>
              )}
            </div>
          )}
        </div>

        <DialogFooter className="gap-2">
          <Button variant="outline" onClick={handleClose}>
            Cancelar
          </Button>
          <Button 
            onClick={handleValidate} 
            disabled={!uploadedFile || !receiptValue || isValidating}
          >
            {isValidating ? (
              <>
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                Validando...
              </>
            ) : (
              <>
                <CheckCircle className="h-4 w-4 mr-2" />
                Validar Transação
              </>
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
