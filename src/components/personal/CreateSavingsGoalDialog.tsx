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
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { cn } from '@/lib/utils';
import { CalendarIcon, Loader2, Target, Banknote } from 'lucide-react';
import { usePersonalSavingsGoals } from '@/hooks/usePersonalSavingsGoals';
import { calculateMonthlySavings, parseSavingsAmount } from '@/utils/savingsGoalCalculations';

const savingsGoalSchema = z.object({
  goal_name: z.string().min(1, 'Nome da meta obrigatório').max(100, 'Nome muito longo'),
  total_target_amount: z.string().refine(value => parseSavingsAmount(value) > 0, 'Informe uma meta maior que zero'),
  initial_saved_amount: z.string().refine(value => Number.isFinite(parseSavingsAmount(value)) && parseSavingsAmount(value) >= 0, 'Informe um valor válido, igual ou maior que zero'),
  timeframe_months: z.string().refine(value => Number.isInteger(Number(value)) && Number(value) >= 1 && Number(value) <= 120, 'Informe um prazo entre 1 e 120 meses'),
  bank_name: z.string().optional(),
  contribution_day: z.string().optional(),
  start_date: z.date().optional(),
});

type SavingsGoalFormData = z.infer<typeof savingsGoalSchema>;

interface CreateSavingsGoalDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function CreateSavingsGoalDialog({ open, onOpenChange }: CreateSavingsGoalDialogProps) {
  const { createGoal, isCreating } = usePersonalSavingsGoals();

  const form = useForm<SavingsGoalFormData>({
    resolver: zodResolver(savingsGoalSchema),
    defaultValues: {
      goal_name: '',
      total_target_amount: '',
      initial_saved_amount: '0,00',
      timeframe_months: '',
      bank_name: '',
      contribution_day: '10',
      start_date: new Date(),
    },
  });

  const watchAmount = form.watch('total_target_amount');
  const watchMonths = form.watch('timeframe_months');
  const watchInitialSaved = form.watch('initial_saved_amount');
  const amount = parseSavingsAmount(watchAmount);
  const initialSaved = parseSavingsAmount(watchInitialSaved);
  const months = Number(watchMonths);
  const calculatedMonthly = amount > 0 && Number.isFinite(initialSaved) && initialSaved >= 0 && Number.isInteger(months) && months > 0
    ? calculateMonthlySavings(amount, initialSaved, months)
    : null;

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL',
    }).format(value);
  };

  const onSubmit = (data: SavingsGoalFormData) => {
    createGoal({
      goal_name: data.goal_name,
      total_target_amount: parseSavingsAmount(data.total_target_amount),
      initial_saved_amount: parseSavingsAmount(data.initial_saved_amount),
      timeframe_months: parseInt(data.timeframe_months, 10),
      bank_name: data.bank_name || undefined,
      contribution_day: data.contribution_day ? parseInt(data.contribution_day, 10) : undefined,
      start_date: data.start_date ? format(data.start_date, 'yyyy-MM-dd') : undefined,
    }, {
      onSuccess: () => {
        form.reset();
        onOpenChange(false);
      },
    });
  };

  const contributionDays = Array.from({ length: 28 }, (_, i) => i + 1);

  return (
    <Dialog open={open} onOpenChange={onOpenChange} modal={false}>
      <DialogContent className="sm:max-w-md max-h-[90vh] overflow-y-auto notranslate" translate="no">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Target className="h-5 w-5 text-primary" />
            Nova Caixinha
          </DialogTitle>
          <DialogDescription>
            Crie uma meta de economia para alcançar seus objetivos financeiros.
          </DialogDescription>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <FormField
              control={form.control}
              name="goal_name"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Nome da Meta</FormLabel>
                  <FormControl>
                    <Input
                      {...field}
                      placeholder="Ex: Comprar um carro, Reserva de emergência"
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div className="grid grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="total_target_amount"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Valor Total (R$)</FormLabel>
                    <FormControl>
                      <Input
                        {...field}
                        placeholder="10.000,00"
                        inputMode="decimal"
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="timeframe_months"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Prazo (meses)</FormLabel>
                    <FormControl>
                      <Input
                        {...field}
                        type="number"
                        min="1"
                        max="120"
                        placeholder="12"
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <FormField
              control={form.control}
              name="initial_saved_amount"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Valor já guardado (R$)</FormLabel>
                  <FormControl>
                    <Input {...field} placeholder="0,00" inputMode="decimal" />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Calculated Monthly Amount */}
            {calculatedMonthly !== null && (
              <div className="flex items-center gap-3 p-4 rounded-lg bg-primary/10 border border-primary/20">
                <Banknote className="h-6 w-6 text-primary" />
                <div>
                  <p className="text-sm text-muted-foreground">Valor mensal a guardar</p>
                  <p className="text-lg font-bold text-primary">
                    {formatCurrency(calculatedMonthly)}
                  </p>
                  <p className="text-sm text-muted-foreground">
                    Falta guardar: {formatCurrency(Math.max(0, amount - initialSaved))}
                  </p>
                </div>
              </div>
            )}

            <FormField
              control={form.control}
              name="bank_name"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Banco (opcional)</FormLabel>
                  <FormControl>
                    <Input
                      {...field}
                      placeholder="Ex: Nubank, Itaú, Caixa"
                    />
                  </FormControl>
                  <FormDescription>
                    Onde você vai guardar esse dinheiro
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div className="grid grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="contribution_day"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Dia da Contribuição</FormLabel>
                    <Select onValueChange={field.onChange} defaultValue={field.value}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Selecione" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {contributionDays.map((day) => (
                          <SelectItem key={day} value={day.toString()}>
                            Dia {day}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="start_date"
                render={({ field }) => (
                  <FormItem className="flex flex-col">
                    <FormLabel>Data de Início</FormLabel>
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
                              format(field.value, 'dd/MM/yy', { locale: ptBR })
                            ) : (
                              <span>Selecione</span>
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
                          locale={ptBR}
                          initialFocus
                        />
                      </PopoverContent>
                    </Popover>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <div className="flex justify-end gap-3 pt-2">
              <Button
                type="button"
                variant="outline"
                onClick={() => onOpenChange(false)}
              >
                Cancelar
              </Button>
              <Button type="submit" disabled={isCreating}>
                {isCreating && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                Criar Caixinha
              </Button>
            </div>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
