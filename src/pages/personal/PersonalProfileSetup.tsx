import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Loader2, MapPin } from 'lucide-react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { usePersonalProfile, PersonalProfileInput } from '@/hooks/usePersonalProfile';
import { useAuth } from '@/hooks/useAuth';
import { useModule } from '@/contexts/ModuleContext';
import { toast } from 'sonner';

const profileSchema = z.object({
  full_name: z.string().min(3, 'Nome deve ter pelo menos 3 caracteres'),
  email: z.string().email('Email inválido'),
  phone: z.string().min(10, 'Telefone inválido'),
  address_zip_code: z.string().min(8, 'CEP inválido'),
  address_street: z.string().min(3, 'Endereço obrigatório'),
  address_number: z.string().min(1, 'Número obrigatório'),
  address_complement: z.string().optional(),
  address_neighborhood: z.string().min(2, 'Bairro obrigatório'),
  address_city: z.string().min(2, 'Cidade obrigatória'),
  address_state: z.string().min(2, 'Estado obrigatório'),
});

type ProfileFormData = z.infer<typeof profileSchema>;

export default function PersonalProfileSetup() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { profile, isLoading, createOrUpdateProfile, isUpdating } = usePersonalProfile();
  const { refreshContext, setCurrentContext } = useModule();
  const [isLoadingCep, setIsLoadingCep] = useState(false);

  const {
    register,
    handleSubmit,
    setValue,
    watch,
    formState: { errors }
  } = useForm<ProfileFormData>({
    resolver: zodResolver(profileSchema),
    defaultValues: {
      full_name: '',
      email: user?.email || '',
      phone: '',
      address_zip_code: '',
      address_street: '',
      address_number: '',
      address_complement: '',
      address_neighborhood: '',
      address_city: '',
      address_state: '',
    }
  });

  // Pre-fill form with existing profile data
  useEffect(() => {
    if (profile) {
      setValue('full_name', profile.full_name);
      setValue('email', profile.email);
      setValue('phone', profile.phone);
      setValue('address_zip_code', profile.address_zip_code);
      setValue('address_street', profile.address_street);
      setValue('address_number', profile.address_number);
      setValue('address_complement', profile.address_complement || '');
      setValue('address_neighborhood', profile.address_neighborhood);
      setValue('address_city', profile.address_city);
      setValue('address_state', profile.address_state);
    } else if (user?.email) {
      setValue('email', user.email);
    }
  }, [profile, user, setValue]);

  const zipCode = watch('address_zip_code');

  // Auto-fill address from CEP
  useEffect(() => {
    const fetchAddress = async () => {
      const cleanZip = zipCode?.replace(/\D/g, '');
      if (cleanZip?.length === 8) {
        setIsLoadingCep(true);
        try {
          const response = await fetch(`https://viacep.com.br/ws/${cleanZip}/json/`);
          const data = await response.json();
          if (!data.erro) {
            setValue('address_street', data.logradouro || '');
            setValue('address_neighborhood', data.bairro || '');
            setValue('address_city', data.localidade || '');
            setValue('address_state', data.uf || '');
          }
        } catch (error) {
          console.error('Error fetching CEP:', error);
        } finally {
          setIsLoadingCep(false);
        }
      }
    };

    fetchAddress();
  }, [zipCode, setValue]);

  const onSubmit = (data: ProfileFormData) => {
    createOrUpdateProfile(data as PersonalProfileInput, {
      onSuccess: async () => {
        try {
          // Atualiza o contexto e o status de perfil completo antes de ir para o dashboard pessoal
          await Promise.all([
            refreshContext(),
            setCurrentContext('personal'),
          ]);
        } catch (error) {
          console.error('Erro ao atualizar contexto após salvar perfil pessoal:', error);
        }
        navigate('/personal', { replace: true });
      }
    });
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-4">
      <Card className="w-full max-w-2xl">
        <CardHeader className="text-center">
          <CardTitle className="text-2xl">Complete seu Perfil Pessoal</CardTitle>
          <CardDescription>
            Para acessar o módulo de finanças pessoais, preencha todos os dados abaixo
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
            {/* Personal Info */}
            <div className="space-y-4">
              <h3 className="font-medium text-lg">Dados Pessoais</h3>
              
              <div className="grid md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="full_name">Nome Completo *</Label>
                  <Input
                    id="full_name"
                    {...register('full_name')}
                    placeholder="Seu nome completo"
                  />
                  {errors.full_name && (
                    <p className="text-sm text-destructive">{errors.full_name.message}</p>
                  )}
                </div>

                <div className="space-y-2">
                  <Label htmlFor="email">Email *</Label>
                  <Input
                    id="email"
                    type="email"
                    {...register('email')}
                    placeholder="seu@email.com"
                  />
                  {errors.email && (
                    <p className="text-sm text-destructive">{errors.email.message}</p>
                  )}
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="phone">Telefone Celular *</Label>
                <Input
                  id="phone"
                  {...register('phone')}
                  placeholder="(11) 99999-9999"
                />
                {errors.phone && (
                  <p className="text-sm text-destructive">{errors.phone.message}</p>
                )}
              </div>
            </div>

            {/* Address */}
            <div className="space-y-4">
              <h3 className="font-medium text-lg flex items-center gap-2">
                <MapPin className="h-5 w-5" />
                Endereço
              </h3>

              <div className="grid md:grid-cols-3 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="address_zip_code">CEP *</Label>
                  <div className="relative">
                    <Input
                      id="address_zip_code"
                      {...register('address_zip_code')}
                      placeholder="00000-000"
                    />
                    {isLoadingCep && (
                      <Loader2 className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 animate-spin text-muted-foreground" />
                    )}
                  </div>
                  {errors.address_zip_code && (
                    <p className="text-sm text-destructive">{errors.address_zip_code.message}</p>
                  )}
                </div>

                <div className="space-y-2 md:col-span-2">
                  <Label htmlFor="address_street">Rua *</Label>
                  <Input
                    id="address_street"
                    {...register('address_street')}
                    placeholder="Nome da rua"
                  />
                  {errors.address_street && (
                    <p className="text-sm text-destructive">{errors.address_street.message}</p>
                  )}
                </div>
              </div>

              <div className="grid md:grid-cols-3 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="address_number">Número *</Label>
                  <Input
                    id="address_number"
                    {...register('address_number')}
                    placeholder="123"
                  />
                  {errors.address_number && (
                    <p className="text-sm text-destructive">{errors.address_number.message}</p>
                  )}
                </div>

                <div className="space-y-2 md:col-span-2">
                  <Label htmlFor="address_complement">Complemento</Label>
                  <Input
                    id="address_complement"
                    {...register('address_complement')}
                    placeholder="Apto, Bloco, etc."
                  />
                </div>
              </div>

              <div className="grid md:grid-cols-3 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="address_neighborhood">Bairro *</Label>
                  <Input
                    id="address_neighborhood"
                    {...register('address_neighborhood')}
                    placeholder="Nome do bairro"
                  />
                  {errors.address_neighborhood && (
                    <p className="text-sm text-destructive">{errors.address_neighborhood.message}</p>
                  )}
                </div>

                <div className="space-y-2">
                  <Label htmlFor="address_city">Cidade *</Label>
                  <Input
                    id="address_city"
                    {...register('address_city')}
                    placeholder="Nome da cidade"
                  />
                  {errors.address_city && (
                    <p className="text-sm text-destructive">{errors.address_city.message}</p>
                  )}
                </div>

                <div className="space-y-2">
                  <Label htmlFor="address_state">Estado *</Label>
                  <Input
                    id="address_state"
                    {...register('address_state')}
                    placeholder="UF"
                    maxLength={2}
                  />
                  {errors.address_state && (
                    <p className="text-sm text-destructive">{errors.address_state.message}</p>
                  )}
                </div>
              </div>
            </div>

            <Button type="submit" className="w-full" disabled={isUpdating}>
              {isUpdating && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Salvar e Continuar
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
