import { useState, useEffect } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { useNavigate, Link, useSearchParams } from "react-router-dom";
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
  const [searchParams] = useSearchParams();
  const { toast } = useToast();
  const { signIn, signInWithGoogle, isAuthenticated, user, isLoading: authLoading } = useSecureAuth();
  const { hasActiveSubscription, isLoading: subLoading } = useSubscription();

  useEffect(() => {
    console.log('Login useEffect - isAuthenticated:', isAuthenticated, 'authLoading:', authLoading, 'hasActiveSubscription:', hasActiveSubscription);
    
    // Wait for both auth and subscription checks
    if (!authLoading && !subLoading && isAuthenticated) {
      const redirectTo = searchParams.get('redirect');
      const planId = searchParams.get('plan');
      
      // If explicit redirect, use it
      if (redirectTo) {
        navigate(redirectTo, { replace: true });
        return;
      }
      
      // Check if user has active subscription
      if (!hasActiveSubscription) {
        console.log('User authenticated but no active subscription, redirecting to checkout');
        const checkoutUrl = planId ? `/checkout?plan=${planId}` : '/checkout';
        navigate(checkoutUrl, { replace: true });
      } else {
        // Redirect to module selector to choose between company/personal
        console.log('User is authenticated with active subscription, redirecting to module selector');
        navigate('/select-module', { replace: true });
      }
    }
  }, [isAuthenticated, authLoading, hasActiveSubscription, subLoading, navigate, searchParams]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    setIsLoading(true);

    try {
      const { error } = await signIn(email, password);
      
      // Error handling is now done in useSecureAuth with Portuguese messages
      if (error) {
        return;
      }

      toast({
        title: "Login realizado com sucesso!",
        description: "Redirecionando para o painel...",
      });
      
      // Navigation will be handled by useEffect
    } catch (error: any) {
      toast({
        title: "Erro no login",
        description: "Erro inesperado ao realizar login. Tente novamente.",
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
          title: "Erro no login com Google",
          description: "Não foi possível realizar login com Google. Tente novamente.",
          variant: "destructive",
        });
      }
    } catch (error: any) {
      toast({
        title: "Erro no login",
        description: "Erro inesperado ao realizar login com Google. Tente novamente.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  // Show loading if still checking auth or subscription state
  if (authLoading || subLoading) {
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
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 flex">
      
      {/* Left side - Hero Dashboard Preview */}
      <div className="hidden lg:flex flex-1 relative overflow-hidden p-12" style={{ backgroundColor: '#1a3423' }}>
        
        {/* Background pattern */}
        <div className="absolute inset-0 bg-gradient-to-r from-primary/10 to-transparent"></div>
        <div 
          className="absolute inset-0 opacity-30"
          style={{
            backgroundImage: `url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%239C92AC' fill-opacity='0.05'%3E%3Ccircle cx='30' cy='30' r='2'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")`
          }}
        ></div>
        
        {/* Company branding */}
        <div className="relative z-10 flex flex-col justify-between w-full">
          <div className="flex items-center gap-4">
            <img 
              src="/lovable-uploads/6335b26d-ecb0-4039-ad1c-b4fd6bed66f1.png" 
              alt="Balanzzo"
              className="w-12 h-12"
            />
            <h1 className="text-3xl font-bold text-white tracking-tight">
              Balanzzo
            </h1>
          </div>

          {/* Main dashboard preview */}
          <div className="flex-1 flex items-center justify-center">
            <div className="w-full max-w-md">
              
              {/* Mock dashboard window */}
              <div className="bg-white rounded-2xl shadow-2xl overflow-hidden">
                
                {/* Header with navigation */}
                <div className="bg-primary p-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-lg bg-white/20 flex items-center justify-center">
                        <div className="w-4 h-4 bg-white rounded-sm"></div>
                      </div>
                      <span className="text-white font-medium text-sm">Dashboard</span>
                    </div>
                    <div className="flex gap-2">
                      <div className="w-2 h-2 rounded-full bg-white/30"></div>
                      <div className="w-2 h-2 rounded-full bg-white/30"></div>
                      <div className="w-2 h-2 rounded-full bg-white/30"></div>
                    </div>
                  </div>
                </div>

                {/* Content area */}
                <div className="p-6">
                  
                  {/* Stats cards */}
                  <div className="grid grid-cols-2 gap-3 mb-6">
                    <div className="bg-gradient-to-r from-primary/10 to-primary/5 rounded-lg p-3">
                      <div className="text-xs text-gray-600 mb-1">Receita</div>
                      <div className="text-lg font-bold text-primary">R$ 12.480</div>
                      <div className="text-xs text-green-600">+8.2%</div>
                    </div>
                    <div className="bg-gradient-to-r from-accent/20 to-accent/10 rounded-lg p-3">
                      <div className="text-xs text-gray-600 mb-1">Despesas</div>
                      <div className="text-lg font-bold text-gray-800">R$ 8.320</div>
                      <div className="text-xs text-red-600">-2.1%</div>
                    </div>
                  </div>

                  {/* Chart area */}
                  <div className="space-y-3">
                    <div className="text-sm font-medium text-gray-700">Fluxo de Caixa</div>
                    <div className="h-24 flex items-end justify-between gap-1">
                      {[0.6, 0.8, 0.4, 0.9, 0.7, 0.5, 0.8, 0.6, 0.9, 0.7, 0.8, 0.9].map((height, index) => (
                        <div
                          key={index}
                          className="flex-1 rounded-t-sm bg-gradient-to-t from-primary to-primary/60"
                          style={{ height: `${height * 100}%` }}
                        />
                      ))}
                    </div>
                    <div className="flex justify-between text-xs text-gray-500">
                      <span>Jan</span>
                      <span>Fev</span>
                      <span>Mar</span>
                      <span>Abr</span>
                      <span>Mai</span>
                      <span>Jun</span>
                    </div>
                  </div>

                  {/* Bottom indicators */}
                  <div className="flex justify-center gap-2 mt-6">
                    <div className="w-16 h-2 bg-primary rounded-full"></div>
                    <div className="w-8 h-2 bg-gray-200 rounded-full"></div>
                    <div className="w-8 h-2 bg-gray-200 rounded-full"></div>
                  </div>
                  
                </div>
              </div>
            </div>
          </div>

        </div>
      </div>

      {/* Right side - Login form */}
      <div className="flex-1 flex items-center justify-center p-8 lg:p-12">
        <div className="w-full max-w-md">
          
          {/* Logo for mobile */}
          <div className="lg:hidden flex items-center justify-center gap-4 mb-8">
            <img 
              src="/lovable-uploads/6335b26d-ecb0-4039-ad1c-b4fd6bed66f1.png" 
              alt="Balanzzo" 
              className="w-10 h-10"
            />
            <h1 className="text-2xl font-bold text-primary">Balanzzo</h1>
          </div>

          {/* Header */}
          <div className="text-center mb-8">
            <h2 className="text-3xl font-bold text-gray-900 mb-3">
              Entrar na sua conta
            </h2>
            <p className="text-gray-600">
              Bem-vindo de volta! Entre para continuar.
            </p>
          </div>

          {/* Form card */}
          <Card className="border-0 shadow-xl bg-white/80 backdrop-blur-sm">
            <CardContent className="p-8">
              
              {/* Google login */}
              <Button 
                type="button" 
                variant="outline" 
                className="w-full mb-6 py-3 border-2 hover:bg-gray-50 transition-all duration-200" 
                onClick={handleGoogleSignIn}
                disabled={isLoading}
              >
                <Chrome className="mr-3 h-5 w-5" />
                Entrar com Google
              </Button>

              {/* Divider */}
              <div className="relative mb-6">
                <div className="absolute inset-0 flex items-center">
                  <Separator className="w-full" />
                </div>
                <div className="relative flex justify-center text-sm">
                  <span className="px-4 bg-white text-gray-500">
                    ou continue com email
                  </span>
                </div>
              </div>

              {/* Form */}
              <form onSubmit={handleSubmit} className="space-y-6">
                
                <div className="space-y-2">
                  <Label htmlFor="email" className="text-sm font-medium text-gray-700">
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
                      className="pl-11 py-3 border-0 bg-gray-50 rounded-lg focus:ring-2 focus:ring-primary/20 focus:bg-white transition-all duration-200"
                      required
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="password" className="text-sm font-medium text-gray-700">
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
                      className="pl-11 pr-11 py-3 border-0 bg-gray-50 rounded-lg focus:ring-2 focus:ring-primary/20 focus:bg-white transition-all duration-200"
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
                    className="p-0 text-sm text-primary hover:text-primary/80 font-medium"
                    onClick={() => navigate("/forgot-password")}
                  >
                    Esqueceu sua senha?
                  </Button>
                </div>

                <Button 
                  type="submit" 
                  className="w-full py-3 bg-primary hover:bg-primary/90 text-white font-medium rounded-lg shadow-lg hover:shadow-xl transition-all duration-200"
                  disabled={isLoading}
                >
                  {isLoading ? (
                    <div className="flex items-center justify-center">
                      <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white mr-2"></div>
                      Entrando...
                    </div>
                  ) : (
                    "Entrar"
                  )}
                </Button>
              </form>

              {/* Signup link */}
              <div className="text-center mt-6">
                <p className="text-sm text-gray-600">
                  Não tem uma conta?{' '}
                  <Button
                    type="button"
                    variant="link"
                    className="p-0 text-primary hover:text-primary/80 font-medium"
                    onClick={() => setMode('signup')}
                  >
                    Criar conta
                  </Button>
                </p>
              </div>
            </CardContent>
          </Card>

          {/* Footer links */}
          <div className="mt-8 flex flex-col sm:flex-row items-center justify-center gap-4 text-sm text-gray-500">
            <Link 
              to="/politica-de-privacidade" 
              className="hover:text-primary transition-colors"
            >
              Política de Privacidade
            </Link>
            <span className="hidden sm:inline">•</span>
            <Link 
              to="/politica-de-cancelamento" 
              className="hover:text-primary transition-colors"
            >
              Política de Cancelamento
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}