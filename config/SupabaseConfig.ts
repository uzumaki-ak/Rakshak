import { createClient } from '@supabase/supabase-js';

// Replace with your actual Supabase URL and anon key
const supabaseUrl = process.env.EXPO_PUBLIC_SUPABASE_URL!;
const supabaseAnonKey = process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY!;

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error('Missing Supabase environment variables');
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    // Disable Supabase auth since we're using Clerk
    persistSession: false,
    autoRefreshToken: false,
    detectSessionInUrl: false,
  },
});

// Database types (you can generate these with Supabase CLI)
export interface Database {
  public: {
    Tables: {
      users: {
        Row: {
          id: string;
          clerk_user_id: string;
          email: string;
          full_name: string | null;
          first_name: string | null;
          last_name: string | null;
          phone: string | null;
          avatar_url: string | null;
          country: string;
          timezone: string;
          date_of_birth: string | null;
          gender: string | null;
          expo_push_token: string | null;
          push_notifications_enabled: boolean;
          email_notifications_enabled: boolean;
          reminder_notifications_enabled: boolean;
          preferred_language: string;
          temperature_unit: string;
          date_format: string;
          data_sharing_consent: boolean;
          analytics_consent: boolean;
          marketing_consent: boolean;
          is_active: boolean;
          last_login_at: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          clerk_user_id: string;
          email: string;
          full_name?: string | null;
          first_name?: string | null;
          last_name?: string | null;
          phone?: string | null;
          avatar_url?: string | null;
          country?: string;
          timezone?: string;
          date_of_birth?: string | null;
          gender?: string | null;
          expo_push_token?: string | null;
          push_notifications_enabled?: boolean;
          email_notifications_enabled?: boolean;
          reminder_notifications_enabled?: boolean;
          preferred_language?: string;
          temperature_unit?: string;
          date_format?: string;
          data_sharing_consent?: boolean;
          analytics_consent?: boolean;
          marketing_consent?: boolean;
          is_active?: boolean;
          last_login_at?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          clerk_user_id?: string;
          email?: string;
          full_name?: string | null;
          first_name?: string | null;
          last_name?: string | null;
          phone?: string | null;
          avatar_url?: string | null;
          country?: string;
          timezone?: string;
          date_of_birth?: string | null;
          gender?: string | null;
          expo_push_token?: string | null;
          push_notifications_enabled?: boolean;
          email_notifications_enabled?: boolean;
          reminder_notifications_enabled?: boolean;
          preferred_language?: string;
          temperature_unit?: string;
          date_format?: string;
          data_sharing_consent?: boolean;
          analytics_consent?: boolean;
          marketing_consent?: boolean;
          is_active?: boolean;
          last_login_at?: string | null;
          created_at?: string;
          updated_at?: string;
        };
      };
      medicines: {
        Row: {
          id: string;
          user_id: string;
          name: string;
          canonical_name: string | null;
          generic_name: string | null;
          brand_name: string | null;
          manufacturer: string | null;
          barcode: string | null;
          batch_number: string | null;
          ndc_code: string | null;
          original_quantity: number | null;
          current_quantity: number;
          unit_type: string | null;
          strength: string | null;
          manufacture_date: string | null;
          expiry_date: string | null;
          opened_date: string | null;
          image_path: string | null;
          additional_images: string[] | null;
          storage_instructions: string | null;
          medicine_type: string | null;
          therapeutic_class: string | null;
          tags: string[] | null;
          dosage_instructions: string | null;
          frequency: string | null;
          prescribed_by: string | null;
          prescription_date: string | null;
          status: string;
          is_shared: boolean;
          is_donated: boolean;
          notes: string | null;
          acquisition_source: string | null;
          cost: number | null;
          currency: string;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          name: string;
          canonical_name?: string | null;
          generic_name?: string | null;
          brand_name?: string | null;
          manufacturer?: string | null;
          barcode?: string | null;
          batch_number?: string | null;
          ndc_code?: string | null;
          original_quantity?: number | null;
          current_quantity?: number;
          unit_type?: string | null;
          strength?: string | null;
          manufacture_date?: string | null;
          expiry_date?: string | null;
          opened_date?: string | null;
          image_path?: string | null;
          additional_images?: string[] | null;
          storage_instructions?: string | null;
          medicine_type?: string | null;
          therapeutic_class?: string | null;
          tags?: string[] | null;
          dosage_instructions?: string | null;
          frequency?: string | null;
          prescribed_by?: string | null;
          prescription_date?: string | null;
          status?: string;
          is_shared?: boolean;
          is_donated?: boolean;
          notes?: string | null;
          acquisition_source?: string | null;
          cost?: number | null;
          currency?: string;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          user_id?: string;
          name?: string;
          canonical_name?: string | null;
          generic_name?: string | null;
          brand_name?: string | null;
          manufacturer?: string | null;
          barcode?: string | null;
          batch_number?: string | null;
          ndc_code?: string | null;
          original_quantity?: number | null;
          current_quantity?: number;
          unit_type?: string | null;
          strength?: string | null;
          manufacture_date?: string | null;
          expiry_date?: string | null;
          opened_date?: string | null;
          image_path?: string | null;
          additional_images?: string[] | null;
          storage_instructions?: string | null;
          medicine_type?: string | null;
          therapeutic_class?: string | null;
          tags?: string[] | null;
          dosage_instructions?: string | null;
          frequency?: string | null;
          prescribed_by?: string | null;
          prescription_date?: string | null;
          status?: string;
          is_shared?: boolean;
          is_donated?: boolean;
          notes?: string | null;
          acquisition_source?: string | null;
          cost?: number | null;
          currency?: string;
          created_at?: string;
          updated_at?: string;
        };
      };
      scans: {
        Row: {
          id: string;
          user_id: string;
          medicine_id: string | null;
          scan_type: string;
          image_path: string | null;
          raw_ocr_text: string | null;
          parsed_data: any | null;
          confidence_score: number | null;
          processing_status: string;
          error_message: string | null;
          created_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          medicine_id?: string | null;
          scan_type: string;
          image_path?: string | null;
          raw_ocr_text?: string | null;
          parsed_data?: any | null;
          confidence_score?: number | null;
          processing_status?: string;
          error_message?: string | null;
          created_at?: string;
        };
        Update: {
          id?: string;
          user_id?: string;
          medicine_id?: string | null;
          scan_type?: string;
          image_path?: string | null;
          raw_ocr_text?: string | null;
          parsed_data?: any | null;
          confidence_score?: number | null;
          processing_status?: string;
          error_message?: string | null;
          created_at?: string;
        };
      };
      medication_logs: {
        Row: {
          id: string;
          user_id: string;
          medicine_id: string;
          dose_amount: number | null;
          taken_at: string;
          notes: string | null;
          created_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          medicine_id: string;
          dose_amount?: number | null;
          taken_at?: string;
          notes?: string | null;
          created_at?: string;
        };
        Update: {
          id?: string;
          user_id?: string;
          medicine_id?: string;
          dose_amount?: number | null;
          taken_at?: string;
          notes?: string | null;
          created_at?: string;
        };
      };
      user_health_profiles: {
        Row: {
          id: string;
          user_id: string;
          known_allergies: string[] | null;
          chronic_conditions: string[] | null;
          current_medications: string[] | null;
          blood_group: string | null;
          weight: number | null;
          height: number | null;
          emergency_contact_name: string | null;
          emergency_contact_phone: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          known_allergies?: string[] | null;
          chronic_conditions?: string[] | null;
          current_medications?: string[] | null;
          blood_group?: string | null;
          weight?: number | null;
          height?: number | null;
          emergency_contact_name?: string | null;
          emergency_contact_phone?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          user_id?: string;
          known_allergies?: string[] | null;
          chronic_conditions?: string[] | null;
          current_medications?: string[] | null;
          blood_group?: string | null;
          weight?: number | null;
          height?: number | null;
          emergency_contact_name?: string | null;
          emergency_contact_phone?: string | null;
          created_at?: string;
          updated_at?: string;
        };
      };
      notifications: {
        Row: {
          id: string;
          user_id: string;
          title: string;
          body: string;
          type: string | null;
          is_read: boolean;
          data: any | null;
          created_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          title: string;
          body: string;
          type?: string | null;
          is_read?: boolean;
          data?: any | null;
          created_at?: string;
        };
        Update: {
          id?: string;
          user_id?: string;
          title?: string;
          body?: string;
          type?: string | null;
          is_read?: boolean;
          data?: any | null;
          created_at?: string;
        };
      };
    };
    Views: {
      [_ in never]: never;
    };
    Functions: {
      [_ in never]: never;
    };
    Enums: {
      [_ in never]: never;
    };
  };
}