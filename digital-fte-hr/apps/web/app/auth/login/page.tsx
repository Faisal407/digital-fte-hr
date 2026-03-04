'use client';

import { useState, useEffect } from 'react';
import { signIn } from 'next-auth/react';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { useToast } from '@/store/ui-store';

export default function LoginPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const router = useRouter();
  const searchParams = useSearchParams();
  const { success } = useToast();

  // Check for error from NextAuth
  useEffect(() => {
    const errorParam = searchParams.get('error');
    if (errorParam) {
      // Decode the error message
      const decodedError = decodeURIComponent(errorParam);
      setError(decodedError);
    }
  }, [searchParams]);

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setError(null);
    setIsLoading(true);

    try {
      // Validate inputs first
      if (!email || !email.trim()) {
        setError('Email address is required');
        setIsLoading(false);
        return;
      }

      if (!password || !password.trim()) {
        setError('Password is required');
        setIsLoading(false);
        return;
      }

      // Basic email validation
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(email)) {
        setError('Please enter a valid email address');
        setIsLoading(false);
        return;
      }

      // Attempt sign in with credentials provider
      const result = await signIn('credentials', {
        email: email.toLowerCase(),
        password,
        redirect: false,
      });

      // Handle authentication results
      if (!result) {
        setError('Authentication service unavailable. Please try again.');
        return;
      }

      // Check for specific error messages from our credentials provider
      if (result.error) {
        let displayError = result.error;

        // Map common NextAuth error codes and custom messages
        if (result.error.includes('not found')) {
          displayError = 'Account not found. Please create a new account first.';
        } else if (result.error.includes('Wrong password')) {
          displayError = 'Wrong password. Please try again.';
        } else if (result.error.includes('required')) {
          displayError = 'Email and password are required.';
        } else if (result.error === 'CredentialsSignin') {
          displayError = 'Invalid email or password. Please try again.';
        }

        setError(displayError);
        return;
      }

      if (!result.ok) {
        setError('Invalid email or password. Please try again.');
        return;
      }

      success('Login Successful!', 'Redirecting to dashboard...');

      // Small delay to show success message
      setTimeout(() => {
        router.push('/dashboard');
      }, 1000);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'An unexpected error occurred. Please try again.';
      setError(errorMessage);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="space-y-6 p-6">
      <div>
        <h2 className="text-2xl font-bold text-gray-900">Sign In</h2>
        <p className="mt-1 text-sm text-gray-600">
          Enter your credentials to access your account
        </p>
      </div>

      {error && (
        <Alert variant="destructive" className="mb-4">
          <AlertTitle>Authentication Error</AlertTitle>
          <AlertDescription className="mt-2">{error}</AlertDescription>
        </Alert>
      )}

      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="space-y-2">
          <Label htmlFor="email">Email Address</Label>
          <Input
            id="email"
            type="email"
            placeholder="your@email.com"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
            disabled={isLoading}
          />
        </div>

        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <Label htmlFor="password">Password</Label>
            <Link
              href="/auth/forgot-password"
              className="text-xs text-blue-600 hover:underline"
            >
              Forgot password?
            </Link>
          </div>
          <Input
            id="password"
            type="password"
            placeholder="••••••••"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
            disabled={isLoading}
          />
        </div>

        <Button
          type="submit"
          className="w-full"
          disabled={isLoading}
        >
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

      <Button
        variant="outline"
        className="w-full"
        onClick={() => signIn('cognito')}
        disabled={isLoading}
      >
        Sign in with Cognito
      </Button>

      <p className="text-center text-sm text-gray-600">
        Don't have an account?{' '}
        <Link
          href="/auth/register"
          className="font-semibold text-blue-600 hover:underline"
        >
          Create one
        </Link>
      </p>
    </div>
  );
}
