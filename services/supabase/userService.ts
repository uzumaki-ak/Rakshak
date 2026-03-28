import { supabase } from '@/config/SupabaseConfig';
import { Platform } from 'react-native';

export interface UserProfile {
  clerk_user_id: string;
  email: string;
  full_name?: string | null;
  first_name?: string | null;
  last_name?: string | null;
  phone?: string | null;
  avatar_url?: string | null;
  country?: string;
  timezone?: string;
  preferred_language?: string;
  last_login_at?: string;
}

export class SupabaseUserService {
  private static instance: SupabaseUserService;

  public static getInstance(): SupabaseUserService {
    if (!SupabaseUserService.instance) {
      SupabaseUserService.instance = new SupabaseUserService();
    }
    return SupabaseUserService.instance;
  }

  /**
   * Check if user exists in Supabase
   */
  async checkUserExists(clerkUserId: string) {
    try {
      const { data, error } = await supabase
        .from('users')
        .select('id, clerk_user_id')
        .eq('clerk_user_id', clerkUserId)
        .single();

      if (error && error.code !== 'PGRST116') {
        console.error('Error checking user existence:', error);
        return null;
      }

      return data;
    } catch (error) {
      console.error('Error in checkUserExists:', error);
      return null;
    }
  }

  /**
   * Create or update user in Supabase
   */
  async createOrUpdateUser(clerkUser: any, isNewUser: boolean = false) {
    try {
      const timezone = Intl.DateTimeFormat().resolvedOptions().timeZone;
      const locale = Intl.DateTimeFormat().resolvedOptions().locale;
      const country = locale.split('-')[1] || 'IN';

      const email = clerkUser.primaryEmailAddress?.emailAddress || 
                    clerkUser.emailAddresses?.[0]?.emailAddress || 
                    `user_${clerkUser.id}@rakshak.local`;

      const userData: Partial<UserProfile> = {
        clerk_user_id: clerkUser.id,
        email: email,
        full_name: clerkUser.fullName || `${clerkUser.firstName || ''} ${clerkUser.lastName || ''}`.trim(),
        first_name: clerkUser.firstName,
        last_name: clerkUser.lastName,
        phone: clerkUser.primaryPhoneNumber?.phoneNumber,
        avatar_url: clerkUser.imageUrl,
        country: country,
        timezone: timezone,
        preferred_language: locale.split('-')[0] || 'en',
        last_login_at: new Date().toISOString(),
      };

      if (isNewUser) {
        const { data, error } = await supabase
          .from('users')
          .insert([userData])
          .select()
          .single();

        if (error) {
          console.error('Error creating user in Supabase:', error);
          throw error;
        }

        console.log('New user created in Supabase:', data.id);
        
        // Initialize health profile for new user
        await this.initializeHealthProfile(data.id);
        
        return data;
      } else {
        const { data, error } = await supabase
          .from('users')
          .update({
            full_name: userData.full_name,
            first_name: userData.first_name,
            last_name: userData.last_name,
            phone: userData.phone,
            avatar_url: userData.avatar_url,
            last_login_at: userData.last_login_at,
          })
          .eq('clerk_user_id', clerkUser.id)
          .select()
          .single();

        if (error) {
          console.error('Error updating user in Supabase:', error);
          throw error;
        }

        return data;
      }
    } catch (error) {
      console.error('Error in createOrUpdateUser:', error);
      throw error;
    }
  }

  /**
   * Initialize default health profile
   */
  private async initializeHealthProfile(userId: string) {
    try {
      const { error } = await supabase.from('user_health_profiles').insert([
        {
          user_id: userId,
          known_allergies: [],
          chronic_conditions: [],
          current_medications: [],
        },
      ]);

      if (error) {
        console.error('Error initializing health profile:', error);
      }
    } catch (error) {
      console.error('Error in initializeHealthProfile:', error);
    }
  }

  /**
   * Log user activity
   */
  async logActivity(userId: string, activityType: string, activityData: any = {}) {
    try {
      // Assuming you have a user_activities table or using medication_logs for specific actions
      // For now, let's skip unless table is defined in schema
    } catch (error) {
      console.error('Error logging activity:', error);
    }
  }
}
