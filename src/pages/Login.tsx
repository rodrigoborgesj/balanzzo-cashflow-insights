import { useState, useEffect } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { useNavigate, Link } from "react-router-dom";
import { useToast } from "@/hooks/use-toast";
import { Lock, Mail, Eye, EyeOff, Chrome } from "lucide-react";
import { useSecureAuth } from "@/hooks/useSecureAuth";
import { useProfile } from "@/hooks/useProfile";
import { useSubscription } from "@/hooks/useSubscription";
import { SignupForm } from "@/components/SignupForm";
import financialHero from "@/assets/financial-hero.png";

export default function Login() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [mode, setMode] = useState<'login' | 'signup'>('login');
  const [isLoading, setIsLoading] = useState(false);
  const navigate = useNavigate();
  const { toast } = useToast();
  const { signIn, signInWithGoogle, isAuthenticated, user, isLoading: authLoading } = useSecureAuth();
  const { hasProfile, isLoading: profileLoading } = useProfile();
  const { hasAccess, loadSubscriptionData } = useSubscription();

  useEffect(() => {
    console.log('Login useEffect - isAuthenticated:', isAuthenticated, 'hasProfile:', hasProfile, 'authLoading:', authLoading, 'profileLoading:', profileLoading);
    
    // Check for payment success/failure in URL params
    const urlParams = new URLSearchParams(window.location.search);
    if (urlParams.get('payment_success') === 'true') {
      toast({
        title: "Pagamento realizado com sucesso!",
        description: "Sua assinatura foi ativada. Faça login para acessar a plataforma.",
      });
      // Reload subscription data after successful payment
      loadSubscriptionData();
      // Clean up URL
      window.history.replaceState({}, document.title, window.location.pathname);
    } else if (urlParams.get('payment_cancelled') === 'true') {
      toast({
        title: "Pagamento cancelado",
        description: "O pagamento foi cancelado. Você pode tentar novamente.",
        variant: "destructive",
      });
      // Clean up URL
      window.history.replaceState({}, document.title, window.location.pathname);
    }
    
    // Redirect authenticated users with active subscription to dashboard
    if (!authLoading && isAuthenticated && hasAccess()) {
      console.log('User is authenticated with active subscription, redirecting to dashboard');
      navigate("/", { replace: true });
    }
  }, [isAuthenticated, authLoading, hasAccess, navigate, toast, loadSubscriptionData]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    setIsLoading(true);

    try {
      const { error } = await signIn(email, password);
      
      if (error) {
        toast({
          title: "Erro no login",
          description: error.message,
          variant: "destructive",
        });
        return;
      }

      toast({
        title: "Login realizado com sucesso!",
        description: "Redirecionando...",
      });
      
      // Navigation will be handled by useEffect
    } catch (error: any) {
      toast({
        title: "Erro no login",
        description: error.message || "Erro inesperado",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleGoogleSignIn = async () => {
    setIsLoading(true);
    try {
      const { error } = await signInWithGoogle();
      
      if (error) {
        toast({
          title: "Erro no login",
          description: error.message,
          variant: "destructive",
        });
      }
    } catch (error: any) {
      toast({
        title: "Erro no login",
        description: error.message || "Erro inesperado",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  // Show loading if still checking auth state
  if (authLoading || profileLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  if (mode === 'signup') {
    return (
      <div className="min-h-screen bg-gradient-to-br from-background via-background to-accent/5 flex items-center justify-center p-4">
        <SignupForm onBack={() => setMode('login')} />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 flex">
      {/* Left side - Dashboard Preview */}
      <div className="flex-1 relative p-8 bg-white">
        {/* Company Name - Top Left */}
        <div className="absolute top-8 left-8">
          <h1 className="text-4xl font-bold" style={{ color: '#1A3423', fontFamily: 'Montserrat, sans-serif' }}>
            Balanzzo
          </h1>
        </div>

        {/* Dashboard Preview Container - Centered */}
        <div className="flex flex-col justify-center items-center h-full">
          <div className="w-full max-w-lg">
            {/* Header */}
            <div className="flex items-center justify-between mb-6">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-full flex items-center justify-center" style={{ backgroundColor: '#A9C7A1' }}>
                  <div className="w-6 h-6 rounded" style={{ backgroundColor: '#1A3423' }}></div>
                </div>
                <div>
                  <h2 className="text-xl font-bold" style={{ color: '#1A3423' }}>Dashboard Financeiro</h2>
                  <p className="text-sm" style={{ color: '#1A3423' }}>Rodrigo Alessandro B. Junior</p>
                </div>
              </div>
              <div className="text-2xl font-bold" style={{ color: '#1A3423' }}>138.4%</div>
            </div>

            {/* Financial Cards */}
            <div className="grid grid-cols-2 gap-4 mb-6">
              <div className="p-4 rounded-2xl border-2" style={{ backgroundColor: '#E4F8CA', borderColor: '#A9C7A1' }}>
                <p className="text-xs mb-1" style={{ color: '#1A3423' }}>Faturamento Mensal</p>
                <p className="text-lg font-bold" style={{ color: '#1A3423' }}>R$ 17.550,00</p>
              </div>
              <div className="p-4 rounded-2xl border-2" style={{ backgroundColor: '#A9C7A1', borderColor: '#1A3423' }}>
                <p className="text-xs mb-1 text-white">Saldo Líquido</p>
                <p className="text-lg font-bold text-white">R$ 6.050,00</p>
              </div>
            </div>

            {/* Cash Flow Chart */}
            <div className="bg-white p-6 rounded-2xl shadow-sm border-2" style={{ borderColor: '#A9C7A1' }}>
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 rounded-full flex items-center justify-center" style={{ backgroundColor: '#E4F8CA' }}>
                    <span className="text-sm font-bold" style={{ color: '#1A3423' }}>$</span>
                  </div>
                  <div>
                    <p className="text-sm font-medium" style={{ color: '#1A3423' }}>Fluxo de Caixa</p>
                    <p className="text-xs" style={{ color: '#1A3423' }}>Receitas por Tipo</p>
                  </div>
                </div>
                <div className="text-right">
                  <p className="text-sm font-medium" style={{ color: '#1A3423' }}>+18% este mês</p>
                  <p className="text-xs" style={{ color: '#1A3423' }}>Margem de Lucro: 65%</p>
                </div>
              </div>
              
              {/* Mock Chart Bars */}
              <div className="flex items-end justify-between gap-2 h-20">
                {[60, 70, 85, 75, 90, 80, 85].map((height, index) => (
                  <div
                    key={index}
                    className="rounded-t-lg flex-1"
                    style={{ 
                      height: `${height}%`,
                      backgroundColor: index % 2 === 0 ? '#1A3423' : '#A9C7A1'
                    }}
                  ></div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Right side - Modern login form */}
      <div className="flex-1 flex items-center justify-center p-8 bg-white">
        <div className="w-full max-w-md">
          {/* Header */}
          <div className="text-center mb-8">
            <h2 className="text-3xl font-bold text-gray-900 mb-2" style={{ fontFamily: 'Montserrat, sans-serif' }}>
              Entre na sua conta
            </h2>
            <p className="text-gray-600" style={{ fontFamily: 'Montserrat, sans-serif' }}>
              Bem-vindo de volta! Faça login para continuar.
            </p>
          </div>

          {/* Social login */}
          <div className="mb-6">
            <Button 
              type="button" 
              variant="outline" 
              className="w-full py-3 border-2 hover:bg-gray-50 transition-colors" 
              onClick={handleGoogleSignIn}
              disabled={isLoading}
              style={{ fontFamily: 'Montserrat, sans-serif' }}
            >
              <Chrome className="mr-3 h-5 w-5" />
              Continuar com Google
            </Button>
          </div>

          {/* Divider */}
          <div className="relative mb-6">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-gray-300"></div>
            </div>
            <div className="relative flex justify-center text-sm">
              <span className="px-4 bg-white text-gray-500" style={{ fontFamily: 'Montserrat, sans-serif' }}>
                Ou continue com email
              </span>
            </div>
          </div>

          {/* Form */}
          <form onSubmit={handleSubmit} className="space-y-5">
            <div>
              <Label htmlFor="email" className="block text-sm font-semibold text-gray-700 mb-2" style={{ fontFamily: 'Montserrat, sans-serif' }}>
                Email
              </Label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
                <Input
                  id="email"
                  type="email"
                  placeholder="seu@email.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="pl-11 py-3 border-2 border-gray-200 rounded-xl focus:border-primary focus:ring-0 bg-gray-50 transition-colors"
                  style={{ fontFamily: 'Montserrat, sans-serif' }}
                  required
                />
              </div>
            </div>

            <div>
              <Label htmlFor="password" className="block text-sm font-semibold text-gray-700 mb-2" style={{ fontFamily: 'Montserrat, sans-serif' }}>
                Senha
              </Label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
                <Input
                  id="password"
                  type={showPassword ? "text" : "password"}
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="pl-11 pr-11 py-3 border-2 border-gray-200 rounded-xl focus:border-primary focus:ring-0 bg-gray-50 transition-colors"
                  style={{ fontFamily: 'Montserrat, sans-serif' }}
                  required
                />
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  className="absolute right-2 top-1/2 transform -translate-y-1/2 h-8 w-8 p-0 hover:bg-transparent"
                  onClick={() => setShowPassword(!showPassword)}
                >
                  {showPassword ? <EyeOff className="h-4 w-4 text-gray-400" /> : <Eye className="h-4 w-4 text-gray-400" />}
                </Button>
              </div>
            </div>
            
            <div className="flex justify-end">
              <Button
                type="button"
                variant="link"
                className="p-0 text-sm text-primary hover:text-primary/80"
                onClick={() => navigate("/forgot-password")}
                style={{ fontFamily: 'Montserrat, sans-serif' }}
              >
                Esqueceu sua senha?
              </Button>
            </div>

            <Button 
              type="submit" 
              className="w-full py-3 text-white font-semibold rounded-xl shadow-lg transition-all duration-200 hover:shadow-xl"
              style={{ fontFamily: 'Montserrat, sans-serif', backgroundColor: '#1A3423' }}
              disabled={isLoading}
            >
              {isLoading ? (
                <div className="flex items-center justify-center">
                  <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white mr-2"></div>
                  Carregando...
                </div>
              ) : (
                "Entrar"
              )}
            </Button>
          </form>

          {/* Signup link */}
          <div className="text-center mt-6">
            <p className="text-sm text-gray-600" style={{ fontFamily: 'Montserrat, sans-serif' }}>
              Não tem uma conta?{' '}
              <Button
                type="button"
                variant="link"
                className="p-0 text-primary hover:text-primary/80 font-semibold"
                onClick={() => setMode('signup')}
                style={{ fontFamily: 'Montserrat, sans-serif' }}
              >
                Criar conta
              </Button>
            </p>
          </div>

          {/* Footer links */}
          <div className="mt-8 space-y-4">
            {/* Privacy policy */}
            <div className="text-center">
              <Link 
                to="/politica-de-privacidade" 
                className="text-xs text-gray-500 hover:text-primary transition-colors"
                style={{ fontFamily: 'Montserrat, sans-serif' }}
              >
                Política de Privacidade
              </Link>
            </div>

          </div>
        </div>
      </div>
    </div>
  );
}