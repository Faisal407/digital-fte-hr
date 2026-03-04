'use client';

import { signIn } from 'next-auth/react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { useState } from 'react';

export default function LoginPage() {
  const [isLoading, setIsLoading] = useState(false);

  const handleCognitoSignIn = async () => {
    setIsLoading(true);
    await signIn('cognito', { redirect: true, callbackUrl: '/dashboard' });
  };

  return (
    <div className="space-y-6 p-6">
      <div>
        <h2 className="text-2xl font-bold text-gray-900">Sign In</h2>
        <p className="mt-1 text-sm text-gray-600">
          Sign in with your AWS Cognito account
        </p>
      </div>

      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 text-sm text-blue-900">
        <p className="font-semibold mb-2">🔐 AWS Cognito OAuth Authentication</p>
        <p>You'll be securely authenticated through AWS Cognito.</p>
      </div>

      <Button
        onClick={handleCognitoSignIn}
        disabled={isLoading}
        className="w-full bg-orange-600 hover:bg-orange-700 h-12 text-base"
      >
        {isLoading ? 'Signing in...' : 'Sign in with AWS Cognito'}
      </Button>

      <div className="relative">
        <div className="absolute inset-0 flex items-center">
          <div className="w-full border-t border-gray-300" />
        </div>
        <div className="relative flex justify-center text-sm">
          <span className="bg-white px-2 text-gray-500">Or</span>
        </div>
      </div>

      <p className="text-center text-sm text-gray-600">
        Don't have an account?{' '}
        <Link
          href="https://your-cognito-signup-url.com"
          className="font-semibold text-blue-600 hover:underline"
          target="_blank"
        >
          Sign up with Cognito
        </Link>
      </p>

      <div className="text-xs text-gray-500 bg-gray-50 p-3 rounded">
        <p className="font-semibold mb-1">ℹ️ Development Setup Required</p>
        <p>To use this app, you need valid AWS Cognito credentials configured in your environment.</p>
        <p className="mt-2 text-gray-600">Contact your administrator for access credentials.</p>
      </div>
    </div>
  );
}
