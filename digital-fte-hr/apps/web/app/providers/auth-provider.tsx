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

    let isMounted = true;

    // Initialize auth state
    const initializeAuth = async () => {
      try {
        const result = await supabase!.auth.getSession();
        if (isMounted) {
          setUser(result?.data?.session?.user || null);
          setLoading(false);
        }
      } catch (error) {
        console.error('Auth initialization error:', error);
        if (isMounted) {
          setLoading(false);
        }
      }
    };

    initializeAuth();

    // Listen for auth changes
    try {
      const result = supabase!.auth.onAuthStateChange((_event: any, session: any) => {
        if (isMounted) {
          setUser(session?.user || null);
        }
      });

      const subscription = result?.data?.subscription;

      return () => {
        isMounted = false;
        if (subscription) {
          subscription.unsubscribe();
        }
      };
    } catch (error) {
      console.error('Auth state change setup error:', error);
      return () => {
        isMounted = false;
      };
    }
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
