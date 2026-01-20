import { useState, useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { Eye, EyeOff, Mail, Chrome, MapPin, User, Loader2 } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { useSecureAuth } from "@/hooks/useSecureAuth";
import { Link, useNavigate, useSearchParams } from "react-router-dom";
import { validatePasswordAsync } from "@/utils/passwordValidationAsync";
import { PasswordValidationDisplay } from "@/components/PasswordValidationDisplay";
import { PasswordValidationResult } from "@/utils/passwordValidation";
import { supabase } from "@/integrations/supabase/client";

const personalSignupSchema = z.object({
  email: z.string().email("Email inválido"),
  password: z.string().min(6, "Senha deve ter pelo menos 6 caracteres"),
  full_name: z.string().min(3, "Nome deve ter pelo menos 3 caracteres"),
  phone: z.string().min(10, "Telefone deve ter pelo menos 10 dígitos"),
  address_zip_code: z.string().min(8, "CEP inválido"),
  address_city: z.string().min(2, "Cidade obrigatória"),
  age: z.number().min(16, "Você precisa ter pelo menos 16 anos").max(120, "Idade inválida"),
});

type PersonalSignupFormData = z.infer<typeof personalSignupSchema>;

interface PersonalSignupFormProps {
  onBack: () => void;
}

export function PersonalSignupForm({ onBack }: PersonalSignupFormProps) {
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [isLoadingCep, setIsLoadingCep] = useState(false);
  const [acceptedPrivacyPolicy, setAcceptedPrivacyPolicy] = useState(false);
  const [passwordValidation, setPasswordValidation] = useState<PasswordValidationResult | null>(null);
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { toast } = useToast();
  const { signUp, signInWithGoogle } = useSecureAuth();
  
  // Get redirect URL and plan from query params
  const redirectTo = searchParams.get('redirect');
  const planId = searchParams.get('plan');

  const form = useForm<PersonalSignupFormData>({
    resolver: zodResolver(personalSignupSchema),
    defaultValues: {
      email: "",
      password: "",
      full_name: "",
      phone: "",
      address_zip_code: "",
      address_city: "",
      age: undefined,
    },
  });

  // Watch password field for real-time validation
  const password = form.watch("password");
  const fullName = form.watch("full_name");
  const zipCode = form.watch("address_zip_code");

  // Validate password in real-time with breach check
  useEffect(() => {
    if (password) {
      const timeoutId = setTimeout(async () => {
        try {
          const result = await validatePasswordAsync(password, { full_name: fullName });
          setPasswordValidation(result);
        } catch (error) {
          console.error('Error validating password:', error);
        }
      }, 500);

      return () => clearTimeout(timeoutId);
    } else {
      setPasswordValidation(null);
    }
  }, [password, fullName]);

  // Auto-fill city from CEP
  useEffect(() => {
    const fetchAddress = async () => {
      const cleanZip = zipCode?.replace(/\D/g, '');
      if (cleanZip?.length === 8) {
        setIsLoadingCep(true);
        try {
          const response = await fetch(`https://viacep.com.br/ws/${cleanZip}/json/`);
          const data = await response.json();
          if (!data.erro) {
            form.setValue('address_city', data.localidade || '');
          }
        } catch (error) {
          console.error('Error fetching CEP:', error);
        } finally {
          setIsLoadingCep(false);
        }
      }
    };

    fetchAddress();
  }, [zipCode, form]);

  const onSubmit = async (data: PersonalSignupFormData) => {
    if (!acceptedPrivacyPolicy) {
      toast({
        title: "Política de Privacidade",
        description: "Você deve aceitar a Política de Privacidade para continuar.",
        variant: "destructive",
      });
      return;
    }
    
    const isValid = await form.trigger();
    if (!isValid) {
      toast({
        title: "Erro de validação",
        description: "Por favor, preencha todos os campos obrigatórios corretamente.",
        variant: "destructive",
      });
      return;
    }

    setIsLoading(true);
    try {
      const { error } = await signUp(data.email, data.password, {
        full_name: data.full_name,
        phone: data.phone,
        address_zip_code: data.address_zip_code,
        address_city: data.address_city,
        age: data.age,
        signup_type: 'personal',
      });
      
      if (error) {
        toast({
          title: "Erro no cadastro",
          description: `Erro na criação da conta: ${error.message}`,
          variant: "destructive",
        });
        return;
      }

      // Check if user has free access before redirecting to checkout
      const { data: hasFreeAccessData } = await supabase
        .rpc('has_free_access', { user_email: data.email });
      
      const userHasFreeAccess = !!hasFreeAccessData;
      console.log('🆓 Personal Signup - Free access check for', data.email, ':', userHasFreeAccess);

      if (userHasFreeAccess) {
        toast({
          title: "Conta criada com sucesso!",
          description: "Você possui acesso gratuito! Redirecionando...",
        });
        
        setTimeout(() => {
          navigate('/select-module', { replace: true });
        }, 1500);
      } else {
        toast({
          title: "Conta criada com sucesso!",
          description: redirectTo ? "Você será redirecionado..." : "Verifique seu email para confirmar sua conta.",
        });

        setTimeout(() => {
          if (redirectTo) {
            navigate(redirectTo, { replace: true });
          } else if (planId) {
            navigate(`/checkout?plan=${planId}`, { replace: true });
          } else {
            // Default: go to personal landing page
            navigate('/pessoal', { replace: true });
          }
        }, 1500);
      }
    } catch (error: any) {
      toast({
        title: "Erro no cadastro",
        description: error.message || "Erro inesperado ao criar conta",
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
    <Card className="w-full max-w-md mx-auto">
      <CardHeader className="text-center">
        <div className="mx-auto mb-4 h-12 w-12 rounded-full bg-primary/10 flex items-center justify-center">
          <User className="h-6 w-6 text-primary" />
        </div>
        <CardTitle className="text-2xl font-bold">Criar Conta Pessoal</CardTitle>
        <CardDescription>
          Preencha seus dados para criar sua conta de finanças pessoais
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

        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
          {/* Email e Senha */}
          <div className="space-y-2">
            <Label htmlFor="email">Email *</Label>
            <div className="relative">
              <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
              <Input
                id="email"
                type="email"
                className="pl-10"
                placeholder="seu@email.com"
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
                placeholder="••••••••"
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
            
            {passwordValidation && (
              <div className="mt-2">
                <PasswordValidationDisplay rules={passwordValidation.rules} />
              </div>
            )}
          </div>

          {/* Nome Completo */}
          <div className="space-y-2">
            <Label htmlFor="full_name">Nome Completo *</Label>
            <Input
              id="full_name"
              placeholder="Seu nome completo"
              {...form.register("full_name")}
            />
            {form.formState.errors.full_name && (
              <p className="text-destructive text-sm">{form.formState.errors.full_name.message}</p>
            )}
          </div>

          {/* Celular e Idade */}
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="phone">Celular *</Label>
              <Input
                id="phone"
                placeholder="(11) 99999-9999"
                {...form.register("phone")}
              />
              {form.formState.errors.phone && (
                <p className="text-destructive text-sm">{form.formState.errors.phone.message}</p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="age">Idade *</Label>
              <Input
                id="age"
                type="number"
                placeholder="25"
                min={16}
                max={120}
                {...form.register("age", { valueAsNumber: true })}
              />
              {form.formState.errors.age && (
                <p className="text-destructive text-sm">{form.formState.errors.age.message}</p>
              )}
            </div>
          </div>

          {/* CEP e Cidade */}
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="address_zip_code" className="flex items-center gap-1">
                <MapPin className="h-3 w-3" />
                CEP *
              </Label>
              <div className="relative">
                <Input
                  id="address_zip_code"
                  placeholder="00000-000"
                  {...form.register("address_zip_code")}
                />
                {isLoadingCep && (
                  <Loader2 className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 animate-spin text-muted-foreground" />
                )}
              </div>
              {form.formState.errors.address_zip_code && (
                <p className="text-destructive text-sm">{form.formState.errors.address_zip_code.message}</p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="address_city">Cidade *</Label>
              <Input
                id="address_city"
                placeholder="Sua cidade"
                {...form.register("address_city")}
              />
              {form.formState.errors.address_city && (
                <p className="text-destructive text-sm">{form.formState.errors.address_city.message}</p>
              )}
            </div>
          </div>

          {/* Privacy Policy */}
          <div className="flex items-start space-x-2">
            <Checkbox
              id="privacy"
              checked={acceptedPrivacyPolicy}
              onCheckedChange={(checked) => setAcceptedPrivacyPolicy(checked as boolean)}
            />
            <label htmlFor="privacy" className="text-sm text-muted-foreground leading-tight">
              Li e aceito a{" "}
              <Link to="/politica-de-privacidade" className="text-primary hover:underline">
                Política de Privacidade
              </Link>{" "}
              da Balanzzo.
            </label>
          </div>

          {/* Buttons */}
          <div className="flex flex-col gap-3 pt-2">
            <Button 
              type="submit" 
              className="w-full"
              disabled={isLoading}
            >
              {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Criar Conta
            </Button>
            
            <Button
              type="button"
              variant="outline"
              className="w-full"
              onClick={onBack}
              disabled={isLoading}
            >
              Voltar
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  );
}
