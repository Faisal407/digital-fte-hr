/**
 * Authentication Hooks
 * Session and user management with NextAuth
 */

import { useSession, signIn, signOut } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { useToast } from '@/store/ui-store';

export function useAuth() {
  const { data: session, status } = useSession();

  return {
    user: session?.user,
    accessToken: session?.accessToken,
    isLoading: status === 'loading',
    isAuthenticated: status === 'authenticated',
    isUnauthenticated: status === 'unauthenticated',
  };
}

export function useLogin() {
  const { success, error } = useToast();
  const router = useRouter();

  const login = async (email: string, password: string) => {
    try {
      const result = await signIn('credentials', {
        email,
        password,
        redirect: false,
      });

      if (!result?.ok) {
        error('Login Failed', result?.error || 'Invalid credentials');
        return false;
      }

      success('Login Successful', 'Redirecting to dashboard...');
      router.push('/dashboard');
      return true;
    } catch (err) {
      error('Login Error', err instanceof Error ? err.message : 'An error occurred');
      return false;
    }
  };

  return { login };
}

export function useLogout() {
  const router = useRouter();

  const logout = async () => {
    await signOut({ redirect: false });
    router.push('/');
  };

  return { logout };
}

export function useSignup() {
  const { success, error } = useToast();
  const router = useRouter();

  const signup = async (email: string, password: string, firstName: string, lastName: string) => {
    try {
      const response = await fetch('/api/auth/signup', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password, firstName, lastName }),
      });

      if (!response.ok) {
        const data = await response.json();
        error('Signup Failed', data.message || 'Failed to create account');
        return false;
      }

      success('Account Created', 'Redirecting to login...');
      router.push('/auth/login');
      return true;
    } catch (err) {
      error('Signup Error', err instanceof Error ? err.message : 'An error occurred');
      return false;
    }
  };

  return { signup };
}
