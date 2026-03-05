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
        // Get current session
        const { data: { session }, error } = await supabase!.auth.getSession();
        if (isMounted) {
          if (error) {
            console.error('Error fetching session:', error);
            setUser(null);
          } else {
            setUser(session?.user || null);
          }
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
    const authStateResponse = supabase!.auth.onAuthStateChange((_event: any, session: any) => {
      if (isMounted) {
        setUser(session?.user || null);
        setLoading(false);
      }
    });

    return () => {
      isMounted = false;
      authStateResponse?.data?.subscription?.unsubscribe();
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
