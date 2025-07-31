import { useState, useEffect } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { useNavigate, Link } from "react-router-dom";
import { useToast } from "@/hooks/use-toast";
import { Lock, Mail, Eye, EyeOff, Chrome } from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
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
  const { signIn, signInWithGoogle, isAuthenticated, user, isLoading: authLoading } = useAuth();
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
    <div className="min-h-screen bg-background flex flex-col">
      {/* Balanzzo title at top-left */}
      <div className="p-8">
        <h1 
          className="text-foreground"
          style={{ 
            fontFamily: 'Montserrat, sans-serif',
            fontWeight: '700',
            fontSize: '22px'
          }}
        >
          Balanzzo
        </h1>
      </div>

      {/* Centered login form */}
      <div className="flex-1 flex items-center justify-center p-8">
        <div className="w-full max-w-md space-y-6">

          {/* Form */}
          <Card className="bg-card/80 backdrop-blur-sm border-border/50 shadow-lg">
            <CardContent className="p-6">
              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="email" style={{ fontFamily: 'Montserrat, sans-serif', fontWeight: '500' }}>
                    Email
                  </Label>
                  <div className="relative">
                    <Mail className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                    <Input
                      id="email"
                      type="email"
                      placeholder="seu@email.com"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      className="pl-10"
                      style={{ 
                        backgroundColor: '#E9E9E9',
                        borderRadius: '4px',
                        fontFamily: 'Montserrat, sans-serif',
                        fontWeight: '500',
                        fontSize: '16px'
                      }}
                      required
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="password" style={{ fontFamily: 'Montserrat, sans-serif', fontWeight: '500' }}>
                    Senha
                  </Label>
                  <div className="relative">
                    <Lock className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                    <Input
                      id="password"
                      type={showPassword ? "text" : "password"}
                      placeholder="••••••••"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      className="pl-10 pr-10"
                      style={{ 
                        backgroundColor: '#E9E9E9',
                        borderRadius: '4px',
                        fontFamily: 'Montserrat, sans-serif',
                        fontWeight: '500',
                        fontSize: '16px'
                      }}
                      required
                    />
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      className="absolute right-1 top-1 h-8 w-8 p-0"
                      onClick={() => setShowPassword(!showPassword)}
                    >
                      {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                    </Button>
                  </div>
                </div>
                
                <div className="flex justify-end">
                  <Button
                    type="button"
                    variant="link"
                    className="p-0 text-sm"
                    onClick={() => navigate("/forgot-password")}
                  >
                    Esqueceu sua senha?
                  </Button>
                </div>

                <Button 
                  type="submit" 
                  className="w-full text-white font-medium"
                  style={{ 
                    background: 'linear-gradient(90deg, #A6C39E 0%, #4F5D4B 100%)',
                    fontFamily: 'Montserrat, sans-serif'
                  }}
                  disabled={isLoading}
                >
                  {isLoading ? "Carregando..." : "Entrar"}
                </Button>
              </form>

              <div className="mt-6">
                <div className="space-y-4">
                  <Button 
                    type="button" 
                    variant="outline" 
                    className="w-full" 
                    onClick={handleGoogleSignIn}
                    disabled={isLoading}
                  >
                    <Chrome className="mr-2 h-4 w-4" />
                    Continuar com Google
                  </Button>
                  
                  <div className="relative">
                    <div className="absolute inset-0 flex items-center">
                      <Separator className="w-full" />
                    </div>
                    <div className="relative flex justify-center text-xs uppercase">
                      <span className="bg-background px-2 text-muted-foreground">
                        Ou
                      </span>
                    </div>
                  </div>
                </div>
                
                <div className="text-center mt-4">
                  <p className="text-sm text-muted-foreground">
                    Não tem uma conta?
                    <Button
                      type="button"
                      variant="link"
                      className="p-0 ml-1"
                      onClick={() => setMode('signup')}
                    >
                      Criar conta
                    </Button>
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Privacy policy notice - below login button */}
          <div className="text-center">
            <p className="text-xs text-muted-foreground">
              Ao continuar, você concorda com nossa{" "}
              <Link 
                to="/politica-de-privacidade" 
                className="underline text-muted-foreground hover:text-foreground"
                target="_blank"
                rel="noopener noreferrer"
              >
                Política de Privacidade
              </Link>
            </p>
          </div>

          {/* Demo info */}
          <Card className="bg-accent/10 border-accent/20">
            <CardContent className="p-4">
              <p className="text-sm text-muted-foreground text-center">
                <strong>Demo:</strong> Use qualquer email e senha para testar a plataforma
              </p>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}