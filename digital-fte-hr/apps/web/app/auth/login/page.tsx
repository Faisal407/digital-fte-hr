'use client';

import { useState } from 'react';
import { signIn } from 'next-auth/react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '';
const supabase = createClient(supabaseUrl, supabaseAnonKey);

export default function LoginPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleEmailLogin = async (e: React.FormEvent) => {
    e.preventDefault();
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
      const { data, error: supabaseError } = await supabase.auth.signInWithPassword({
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
        // Sign in to NextAuth with the Supabase user
        const result = await signIn('credentials', {
          email: data.user.email,
          redirect: true,
          callbackUrl: '/dashboard',
        });

        if (!result?.ok) {
          setError('Failed to create session');
        }
      }
    } catch (err: any) {
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

      {error && (
        <Alert variant="destructive">
          <AlertTitle>Error</AlertTitle>
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

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

      <div className="relative">
        <div className="absolute inset-0 flex items-center">
          <div className="w-full border-t border-gray-300" />
        </div>
        <div className="relative flex justify-center text-sm">
          <span className="bg-white px-2 text-gray-500">Or continue with</span>
        </div>
      </div>

      <div className="space-y-2">
        <Button
          onClick={() => signIn('github', { callbackUrl: '/dashboard' })}
          variant="outline"
          className="w-full"
          disabled={isLoading}
        >
          Sign in with GitHub
        </Button>
        <Button
          onClick={() => signIn('google', { callbackUrl: '/dashboard' })}
          variant="outline"
          className="w-full"
          disabled={isLoading}
        >
          Sign in with Google
        </Button>
      </div>

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
    </div>
  );
}
