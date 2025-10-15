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

import { useToast } from "@/hooks/use-toast";
import { useProfile } from "@/hooks/useProfile";
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
} from "lucide-react";

export default function Configuracoes() {
  const { toast } = useToast();
  const { profile, updateProfilePhoto } = useProfile();
  const { theme, setTheme } = useTheme();
  
  // Estados das configurações
  const [settings, setSettings] = useState({
    relatoriosMensais: true,
    alertasVencimento: true,
    conciliacaoAutomatica: false,
    autenticacaoDoisFatores: false,
    loginAutomatico: true,
  });

  // Sincronizar o tema com o estado do dark mode
  const isDarkMode = theme === "dark";

  const handleSwitchChange = (key: keyof typeof settings) => {
    setSettings(prev => ({
      ...prev,
      [key]: !prev[key]
    }));
  };

  const handleSaveSettings = () => {
    // Aqui você salvaria as configurações no banco de dados
    toast({
      title: "Configurações salvas",
      description: "Suas preferências foram atualizadas com sucesso.",
    });
  };
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
        <Button size="sm" onClick={handleSaveSettings}>
          <Save className="h-4 w-4 mr-2" />
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
                checked={settings.relatoriosMensais}
                onCheckedChange={() => handleSwitchChange('relatoriosMensais')}
              />
            </div>
            <div className="flex items-center justify-between">
              <div>
                <p className="font-medium">Alertas de vencimento</p>
                <p className="text-sm text-muted-foreground">Avisos sobre contas próximas do vencimento</p>
              </div>
              <Switch 
                checked={settings.alertasVencimento}
                onCheckedChange={() => handleSwitchChange('alertasVencimento')}
              />
            </div>
            <div className="flex items-center justify-between">
              <div>
                <p className="font-medium">Conciliação automática</p>
                <p className="text-sm text-muted-foreground">Sugerir categorias para transações similares</p>
              </div>
              <Switch 
                checked={settings.conciliacaoAutomatica}
                onCheckedChange={() => handleSwitchChange('conciliacaoAutomatica')}
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
                checked={settings.autenticacaoDoisFatores}
                onCheckedChange={() => handleSwitchChange('autenticacaoDoisFatores')}
              />
            </div>
            <div className="flex items-center justify-between">
              <div>
                <p className="font-medium">Login automático</p>
                <p className="text-sm text-muted-foreground">Manter sessão ativa por 30 dias</p>
              </div>
              <Switch 
                checked={settings.loginAutomatico}
                onCheckedChange={() => handleSwitchChange('loginAutomatico')}
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