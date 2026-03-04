'use client';

import { useState } from 'react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '';
const supabase = createClient(supabaseUrl, supabaseAnonKey);

export default function RegisterPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  const handleSignUp = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setIsLoading(true);

    try {
      // Validation
      if (!email || !password || !confirmPassword) {
        setError('All fields are required');
        setIsLoading(false);
        return;
      }

      if (password !== confirmPassword) {
        setError('Passwords do not match');
        setIsLoading(false);
        return;
      }

      if (password.length < 8) {
        setError('Password must be at least 8 characters');
        setIsLoading(false);
        return;
      }

      // Sign up with Supabase
      const { data, error: supabaseError } = await supabase.auth.signUp({
        email,
        password,
        options: {
          emailRedirectTo: `${window.location.origin}/auth/callback`,
        },
      });

      if (supabaseError) {
        if (supabaseError.message.includes('already registered')) {
          setError('This email is already registered. Try signing in instead.');
        } else {
          setError(supabaseError.message);
        }
        setIsLoading(false);
        return;
      }

      if (data.user) {
        setSuccess(true);
        setEmail('');
        setPassword('');
        setConfirmPassword('');
      }
    } catch (err: any) {
      setError(err.message || 'An error occurred');
      setIsLoading(false);
    }
  };

  if (success) {
    return (
      <div className="space-y-6 p-6">
        <div className="bg-green-50 border border-green-200 rounded-lg p-6 text-center">
          <h2 className="text-2xl font-bold text-green-900 mb-2">✅ Check Your Email</h2>
          <p className="text-green-800 mb-4">
            We've sent you a confirmation link. Click it to verify your email and activate your account.
          </p>
          <p className="text-sm text-green-700">
            Once verified, you can sign in with your email and password.
          </p>
        </div>

        <div className="text-center">
          <Link href="/auth/login" className="text-blue-600 hover:underline font-semibold">
            Return to Sign In
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6 p-6">
      <div>
        <h2 className="text-2xl font-bold text-gray-900">Create Account</h2>
        <p className="mt-1 text-sm text-gray-600">Sign up to get started</p>
      </div>

      {error && (
        <Alert variant="destructive">
          <AlertTitle>Error</AlertTitle>
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      <form onSubmit={handleSignUp} className="space-y-4">
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
          <Label htmlFor="password">Password</Label>
          <Input
            id="password"
            type="password"
            placeholder="At least 8 characters"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            disabled={isLoading}
            required
          />
          <p className="text-xs text-gray-500">Must be at least 8 characters</p>
        </div>

        <div className="space-y-2">
          <Label htmlFor="confirmPassword">Confirm Password</Label>
          <Input
            id="confirmPassword"
            type="password"
            placeholder="••••••••"
            value={confirmPassword}
            onChange={(e) => setConfirmPassword(e.target.value)}
            disabled={isLoading}
            required
          />
        </div>

        <div className="flex items-start gap-2">
          <input
            type="checkbox"
            id="terms"
            className="mt-1 h-4 w-4 rounded border-gray-300"
            required
            disabled={isLoading}
          />
          <Label htmlFor="terms" className="text-xs">
            I agree to the{' '}
            <Link href="/terms" className="text-blue-600 hover:underline">
              Terms of Service
            </Link>
            {' '}and{' '}
            <Link href="/privacy" className="text-blue-600 hover:underline">
              Privacy Policy
            </Link>
          </Label>
        </div>

        <Button type="submit" className="w-full" disabled={isLoading}>
          {isLoading ? 'Creating account...' : 'Create Account'}
        </Button>
      </form>

      <p className="text-center text-sm text-gray-600">
        Already have an account?{' '}
        <Link href="/auth/login" className="font-semibold text-blue-600 hover:underline">
          Sign in
        </Link>
      </p>

      <div className="bg-blue-50 border border-blue-200 rounded p-3 text-xs text-blue-900">
        <p className="font-semibold mb-1">✅ Powered by Supabase</p>
        <p>Your account will be securely stored in Supabase. Email verification required.</p>
      </div>
    </div>
  );
}
