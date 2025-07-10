import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { useNavigate } from "react-router-dom";
import { useToast } from "@/hooks/use-toast";
import { Lock, Mail, Eye, EyeOff, Building2 } from "lucide-react";

export default function Login() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [isLogin, setIsLogin] = useState(true);
  const [isLoading, setIsLoading] = useState(false);
  const navigate = useNavigate();
  const { toast } = useToast();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    // Simular autenticação
    setTimeout(() => {
      if (email && password) {
        localStorage.setItem("isAuthenticated", "true");
        localStorage.setItem("userEmail", email);
        toast({
          title: isLogin ? "Login realizado com sucesso!" : "Conta criada com sucesso!",
          description: `Bem-vindo ao Balanzzo${isLogin ? " de volta" : ""}!`,
        });
        navigate("/");
      } else {
        toast({
          title: "Erro na autenticação",
          description: "Por favor, preencha todos os campos.",
          variant: "destructive",
        });
      }
      setIsLoading(false);
    }, 1000);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-background to-accent/5 flex items-center justify-center p-4">
      <div className="w-full max-w-md space-y-6">
        {/* Header */}
        <div className="text-center space-y-2">
          <div className="flex items-center justify-center gap-2 mb-4">
            <div className="p-3 bg-primary rounded-xl">
              <Building2 className="h-8 w-8 text-primary-foreground" />
            </div>
            <h1 className="text-3xl font-bold text-foreground">Balanzzo</h1>
          </div>
          <h2 className="text-xl font-semibold text-foreground">
            {isLogin ? "Entre na sua conta" : "Crie sua conta"}
          </h2>
          <p className="text-muted-foreground">
            {isLogin 
              ? "Gerencie suas finanças de forma inteligente" 
              : "Comece a organizar suas finanças hoje"
            }
          </p>
        </div>

        {/* Form */}
        <Card className="bg-card/80 backdrop-blur-sm border-border/50 shadow-lg">
          <CardContent className="p-6">
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="email">Email</Label>
                <div className="relative">
                  <Mail className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                  <Input
                    id="email"
                    type="email"
                    placeholder="seu@email.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="pl-10"
                    required
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="password">Senha</Label>
                <div className="relative">
                  <Lock className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                  <Input
                    id="password"
                    type={showPassword ? "text" : "password"}
                    placeholder="••••••••"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="pl-10 pr-10"
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

              <Button type="submit" className="w-full" disabled={isLoading}>
                {isLoading ? "Carregando..." : (isLogin ? "Entrar" : "Criar conta")}
              </Button>
            </form>

            <div className="mt-6">
              <Separator />
              <div className="text-center mt-4">
                <p className="text-sm text-muted-foreground">
                  {isLogin ? "Não tem uma conta?" : "Já tem uma conta?"}
                  <Button
                    type="button"
                    variant="link"
                    className="p-0 ml-1"
                    onClick={() => setIsLogin(!isLogin)}
                  >
                    {isLogin ? "Criar conta" : "Fazer login"}
                  </Button>
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

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
  );
}