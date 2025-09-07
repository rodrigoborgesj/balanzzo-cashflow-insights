import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { Loader2, Mail, Users, Clock, CheckCircle2 } from 'lucide-react';

interface EmailStats {
  totalUsers: number;
  usersWithWelcomeEmail: number;
  usersWithoutWelcomeEmail: number;
  pendingEmails: number;
}

export function EmailManagement() {
  const [isLoading, setIsLoading] = useState(false);
  const [isSending, setIsSending] = useState(false);
  const [stats, setStats] = useState<EmailStats | null>(null);
  const { toast } = useToast();

  const fetchEmailStats = async () => {
    setIsLoading(true);
    try {
      // Get total users count
      const { count: totalUsers } = await supabase
        .from('profiles')
        .select('*', { count: 'exact', head: true });

      // Get users with successful welcome emails
      const { count: usersWithWelcomeEmail } = await supabase
        .from('email_logs')
        .select('user_id', { count: 'exact', head: true })
        .eq('email_type', 'welcome')
        .eq('success', true);

      // Get pending emails
      const { count: pendingEmails } = await supabase
        .from('email_logs')
        .select('*', { count: 'exact', head: true })
        .eq('email_type', 'welcome_pending')
        .eq('success', false);

      setStats({
        totalUsers: totalUsers || 0,
        usersWithWelcomeEmail: usersWithWelcomeEmail || 0,
        usersWithoutWelcomeEmail: (totalUsers || 0) - (usersWithWelcomeEmail || 0),
        pendingEmails: pendingEmails || 0,
      });

    } catch (error) {
      console.error('Error fetching email stats:', error);
      toast({
        title: "Erro",
        description: "Não foi possível carregar as estatísticas de email.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const sendWelcomeEmailsToExisting = async () => {
    setIsSending(true);
    try {
      console.log('Sending welcome emails to existing users...');

      const { data, error } = await supabase.functions.invoke('send-welcome-email', {
        body: { sendToExisting: true }
      });

      if (error) {
        throw error;
      }

      console.log('Welcome emails result:', data);

      toast({
        title: "Emails Enviados",
        description: `${data.sentCount} emails de boas-vindas foram enviados com sucesso.`,
        variant: "default",
      });

      // Refresh stats
      await fetchEmailStats();

    } catch (error: any) {
      console.error('Error sending welcome emails:', error);
      toast({
        title: "Erro ao Enviar Emails",
        description: `Erro: ${error.message}`,
        variant: "destructive",
      });
    } finally {
      setIsSending(false);
    }
  };

  const processPendingEmails = async () => {
    setIsSending(true);
    try {
      // Get all pending emails
      const { data: pendingEmails, error } = await supabase
        .from('email_logs')
        .select('user_id, email_address')
        .eq('email_type', 'welcome_pending')
        .eq('success', false);

      if (error) throw error;

      if (!pendingEmails || pendingEmails.length === 0) {
        toast({
          title: "Nenhum Email Pendente",
          description: "Não há emails pendentes para processar.",
          variant: "default",
        });
        return;
      }

      console.log(`Processing ${pendingEmails.length} pending emails...`);

      let processedCount = 0;

      for (const pendingEmail of pendingEmails) {
        try {
          const { error: emailError } = await supabase.functions.invoke('send-welcome-email', {
            body: { 
              userId: pendingEmail.user_id,
              email: pendingEmail.email_address
            }
          });

          if (!emailError) {
            processedCount++;
            // Remove the pending entry
            await supabase
              .from('email_logs')
              .delete()
              .eq('user_id', pendingEmail.user_id)
              .eq('email_type', 'welcome_pending');
          }

          // Add small delay to avoid rate limiting
          await new Promise(resolve => setTimeout(resolve, 200));

        } catch (error) {
          console.error(`Error processing pending email for user ${pendingEmail.user_id}:`, error);
        }
      }

      toast({
        title: "Emails Processados",
        description: `${processedCount} emails pendentes foram processados com sucesso.`,
        variant: "default",
      });

      // Refresh stats
      await fetchEmailStats();

    } catch (error: any) {
      console.error('Error processing pending emails:', error);
      toast({
        title: "Erro",
        description: `Erro ao processar emails pendentes: ${error.message}`,
        variant: "destructive",
      });
    } finally {
      setIsSending(false);
    }
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Mail className="h-5 w-5" />
            Gestão de Emails de Boas-Vindas
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex gap-4">
            <Button 
              onClick={fetchEmailStats} 
              disabled={isLoading}
              variant="outline"
            >
              {isLoading ? (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              ) : (
                <Users className="mr-2 h-4 w-4" />
              )}
              Atualizar Estatísticas
            </Button>

            <Button 
              onClick={sendWelcomeEmailsToExisting} 
              disabled={isSending || !stats}
            >
              {isSending ? (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              ) : (
                <Mail className="mr-2 h-4 w-4" />
              )}
              Enviar para Usuários Existentes
            </Button>

            {stats && stats.pendingEmails > 0 && (
              <Button 
                onClick={processPendingEmails} 
                disabled={isSending}
                variant="secondary"
              >
                {isSending ? (
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                ) : (
                  <Clock className="mr-2 h-4 w-4" />
                )}
                Processar Pendentes ({stats.pendingEmails})
              </Button>
            )}
          </div>

          {stats && (
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-6">
              <div className="p-4 rounded-lg bg-muted">
                <div className="text-2xl font-bold text-primary">{stats.totalUsers}</div>
                <div className="text-sm text-muted-foreground">Total de Usuários</div>
              </div>

              <div className="p-4 rounded-lg bg-muted">
                <div className="flex items-center gap-2">
                  <div className="text-2xl font-bold text-green-600">{stats.usersWithWelcomeEmail}</div>
                  <CheckCircle2 className="h-4 w-4 text-green-600" />
                </div>
                <div className="text-sm text-muted-foreground">Com Email Enviado</div>
              </div>

              <div className="p-4 rounded-lg bg-muted">
                <div className="text-2xl font-bold text-orange-600">{stats.usersWithoutWelcomeEmail}</div>
                <div className="text-sm text-muted-foreground">Sem Email Enviado</div>
              </div>

              <div className="p-4 rounded-lg bg-muted">
                <div className="flex items-center gap-2">
                  <div className="text-2xl font-bold text-yellow-600">{stats.pendingEmails}</div>
                  <Clock className="h-4 w-4 text-yellow-600" />
                </div>
                <div className="text-sm text-muted-foreground">Emails Pendentes</div>
              </div>
            </div>
          )}

          <div className="mt-6 p-4 rounded-lg bg-muted/50">
            <h4 className="font-medium mb-2">Como Funciona:</h4>
            <ul className="text-sm text-muted-foreground space-y-1">
              <li>• <strong>Novos usuários:</strong> Recebem email automaticamente ao se cadastrar</li>
              <li>• <strong>Usuários existentes:</strong> Use o botão "Enviar para Usuários Existentes" para enviar em lote</li>
              <li>• <strong>Emails pendentes:</strong> São emails que falharam e precisam ser reprocessados</li>
              <li>• <strong>Proteção contra duplicação:</strong> Cada usuário recebe o email apenas uma vez</li>
            </ul>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}