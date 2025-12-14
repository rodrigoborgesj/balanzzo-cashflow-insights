export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  // Allows to automatically instantiate createClient with right options
  // instead of createClient<Database, { PostgrestVersion: 'XX' }>(URL, KEY)
  __InternalSupabase: {
    PostgrestVersion: "12.2.3 (519615d)"
  }
  public: {
    Tables: {
      categorias_usuario: {
        Row: {
          ativo: boolean | null
          cor: string | null
          id: string
          nome_categoria: string
          user_id: string
        }
        Insert: {
          ativo?: boolean | null
          cor?: string | null
          id?: string
          nome_categoria: string
          user_id: string
        }
        Update: {
          ativo?: boolean | null
          cor?: string | null
          id?: string
          nome_categoria?: string
          user_id?: string
        }
        Relationships: []
      }
      companies: {
        Row: {
          address_city: string
          address_complement: string | null
          address_neighborhood: string
          address_number: string
          address_state: string
          address_street: string
          address_zip_code: string
          cnpj: string
          company_name: string
          created_at: string | null
          id: string
          revenue_range: string
          status: string | null
          updated_at: string | null
          user_id: string
        }
        Insert: {
          address_city: string
          address_complement?: string | null
          address_neighborhood: string
          address_number: string
          address_state: string
          address_street: string
          address_zip_code: string
          cnpj: string
          company_name: string
          created_at?: string | null
          id?: string
          revenue_range: string
          status?: string | null
          updated_at?: string | null
          user_id: string
        }
        Update: {
          address_city?: string
          address_complement?: string | null
          address_neighborhood?: string
          address_number?: string
          address_state?: string
          address_street?: string
          address_zip_code?: string
          cnpj?: string
          company_name?: string
          created_at?: string | null
          id?: string
          revenue_range?: string
          status?: string | null
          updated_at?: string | null
          user_id?: string
        }
        Relationships: []
      }
      email_logs: {
        Row: {
          created_at: string
          email_address: string
          email_type: string
          error_message: string | null
          id: string
          sent_at: string
          success: boolean
          user_id: string
        }
        Insert: {
          created_at?: string
          email_address: string
          email_type: string
          error_message?: string | null
          id?: string
          sent_at?: string
          success?: boolean
          user_id: string
        }
        Update: {
          created_at?: string
          email_address?: string
          email_type?: string
          error_message?: string | null
          id?: string
          sent_at?: string
          success?: boolean
          user_id?: string
        }
        Relationships: []
      }
      fluxo_caixa: {
        Row: {
          categoria: string | null
          company_id: string
          created_at: string
          data_competencia: string
          descricao: string | null
          id: string
          tipo: string
          transacao_origem_id: string | null
          updated_at: string
          user_id: string
          valor: number
        }
        Insert: {
          categoria?: string | null
          company_id: string
          created_at?: string
          data_competencia: string
          descricao?: string | null
          id?: string
          tipo: string
          transacao_origem_id?: string | null
          updated_at?: string
          user_id: string
          valor: number
        }
        Update: {
          categoria?: string | null
          company_id?: string
          created_at?: string
          data_competencia?: string
          descricao?: string | null
          id?: string
          tipo?: string
          transacao_origem_id?: string | null
          updated_at?: string
          user_id?: string
          valor?: number
        }
        Relationships: [
          {
            foreignKeyName: "fk_fluxo_caixa_company"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "companies"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "fk_fluxo_caixa_transacao"
            columns: ["transacao_origem_id"]
            isOneToOne: false
            referencedRelation: "transacoes_conciliadas"
            referencedColumns: ["id"]
          },
        ]
      }
      free_access_users: {
        Row: {
          created_at: string | null
          email: string
          expires_at: string | null
          id: string
          updated_at: string | null
        }
        Insert: {
          created_at?: string | null
          email: string
          expires_at?: string | null
          id?: string
          updated_at?: string | null
        }
        Update: {
          created_at?: string | null
          email?: string
          expires_at?: string | null
          id?: string
          updated_at?: string | null
        }
        Relationships: []
      }
      painel_mensal: {
        Row: {
          ano: number
          atualizado_em: string | null
          categoria_gastos: Json | null
          categoria_receitas: Json | null
          criado_em: string | null
          dados_brutos: Json | null
          id: string
          insights: Json | null
          mes: number
          total_entradas: number | null
          total_saidas: number | null
          usuario_id: string
        }
        Insert: {
          ano: number
          atualizado_em?: string | null
          categoria_gastos?: Json | null
          categoria_receitas?: Json | null
          criado_em?: string | null
          dados_brutos?: Json | null
          id?: string
          insights?: Json | null
          mes: number
          total_entradas?: number | null
          total_saidas?: number | null
          usuario_id: string
        }
        Update: {
          ano?: number
          atualizado_em?: string | null
          categoria_gastos?: Json | null
          categoria_receitas?: Json | null
          criado_em?: string | null
          dados_brutos?: Json | null
          id?: string
          insights?: Json | null
          mes?: number
          total_entradas?: number | null
          total_saidas?: number | null
          usuario_id?: string
        }
        Relationships: []
      }
      password_history: {
        Row: {
          created_at: string
          id: string
          password_hash: string
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          password_hash: string
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          password_hash?: string
          user_id?: string
        }
        Relationships: []
      }
      payments: {
        Row: {
          amount_cents: number
          created_at: string
          id: string
          pagarme_transaction_id: string | null
          paid_at: string | null
          payment_method: string | null
          status: string
          subscription_id: string
          updated_at: string
          user_id: string
        }
        Insert: {
          amount_cents: number
          created_at?: string
          id?: string
          pagarme_transaction_id?: string | null
          paid_at?: string | null
          payment_method?: string | null
          status?: string
          subscription_id: string
          updated_at?: string
          user_id: string
        }
        Update: {
          amount_cents?: number
          created_at?: string
          id?: string
          pagarme_transaction_id?: string | null
          paid_at?: string | null
          payment_method?: string | null
          status?: string
          subscription_id?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "payments_subscription_id_fkey"
            columns: ["subscription_id"]
            isOneToOne: false
            referencedRelation: "subscriptions"
            referencedColumns: ["id"]
          },
        ]
      }
      personal_categories: {
        Row: {
          active: boolean | null
          color: string | null
          created_at: string | null
          id: string
          name: string
          type: string
          updated_at: string | null
          user_id: string
        }
        Insert: {
          active?: boolean | null
          color?: string | null
          created_at?: string | null
          id?: string
          name: string
          type: string
          updated_at?: string | null
          user_id: string
        }
        Update: {
          active?: boolean | null
          color?: string | null
          created_at?: string | null
          id?: string
          name?: string
          type?: string
          updated_at?: string | null
          user_id?: string
        }
        Relationships: []
      }
      personal_profiles: {
        Row: {
          address_city: string
          address_complement: string | null
          address_neighborhood: string
          address_number: string
          address_state: string
          address_street: string
          address_zip_code: string
          created_at: string | null
          email: string
          full_name: string
          id: string
          phone: string
          profile_complete: boolean
          updated_at: string | null
          user_id: string
        }
        Insert: {
          address_city: string
          address_complement?: string | null
          address_neighborhood: string
          address_number: string
          address_state: string
          address_street: string
          address_zip_code: string
          created_at?: string | null
          email: string
          full_name: string
          id?: string
          phone: string
          profile_complete?: boolean
          updated_at?: string | null
          user_id: string
        }
        Update: {
          address_city?: string
          address_complement?: string | null
          address_neighborhood?: string
          address_number?: string
          address_state?: string
          address_street?: string
          address_zip_code?: string
          created_at?: string | null
          email?: string
          full_name?: string
          id?: string
          phone?: string
          profile_complete?: boolean
          updated_at?: string | null
          user_id?: string
        }
        Relationships: []
      }
      personal_savings_contributions: {
        Row: {
          amount: number
          contribution_date: string
          created_at: string | null
          goal_id: string
          id: string
          notes: string | null
          proof_file_name: string | null
          proof_file_url: string
          reference_month: string
          status: string
          updated_at: string | null
          user_id: string
        }
        Insert: {
          amount: number
          contribution_date: string
          created_at?: string | null
          goal_id: string
          id?: string
          notes?: string | null
          proof_file_name?: string | null
          proof_file_url: string
          reference_month: string
          status?: string
          updated_at?: string | null
          user_id: string
        }
        Update: {
          amount?: number
          contribution_date?: string
          created_at?: string | null
          goal_id?: string
          id?: string
          notes?: string | null
          proof_file_name?: string | null
          proof_file_url?: string
          reference_month?: string
          status?: string
          updated_at?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "personal_savings_contributions_goal_id_fkey"
            columns: ["goal_id"]
            isOneToOne: false
            referencedRelation: "personal_savings_goals"
            referencedColumns: ["id"]
          },
        ]
      }
      personal_savings_goals: {
        Row: {
          bank_name: string | null
          contribution_day: number | null
          created_at: string | null
          goal_name: string
          id: string
          monthly_amount: number | null
          start_date: string
          status: string
          timeframe_months: number
          total_target_amount: number
          updated_at: string | null
          user_id: string
        }
        Insert: {
          bank_name?: string | null
          contribution_day?: number | null
          created_at?: string | null
          goal_name: string
          id?: string
          monthly_amount?: number | null
          start_date?: string
          status?: string
          timeframe_months: number
          total_target_amount: number
          updated_at?: string | null
          user_id: string
        }
        Update: {
          bank_name?: string | null
          contribution_day?: number | null
          created_at?: string | null
          goal_name?: string
          id?: string
          monthly_amount?: number | null
          start_date?: string
          status?: string
          timeframe_months?: number
          total_target_amount?: number
          updated_at?: string | null
          user_id?: string
        }
        Relationships: []
      }
      personal_transactions: {
        Row: {
          amount: number
          category_id: string | null
          created_at: string | null
          description: string | null
          hash_transaction: string | null
          id: string
          reconciled: boolean | null
          reference_month: string | null
          source_file: string | null
          transaction_date: string
          type: string
          updated_at: string | null
          user_id: string
        }
        Insert: {
          amount: number
          category_id?: string | null
          created_at?: string | null
          description?: string | null
          hash_transaction?: string | null
          id?: string
          reconciled?: boolean | null
          reference_month?: string | null
          source_file?: string | null
          transaction_date: string
          type: string
          updated_at?: string | null
          user_id: string
        }
        Update: {
          amount?: number
          category_id?: string | null
          created_at?: string | null
          description?: string | null
          hash_transaction?: string | null
          id?: string
          reconciled?: boolean | null
          reference_month?: string | null
          source_file?: string | null
          transaction_date?: string
          type?: string
          updated_at?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "personal_transactions_category_id_fkey"
            columns: ["category_id"]
            isOneToOne: false
            referencedRelation: "personal_categories"
            referencedColumns: ["id"]
          },
        ]
      }
      profiles: {
        Row: {
          created_at: string | null
          full_name: string
          id: string
          phone: string
          position: string
          profile_photo_url: string | null
          trial_start_date: string | null
          trial_used: boolean | null
          updated_at: string | null
        }
        Insert: {
          created_at?: string | null
          full_name: string
          id: string
          phone: string
          position: string
          profile_photo_url?: string | null
          trial_start_date?: string | null
          trial_used?: boolean | null
          updated_at?: string | null
        }
        Update: {
          created_at?: string | null
          full_name?: string
          id?: string
          phone?: string
          position?: string
          profile_photo_url?: string | null
          trial_start_date?: string | null
          trial_used?: boolean | null
          updated_at?: string | null
        }
        Relationships: []
      }
      subscription_plans: {
        Row: {
          active: boolean
          billing_cycle: string
          created_at: string
          features: Json
          id: string
          name: string
          pagarme_plan_id: string | null
          price_cents: number
          subscription_type: Database["public"]["Enums"]["subscription_type"]
          updated_at: string
        }
        Insert: {
          active?: boolean
          billing_cycle: string
          created_at?: string
          features?: Json
          id?: string
          name: string
          pagarme_plan_id?: string | null
          price_cents: number
          subscription_type?: Database["public"]["Enums"]["subscription_type"]
          updated_at?: string
        }
        Update: {
          active?: boolean
          billing_cycle?: string
          created_at?: string
          features?: Json
          id?: string
          name?: string
          pagarme_plan_id?: string | null
          price_cents?: number
          subscription_type?: Database["public"]["Enums"]["subscription_type"]
          updated_at?: string
        }
        Relationships: []
      }
      subscriptions: {
        Row: {
          cancel_at_period_end: boolean
          canceled_at: string | null
          created_at: string
          current_period_end: string | null
          current_period_start: string | null
          id: string
          pagarme_subscription_id: string | null
          plan_id: string
          status: string
          subscription_type: Database["public"]["Enums"]["subscription_type"]
          updated_at: string
          user_id: string
        }
        Insert: {
          cancel_at_period_end?: boolean
          canceled_at?: string | null
          created_at?: string
          current_period_end?: string | null
          current_period_start?: string | null
          id?: string
          pagarme_subscription_id?: string | null
          plan_id: string
          status?: string
          subscription_type?: Database["public"]["Enums"]["subscription_type"]
          updated_at?: string
          user_id: string
        }
        Update: {
          cancel_at_period_end?: boolean
          canceled_at?: string | null
          created_at?: string
          current_period_end?: string | null
          current_period_start?: string | null
          id?: string
          pagarme_subscription_id?: string | null
          plan_id?: string
          status?: string
          subscription_type?: Database["public"]["Enums"]["subscription_type"]
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "subscriptions_plan_id_fkey"
            columns: ["plan_id"]
            isOneToOne: false
            referencedRelation: "public_subscription_plans"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "subscriptions_plan_id_fkey"
            columns: ["plan_id"]
            isOneToOne: false
            referencedRelation: "subscription_plans"
            referencedColumns: ["id"]
          },
        ]
      }
      transacoes_conciliadas: {
        Row: {
          categoria_final: string | null
          categoria_sugerida: string | null
          company_id: string | null
          criado_em: string | null
          data_transacao: string
          descricao: string | null
          hash_transacao: string | null
          id: string
          mes_referencia: string | null
          origem_arquivo: string | null
          status_conciliacao: boolean | null
          tipo: string | null
          user_id: string
          valor: number
        }
        Insert: {
          categoria_final?: string | null
          categoria_sugerida?: string | null
          company_id?: string | null
          criado_em?: string | null
          data_transacao: string
          descricao?: string | null
          hash_transacao?: string | null
          id?: string
          mes_referencia?: string | null
          origem_arquivo?: string | null
          status_conciliacao?: boolean | null
          tipo?: string | null
          user_id: string
          valor: number
        }
        Update: {
          categoria_final?: string | null
          categoria_sugerida?: string | null
          company_id?: string | null
          criado_em?: string | null
          data_transacao?: string
          descricao?: string | null
          hash_transacao?: string | null
          id?: string
          mes_referencia?: string | null
          origem_arquivo?: string | null
          status_conciliacao?: boolean | null
          tipo?: string | null
          user_id?: string
          valor?: number
        }
        Relationships: [
          {
            foreignKeyName: "transacoes_conciliadas_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "companies"
            referencedColumns: ["id"]
          },
        ]
      }
      transacoes_recorrentes: {
        Row: {
          ativo: boolean | null
          company_id: string | null
          created_at: string | null
          id: string
          intervalo_dias: number | null
          mes_especifico: number | null
          proximo_lancamento: string
          tipo_recorrencia: string
          transacao_origem_id: string
          updated_at: string | null
          user_id: string
        }
        Insert: {
          ativo?: boolean | null
          company_id?: string | null
          created_at?: string | null
          id?: string
          intervalo_dias?: number | null
          mes_especifico?: number | null
          proximo_lancamento: string
          tipo_recorrencia: string
          transacao_origem_id: string
          updated_at?: string | null
          user_id: string
        }
        Update: {
          ativo?: boolean | null
          company_id?: string | null
          created_at?: string | null
          id?: string
          intervalo_dias?: number | null
          mes_especifico?: number | null
          proximo_lancamento?: string
          tipo_recorrencia?: string
          transacao_origem_id?: string
          updated_at?: string | null
          user_id?: string
        }
        Relationships: []
      }
      user_session_context: {
        Row: {
          current_context: Database["public"]["Enums"]["subscription_type"]
          id: string
          updated_at: string | null
          user_id: string
        }
        Insert: {
          current_context?: Database["public"]["Enums"]["subscription_type"]
          id?: string
          updated_at?: string | null
          user_id: string
        }
        Update: {
          current_context?: Database["public"]["Enums"]["subscription_type"]
          id?: string
          updated_at?: string | null
          user_id?: string
        }
        Relationships: []
      }
      user_settings: {
        Row: {
          alertas_vencimento: boolean | null
          autenticacao_dois_fatores: boolean | null
          conciliacao_automatica: boolean | null
          created_at: string | null
          id: string
          login_automatico: boolean | null
          relatorios_mensais: boolean | null
          updated_at: string | null
          user_id: string
        }
        Insert: {
          alertas_vencimento?: boolean | null
          autenticacao_dois_fatores?: boolean | null
          conciliacao_automatica?: boolean | null
          created_at?: string | null
          id?: string
          login_automatico?: boolean | null
          relatorios_mensais?: boolean | null
          updated_at?: string | null
          user_id: string
        }
        Update: {
          alertas_vencimento?: boolean | null
          autenticacao_dois_fatores?: boolean | null
          conciliacao_automatica?: boolean | null
          created_at?: string | null
          id?: string
          login_automatico?: boolean | null
          relatorios_mensais?: boolean | null
          updated_at?: string | null
          user_id?: string
        }
        Relationships: []
      }
    }
    Views: {
      public_subscription_plans: {
        Row: {
          billing_cycle: string | null
          features: Json | null
          id: string | null
          name: string | null
          price_cents: number | null
        }
        Insert: {
          billing_cycle?: string | null
          features?: Json | null
          id?: string | null
          name?: string | null
          price_cents?: number | null
        }
        Update: {
          billing_cycle?: string | null
          features?: Json | null
          id?: string | null
          name?: string | null
          price_cents?: number | null
        }
        Relationships: []
      }
    }
    Functions: {
      get_subscription_plans: {
        Args: never
        Returns: {
          active: boolean
          billing_cycle: string
          features: Json
          id: string
          name: string
          price_cents: number
        }[]
      }
      get_user_context: {
        Args: { p_user_id: string }
        Returns: Database["public"]["Enums"]["subscription_type"]
      }
      get_user_subscription: {
        Args: { p_user_id: string }
        Returns: {
          cancel_at_period_end: boolean
          created_at: string
          current_period_end: string
          current_period_start: string
          id: string
          pagarme_subscription_id: string
          plan_id: string
          status: string
          updated_at: string
          user_id: string
        }[]
      }
      has_active_subscription: {
        Args: {
          p_type: Database["public"]["Enums"]["subscription_type"]
          p_user_id: string
        }
        Returns: boolean
      }
      has_free_access: { Args: { user_email: string }; Returns: boolean }
      is_personal_profile_complete: {
        Args: { p_user_id: string }
        Returns: boolean
      }
      sugerir_categoria: { Args: { descricao_input: string }; Returns: string }
    }
    Enums: {
      subscription_type: "company" | "personal"
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}

