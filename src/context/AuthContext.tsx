import { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import { Session } from '@supabase/supabase-js';
import { supabase } from '../lib/supabase';
import { usePushRegistration } from '../hooks/usePushRegistration';
import { unregisterPushToken } from '../lib/notifications';

interface AuthContextValue {
  session: Session | null;
  loading: boolean;
  signIn: (email: string, password: string) => Promise<{ error: string | null }>;
  signUp: (email: string, password: string) => Promise<{ error: string | null }>;
  signOut: () => Promise<{ error: string | null }>;
  resetPassword: (email: string) => Promise<{ error: string | null }>;
}

const AuthContext = createContext<AuthContextValue | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);

  usePushRegistration(session?.user.id ?? null);

  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => {
      setSession(data.session);
      setLoading(false);
    });

    const { data: listener } = supabase.auth.onAuthStateChange((_event, newSession) => {
      setSession(newSession);
    });

    return () => listener.subscription.unsubscribe();
  }, []);

  const signIn: AuthContextValue['signIn'] = async (email, password) => {
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    return { error: error?.message ?? null };
  };

  const signUp: AuthContextValue['signUp'] = async (email, password) => {
    const { error } = await supabase.auth.signUp({ email, password });
    return { error: error?.message ?? null };
  };

  const signOut: AuthContextValue['signOut'] = async () => {
    try {
      // Must run while the JWT is still valid; never throws.
      await unregisterPushToken();

      const { error } = await supabase.auth.signOut();
      if (error) {
        console.error('[AuthContext] signOut error:', error.message);
        return { error: error.message };
      }
      return { error: null };
    } catch (err) {
      // This branch is what was silently swallowing the earlier bug —
      // a thrown error (e.g. a storage read/write failure) never reached
      // the UI because nothing was catching or logging it. Now it does.
      const message = err instanceof Error ? err.message : 'Sign out failed';
      console.error('[AuthContext] signOut threw:', message);
      return { error: message };
    }
  };

  const resetPassword: AuthContextValue['resetPassword'] = async (email) => {
    const { error } = await supabase.auth.resetPasswordForEmail(email);
    return { error: error?.message ?? null };
  };

  return (
    <AuthContext.Provider value={{ session, loading, signIn, signUp, signOut, resetPassword }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within an AuthProvider');
  return ctx;
}