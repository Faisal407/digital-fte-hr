'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { supabase, isSupabaseConfigured } from '@/lib/supabase-client';

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isConfigured, setIsConfigured] = useState(true);

  useEffect(() => {
    const configured = isSupabaseConfigured();
    setIsConfigured(configured);
    if (!configured) {
      setError('Supabase is not configured. Please set NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY in .env.local');
    }
  }, []);

  const handleEmailLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!isConfigured || !supabase) return;

    setError(null);
    setIsLoading(true);

    try {
      // Validate inputs
      if (!email || !password) {
        setError('Email and password are required');
        setIsLoading(false);
        return;
      }

      // Sign in with Supabase
      const { data, error: supabaseError } = await supabase!.auth.signInWithPassword({
        email,
        password,
      });

      if (supabaseError) {
        if (supabaseError.message.includes('Invalid login credentials')) {
          setError('Invalid email or password');
        } else if (supabaseError.message.includes('Email not confirmed')) {
          setError('Please verify your email first');
        } else {
          setError(supabaseError.message);
        }
        setIsLoading(false);
        return;
      }

      if (data.user) {
        // Supabase login successful - redirect to dashboard
        console.log('Login successful, redirecting to dashboard...');
        router.push('/dashboard');
      }
    } catch (err: any) {
      console.error('Login error:', err);
      setError(err.message || 'An error occurred');
      setIsLoading(false);
    }
  };

  return (
    <div className="space-y-6 p-6">
      <div>
        <h2 className="text-2xl font-bold text-gray-900">Sign In</h2>
        <p className="mt-1 text-sm text-gray-600">Enter your credentials or use social login</p>
      </div>

      {!isConfigured && (
        <Alert variant="destructive">
          <AlertTitle>Configuration Required</AlertTitle>
          <AlertDescription>
            Supabase credentials not configured. Add NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY to .env.local
          </AlertDescription>
        </Alert>
      )}

      {error && isConfigured && (
        <Alert variant="destructive">
          <AlertTitle>Error</AlertTitle>
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      {isConfigured ? (
        <>
          <form onSubmit={handleEmailLogin} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="email">Email Address</Label>
              <Input
                id="email"
                type="email"
                placeholder="you@example.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                disabled={isLoading}
                required
              />
            </div>

            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <Label htmlFor="password">Password</Label>
                <Link href="/auth/forgot-password" className="text-xs text-blue-600 hover:underline">
                  Forgot password?
                </Link>
              </div>
              <Input
                id="password"
                type="password"
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                disabled={isLoading}
                required
              />
            </div>

            <Button type="submit" className="w-full" disabled={isLoading}>
              {isLoading ? 'Signing in...' : 'Sign In'}
            </Button>
          </form>


          <p className="text-center text-sm text-gray-600">
            Don't have an account?{' '}
            <Link href="/auth/register" className="font-semibold text-blue-600 hover:underline">
              Sign up
            </Link>
          </p>

          <div className="bg-blue-50 border border-blue-200 rounded p-3 text-xs text-blue-900">
            <p className="font-semibold mb-1">✅ Powered by Supabase</p>
            <p>Your credentials are securely managed by Supabase Auth.</p>
          </div>
        </>
      ) : (
        <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
          <p className="text-sm text-yellow-900">
            Follow <strong>SUPABASE_SETUP.md</strong> to configure your Supabase credentials.
          </p>
        </div>
      )}
    </div>
  );
}
