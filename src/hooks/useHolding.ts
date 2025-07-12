import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "./useAuth";

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

export interface HoldingSettings {
  id: string;
  user_id: string;
  is_holding_enabled: boolean;
  consolidation_view_default: boolean;
}

export interface FinancialData {
  id: string;
  company_id: string;
  date: string;
  revenue: number;
  expenses: number;
  profit: number;
  cash_flow: number;
  type: string;
}

export interface ConsolidatedData {
  total_revenue: number;
  total_expenses: number;
  total_profit: number;
  total_cash_flow: number;
  company_count: number;
  companies: Company[];
  financial_data: FinancialData[];
}

export function useHolding() {
  const { user } = useAuth();
  const [companies, setCompanies] = useState<Company[]>([]);
  const [holdingSettings, setHoldingSettings] = useState<HoldingSettings | null>(null);
  const [consolidatedData, setConsolidatedData] = useState<ConsolidatedData | null>(null);
  const [selectedCompanyId, setSelectedCompanyId] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (user) {
      loadHoldingData();
    } else {
      setCompanies([]);
      setHoldingSettings(null);
      setConsolidatedData(null);
      setIsLoading(false);
    }
  }, [user]);

  const loadHoldingData = async () => {
    if (!user) return;

    setIsLoading(true);

    // Load companies
    const { data: companiesData } = await supabase
      .from('companies')
      .select('*')
      .eq('user_id', user.id)
      .order('display_order', { ascending: true });

    // Load holding settings
    const { data: settingsData } = await supabase
      .from('holding_settings')
      .select('*')
      .eq('user_id', user.id)
      .single();

    // Load financial data for all companies
    const { data: financialData } = await supabase
      .from('financial_data')
      .select(`
        *,
        companies!inner(user_id)
      `)
      .eq('companies.user_id', user.id)
      .eq('type', 'monthly')
      .gte('date', new Date(new Date().getFullYear(), 0, 1).toISOString().split('T')[0])
      .order('date', { ascending: false });

    setCompanies(companiesData || []);
    setHoldingSettings(settingsData);
    
    // Calculate consolidated data
    if (companiesData && financialData) {
      const consolidated = calculateConsolidatedData(companiesData, financialData);
      setConsolidatedData(consolidated);
    }

    setIsLoading(false);
  };

  const calculateConsolidatedData = (companies: Company[], financialData: any[]): ConsolidatedData => {
    const totalRevenue = financialData.reduce((sum, item) => sum + (item.revenue || 0), 0);
    const totalExpenses = financialData.reduce((sum, item) => sum + (item.expenses || 0), 0);
    const totalProfit = financialData.reduce((sum, item) => sum + (item.profit || 0), 0);
    const totalCashFlow = financialData.reduce((sum, item) => sum + (item.cash_flow || 0), 0);

    return {
      total_revenue: totalRevenue,
      total_expenses: totalExpenses,
      total_profit: totalProfit,
      total_cash_flow: totalCashFlow,
      company_count: companies.length,
      companies,
      financial_data: financialData
    };
  };

  const enableHolding = async () => {
    if (!user) return;

    const { error } = await supabase
      .from('holding_settings')
      .upsert({
        user_id: user.id,
        is_holding_enabled: true,
        consolidation_view_default: true,
      });

    if (!error) {
      await loadHoldingData();
    }
  };

  const addCompany = async (companyData: Omit<Company, 'id' | 'user_id'>) => {
    if (!user) return;

    const { error } = await supabase
      .from('companies')
      .insert({
        user_id: user.id,
        ...companyData,
      });

    if (!error) {
      await loadHoldingData();
    }
  };

  const updateCompany = async (companyId: string, updates: Partial<Company>) => {
    const { error } = await supabase
      .from('companies')
      .update(updates)
      .eq('id', companyId);

    if (!error) {
      await loadHoldingData();
    }
  };

  const getFilteredData = (companyId?: string) => {
    if (!consolidatedData) return null;

    if (!companyId) return consolidatedData;

    const filteredFinancialData = consolidatedData.financial_data.filter(
      item => item.company_id === companyId
    );

    const company = consolidatedData.companies.find(c => c.id === companyId);

    return {
      total_revenue: filteredFinancialData.reduce((sum, item) => sum + (item.revenue || 0), 0),
      total_expenses: filteredFinancialData.reduce((sum, item) => sum + (item.expenses || 0), 0),
      total_profit: filteredFinancialData.reduce((sum, item) => sum + (item.profit || 0), 0),
      total_cash_flow: filteredFinancialData.reduce((sum, item) => sum + (item.cash_flow || 0), 0),
      company_count: 1,
      companies: company ? [company] : [],
      financial_data: filteredFinancialData
    };
  };

  return {
    companies,
    holdingSettings,
    consolidatedData,
    selectedCompanyId,
    isLoading,
    isHoldingEnabled: holdingSettings?.is_holding_enabled || false,
    enableHolding,
    addCompany,
    updateCompany,
    loadHoldingData,
    setSelectedCompanyId,
    getFilteredData,
  };
}