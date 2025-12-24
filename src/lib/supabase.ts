import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error('Missing Supabase environment variables');
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey);

export type Database = {
  public: {
    Tables: {
      profiles: {
        Row: {
          id: string;
          full_name: string;
          username: string;
          role: 'admin' | 'sales_manager' | 'employee';
          is_active: boolean;
          created_at: string;
        };
        Insert: {
          id: string;
          full_name: string;
          username: string;
          role: 'admin' | 'sales_manager' | 'employee';
          is_active?: boolean;
          created_at?: string;
        };
        Update: {
          id?: string;
          full_name?: string;
          username?: string;
          role?: 'admin' | 'sales_manager' | 'employee';
          is_active?: boolean;
          created_at?: string;
        };
      };
      categories: {
        Row: {
          id: string;
          category_name: string;
          description: string | null;
          created_at: string;
        };
        Insert: {
          id?: string;
          category_name: string;
          description?: string | null;
          created_at?: string;
        };
        Update: {
          id?: string;
          category_name?: string;
          description?: string | null;
          created_at?: string;
        };
      };
      devices: {
        Row: {
          id: string;
          model_name: string;
          category_id: string;
          factory_pricelist_eur: number;
          length_meter: number;
          weight_unit: number;
          is_active: boolean;
          created_at: string;
        };
        Insert: {
          id?: string;
          model_name: string;
          category_id: string;
          factory_pricelist_eur: number;
          length_meter: number;
          weight_unit: number;
          is_active?: boolean;
          created_at?: string;
        };
        Update: {
          id?: string;
          model_name?: string;
          category_id?: string;
          factory_pricelist_eur?: number;
          length_meter?: number;
          weight_unit?: number;
          is_active?: boolean;
          created_at?: string;
        };
      };
      settings: {
        Row: {
          id: string;
          is_active: boolean;
          discount_multiplier: number;
          freight_rate_per_meter_eur: number;
          customs_numerator: number;
          customs_denominator: number;
          warranty_rate: number;
          commission_factor: number;
          office_factor: number;
          profit_factor: number;
          rounding_mode: string;
          rounding_step: number;
          exchange_rate_irr_per_eur: number;
          google_script_url: string | null;
          last_sync_at: string | null;
          updated_at: string;
        };
        Insert: {
          id?: string;
          is_active?: boolean;
          discount_multiplier?: number;
          freight_rate_per_meter_eur?: number;
          customs_numerator?: number;
          customs_denominator?: number;
          warranty_rate?: number;
          commission_factor?: number;
          office_factor?: number;
          profit_factor?: number;
          rounding_mode?: string;
          rounding_step?: number;
          exchange_rate_irr_per_eur?: number;
          google_script_url?: string | null;
          last_sync_at?: string | null;
          updated_at?: string;
        };
        Update: {
          id?: string;
          is_active?: boolean;
          discount_multiplier?: number;
          freight_rate_per_meter_eur?: number;
          customs_numerator?: number;
          customs_denominator?: number;
          warranty_rate?: number;
          commission_factor?: number;
          office_factor?: number;
          profit_factor?: number;
          rounding_mode?: string;
          rounding_step?: number;
          exchange_rate_irr_per_eur?: number;
          google_script_url?: string | null;
          last_sync_at?: string | null;
          updated_at?: string;
        };
      };
      projects: {
        Row: {
          id: string;
          created_by_user_id: string;
          assigned_sales_manager_id: string | null;
          project_name: string;
          employer_name: string;
          project_type: string;
          address_text: string;
          tehran_lat: number;
          tehran_lng: number;
          additional_info: string | null;
          status: string;
          approval_decision_by: string | null;
          approval_decision_at: string | null;
          approval_note: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          created_by_user_id: string;
          assigned_sales_manager_id?: string | null;
          project_name: string;
          employer_name: string;
          project_type: string;
          address_text: string;
          tehran_lat: number;
          tehran_lng: number;
          additional_info?: string | null;
          status?: string;
          approval_decision_by?: string | null;
          approval_decision_at?: string | null;
          approval_note?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          created_by_user_id?: string;
          assigned_sales_manager_id?: string | null;
          project_name?: string;
          employer_name?: string;
          project_type?: string;
          address_text?: string;
          tehran_lat?: number;
          tehran_lng?: number;
          additional_info?: string | null;
          status?: string;
          approval_decision_by?: string | null;
          approval_decision_at?: string | null;
          approval_note?: string | null;
          created_at?: string;
          updated_at?: string;
        };
      };
      project_comments: {
        Row: {
          id: string;
          project_id: string;
          author_user_id: string;
          author_role_snapshot: string;
          body: string;
          parent_comment_id: string | null;
          created_at: string;
        };
        Insert: {
          id?: string;
          project_id: string;
          author_user_id: string;
          author_role_snapshot: string;
          body: string;
          parent_comment_id?: string | null;
          created_at?: string;
        };
        Update: {
          id?: string;
          project_id?: string;
          author_user_id?: string;
          author_role_snapshot?: string;
          body?: string;
          parent_comment_id?: string | null;
          created_at?: string;
        };
      };
      project_inquiries: {
        Row: {
          id: string;
          project_id: string;
          requested_by_user_id: string;
          device_id: string;
          category_id: string;
          quantity: number;
          status: string;
          admin_decision_at: string | null;
          sell_price_eur_snapshot: number;
          sell_price_irr_snapshot: number | null;
          calculation_breakdown: any;
          created_at: string;
        };
        Insert: {
          id?: string;
          project_id: string;
          requested_by_user_id: string;
          device_id: string;
          category_id: string;
          quantity?: number;
          status?: string;
          admin_decision_at?: string | null;
          sell_price_eur_snapshot: number;
          sell_price_irr_snapshot?: number | null;
          calculation_breakdown: any;
          created_at?: string;
        };
        Update: {
          id?: string;
          project_id?: string;
          requested_by_user_id?: string;
          device_id?: string;
          category_id?: string;
          quantity?: number;
          status?: string;
          admin_decision_at?: string | null;
          sell_price_eur_snapshot?: number;
          sell_price_irr_snapshot?: number | null;
          calculation_breakdown?: any;
          created_at?: string;
        };
      };
    };
  };
};
