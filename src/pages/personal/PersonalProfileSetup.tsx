import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Loader2, MapPin, User } from 'lucide-react';
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

const profileSchema = z.object({
  full_name: z.string().min(3, 'Nome deve ter pelo menos 3 caracteres'),
  email: z.string().email('Email inválido'),
  phone: z.string().min(10, 'Telefone inválido'),
  address_zip_code: z.string().min(8, 'CEP inválido'),
  address_city: z.string().min(2, 'Cidade obrigatória'),
  age: z.number().min(16, 'Você precisa ter pelo menos 16 anos').max(120, 'Idade inválida'),
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
      address_city: '',
      age: undefined,
    }
  });

  // Pre-fill form with existing profile data
  useEffect(() => {
    if (profile) {
      setValue('full_name', profile.full_name);
      setValue('email', profile.email);
      setValue('phone', profile.phone);
      setValue('address_zip_code', profile.address_zip_code);
      setValue('address_city', profile.address_city);
      if (profile.age) {
        setValue('age', profile.age);
      }
    } else if (user?.email) {
      setValue('email', user.email);
    }
  }, [profile, user, setValue]);

  const zipCode = watch('address_zip_code');

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
            setValue('address_city', data.localidade || '');
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
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <div className="mx-auto mb-4 h-12 w-12 rounded-full bg-primary/10 flex items-center justify-center">
            <User className="h-6 w-6 text-primary" />
          </div>
          <CardTitle className="text-2xl">Complete seu Perfil</CardTitle>
          <CardDescription>
            Para acessar o módulo de finanças pessoais, preencha os dados abaixo
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
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

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="phone">Celular *</Label>
                <Input
                  id="phone"
                  {...register('phone')}
                  placeholder="(11) 99999-9999"
                />
                {errors.phone && (
                  <p className="text-sm text-destructive">{errors.phone.message}</p>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="age">Idade *</Label>
                <Input
                  id="age"
                  type="number"
                  {...register('age', { valueAsNumber: true })}
                  placeholder="25"
                  min={16}
                  max={120}
                />
                {errors.age && (
                  <p className="text-sm text-destructive">{errors.age.message}</p>
                )}
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="address_zip_code" className="flex items-center gap-1">
                  <MapPin className="h-3 w-3" />
                  CEP *
                </Label>
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

              <div className="space-y-2">
                <Label htmlFor="address_city">Cidade *</Label>
                <Input
                  id="address_city"
                  {...register('address_city')}
                  placeholder="Sua cidade"
                />
                {errors.address_city && (
                  <p className="text-sm text-destructive">{errors.address_city.message}</p>
                )}
              </div>
            </div>

            <Button type="submit" className="w-full mt-6" disabled={isUpdating}>
              {isUpdating && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Salvar e Continuar
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
