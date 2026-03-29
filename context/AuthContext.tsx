import React, { createContext, useContext, useEffect, useState } from 'react';
import { Session, User } from '@supabase/supabase-js';
import { supabase } from '@/config/SupabaseConfig';

interface AuthContextType {
  session: Session | null;
  user: User | null;
  isLoading: boolean;
  signOut: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType>({
  session: null,
  user: null,
  isLoading: true,
  signOut: async () => {},
});

/**
 * Ensures the public `users` table has a row for this Supabase Auth user.
 * Handles the case where an old Clerk-based row exists with the same email
 * but a different (non-Supabase) primary key.
 */
const ensureUserProfile = async (user: User) => {
  // 1. Row already exists for this Supabase UUID → nothing to do
  const { data: existing } = await supabase
    .from('users')
    .select('id')
    .eq('id', user.id)
    .single();
  if (existing) return;

  // 2. Try a clean insert
  const profilePayload = {
    id: user.id,
    clerk_user_id: user.id,          // kept for schema compat
    email: user.email ?? '',
    full_name: user.user_metadata?.full_name ?? null,
    is_active: true,
  };
  const { error: insertError } = await supabase.from('users').insert(profilePayload);
  if (!insertError) return;

  // 3. Email unique-constraint conflict → stale Clerk row exists
  //    Delete it and re-insert with the correct Supabase UUID
  if (insertError.code === '23505') {
    await supabase.from('users').delete().eq('email', user.email ?? '');
    const { error: retryError } = await supabase.from('users').insert(profilePayload);
    if (retryError) console.warn('[AuthContext] ensureUserProfile retry:', retryError.message);
  } else {
    console.warn('[AuthContext] ensureUserProfile:', insertError.message);
  }
};


export const AuthProvider = ({ children }: { children: React.ReactNode }) => {
  const [session, setSession] = useState<Session | null>(null);
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    // Restore existing session on app start
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      setUser(session?.user ?? null);
      if (session?.user) ensureUserProfile(session.user);
      setIsLoading(false);
    });

    // React to sign-in / sign-out / token-refresh events
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session);
      setUser(session?.user ?? null);
      if (session?.user) ensureUserProfile(session.user);
      setIsLoading(false);
    });

    return () => subscription.unsubscribe();
  }, []);

  const signOut = async () => {
    await supabase.auth.signOut();
  };

  return (
    <AuthContext.Provider value={{ session, user, isLoading, signOut }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuthContext = () => useContext(AuthContext);
