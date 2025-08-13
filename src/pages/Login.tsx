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

  useEffect(() => {
    console.log('Login useEffect - isAuthenticated:', isAuthenticated, 'hasProfile:', hasProfile, 'authLoading:', authLoading, 'profileLoading:', profileLoading);
    
    // Redirect authenticated users to dashboard, regardless of profile completion
    if (!authLoading && isAuthenticated) {
      console.log('User is authenticated, redirecting to dashboard');
      navigate("/", { replace: true });
    }
  }, [isAuthenticated, authLoading, navigate]);

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
      {/* Left side - Modern brand section with gradient */}
      <div className="flex-1 relative bg-gradient-to-br from-primary via-primary to-secondary flex flex-col justify-center items-center text-white p-12 overflow-hidden">
        {/* Background pattern */}
        <div className="absolute inset-0 opacity-10">
          <div className="absolute top-20 left-20 w-32 h-32 bg-white rounded-full blur-3xl"></div>
          <div className="absolute bottom-32 right-16 w-48 h-48 bg-white rounded-full blur-3xl"></div>
          <div className="absolute top-1/2 left-1/3 w-24 h-24 bg-white rounded-full blur-2xl"></div>
        </div>
        
        {/* Brand content */}
        <div className="relative z-10 text-center max-w-md">
          <div className="mb-8">
            <h1 className="text-4xl font-bold mb-4" style={{ fontFamily: 'Montserrat, sans-serif' }}>
              BALANZZO
            </h1>
            <h2 className="text-2xl font-semibold mb-6" style={{ fontFamily: 'Montserrat, sans-serif' }}>
              Simplicidade que funciona
            </h2>
            <p className="text-lg opacity-90 leading-relaxed" style={{ fontFamily: 'Montserrat, sans-serif' }}>
              Para nano e microempresas: gestão financeira sem planilhas complicadas, com simplicidade que funciona.
            </p>
          </div>
          
          {/* Modern feature preview */}
          <div className="bg-white/10 backdrop-blur-sm rounded-2xl p-6 border border-white/20">
            <h3 className="text-lg font-semibold mb-4" style={{ fontFamily: 'Montserrat, sans-serif' }}>
              Principais funcionalidades
            </h3>
            <div className="grid grid-cols-1 gap-3">
              <div className="flex items-center space-x-3 p-3 bg-white/10 rounded-lg">
                <div className="w-3 h-3 bg-white rounded-full"></div>
                <span className="text-sm font-medium">DRE Automatizada</span>
              </div>
              <div className="flex items-center space-x-3 p-3 bg-white/10 rounded-lg">
                <div className="w-3 h-3 bg-white rounded-full"></div>
                <span className="text-sm font-medium">Fluxo de Caixa</span>
              </div>
              <div className="flex items-center space-x-3 p-3 bg-white/10 rounded-lg">
                <div className="w-3 h-3 bg-white rounded-full"></div>
                <span className="text-sm font-medium">Conciliação Bancária</span>
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
              className="w-full py-3 bg-gradient-to-r from-primary to-secondary hover:from-primary/90 hover:to-secondary/90 text-white font-semibold rounded-xl shadow-lg transition-all duration-200 hover:shadow-xl"
              style={{ fontFamily: 'Montserrat, sans-serif' }}
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