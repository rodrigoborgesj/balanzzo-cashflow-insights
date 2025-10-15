import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { Plus, Calendar, DollarSign, Tag, FileText } from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";

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
    paymentMethod: ''
  });
  
  const { user } = useAuth();
  const { toast } = useToast();

  // Reload categories when dialog opens
  useEffect(() => {
    if (isOpen && loadUserCategories) {
      loadUserCategories();
    }
  }, [isOpen]); // ✅ FIX: Removido loadUserCategories das dependências para evitar que mudanças na função causem fechamento do modal

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
      const transactionData = {
        user_id: user.id,
        data_transacao: formData.date, // Manter como string YYYY-MM-DD
        valor: finalAmount,
        descricao: formData.description,
        tipo: formData.type,
        categoria_final: formData.category,
        categoria_sugerida: formData.category,
        status_conciliacao: true,
        origem_arquivo: 'manual_entry',
        mes_referencia: formData.date.substring(0, 7) + '-01',
        hash_transacao: btoa(`${formData.date}-${formData.description}-${finalAmount}-${user.id}-manual`).substring(0, 50)
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

      toast({
        title: 'Transação adicionada com sucesso!',
        description: `${formData.type === 'entrada' ? 'Receita' : 'Despesa'} de R$ ${amount.toFixed(2)} foi registrada`,
      });

      // Reset form
      setFormData({
        date: new Date().toISOString().split('T')[0],
        type: 'entrada',
        amount: '',
        category: '',
        description: '',
        paymentMethod: ''
      });

      setIsOpen(false);
      
      // Reload categories to ensure fresh data
      if (loadUserCategories) {
        await loadUserCategories();
      }
      
      onTransactionAdded();

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
      <DialogContent className="sm:max-w-[600px]" onInteractOutside={(e) => e.preventDefault()}>
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