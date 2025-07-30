import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useNavigate, useSearchParams } from "react-router-dom";
import { useToast } from "@/hooks/use-toast";
import { Lock, Eye, EyeOff, Building2, CheckCircle, XCircle } from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import { useProfile } from "@/hooks/useProfile";
import { validatePassword, checkPasswordHistory, savePasswordToHistory, PasswordValidationResult } from "@/utils/passwordValidation";

export default function ResetPassword() {
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [validation, setValidation] = useState<PasswordValidationResult | null>(null);
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const { toast } = useToast();
  const { updatePassword, user, isAuthenticated } = useAuth();
  const { profile } = useProfile();

  useEffect(() => {
    // Check if user is authenticated (came from password reset email)
    if (!isAuthenticated) {
      toast({
        title: "Acesso negado",
        description: "Link de redefinição de senha inválido ou expirado.",
        variant: "destructive",
      });
      navigate("/login");
    }
  }, [isAuthenticated, navigate, toast]);

  useEffect(() => {
    if (password) {
      const result = validatePassword(password, profile || undefined);
      setValidation(result);
    } else {
      setValidation(null);
    }
  }, [password, profile]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!password || !confirmPassword) {
      toast({
        title: "Campos obrigatórios",
        description: "Preencha todos os campos.",
        variant: "destructive",
      });
      return;
    }

    if (password !== confirmPassword) {
      toast({
        title: "Senhas não coincidem",
        description: "As senhas digitadas não são iguais.",
        variant: "destructive",
      });
      return;
    }

    if (!validation?.isValid) {
      toast({
        title: "Senha inválida",
        description: "A senha não atende aos requisitos de segurança.",
        variant: "destructive",
      });
      return;
    }

    if (!user?.id) {
      toast({
        title: "Erro",
        description: "Usuário não encontrado.",
        variant: "destructive",
      });
      return;
    }

    setIsLoading(true);

    try {
      // Check if password was used before
      const isPasswordUnique = await checkPasswordHistory(password, user.id);
      
      if (!isPasswordUnique) {
        toast({
          title: "Senha já utilizada",
          description: "Esta senha já foi utilizada anteriormente. Escolha uma senha diferente.",
          variant: "destructive",
        });
        setIsLoading(false);
        return;
      }

      const { error } = await updatePassword(password);
      
      if (error) {
        toast({
          title: "Erro ao redefinir senha",
          description: error.message,
          variant: "destructive",
        });
        return;
      }

      // Save password to history
      await savePasswordToHistory(password, user.id);

      toast({
        title: "Senha redefinida com sucesso!",
        description: "Sua senha foi alterada. Redirecionando...",
      });

      // Redirect to dashboard
      setTimeout(() => {
        navigate("/", { replace: true });
      }, 2000);
      
    } catch (error: any) {
      toast({
        title: "Erro ao redefinir senha",
        description: error.message || "Erro inesperado",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
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
            Redefinir Senha
          </h2>
          <p className="text-muted-foreground">
            Crie uma nova senha segura para sua conta
          </p>
        </div>

        {/* Form */}
        <Card className="bg-card/80 backdrop-blur-sm border-border/50 shadow-lg">
          <CardContent className="p-6">
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="password">Nova Senha</Label>
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

              <div className="space-y-2">
                <Label htmlFor="confirmPassword">Confirmar Nova Senha</Label>
                <div className="relative">
                  <Lock className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                  <Input
                    id="confirmPassword"
                    type={showConfirmPassword ? "text" : "password"}
                    placeholder="••••••••"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    className="pl-10 pr-10"
                    required
                  />
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    className="absolute right-1 top-1 h-8 w-8 p-0"
                    onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                  >
                    {showConfirmPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </Button>
                </div>
              </div>

              {validation && (
                <div className="space-y-3">
                  <Label className="text-sm font-medium">Requisitos da Senha:</Label>
                  <div className="space-y-2">
                    {validation.rules.map((rule, index) => (
                      <div key={index} className="flex items-center gap-2">
                        {rule.isValid ? (
                          <CheckCircle className="h-4 w-4 text-green-500" />
                        ) : (
                          <XCircle className="h-4 w-4 text-red-500" />
                        )}
                        <span className={`text-sm ${rule.isValid ? 'text-green-600' : 'text-red-600'}`}>
                          {rule.message}
                        </span>
                      </div>
                    ))}
                    <div className="flex items-center gap-2">
                      <XCircle className="h-4 w-4 text-muted-foreground" />
                      <span className="text-sm text-muted-foreground">
                        Não pode ser uma senha já utilizada anteriormente
                      </span>
                    </div>
                  </div>
                </div>
              )}

              <Button 
                type="submit" 
                className="w-full" 
                disabled={isLoading || !validation?.isValid || password !== confirmPassword}
              >
                {isLoading ? "Redefinindo..." : "Redefinir Senha"}
              </Button>
            </form>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}