type DatabaseWithoutInternals = Omit<Database, "__InternalSupabase">

type DefaultSchema = DatabaseWithoutInternals[Extract<keyof Database, "public">]

export type Tables<
  DefaultSchemaTableNameOrOptions extends
    | keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
      DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])[TableName] extends {
      Row: infer R
    }
    ? R
    : never
  : DefaultSchemaTableNameOrOptions extends keyof (DefaultSchema["Tables"] &
        DefaultSchema["Views"])
    ? (DefaultSchema["Tables"] &
        DefaultSchema["Views"])[DefaultSchemaTableNameOrOptions] extends {
        Row: infer R
      }
      ? R
      : never
    : never

export type TablesInsert<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Insert: infer I
    }
    ? I
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Insert: infer I
      }
      ? I
      : never
    : never

export type TablesUpdate<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Update: infer U
    }
    ? U
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Update: infer U
      }
      ? U
      : never
    : never

export type Enums<
  DefaultSchemaEnumNameOrOptions extends
    | keyof DefaultSchema["Enums"]
    | { schema: keyof DatabaseWithoutInternals },
  EnumName extends DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never = never,
> = DefaultSchemaEnumNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : DefaultSchemaEnumNameOrOptions extends keyof DefaultSchema["Enums"]
    ? DefaultSchema["Enums"][DefaultSchemaEnumNameOrOptions]
    : never

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    | keyof DefaultSchema["CompositeTypes"]
    | { schema: keyof DatabaseWithoutInternals },
  CompositeTypeName extends PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never = never,
> = PublicCompositeTypeNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"]
    ? DefaultSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never

export const Constants = {
  public: {
    Enums: {
      subscription_type: ["company", "personal"],
    },
  },
} as const
