import { useAuth, useUser } from '@clerk/clerk-expo';
import { useEffect, useState } from 'react';
import { SupabaseUserService } from '@/services/supabase/userService';

/**
 * useUserSync
 * Syncs Clerk user state to Supabase database.
 * Handles user creation and profile updates automatically.
 */
export function useUserSync() {
  const { isLoaded, isSignedIn, userId } = useAuth();
  const { user } = useUser();
  const [isSynced, setIsSynced] = useState(false);
  const [syncError, setSyncError] = useState<Error | null>(null);

  const userService = SupabaseUserService.getInstance();

  useEffect(() => {
    async function syncUser() {
      if (!isLoaded || !isSignedIn || !user || !userId) {
        return;
      }

      try {
        console.log('🔄 Syncing user state with Supabase:', userId);
        
        // Check if user exists in Supabase
        const existingUser = await userService.checkUserExists(userId);
        
        if (!existingUser) {
          console.log('✨ Creating new user in Supabase');
          await userService.createOrUpdateUser(user, true);
        } else {
          console.log('✅ Updating existing user in Supabase');
          await userService.createOrUpdateUser(user, false);
        }

        setIsSynced(true);
      } catch (error) {
        console.error('❌ User sync error:', error);
        setSyncError(error instanceof Error ? error : new Error('Unknown sync error'));
      }
    }

    if (isSignedIn && isLoaded && !isSynced) {
      syncUser();
    }
  }, [isLoaded, isSignedIn, user, userId, isSynced]);

  return {
    isSynced,
    syncError,
    isLoading: !isLoaded
  };
}
