'use client';

import Link from 'next/link';
import { Button } from '@/components/ui/button';

export default function RegisterPage() {
  const handleCognitoSignUp = () => {
    // Redirect to Cognito Hosted UI signup page
    // Format: https://{cognito-domain}.auth.{region}.amazoncognito.com/signup?response_type=code&client_id={client_id}&redirect_uri={callback_url}
    const cognitoSignupUrl = process.env.NEXT_PUBLIC_COGNITO_SIGNUP_URL;

    if (!cognitoSignupUrl) {
      alert('Cognito signup URL not configured. Contact your administrator.');
      return;
    }

    window.location.href = cognitoSignupUrl;
  };

  return (
    <div className="space-y-6 p-6">
      <div>
        <h2 className="text-2xl font-bold text-gray-900">Create Account</h2>
        <p className="mt-1 text-sm text-gray-600">
          Sign up with AWS Cognito
        </p>
      </div>

      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
        <p className="text-sm text-blue-900 font-semibold mb-2">🔐 AWS Cognito Account Registration</p>
        <p className="text-sm text-blue-800">Create a new account through AWS Cognito's secure registration system.</p>
      </div>

      <Button
        onClick={handleCognitoSignUp}
        className="w-full bg-orange-600 hover:bg-orange-700 h-12 text-base"
      >
        Create Account with AWS Cognito
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
        Already have an account?{' '}
        <Link
          href="/auth/login"
          className="font-semibold text-blue-600 hover:underline"
        >
          Sign in
        </Link>
      </p>

      <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-3 text-sm">
        <p className="font-semibold text-yellow-900 mb-2">⚙️ How It Works</p>
        <ul className="text-yellow-800 space-y-1 text-xs">
          <li>✓ Click "Create Account with AWS Cognito"</li>
          <li>✓ You'll be redirected to AWS Cognito signup</li>
          <li>✓ Complete registration securely</li>
          <li>✓ Return to sign in with your new account</li>
        </ul>
      </div>

      <div className="bg-red-50 border border-red-200 rounded-lg p-3 text-sm">
        <p className="font-semibold text-red-900 mb-1">⚠️ Setup Required</p>
        <p className="text-red-800 text-xs">
          Admin needs to configure Cognito Hosted UI URL in environment variables before signup works.
        </p>
      </div>
    </div>
  );
}
