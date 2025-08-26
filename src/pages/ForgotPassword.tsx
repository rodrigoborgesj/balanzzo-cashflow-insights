import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useNavigate, Link } from "react-router-dom";
import { useToast } from "@/hooks/use-toast";
import { Mail, Building2, ArrowLeft } from "lucide-react";
import { useAuth } from "@/hooks/useAuth";

export default function ForgotPassword() {
  const [email, setEmail] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [emailSent, setEmailSent] = useState(false);
  const navigate = useNavigate();
  const { toast } = useToast();
  const { resetPassword } = useAuth();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!email) {
      toast({
        title: "Campo obrigatório",
        description: "Digite seu endereço de email.",
        variant: "destructive",
      });
      return;
    }

    setIsLoading(true);

    try {
      const { error } = await resetPassword(email);
      
      if (error) {
        toast({
          title: "Erro ao enviar email",
          description: error.message,
          variant: "destructive",
        });
        return;
      }

      setEmailSent(true);
      toast({
        title: "Email enviado!",
        description: "Verifique sua caixa de entrada para redefinir sua senha.",
      });
      
    } catch (error: any) {
      toast({
        title: "Erro ao enviar email",
        description: error.message || "Erro inesperado",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  if (emailSent) {
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
              Email Enviado!
            </h2>
            <p className="text-muted-foreground">
              Verifique sua caixa de entrada e spam
            </p>
          </div>

          {/* Success Message */}
          <Card className="bg-card/80 backdrop-blur-sm border-border/50 shadow-lg">
            <CardContent className="p-6 text-center space-y-4">
              <div className="p-4 bg-green-50 rounded-lg border border-green-200">
                <Mail className="h-8 w-8 text-green-600 mx-auto mb-2" />
                <p className="text-green-800 font-medium">
                  Instruções enviadas para:
                </p>
                <p className="text-green-700 text-sm mt-1">
                  {email}
                </p>
              </div>
              
              <div className="space-y-2 text-sm text-muted-foreground">
                <p>
                  Clique no link recebido por email para redefinir sua senha.
                </p>
                <p>
                  O link expira em 1 hora por motivos de segurança.
                </p>
              </div>

              <div className="space-y-3">
                <Button
                  variant="outline"
                  className="w-full"
                  onClick={() => setEmailSent(false)}
                >
                  Enviar novamente
                </Button>
                
                <Button
                  variant="ghost"
                  className="w-full"
                  onClick={() => navigate("/login")}
                >
                  <ArrowLeft className="h-4 w-4 mr-2" />
                  Voltar ao login
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

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
            Esqueceu sua senha?
          </h2>
          <p className="text-muted-foreground">
            Digite seu email para receber as instruções
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

              <Button type="submit" className="w-full" disabled={isLoading}>
                {isLoading ? "Enviando..." : "Enviar instruções"}
              </Button>
            </form>

            <div className="text-center mt-4">
              <p className="text-sm text-muted-foreground">
                Lembrou da senha?
                <Button
                  type="button"
                  variant="link"
                  className="p-0 ml-1"
                  onClick={() => navigate("/login")}
                >
                  Fazer login
                </Button>
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}