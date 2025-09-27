export interface UserProfile {
  id: string;
  clerk_user_id: string;
  email: string;
  full_name?: string;
  first_name?: string;
  last_name?: string;
  phone?: string;
  avatar_url?: string;
  country?: string;
  timezone?: string;
  date_of_birth?: string;
  gender?: 'male' | 'female' | 'other' | 'prefer_not_to_say';
  preferred_language: string;
  temperature_unit: 'celsius' | 'fahrenheit';
  date_format: string;
  push_notifications_enabled: boolean;
  email_notifications_enabled: boolean;
  reminder_notifications_enabled: boolean;
  data_sharing_consent: boolean;
  analytics_consent: boolean;
  marketing_consent: boolean;
  created_at: string;
  updated_at: string;
}

export interface HealthProfile {
  id: string;
  user_id: string;
  height_cm?: number;
  weight_kg?: number;
  blood_type?: string;
  known_allergies: string[];
  chronic_conditions: string[];
  current_medications: string[];
  emergency_contact_name?: string;
  emergency_contact_phone?: string;
  emergency_contact_relation?: string;
  created_at: string;
  updated_at: string;
}

export interface EmergencyContact {
  name: string;
  phone: string;
  relation: string;
  is_primary: boolean;
}