'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { useToast } from '@/store/ui-store';
import { registerSchema } from '@/lib/validators';

interface FormErrors {
  email?: string;
  password?: string;
  passwordConfirm?: string;
  firstName?: string;
  lastName?: string;
  agreeToTerms?: string;
}

export default function RegisterPage() {
  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
    email: '',
    password: '',
    passwordConfirm: '',
    agreeToTerms: false,
  });
  const [errors, setErrors] = useState<FormErrors>({});
  const [isLoading, setIsLoading] = useState(false);
  const [generalError, setGeneralError] = useState<string | null>(null);
  const router = useRouter();
  const { success } = useToast();

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value, type, checked } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value,
    }));
    // Clear error for this field when user starts typing
    if (errors[name as keyof FormErrors]) {
      setErrors((prev) => ({
        ...prev,
        [name]: undefined,
      }));
    }
  };

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setGeneralError(null);
    setErrors({});
    setIsLoading(true);

    try {
      // Validate form data with Zod
      const validatedData = registerSchema.parse(formData);

      const response = await fetch('/api/auth/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: validatedData.email,
          password: validatedData.password,
          firstName: validatedData.firstName,
          lastName: validatedData.lastName,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        // Handle different error types
        if (data.error?.code === 'USER_EXISTS') {
          setGeneralError(
            'An account with this email already exists. Please sign in with your password.'
          );
        } else if (data.error?.code === 'VALIDATION_ERROR') {
          setGeneralError(data.error.message || 'Please check your input and try again');
        } else {
          setGeneralError(data.error?.message || 'Failed to create account');
        }
        return;
      }

      success('Account Created Successfully! 🎉', 'Redirecting to sign in...');

      // Redirect after a short delay so user can see success message
      setTimeout(() => {
        router.push('/auth/login');
      }, 1500);
    } catch (err: any) {
      if (err.errors) {
        // Zod validation errors - set field-specific errors
        const fieldErrors: FormErrors = {};
        err.errors.forEach((error: any) => {
          const field = error.path[0];
          fieldErrors[field as keyof FormErrors] = error.message;
        });
        setErrors(fieldErrors);
      } else {
        // General error
        setGeneralError(err instanceof Error ? err.message : 'An unexpected error occurred');
      }
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="space-y-6 p-6">
      <div>
        <h2 className="text-2xl font-bold text-gray-900">Create Account</h2>
        <p className="mt-1 text-sm text-gray-600">
          Join Digital FTE and accelerate your career
        </p>
      </div>

      {generalError && (
        <Alert variant="destructive">
          <AlertTitle>Error</AlertTitle>
          <AlertDescription>{generalError}</AlertDescription>
        </Alert>
      )}

      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label htmlFor="firstName">First Name</Label>
            <Input
              id="firstName"
              name="firstName"
              placeholder="John"
              value={formData.firstName}
              onChange={handleChange}
              required
              disabled={isLoading}
              className={errors.firstName ? 'border-red-500' : ''}
            />
            {errors.firstName && (
              <p className="text-xs text-red-600">{errors.firstName}</p>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="lastName">Last Name</Label>
            <Input
              id="lastName"
              name="lastName"
              placeholder="Doe"
              value={formData.lastName}
              onChange={handleChange}
              required
              disabled={isLoading}
              className={errors.lastName ? 'border-red-500' : ''}
            />
            {errors.lastName && (
              <p className="text-xs text-red-600">{errors.lastName}</p>
            )}
          </div>
        </div>

        <div className="space-y-2">
          <Label htmlFor="email">Email Address</Label>
          <Input
            id="email"
            name="email"
            type="email"
            placeholder="your@email.com"
            value={formData.email}
            onChange={handleChange}
            required
            disabled={isLoading}
            className={errors.email ? 'border-red-500' : ''}
          />
          {errors.email && (
            <p className="text-xs text-red-600">{errors.email}</p>
          )}
        </div>

        <div className="space-y-2">
          <Label htmlFor="password">Password</Label>
          <Input
            id="password"
            name="password"
            type="password"
            placeholder="••••••••"
            value={formData.password}
            onChange={handleChange}
            required
            disabled={isLoading}
            className={errors.password ? 'border-red-500' : ''}
          />
          {errors.password && (
            <p className="text-xs text-red-600">{errors.password}</p>
          )}
          <p className="text-xs text-gray-500">
            At least 8 characters with uppercase, lowercase, and numbers
          </p>
        </div>

        <div className="space-y-2">
          <Label htmlFor="passwordConfirm">Confirm Password</Label>
          <Input
            id="passwordConfirm"
            name="passwordConfirm"
            type="password"
            placeholder="••••••••"
            value={formData.passwordConfirm}
            onChange={handleChange}
            required
            disabled={isLoading}
            className={errors.passwordConfirm ? 'border-red-500' : ''}
          />
          {errors.passwordConfirm && (
            <p className="text-xs text-red-600">{errors.passwordConfirm}</p>
          )}
        </div>

        <div className="flex items-start gap-2">
          <input
            id="agreeToTerms"
            name="agreeToTerms"
            type="checkbox"
            checked={formData.agreeToTerms}
            onChange={handleChange}
            required
            disabled={isLoading}
            className="mt-1 h-4 w-4 rounded border-gray-300"
          />
          <Label htmlFor="agreeToTerms" className="text-xs">
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
        {errors.agreeToTerms && (
          <p className="text-xs text-red-600">{errors.agreeToTerms}</p>
        )}

        <Button
          type="submit"
          className="w-full"
          disabled={isLoading}
        >
          {isLoading ? 'Creating account...' : 'Create Account'}
        </Button>
      </form>

      <p className="text-center text-sm text-gray-600">
        Already have an account?{' '}
        <Link
          href="/auth/login"
          className="font-semibold text-blue-600 hover:underline"
        >
          Sign in
        </Link>
      </p>
    </div>
  );
}
