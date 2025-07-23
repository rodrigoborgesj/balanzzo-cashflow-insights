import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { Eye, EyeOff, Mail, Chrome } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/hooks/useAuth";
import { useProfile, ProfileData } from "@/hooks/useProfile";
import { Link } from "react-router-dom";

const revenueRanges = [
  "Até R$ 360.000/ano (MEI)",
  "R$ 360.001 a R$ 4.800.000/ano (Micro)",
  "R$ 4.800.001 a R$ 300.000.000/ano (Pequena)",
  "Acima de R$ 300.000.000/ano (Média/Grande)"
];

const states = [
  "AC", "AL", "AP", "AM", "BA", "CE", "DF", "ES", "GO", "MA",
  "MT", "MS", "MG", "PA", "PB", "PR", "PE", "PI", "RJ", "RN",
  "RS", "RO", "RR", "SC", "SP", "SE", "TO"
];

const signupSchema = z.object({
  email: z.string().email("Email inválido"),
  password: z.string().min(6, "Senha deve ter pelo menos 6 caracteres"),
  full_name: z.string().min(2, "Nome completo é obrigatório"),
  phone: z.string().min(10, "Telefone deve ter pelo menos 10 dígitos"),
  position: z.string().min(2, "Cargo é obrigatório"),
  company_name: z.string().min(2, "Nome da empresa é obrigatório"),
  cnpj: z.string().min(14, "CNPJ deve ter 14 dígitos"),
  revenue_range: z.string().min(1, "Selecione uma faixa de faturamento"),
  address_street: z.string().min(2, "Endereço é obrigatório"),
  address_number: z.string().min(1, "Número é obrigatório"),
  address_complement: z.string().optional(),
  address_neighborhood: z.string().min(2, "Bairro é obrigatório"),
  address_city: z.string().min(2, "Cidade é obrigatória"),
  address_state: z.string().min(2, "Estado é obrigatório"),
  address_zip_code: z.string().min(8, "CEP deve ter 8 dígitos"),
});

type SignupFormData = z.infer<typeof signupSchema>;

interface SignupFormProps {
  onBack: () => void;
}

