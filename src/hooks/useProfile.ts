import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "./useAuth";

export interface Profile {
  id: string;
  full_name: string;
  phone: string;
  position: string;
}

export interface Company {
  id: string;
  user_id: string;
  company_name: string;
  cnpj: string;
  revenue_range: string;
  address_street: string;
  address_number: string;
  address_complement?: string;
  address_neighborhood: string;
  address_city: string;
  address_state: string;
  address_zip_code: string;
  is_holding: boolean;
  holding_parent_id?: string;
  status: string;
  display_order: number;
}

export interface ProfileData {
  full_name: string;
  phone: string;
  position: string;
  company_name: string;
  cnpj: string;
  revenue_range: string;
  address_street: string;
  address_number: string;
  address_complement?: string;
  address_neighborhood: string;
  address_city: string;
  address_state: string;
  address_zip_code: string;
}

export function useProfile() {
  const { user } = useAuth();
  const [profile, setProfile] = useState<Profile | null>(null);
  const [company, setCompany] = useState<Company | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (user) {
      loadProfile();
    } else {
      setProfile(null);
      setCompany(null);
      setIsLoading(false);
    }
  }, [user]);

  const loadProfile = async () => {
    if (!user) return;

    setIsLoading(true);

    try {
      // Load profile
      const { data: profileData, error: profileError } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', user.id)
        .maybeSingle();

      if (profileError && profileError.code !== 'PGRST116') {
        console.error('Error loading profile:', profileError);
        throw profileError;
      }

      // Load company
      const { data: companyData, error: companyError } = await supabase
        .from('companies')
        .select('*')
        .eq('user_id', user.id)
        .maybeSingle();

      if (companyError && companyError.code !== 'PGRST116') {
        console.error('Error loading company:', companyError);
        throw companyError;
      }

      console.log('Profile loaded:', profileData);
      console.log('Company loaded:', companyData);

      setProfile(profileData);
      setCompany(companyData);
    } catch (error) {
      console.error('Error in loadProfile:', error);
      setProfile(null);
      setCompany(null);
    } finally {
      setIsLoading(false);
    }
  };

  const createProfile = async (data: ProfileData) => {
    if (!user) throw new Error('User not authenticated');

    // Create profile
    const { error: profileError } = await supabase
      .from('profiles')
      .insert({
        id: user.id,
        full_name: data.full_name,
        phone: data.phone,
        position: data.position,
      });

    if (profileError) throw profileError;

    // Create company
    const { error: companyError } = await supabase
      .from('companies')
      .insert({
        user_id: user.id,
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
        is_holding: false,
        status: 'active',
        display_order: 0,
      });

    if (companyError) throw companyError;

    await loadProfile();
  };

  return {
    profile,
    company,
    isLoading,
    hasProfile: !!profile, // User has profile if profile exists (company is optional)
    createProfile,
    loadProfile,
  };
}