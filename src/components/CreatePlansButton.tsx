import { useState } from "react";
import { Button } from "@/components/ui/button";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { Loader2 } from "lucide-react";

export function CreatePlansButton() {
  const [isLoading, setIsLoading] = useState(false);

  const handleCreatePlans = async () => {
    setIsLoading(true);
    
    try {
      console.log("Chamando edge function para criar planos...");
      
      const { data, error } = await supabase.functions.invoke('create-pagarme-plans', {
        method: 'POST'
      });

      if (error) {
        console.error('Erro na edge function:', error);
        toast.error(`Erro ao criar planos: ${error.message}`);
        return;
      }

      console.log('Resposta da edge function:', data);

      if (data.success) {
        toast.success(data.message);
        console.log('Planos criados com sucesso:', data.results);
      } else {
        toast.error(`Erro: ${data.error || 'Falha ao criar planos'}`);
        console.error('Erro nos resultados:', data.results);
      }

    } catch (error) {
      console.error('Erro ao criar planos:', error);
      toast.error('Erro inesperado ao criar planos');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="flex flex-col gap-4 p-6 border rounded-lg">
      <div>
        <h3 className="text-lg font-semibold">Criar Planos no Pagar.me</h3>
        <p className="text-sm text-muted-foreground">
          Crie automaticamente os planos Mensal (R$ 197,00) e Semestral (R$ 985,00) no Pagar.me via API.
        </p>
      </div>
      
      <Button 
        onClick={handleCreatePlans} 
        disabled={isLoading}
        className="w-fit"
      >
        {isLoading ? (
          <>
            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            Criando planos...
          </>
        ) : (
          'Criar Planos via API'
        )}
      </Button>
      
      <div className="text-xs text-muted-foreground">
        <p><strong>Planos que serão criados:</strong></p>
        <ul className="list-disc list-inside mt-1">
          <li>ID: "monthly" - Plano Mensal BALANZZO (R$ 197,00)</li>
          <li>ID: "semiannual" - Plano Semestral BALANZZO (R$ 985,00)</li>
        </ul>
      </div>
    </div>
  );
}