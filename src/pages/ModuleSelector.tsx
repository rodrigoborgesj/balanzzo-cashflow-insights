import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Building2, User, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { useModule } from '@/contexts/ModuleContext';
import { useAuth } from '@/hooks/useAuth';

export default function ModuleSelector() {
  const navigate = useNavigate();
  const { user, isLoading: authLoading } = useAuth();
  const { 
    hasCompanySubscription, 
    hasPersonalSubscription,
    hasFreeAccess,
    setCurrentContext, 
    isLoading: moduleLoading 
  } = useModule();

  const isLoading = authLoading || moduleLoading;
  
  // Free access grants both modules
  const canAccessCompany = hasCompanySubscription || hasFreeAccess;
  const canAccessPersonal = hasPersonalSubscription || hasFreeAccess;
  const hasAnyAccess = canAccessCompany || canAccessPersonal;

  useEffect(() => {
    if (!isLoading && !user) {
      navigate('/login', { replace: true });
    }
  }, [isLoading, user, navigate]);

  // If user only has one subscription type, redirect directly
  useEffect(() => {
    if (!isLoading && user) {
      if (canAccessCompany && !canAccessPersonal) {
        handleSelectModule('company');
      } else if (canAccessPersonal && !canAccessCompany) {
        handleSelectModule('personal');
      } else if (!hasAnyAccess) {
        // No subscription, redirect to checkout
        navigate('/checkout', { replace: true });
      }
    }
  }, [isLoading, user, canAccessCompany, canAccessPersonal, hasAnyAccess]);

  const handleSelectModule = async (module: 'company' | 'personal') => {
    await setCurrentContext(module);
    if (module === 'company') {
      navigate('/dashboard', { replace: true });
    } else {
      navigate('/personal', { replace: true });
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="flex flex-col items-center gap-4">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
          <p className="text-sm text-muted-foreground">Verificando acesso...</p>
        </div>
      </div>
    );
  }

  // Show selector only if user has access to both modules
  if (!hasAnyAccess) {
    return null;
  }

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-4">
      <div className="w-full max-w-4xl">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-foreground mb-2">Bem-vindo ao Balanzzo</h1>
          <p className="text-muted-foreground">Selecione qual módulo deseja acessar</p>
        </div>

        <div className="grid md:grid-cols-2 gap-6">
          {canAccessCompany && (
            <Card className="hover:border-primary transition-colors cursor-pointer group">
              <CardHeader className="text-center pb-4">
                <div className="mx-auto w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center mb-4 group-hover:bg-primary/20 transition-colors">
                  <Building2 className="h-8 w-8 text-primary" />
                </div>
                <CardTitle className="text-xl">Conta Empresarial</CardTitle>
                <CardDescription>
                  Gestão financeira completa para sua empresa
                </CardDescription>
              </CardHeader>
              <CardContent>
                <ul className="text-sm text-muted-foreground space-y-2 mb-6">
                  <li className="flex items-center gap-2">
                    <span className="w-1.5 h-1.5 rounded-full bg-primary" />
                    Conciliação bancária
                  </li>
                  <li className="flex items-center gap-2">
                    <span className="w-1.5 h-1.5 rounded-full bg-primary" />
                    DRE - Demonstrativo de Resultados
                  </li>
                  <li className="flex items-center gap-2">
                    <span className="w-1.5 h-1.5 rounded-full bg-primary" />
                    Indicadores financeiros
                  </li>
                  <li className="flex items-center gap-2">
                    <span className="w-1.5 h-1.5 rounded-full bg-primary" />
                    Relatórios gerenciais
                  </li>
                </ul>
                <Button 
                  className="w-full" 
                  onClick={() => handleSelectModule('company')}
                >
                  Acessar Conta Empresarial
                </Button>
              </CardContent>
            </Card>
          )}

          {canAccessPersonal && (
            <Card className="hover:border-primary transition-colors cursor-pointer group">
              <CardHeader className="text-center pb-4">
                <div className="mx-auto w-16 h-16 rounded-full bg-accent/10 flex items-center justify-center mb-4 group-hover:bg-accent/20 transition-colors">
                  <User className="h-8 w-8 text-accent-foreground" />
                </div>
                <CardTitle className="text-xl">Conta Pessoal</CardTitle>
                <CardDescription>
                  Organize suas finanças pessoais com simplicidade
                </CardDescription>
              </CardHeader>
              <CardContent>
                <ul className="text-sm text-muted-foreground space-y-2 mb-6">
                  <li className="flex items-center gap-2">
                    <span className="w-1.5 h-1.5 rounded-full bg-accent" />
                    Conciliação bancária pessoal
                  </li>
                  <li className="flex items-center gap-2">
                    <span className="w-1.5 h-1.5 rounded-full bg-accent" />
                    Transações financeiras
                  </li>
                  <li className="flex items-center gap-2">
                    <span className="w-1.5 h-1.5 rounded-full bg-accent" />
                    Categorias personalizadas
                  </li>
                  <li className="flex items-center gap-2">
                    <span className="w-1.5 h-1.5 rounded-full bg-accent" />
                    Visão clara de receitas e despesas
                  </li>
                </ul>
                <Button 
                  variant="outline"
                  className="w-full" 
                  onClick={() => handleSelectModule('personal')}
                >
                  Acessar Conta Pessoal
                </Button>
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </div>
  );
}
