import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { CategoryManager } from "@/components/CategoryManager";
import TransactionRemover from "@/components/TransactionRemover";
import ManualTransactionRemover from "@/components/ManualTransactionRemover";
import { SecurityMonitoringDashboard } from "@/components/SecurityMonitoringDashboard";
import { ProfilePhotoUpload } from "@/components/ProfilePhotoUpload";
import { useTheme } from "@/components/ThemeProvider";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";

import { useToast } from "@/hooks/use-toast";
import { useProfile } from "@/hooks/useProfile";
import { Link } from "react-router-dom";
import { 
  Settings, 
  Bell, 
  Shield, 
  Database,
  Palette,
  Globe,
  Save,
  Trash2,
  User,
  Loader2,
  Users,
  Layers,
} from "lucide-react";


interface UserSettings {
  relatorios_mensais: boolean;
  alertas_vencimento: boolean;
  conciliacao_automatica: boolean;
  autenticacao_dois_fatores: boolean;
  login_automatico: boolean;
}

export default function Configuracoes() {
  const { toast } = useToast();
  const { profile, updateProfilePhoto } = useProfile();
  const { theme, setTheme } = useTheme();
  const { user } = useAuth();
  
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  
  // Estados das configurações
  const [settings, setSettings] = useState<UserSettings>({
    relatorios_mensais: true,
    alertas_vencimento: true,
    conciliacao_automatica: false,
    autenticacao_dois_fatores: false,
    login_automatico: true,
  });

  // Carregar configurações do banco de dados
  useEffect(() => {
    const loadSettings = async () => {
      if (!user?.id) return;
      
      try {
        const { data, error } = await supabase
          .from('user_settings')
          .select('*')
          .eq('user_id', user.id)
          .maybeSingle();
        
        if (error) throw error;
        
        if (data) {
          setSettings({
            relatorios_mensais: data.relatorios_mensais ?? true,
            alertas_vencimento: data.alertas_vencimento ?? true,
            conciliacao_automatica: data.conciliacao_automatica ?? false,
            autenticacao_dois_fatores: data.autenticacao_dois_fatores ?? false,
            login_automatico: data.login_automatico ?? true,
          });
        }
      } catch (error) {
        console.error('Erro ao carregar configurações:', error);
      } finally {
        setIsLoading(false);
      }
    };
    
    loadSettings();
  }, [user?.id]);

  // Sincronizar o tema com o estado do dark mode
  const isDarkMode = theme === "dark";

  const handleSwitchChange = (key: keyof UserSettings) => {
    setSettings(prev => ({
      ...prev,
      [key]: !prev[key]
    }));
  };

  const handleSaveSettings = async () => {
    if (!user?.id) {
      toast({
        title: "Erro",
        description: "Usuário não autenticado.",
        variant: "destructive"
      });
      return;
    }
    
    setIsSaving(true);
    
    try {
      // Verificar se já existe um registro
      const { data: existing } = await supabase
        .from('user_settings')
        .select('id')
        .eq('user_id', user.id)
        .maybeSingle();
      
      if (existing) {
        // Atualizar registro existente
        const { error } = await supabase
          .from('user_settings')
          .update({
            relatorios_mensais: settings.relatorios_mensais,
            alertas_vencimento: settings.alertas_vencimento,
            conciliacao_automatica: settings.conciliacao_automatica,
            autenticacao_dois_fatores: settings.autenticacao_dois_fatores,
            login_automatico: settings.login_automatico,
          })
          .eq('user_id', user.id);
        
        if (error) throw error;
      } else {
        // Inserir novo registro
        const { error } = await supabase
          .from('user_settings')
          .insert({
            user_id: user.id,
            relatorios_mensais: settings.relatorios_mensais,
            alertas_vencimento: settings.alertas_vencimento,
            conciliacao_automatica: settings.conciliacao_automatica,
            autenticacao_dois_fatores: settings.autenticacao_dois_fatores,
            login_automatico: settings.login_automatico,
          });
        
        if (error) throw error;
      }
      
      toast({
        title: "Configurações salvas",
        description: "Suas preferências foram atualizadas com sucesso.",
      });
    } catch (error) {
      console.error('Erro ao salvar configurações:', error);
      toast({
        title: "Erro ao salvar",
        description: "Não foi possível salvar as configurações. Tente novamente.",
        variant: "destructive"
      });
    } finally {
      setIsSaving(false);
    }
  };

  if (isLoading) {
    return (
      <div className="p-6 flex items-center justify-center min-h-[400px]">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6 bg-background min-h-full">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="page-title">Configurações</h1>
          <p className="text-muted-foreground">
            Personalize as configurações do sistema e preferências
          </p>
        </div>
        <Button size="sm" onClick={handleSaveSettings} disabled={isSaving}>
          {isSaving ? (
            <Loader2 className="h-4 w-4 mr-2 animate-spin" />
          ) : (
            <Save className="h-4 w-4 mr-2" />
          )}
          Salvar Alterações
        </Button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Profile Photo */}
        <Card className="bg-gradient-to-br from-card to-card/80 border-border/50 shadow-soft">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <User className="h-5 w-5" />
              Perfil
            </CardTitle>
          </CardHeader>
          <CardContent>
            <ProfilePhotoUpload 
              currentPhotoUrl={profile?.profile_photo_url}
              onPhotoUpdate={updateProfilePhoto}
            />
          </CardContent>
        </Card>

        {/* Notificações */}
        <Card className="bg-gradient-to-br from-card to-card/80 border-border/50 shadow-soft">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Bell className="h-5 w-5" />
              Notificações
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="font-medium">Relatórios mensais</p>
                <p className="text-sm text-muted-foreground">Receber relatórios automáticos por email</p>
              </div>
              <Switch 
                checked={settings.relatorios_mensais}
                onCheckedChange={() => handleSwitchChange('relatorios_mensais')}
              />
            </div>
            <div className="flex items-center justify-between">
              <div>
                <p className="font-medium">Alertas de vencimento</p>
                <p className="text-sm text-muted-foreground">Avisos sobre contas próximas do vencimento</p>
              </div>
              <Switch 
                checked={settings.alertas_vencimento}
                onCheckedChange={() => handleSwitchChange('alertas_vencimento')}
              />
            </div>
            <div className="flex items-center justify-between">
              <div>
                <p className="font-medium">Conciliação automática</p>
                <p className="text-sm text-muted-foreground">Sugerir categorias para transações similares</p>
              </div>
              <Switch 
                checked={settings.conciliacao_automatica}
                onCheckedChange={() => handleSwitchChange('conciliacao_automatica')}
              />
            </div>
          </CardContent>
        </Card>

        {/* Segurança */}
        <Card className="bg-gradient-to-br from-card to-card/80 border-border/50 shadow-soft">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Shield className="h-5 w-5" />
              Segurança
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="font-medium">Autenticação de dois fatores</p>
                <p className="text-sm text-muted-foreground">Maior segurança para sua conta</p>
              </div>
              <Switch 
                checked={settings.autenticacao_dois_fatores}
                onCheckedChange={() => handleSwitchChange('autenticacao_dois_fatores')}
              />
            </div>
            <div className="flex items-center justify-between">
              <div>
                <p className="font-medium">Login automático</p>
                <p className="text-sm text-muted-foreground">Manter sessão ativa por 30 dias</p>
              </div>
              <Switch 
                checked={settings.login_automatico}
                onCheckedChange={() => handleSwitchChange('login_automatico')}
              />
            </div>
            <Button variant="outline" className="w-full">
              Alterar Senha
            </Button>
          </CardContent>
        </Card>

        {/* Security Monitoring */}
        <Card className="bg-gradient-to-br from-card to-card/80 border-border/50 shadow-soft lg:col-span-2">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Shield className="h-5 w-5" />
              Monitoramento de Segurança
            </CardTitle>
          </CardHeader>
          <CardContent>
            <SecurityMonitoringDashboard />
          </CardContent>
        </Card>


        {/* Categorias */}
        <Card className="bg-gradient-to-br from-card to-card/80 border-border/50 shadow-soft lg:col-span-2">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Database className="h-5 w-5" />
              Gerenciamento de Categorias
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <p className="text-sm text-muted-foreground">
                Gerencie todas as categorias de receitas e despesas em um local centralizado. 
                Todas as alterações serão aplicadas automaticamente em todo o sistema.
              </p>
              <CategoryManager />
            </div>
          </CardContent>
        </Card>

        {/* Remoção de Transações Importadas */}
        <Card className="bg-gradient-to-br from-card to-card/80 border-border/50 shadow-soft">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Trash2 className="h-5 w-5" />
              Transações Importadas
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <p className="text-sm text-muted-foreground">
                Remova transações importadas de arquivos CSV/Excel quando necessário.
              </p>
              <TransactionRemover />
            </div>
          </CardContent>
        </Card>

        {/* Remoção de Transações Manuais */}
        <Card className="bg-gradient-to-br from-card to-card/80 border-border/50 shadow-soft">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Trash2 className="h-5 w-5" />
              Transações Manuais
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <p className="text-sm text-muted-foreground">
                Remova transações criadas manualmente. Os gráficos e dashboards serão atualizados automaticamente.
              </p>
              <ManualTransactionRemover />
            </div>
          </CardContent>
        </Card>

        {/* Acesso Profissional */}
        <Card className="bg-gradient-to-br from-card to-card/80 border-border/50 shadow-soft lg:col-span-2">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Users className="h-5 w-5" />
              Compartilhar com contador ou consultor
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
              <p className="text-sm text-muted-foreground max-w-2xl">
                Convide seu contador, consultor ou parceiro financeiro para acessar
                os dados da sua empresa com permissões controladas. Você gerencia
                quem entra, o que pode ver e revoga o acesso a qualquer momento.
              </p>
              <Button asChild>
                <Link to="/configuracoes/acesso-profissional">
                  <Users className="h-4 w-4 mr-2" />
                  Gerenciar acessos
                </Link>
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Preferências */}
        <Card className="bg-gradient-to-br from-card to-card/80 border-border/50 shadow-soft lg:col-span-2">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Palette className="h-5 w-5" />
              Preferências
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="font-medium">Modo escuro</p>
                <p className="text-sm text-muted-foreground">Tema escuro para melhor experiência visual</p>
              </div>
              <Switch 
                checked={isDarkMode}
                onCheckedChange={(checked) => {
                  setTheme(checked ? "dark" : "light");
                  toast({
                    title: checked ? "Modo escuro ativado" : "Modo claro ativado",
                    description: "Suas preferências de tema foram salvas.",
                  });
                }}
              />
            </div>
            <div className="flex items-center justify-between">
              <div>
                <p className="font-medium">Idioma</p>
                <p className="text-sm text-muted-foreground">Português (Brasil)</p>
              </div>
              <Button variant="outline" size="sm">
                <Globe className="h-4 w-4 mr-2" />
                Alterar
              </Button>
            </div>
            <div className="flex items-center justify-between">
              <div>
                <p className="font-medium">Moeda</p>
                <p className="text-sm text-muted-foreground">Real Brasileiro (R$)</p>
              </div>
              <Button variant="outline" size="sm">
                Alterar
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Sistema */}
      <Card className="bg-gradient-to-br from-card to-card/80 border-border/50 shadow-soft">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Settings className="h-5 w-5" />
            Informações do Sistema
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="text-center p-4 bg-accent/5 rounded-lg">
              <p className="text-sm text-muted-foreground">Versão</p>
              <p className="font-bold">v1.0.0</p>
            </div>
            <div className="text-center p-4 bg-accent/5 rounded-lg">
              <p className="text-sm text-muted-foreground">Última Atualização</p>
              <p className="font-bold">29/06/2024</p>
            </div>
            <div className="text-center p-4 bg-accent/5 rounded-lg">
              <p className="text-sm text-muted-foreground">Suporte</p>
              <p className="font-bold">24/7</p>
            </div>
          </div>
        </CardContent>
      </Card>

    </div>
  );
}