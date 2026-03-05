'use client';

import { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import { supabase, isSupabaseConfigured } from '@/lib/supabase-client';

interface AuthContextType {
  user: any | null;
  loading: boolean;
}

const AuthContext = createContext<AuthContextType>({ user: null, loading: true });

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<any | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!isSupabaseConfigured()) {
      setLoading(false);
      return;
    }

    // Get current session
    supabase?.auth.getSession().then((result: any) => {
      setUser(result.data?.session?.user || null);
      setLoading(false);
    }).catch((error: any) => {
      console.error('Error fetching session:', error);
      setLoading(false);
    });

    // Listen for auth changes
    const subscription = supabase?.auth.onAuthStateChange((_event: any, session: any) => {
      setUser(session?.user || null);
      setLoading(false);
    });

    return () => {
      subscription?.data?.subscription?.unsubscribe();
    };
  }, []);

  return (
    <AuthContext.Provider value={{ user, loading }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  return useContext(AuthContext);
}
