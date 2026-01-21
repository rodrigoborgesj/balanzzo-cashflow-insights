import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import { Plus, Calendar, DollarSign, Tag, FileText, Repeat } from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { addMonths, addDays, format } from "date-fns";

interface ManualTransactionFormProps {
  onTransactionAdded: () => void;
  userCategories?: Array<{ id: string; nome_categoria: string; cor?: string }>;
  loadUserCategories?: () => Promise<void>;
}

interface ManualTransactionData {
  date: string;
  type: 'entrada' | 'saida';
  amount: string;
  category: string;
  description: string;
  paymentMethod?: string;
  // NEW: Recurring transaction fields
  isRecurring?: boolean;
  recurrenceType?: 'monthly' | 'specific_month' | 'custom';
  customIntervalDays?: string;
  specificMonth?: string;
}

export function ManualTransactionForm({ onTransactionAdded, userCategories = [], loadUserCategories }: ManualTransactionFormProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [formData, setFormData] = useState<ManualTransactionData>({
    date: new Date().toISOString().split('T')[0],
    type: 'entrada',
    amount: '',
    category: '',
    description: '',
    paymentMethod: '',
    // NEW: Initialize recurring fields
    isRecurring: false,
    recurrenceType: 'monthly',
    customIntervalDays: '',
    specificMonth: ''
  });
  
  const { user } = useAuth();
  const { toast } = useToast();

  // Reload categories when dialog opens
  useEffect(() => {
    if (isOpen && loadUserCategories) {
      loadUserCategories();
    }
  }, [isOpen]); // ✅ FIX: Removido loadUserCategories das dependências para evitar que mudanças na função causem fechamento do modal

  // NEW: Function to calculate next occurrence date
  const calculateNextOccurrence = (currentDate: string): string => {
    const date = new Date(currentDate + 'T00:00:00');
    
    switch (formData.recurrenceType) {
      case 'monthly':
        return format(addMonths(date, 1), 'yyyy-MM-dd');
      
      case 'specific_month':
        if (!formData.specificMonth) return currentDate;
        const targetMonth = parseInt(formData.specificMonth);
        const nextYear = date.getFullYear() + 1;
        return `${nextYear}-${String(targetMonth).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;
      
      case 'custom':
        if (!formData.customIntervalDays) return currentDate;
        const intervalDays = parseInt(formData.customIntervalDays);
        return format(addDays(date, intervalDays), 'yyyy-MM-dd');
      
      default:
        return currentDate;
    }
  };

  // NEW: Function to generate future occurrences for projections
  const generateFutureOccurrences = (startDate: string, amount: number, numOccurrences: number) => {
    const occurrences = [];
    let currentDate = startDate;

    for (let i = 0; i < numOccurrences; i++) {
      currentDate = calculateNextOccurrence(currentDate);
      
      occurrences.push({
        user_id: user!.id,
        company_id: null, // Will be set later
        data_competencia: currentDate,
        tipo: formData.type,
        categoria: formData.category,
        descricao: formData.description,
        valor: Math.abs(amount)
      });
    }

    return occurrences;
  };

  // NEW: Function to handle recurring transaction creation
  const handleRecurringTransaction = async (transactionData: any, company_id: string | null, amount: number) => {
    try {
      // Validate recurring fields
      if (formData.recurrenceType === 'custom' && !formData.customIntervalDays) {
        throw new Error('Intervalo de dias é obrigatório para recorrência personalizada');
      }
      if (formData.recurrenceType === 'specific_month' && !formData.specificMonth) {
        throw new Error('Mês específico é obrigatório para este tipo de recorrência');
      }

      const nextOccurrence = calculateNextOccurrence(formData.date);

      const recurringData = {
        transacao_origem_id: transactionData.hash_transacao, // Using hash as unique identifier
        user_id: user!.id,
        company_id,
        tipo_recorrencia: formData.recurrenceType,
        intervalo_dias: formData.recurrenceType === 'custom' ? parseInt(formData.customIntervalDays!) : null,
        mes_especifico: formData.recurrenceType === 'specific_month' ? parseInt(formData.specificMonth!) : null,
        proximo_lancamento: nextOccurrence,
        ativo: true
      };

      const { error } = await supabase
        .from('transacoes_recorrentes')
        .insert([recurringData]);

      if (error) throw error;

      console.log('✅ Configuração de recorrência salva:', recurringData);

      // Generate and insert future occurrences for projections
      const numOccurrences = formData.recurrenceType === 'specific_month' ? 5 : 12; // 12 months for monthly/custom, 5 years for specific month
      const futureOccurrences = generateFutureOccurrences(formData.date, amount, numOccurrences);
      
      // Set company_id for all occurrences
      const futureOccurrencesWithCompany = futureOccurrences.map(occ => ({
        ...occ,
        company_id
      }));

      if (futureOccurrencesWithCompany.length > 0) {
        const { error: fluxoError } = await supabase
          .from('fluxo_caixa')
          .insert(futureOccurrencesWithCompany);

        if (fluxoError) {
          console.error('Erro ao criar lançamentos futuros:', fluxoError);
          toast({
            title: 'Aviso',
            description: 'Recorrência configurada, mas houve erro ao criar projeções futuras',
            variant: 'default'
          });
        } else {
          console.log(`✅ ${futureOccurrencesWithCompany.length} lançamentos futuros criados para projeção`);
        }
      }

    } catch (error) {
      console.error('Erro ao configurar recorrência:', error);
      toast({
        title: 'Aviso',
        description: 'Transação salva, mas houve erro ao configurar recorrência',
        variant: 'destructive'
      });
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!user?.id) {
      toast({
        title: 'Erro de autenticação',
        description: 'Você precisa estar logado para adicionar transações',
        variant: 'destructive'
      });
      return;
    }

    // Validations
    if (!formData.date || !formData.amount || !formData.category || !formData.description) {
      toast({
        title: 'Campos obrigatórios',
        description: 'Preencha todos os campos obrigatórios',
        variant: 'destructive'
      });
      return;
    }

    const amount = parseFloat(formData.amount.replace(',', '.'));
    if (isNaN(amount) || amount <= 0) {
      toast({
        title: 'Valor inválido',
        description: 'O valor deve ser um número positivo',
        variant: 'destructive'
      });
      return;
    }

    // Validate category exists
    const categoryExists = allCategories.includes(formData.category);
    if (!categoryExists) {
      toast({
        title: 'Categoria inválida',
        description: 'A categoria selecionada não existe. Por favor, crie-a nas configurações primeiro.',
        variant: 'destructive'
      });
      return;
    }

    setIsLoading(true);
    try {
      // Prepare transaction data for insertion
      // IMPORTANTE: Manter a data como string para evitar problemas de timezone
      // O input type="date" retorna sempre no formato YYYY-MM-DD
      const finalAmount = formData.type === 'saida' ? -Math.abs(amount) : Math.abs(amount);
      
      console.log('💾 Salvando transação manual:', {
        data: formData.date,
        tipo: formData.type,
        valor: finalAmount,
        categoria: formData.category,
        descricao: formData.description
      });

      const transactionData = {
        user_id: user.id,
        data_transacao: formData.date, // Manter como string YYYY-MM-DD
        valor: finalAmount,
        descricao: formData.description,
        tipo: formData.type,
        categoria_final: formData.category,
        categoria_sugerida: formData.category,
        status_conciliacao: true, // ✅ CRÍTICO: Marca como conciliada para aparecer no fluxo de caixa
        origem_arquivo: 'manual_entry',
        mes_referencia: formData.date.substring(0, 7) + '-01',
        hash_transacao: btoa(`${formData.date}-${formData.description}-${finalAmount}-${user.id}-${Date.now()}`).substring(0, 50),
        status_validacao: 'pendente' // 🟡 Transações manuais ficam pendentes até validação com comprovante
      };

      // Insert into transacoes_conciliadas
      const { error: transactionError } = await supabase
        .from('transacoes_conciliadas')
        .insert([transactionData]);

      if (transactionError) {
        throw transactionError;
      }

      // Get company_id for fluxo_caixa
      const { data: companies } = await supabase
        .from('companies')
        .select('id')
        .eq('user_id', user.id)
        .limit(1);

      const company_id = companies?.[0]?.id || null;

      // Insert into fluxo_caixa table
      // Manter data como string para evitar conversão de timezone
      const fluxoCaixaData = {
        company_id,
        user_id: user.id,
        data_competencia: formData.date, // Manter como string YYYY-MM-DD
        tipo: formData.type,
        categoria: formData.category,
        descricao: formData.description,
        valor: Math.abs(amount)
      };

      const { error: fluxoError } = await supabase
        .from('fluxo_caixa')
        .insert([fluxoCaixaData]);

      if (fluxoError) {
        console.warn('Warning: Could not insert into fluxo_caixa:', fluxoError);
        // Don't throw error as the main transaction was successful
      }

      console.log('✅ Transação salva com sucesso!');

      // NEW: Handle recurring transaction if enabled
      if (formData.isRecurring && formData.recurrenceType) {
        await handleRecurringTransaction(transactionData, company_id, amount);
      }

      toast({
        title: 'Transação adicionada com sucesso!',
        description: formData.isRecurring 
          ? `${formData.type === 'entrada' ? 'Receita' : 'Despesa'} recorrente de R$ ${amount.toFixed(2)} foi registrada`
          : `${formData.type === 'entrada' ? 'Receita' : 'Despesa'} de R$ ${amount.toFixed(2)} foi registrada`,
      });

      // Reset form
      setFormData({
        date: new Date().toISOString().split('T')[0],
        type: 'entrada',
        amount: '',
        category: '',
        description: '',
        paymentMethod: '',
        isRecurring: false,
        recurrenceType: 'monthly',
        customIntervalDays: '',
        specificMonth: ''
      });

      setIsOpen(false);
      
      // Reload categories to ensure fresh data
      if (loadUserCategories) {
        await loadUserCategories();
      }
      
      // ✅ CRÍTICO: Aguarda 100ms antes de disparar eventos para garantir que o DB atualizou
      setTimeout(() => {
        window.dispatchEvent(new Event('transactionsUpdated'));
        console.log('🔄 Evento transactionsUpdated disparado');
        onTransactionAdded();
      }, 100);

    } catch (error) {
      console.error('Erro ao adicionar transação manual:', error);
      toast({
        title: 'Erro ao adicionar transação',
        description: error instanceof Error ? error.message : 'Erro desconhecido',
        variant: 'destructive'
      });
    } finally {
      setIsLoading(false);
    }
  };

  // Default categories if user doesn't have custom ones
  const defaultCategories = [
    'Vendas', 'Serviços', 'Recebimentos', 'Outros Receitas',
    'Fornecedores', 'Salários', 'Aluguel', 'Utilities', 'Marketing', 
    'Tarifa bancária', 'Outros Despesas'
  ];

  const allCategories = userCategories.length > 0 
    ? userCategories.map(cat => cat.nome_categoria)
    : defaultCategories;

  const safeCategoryValue = allCategories.includes(formData.category) ? formData.category : "";

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        <Button className="flex items-center gap-2" size="sm">
          <Plus className="h-4 w-4" />
          Adicionar Transação
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[600px]" onInteractOutside={(e) => {
        const target = e.target as HTMLElement;
        // Permite interação com conteúdos em portal (Select/Popover/Dropdown) sem fechar o modal
        if (target?.closest('[data-radix-portal]')) {
          e.preventDefault();
        }
      }}>
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Plus className="h-5 w-5" />
            Adicionar Transação Manual
          </DialogTitle>
        </DialogHeader>
        
        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Date */}
            <div className="space-y-2">
              <Label htmlFor="date" className="flex items-center gap-2">
                <Calendar className="h-4 w-4" />
                Data *
              </Label>
              <Input
                id="date"
                type="date"
                value={formData.date}
                onChange={(e) => setFormData(prev => ({ ...prev, date: e.target.value }))}
                required
              />
            </div>

            {/* Transaction Type */}
            <div className="space-y-2">
              <Label htmlFor="type">Tipo *</Label>
              <Select 
                value={formData.type} 
                onValueChange={(value: 'entrada' | 'saida') => setFormData(prev => ({ ...prev, type: value }))}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Selecione o tipo" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="entrada">
                    <div className="flex items-center gap-2">
                      <div className="w-3 h-3 rounded-full bg-success"></div>
                      Receita
                    </div>
                  </SelectItem>
                  <SelectItem value="saida">
                    <div className="flex items-center gap-2">
                      <div className="w-3 h-3 rounded-full bg-destructive"></div>
                      Despesa
                    </div>
                  </SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Amount */}
            <div className="space-y-2">
              <Label htmlFor="amount" className="flex items-center gap-2">
                <DollarSign className="h-4 w-4" />
                Valor (R$) *
              </Label>
              <Input
                id="amount"
                type="text"
                placeholder="0,00"
                value={formData.amount}
                onChange={(e) => setFormData(prev => ({ ...prev, amount: e.target.value }))}
                required
              />
            </div>

            {/* Category */}
            <div className="space-y-2">
              <Label htmlFor="category" className="flex items-center gap-2">
                <Tag className="h-4 w-4" />
                Categoria *
              </Label>
              <Select 
                value={safeCategoryValue} 
                onValueChange={(value) => {
                  console.log('Categoria selecionada:', value);
                  setFormData(prev => ({ ...prev, category: value }));
                }}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Selecione a categoria" />
                </SelectTrigger>
                <SelectContent 
                  className="max-h-[300px] overflow-y-auto bg-background z-[100]"
                  position="popper"
                  sideOffset={5}
                >
                  {allCategories.length === 0 ? (
                    <div className="p-2 text-sm text-muted-foreground text-center">
                      Nenhuma categoria disponível
                    </div>
                  ) : (
                    allCategories.map((category) => (
                      <SelectItem key={category} value={category}>
                        {category}
                      </SelectItem>
                    ))
                  )}
                </SelectContent>
              </Select>
              <p className="text-xs text-muted-foreground">
                {allCategories.length === 0 
                  ? 'Crie categorias em Configurações → Categorias Personalizadas'
                  : 'Para criar novas categorias, acesse Configurações → Categorias Personalizadas'
                }
              </p>
            </div>
          </div>

          {/* Description */}
          <div className="space-y-2">
            <Label htmlFor="description" className="flex items-center gap-2">
              <FileText className="h-4 w-4" />
              Descrição *
            </Label>
            <Textarea
              id="description"
              placeholder="Ex: Pagamento de aluguel, Venda de produto, etc."
              value={formData.description}
              onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
              required
              rows={3}
            />
          </div>

          {/* Payment Method (Optional) */}
          <div className="space-y-2">
            <Label htmlFor="paymentMethod">Método de Pagamento (Opcional)</Label>
            <Select 
              value={formData.paymentMethod} 
              onValueChange={(value) => setFormData(prev => ({ ...prev, paymentMethod: value }))}
            >
              <SelectTrigger>
                <SelectValue placeholder="Selecione o método" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="pix">PIX</SelectItem>
                <SelectItem value="boleto">Boleto</SelectItem>
                <SelectItem value="dinheiro">Dinheiro</SelectItem>
                <SelectItem value="cartao_credito">Cartão de Crédito</SelectItem>
                <SelectItem value="cartao_debito">Cartão de Débito</SelectItem>
                <SelectItem value="transferencia">Transferência</SelectItem>
                <SelectItem value="outros">Outros</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* NEW: Recurring Transaction Section */}
          <div className="space-y-4 p-4 border-2 border-dashed border-primary/20 rounded-lg bg-primary/5">
            <div className="flex items-center gap-3">
              <Checkbox
                id="isRecurring"
                checked={formData.isRecurring}
                onCheckedChange={(checked) => setFormData(prev => ({ 
                  ...prev, 
                  isRecurring: checked as boolean 
                }))}
              />
              <Label htmlFor="isRecurring" className="flex items-center gap-2 cursor-pointer text-base font-medium">
                <Repeat className="h-5 w-5 text-primary" />
                🔁 Tornar Recorrente
              </Label>
            </div>

            {formData.isRecurring && (
              <div className="space-y-4 pl-8 animate-in slide-in-from-top-2">
                <div className="space-y-2">
                  <Label htmlFor="recurrenceType">Qual a frequência de recorrência? *</Label>
                  <Select
                    value={formData.recurrenceType}
                    onValueChange={(value: 'monthly' | 'specific_month' | 'custom') => 
                      setFormData(prev => ({ ...prev, recurrenceType: value }))
                    }
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Selecione a frequência" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="monthly">
                        <div className="flex items-center gap-2">
                          📅 Mensal (repete todo mês)
                        </div>
                      </SelectItem>
                      <SelectItem value="specific_month">
                        <div className="flex items-center gap-2">
                          📆 Mês específico (ex: só em Março)
                        </div>
                      </SelectItem>
                      <SelectItem value="custom">
                        <div className="flex items-center gap-2">
                          🗓️ Personalizado (escolher intervalo)
                        </div>
                      </SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                {formData.recurrenceType === 'specific_month' && (
                  <div className="space-y-2">
                    <Label htmlFor="specificMonth">Mês específico *</Label>
                    <Select
                      value={formData.specificMonth}
                      onValueChange={(value) => setFormData(prev => ({ ...prev, specificMonth: value }))}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Escolha o mês" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="1">Janeiro</SelectItem>
                        <SelectItem value="2">Fevereiro</SelectItem>
                        <SelectItem value="3">Março</SelectItem>
                        <SelectItem value="4">Abril</SelectItem>
                        <SelectItem value="5">Maio</SelectItem>
                        <SelectItem value="6">Junho</SelectItem>
                        <SelectItem value="7">Julho</SelectItem>
                        <SelectItem value="8">Agosto</SelectItem>
                        <SelectItem value="9">Setembro</SelectItem>
                        <SelectItem value="10">Outubro</SelectItem>
                        <SelectItem value="11">Novembro</SelectItem>
                        <SelectItem value="12">Dezembro</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                )}

                {formData.recurrenceType === 'custom' && (
                  <div className="space-y-2">
                    <Label htmlFor="customIntervalDays">Intervalo em dias *</Label>
                    <Input
                      id="customIntervalDays"
                      type="number"
                      min="1"
                      placeholder="Ex: 15 (a cada 15 dias)"
                      value={formData.customIntervalDays}
                      onChange={(e) => setFormData(prev => ({ ...prev, customIntervalDays: e.target.value }))}
                    />
                  </div>
                )}

                <div className="text-sm text-muted-foreground bg-background p-3 rounded-md border">
                  <strong>ℹ️ Como funciona:</strong> Esta transação será lançada automaticamente nas próximas datas, 
                  conforme a frequência selecionada.
                </div>
              </div>
            )}
          </div>

          {/* Manual Entry Badge */}
          <div className="flex items-center gap-2 p-3 bg-muted/50 rounded-lg">
            <Badge variant="outline" className="bg-primary/10 text-primary border-primary/20">
              Manual
            </Badge>
            <span className="text-sm text-muted-foreground">
              Esta transação será marcada como entrada manual e aparecerá integrada em todos os relatórios.
            </span>
          </div>

          {/* Submit Buttons */}
          <div className="flex justify-end gap-3">
            <Button 
              type="button" 
              variant="outline" 
              onClick={() => setIsOpen(false)}
              disabled={isLoading}
            >
              Cancelar
            </Button>
            <Button type="submit" disabled={isLoading}>
              {isLoading ? 'Salvando...' : 'Adicionar Transação'}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}