export function SignupForm({ onBack }: SignupFormProps) {
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [acceptedPrivacyPolicy, setAcceptedPrivacyPolicy] = useState(false);
  const { toast } = useToast();
  const { signUp, signInWithGoogle } = useAuth();
  const { createProfile } = useProfile();

  const form = useForm<SignupFormData>({
    resolver: zodResolver(signupSchema),
    defaultValues: {
      email: "",
      password: "",
      full_name: "",
      phone: "",
      position: "",
      company_name: "",
      cnpj: "",
      revenue_range: "",
      address_street: "",
      address_number: "",
      address_complement: "",
      address_neighborhood: "",
      address_city: "",
      address_state: "",
      address_zip_code: "",
    },
  });

  const onSubmit = async (data: SignupFormData) => {
    if (!acceptedPrivacyPolicy) {
      toast({
        title: "Política de Privacidade",
        description: "Você deve aceitar a Política de Privacidade para continuar.",
        variant: "destructive",
      });
      return;
    }

    setIsLoading(true);
    try {
      const { error } = await signUp(data.email, data.password);
      
      if (error) {
        toast({
          title: "Erro no cadastro",
          description: error.message,
          variant: "destructive",
        });
        return;
      }

      // Store profile data in localStorage to be used after email confirmation
      const profileData: ProfileData = {
        full_name: data.full_name,
        phone: data.phone,
        position: data.position,
        company_name: data.company_name,
        cnpj: data.cnpj,
        revenue_range: data.revenue_range,
        address_street: data.address_street,
        address_number: data.address_number,
        address_complement: data.address_complement,
        address_neighborhood: data.address_neighborhood,
        address_city: data.address_city,
        address_state: data.address_state,
        address_zip_code: data.address_zip_code,
      };
      
      localStorage.setItem('pendingProfileData', JSON.stringify(profileData));

      toast({
        title: "Conta criada com sucesso!",
        description: "Verifique seu email para confirmar a conta e depois faça login.",
      });

      // Redireciona para tela de login após cadastro bem-sucedido
      onBack();
    } catch (error: any) {
      toast({
        title: "Erro no cadastro",
        description: error.message || "Erro inesperado",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleGoogleSignup = async () => {
    setIsLoading(true);
    try {
      const { error } = await signInWithGoogle();
      
      if (error) {
        toast({
          title: "Erro no cadastro",
          description: error.message,
          variant: "destructive",
        });
      }
    } catch (error: any) {
      toast({
        title: "Erro no cadastro",
        description: error.message || "Erro inesperado",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Card className="w-full max-w-2xl mx-auto">
      <CardHeader className="text-center">
        <CardTitle className="text-2xl font-bold">Criar Conta</CardTitle>
        <CardDescription>
          Preencha seus dados para criar sua conta
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="space-y-4">
          <Button 
            type="button" 
            variant="outline" 
            className="w-full" 
            onClick={handleGoogleSignup}
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
                Ou cadastre-se com email
              </span>
            </div>
          </div>
        </div>

        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
          {/* Dados de Login */}
          <div className="space-y-4">
            <h3 className="text-lg font-semibold">Dados de Acesso</h3>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="email">Email *</Label>
                <div className="relative">
                  <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
                  <Input
                    id="email"
                    type="email"
                    className="pl-10"
                    {...form.register("email")}
                  />
                </div>
                {form.formState.errors.email && (
                  <p className="text-destructive text-sm">{form.formState.errors.email.message}</p>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="password">Senha *</Label>
                <div className="relative">
                  <Input
                    id="password"
                    type={showPassword ? "text" : "password"}
                    className="pr-10"
                    {...form.register("password")}
                  />
                  <button
                    type="button"
                    className="absolute right-3 top-1/2 transform -translate-y-1/2 text-muted-foreground hover:text-foreground"
                    onClick={() => setShowPassword(!showPassword)}
                  >
                    {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </button>
                </div>
                {form.formState.errors.password && (
                  <p className="text-destructive text-sm">{form.formState.errors.password.message}</p>
                )}
              </div>
            </div>
          </div>

          {/* Dados Pessoais */}
          <div className="space-y-4">
            <h3 className="text-lg font-semibold">Dados Pessoais</h3>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="full_name">Nome Completo *</Label>
                <Input
                  id="full_name"
                  {...form.register("full_name")}
                />
                {form.formState.errors.full_name && (
                  <p className="text-destructive text-sm">{form.formState.errors.full_name.message}</p>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="phone">Telefone *</Label>
                <Input
                  id="phone"
                  placeholder="(11) 99999-9999"
                  {...form.register("phone")}
                />
                {form.formState.errors.phone && (
                  <p className="text-destructive text-sm">{form.formState.errors.phone.message}</p>
                )}
              </div>

              <div className="space-y-2 md:col-span-2">
                <Label htmlFor="position">Cargo na Empresa *</Label>
                <Input
                  id="position"
                  placeholder="ex: CEO, Sócio, Gerente Financeiro"
                  {...form.register("position")}
                />
                {form.formState.errors.position && (
                  <p className="text-destructive text-sm">{form.formState.errors.position.message}</p>
                )}
              </div>
            </div>
          </div>

          {/* Dados da Empresa */}
          <div className="space-y-4">
            <h3 className="text-lg font-semibold">Dados da Empresa</h3>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="company_name">Nome da Empresa *</Label>
                <Input
                  id="company_name"
                  {...form.register("company_name")}
                />
                {form.formState.errors.company_name && (
                  <p className="text-destructive text-sm">{form.formState.errors.company_name.message}</p>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="cnpj">CNPJ *</Label>
                <Input
                  id="cnpj"
                  placeholder="00.000.000/0000-00"
                  {...form.register("cnpj")}
                />
                {form.formState.errors.cnpj && (
                  <p className="text-destructive text-sm">{form.formState.errors.cnpj.message}</p>
                )}
              </div>

              <div className="space-y-2 md:col-span-2">
                <Label htmlFor="revenue_range">Faixa de Faturamento Anual *</Label>
                <Select onValueChange={(value) => form.setValue("revenue_range", value)}>
                  <SelectTrigger>
                    <SelectValue placeholder="Selecione a faixa de faturamento" />
                  </SelectTrigger>
                  <SelectContent>
                    {revenueRanges.map((range) => (
                      <SelectItem key={range} value={range}>
                        {range}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                {form.formState.errors.revenue_range && (
                  <p className="text-destructive text-sm">{form.formState.errors.revenue_range.message}</p>
                )}
              </div>
            </div>
          </div>

          {/* Endereço */}
          <div className="space-y-4">
            <h3 className="text-lg font-semibold">Endereço da Empresa</h3>
            
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="space-y-2 md:col-span-2">
                <Label htmlFor="address_street">Rua/Avenida *</Label>
                <Input
                  id="address_street"
                  {...form.register("address_street")}
                />
                {form.formState.errors.address_street && (
                  <p className="text-destructive text-sm">{form.formState.errors.address_street.message}</p>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="address_number">Número *</Label>
                <Input
                  id="address_number"
                  {...form.register("address_number")}
                />
                {form.formState.errors.address_number && (
                  <p className="text-destructive text-sm">{form.formState.errors.address_number.message}</p>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="address_complement">Complemento</Label>
                <Input
                  id="address_complement"
                  placeholder="Sala, andar..."
                  {...form.register("address_complement")}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="address_neighborhood">Bairro *</Label>
                <Input
                  id="address_neighborhood"
                  {...form.register("address_neighborhood")}
                />
                {form.formState.errors.address_neighborhood && (
                  <p className="text-destructive text-sm">{form.formState.errors.address_neighborhood.message}</p>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="address_city">Cidade *</Label>
                <Input
                  id="address_city"
                  {...form.register("address_city")}
                />
                {form.formState.errors.address_city && (
                  <p className="text-destructive text-sm">{form.formState.errors.address_city.message}</p>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="address_state">Estado *</Label>
                <Select onValueChange={(value) => form.setValue("address_state", value)}>
                  <SelectTrigger>
                    <SelectValue placeholder="UF" />
                  </SelectTrigger>
                  <SelectContent>
                    {states.map((state) => (
                      <SelectItem key={state} value={state}>
                        {state}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                {form.formState.errors.address_state && (
                  <p className="text-destructive text-sm">{form.formState.errors.address_state.message}</p>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="address_zip_code">CEP *</Label>
                <Input
                  id="address_zip_code"
                  placeholder="00000-000"
                  {...form.register("address_zip_code")}
                />
                {form.formState.errors.address_zip_code && (
                  <p className="text-destructive text-sm">{form.formState.errors.address_zip_code.message}</p>
                )}
              </div>
            </div>
          </div>

          <div className="flex items-center space-x-2 mb-6">
            <Checkbox 
              id="privacy-policy-signup" 
              checked={acceptedPrivacyPolicy}
              onCheckedChange={(checked) => setAcceptedPrivacyPolicy(checked === true)}
            />
            <Label htmlFor="privacy-policy-signup" className="text-sm text-muted-foreground leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70">
              Li e aceito a{" "}
              <Link 
                to="/politica-de-privacidade" 
                className="text-primary hover:underline"
                target="_blank"
                rel="noopener noreferrer"
              >
                Política de Privacidade
              </Link>
              {" "}da Balanzzo.
            </Label>
          </div>

          <div className="flex gap-4">
            <Button type="button" variant="outline" onClick={onBack} className="flex-1">
              Voltar
            </Button>
            <Button type="submit" disabled={isLoading || !acceptedPrivacyPolicy} className="flex-1">
              {isLoading ? "Criando conta..." : "Criar Conta"}
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  );
}