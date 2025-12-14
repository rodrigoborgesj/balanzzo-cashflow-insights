import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { cn } from '@/lib/utils';
import { CalendarIcon, Upload, FileCheck, Loader2 } from 'lucide-react';
import { SavingsGoal, usePersonalSavingsContributions } from '@/hooks/usePersonalSavingsGoals';
import { toast } from 'sonner';

const MAX_FILE_SIZE = 5 * 1024 * 1024; // 5MB
const ACCEPTED_FILE_TYPES = ['image/jpeg', 'image/png', 'image/webp', 'application/pdf'];

const contributionSchema = z.object({
  contribution_date: z.date({ required_error: 'Data obrigatória' }),
  amount: z.string().min(1, 'Valor obrigatório'),
  notes: z.string().optional(),
});

type ContributionFormData = z.infer<typeof contributionSchema>;

interface ContributionDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  goal: SavingsGoal;
  monthlyAmount: number;
}

export function ContributionDialog({ open, onOpenChange, goal, monthlyAmount }: ContributionDialogProps) {
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  
  const { uploadProof, createContribution, isCreating } = usePersonalSavingsContributions(goal.id);

  const form = useForm<ContributionFormData>({
    resolver: zodResolver(contributionSchema),
    defaultValues: {
      amount: monthlyAmount.toFixed(2).replace('.', ','),
      notes: '',
    },
  });

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > MAX_FILE_SIZE) {
      toast.error('Arquivo muito grande. Máximo: 5MB');
      return;
    }

    if (!ACCEPTED_FILE_TYPES.includes(file.type)) {
      toast.error('Formato não aceito. Use: JPG, PNG, WebP ou PDF');
      return;
    }

    setSelectedFile(file);
  };

  const parseAmount = (value: string): number => {
    return parseFloat(value.replace(/\./g, '').replace(',', '.'));
  };

  const onSubmit = async (data: ContributionFormData) => {
    if (!selectedFile) {
      toast.error('Comprovante obrigatório');
      return;
    }

    try {
      setIsUploading(true);

      // Upload the proof file
      const proofUrl = await uploadProof(selectedFile);

      // Calculate reference month from contribution date
      const referenceMonth = new Date(data.contribution_date);
      referenceMonth.setDate(1);

      // Check if contribution is late
      const contributionDay = goal.contribution_day || 10;
      const expectedDate = new Date(
        data.contribution_date.getFullYear(),
        data.contribution_date.getMonth(),
        contributionDay
      );
      const isLate = data.contribution_date > expectedDate;

      createContribution({
        goal_id: goal.id,
        contribution_date: format(data.contribution_date, 'yyyy-MM-dd'),
        amount: parseAmount(data.amount),
        proof_file_url: proofUrl,
        proof_file_name: selectedFile.name,
        reference_month: format(referenceMonth, 'yyyy-MM-dd'),
        status: isLate ? 'late' : 'completed',
        notes: data.notes || undefined,
      });

      form.reset();
      setSelectedFile(null);
      onOpenChange(false);
    } catch (error) {
      console.error('Erro ao registrar contribuição:', error);
      toast.error('Erro ao fazer upload do comprovante');
    } finally {
      setIsUploading(false);
    }
  };

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL',
    }).format(value);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Registrar Contribuição</DialogTitle>
          <DialogDescription>
            Caixinha: <span className="font-medium">{goal.goal_name}</span>
            <br />
            Valor sugerido: <span className="font-medium">{formatCurrency(monthlyAmount)}</span>
          </DialogDescription>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <FormField
              control={form.control}
              name="contribution_date"
              render={({ field }) => (
                <FormItem className="flex flex-col">
                  <FormLabel>Data da Contribuição</FormLabel>
                  <Popover>
                    <PopoverTrigger asChild>
                      <FormControl>
                        <Button
                          variant="outline"
                          className={cn(
                            'w-full pl-3 text-left font-normal',
                            !field.value && 'text-muted-foreground'
                          )}
                        >
                          {field.value ? (
                            format(field.value, 'dd/MM/yyyy', { locale: ptBR })
                          ) : (
                            <span>Selecione a data</span>
                          )}
                          <CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
                        </Button>
                      </FormControl>
                    </PopoverTrigger>
                    <PopoverContent className="w-auto p-0" align="start">
                      <Calendar
                        mode="single"
                        selected={field.value}
                        onSelect={field.onChange}
                        disabled={(date) => date > new Date()}
                        locale={ptBR}
                        initialFocus
                      />
                    </PopoverContent>
                  </Popover>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="amount"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Valor (R$)</FormLabel>
                  <FormControl>
                    <Input
                      {...field}
                      placeholder="0,00"
                      inputMode="decimal"
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* File Upload */}
            <div className="space-y-2">
              <label className="text-sm font-medium">
                Comprovante <span className="text-destructive">*</span>
              </label>
              <div className="flex items-center gap-3">
                <label
                  htmlFor="proof-upload"
                  className={cn(
                    'flex-1 flex items-center justify-center gap-2 p-4 border-2 border-dashed rounded-lg cursor-pointer transition-colors',
                    selectedFile
                      ? 'border-primary bg-primary/5'
                      : 'border-muted-foreground/25 hover:border-primary/50'
                  )}
                >
                  {selectedFile ? (
                    <>
                      <FileCheck className="h-5 w-5 text-primary" />
                      <span className="text-sm truncate max-w-[200px]">{selectedFile.name}</span>
                    </>
                  ) : (
                    <>
                      <Upload className="h-5 w-5 text-muted-foreground" />
                      <span className="text-sm text-muted-foreground">
                        Anexar comprovante
                      </span>
                    </>
                  )}
                </label>
                <input
                  id="proof-upload"
                  type="file"
                  accept=".jpg,.jpeg,.png,.webp,.pdf"
                  className="hidden"
                  onChange={handleFileChange}
                />
              </div>
              <p className="text-xs text-muted-foreground">
                Formatos aceitos: JPG, PNG, WebP ou PDF. Máximo: 5MB
              </p>
            </div>

            <FormField
              control={form.control}
              name="notes"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Observações (opcional)</FormLabel>
                  <FormControl>
                    <Textarea
                      {...field}
                      placeholder="Ex: Transferência via PIX"
                      rows={2}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div className="flex justify-end gap-3 pt-2">
              <Button
                type="button"
                variant="outline"
                onClick={() => onOpenChange(false)}
              >
                Cancelar
              </Button>
              <Button
                type="submit"
                disabled={isUploading || isCreating || !selectedFile}
              >
                {(isUploading || isCreating) && (
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                )}
                Registrar
              </Button>
            </div>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
