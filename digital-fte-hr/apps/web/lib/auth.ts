/**
 * NextAuth.js v5 Configuration
 * Integrates with Amazon Cognito for OAuth authentication
 * Also includes Credentials provider for development/testing
 */

import NextAuth from 'next-auth';
import type { NextAuthConfig } from 'next-auth';
import Cognito from 'next-auth/providers/cognito';
import Credentials from 'next-auth/providers/credentials';
import { z } from 'zod';

// Mock user database - replace with real database in production
const mockUsers = new Map<string, { id: string; email: string; password: string; name: string }>();

// Pre-populate with test user
mockUsers.set('test@example.com', {
  id: '1',
  email: 'test@example.com',
  password: 'Password123',
  name: 'Test User',
});

const credentialsSchema = z.object({
  email: z.string().email('Invalid email address'),
  password: z.string().min(1, 'Password is required'),
});

export const authConfig: NextAuthConfig = {
  providers: [
    Credentials({
      name: 'Email',
      credentials: {
        email: { label: 'Email', type: 'email', placeholder: 'your@email.com' },
        password: { label: 'Password', type: 'password' },
      },
      async authorize(credentials) {
        if (!credentials) {
          const error = new Error('Email and password required');
          error.cause = { type: 'EmailPasswordMissing' };
          throw error;
        }

        try {
          const { email, password } = credentialsSchema.parse(credentials);

          // Check if user exists
          const user = mockUsers.get(email.toLowerCase());

          if (!user) {
            const error = new Error('Account not found. Please create an account first.');
            error.cause = { type: 'AccountNotFound' };
            throw error;
          }

          // Check password
          if (user.password !== password) {
            const error = new Error('Wrong password. Please try again.');
            error.cause = { type: 'WrongPassword' };
            throw error;
          }

          // Return user object
          return {
            id: user.id,
            email: user.email,
            name: user.name,
          };
        } catch (error) {
          if (error instanceof z.ZodError) {
            const err = new Error(error.errors[0].message);
            err.cause = { type: 'ValidationError' };
            throw err;
          }
          // Re-throw with error type
          if (error instanceof Error) {
            throw error;
          }
          throw new Error('Authentication failed');
        }
      },
    }),
    Cognito({
      clientId: process.env.AWS_COGNITO_CLIENT_ID,
      clientSecret: process.env.AWS_COGNITO_CLIENT_SECRET,
      issuer: process.env.AWS_COGNITO_ISSUER,
    }),
  ],

  pages: {
    signIn: '/auth/login',
    error: '/auth/error',
  },

  callbacks: {
    async jwt({ token, account, user }) {
      if (account) {
        // Store OAuth token and expiration
        token.accessToken = account.access_token;
        token.refreshToken = account.refresh_token;
        token.expiresAt = account.expires_at;
      }

      if (user) {
        token.id = user.id;
        token.email = user.email;
      }

      // Refresh token if expired
      if (token.expiresAt && Date.now() >= (token.expiresAt as number) * 1000) {
        return refreshAccessToken(token);
      }

      return token;
    },

    async session({ session, token }) {
      if (session.user) {
        session.user.id = token.id as string;
        session.accessToken = token.accessToken as string;
      }
      return session;
    },

    async authorized({ auth, request: { nextUrl } }) {
      const isLoggedIn = !!auth?.user;
      const isAuthPage = nextUrl.pathname.startsWith('/auth');

      if (isAuthPage) {
        return !isLoggedIn;
      }

      if (!isLoggedIn) {
        return false;
      }

      return true;
    },
  },

  session: {
    strategy: 'jwt',
    maxAge: 30 * 24 * 60 * 60, // 30 days
  },

  jwt: {
    maxAge: 30 * 24 * 60 * 60, // 30 days
  },

  trustHost: true,

  logger: {
    error: (error: Error) => {
      console.error('NextAuth error:', error.message);
    },
    warn: (code: string) => {
      console.warn('NextAuth warning:', code);
    },
  },
};

/**
 * Refresh OAuth token when expired
 */
async function refreshAccessToken(token: any) {
  try {
    const url = `${process.env.AWS_COGNITO_ISSUER}/oauth2/token`;

    const response = await fetch(url, {
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: new URLSearchParams({
        client_id: process.env.AWS_COGNITO_CLIENT_ID!,
        client_secret: process.env.AWS_COGNITO_CLIENT_SECRET!,
        grant_type: 'refresh_token',
        refresh_token: token.refreshToken,
      }),
      method: 'POST',
    });

    const refreshedTokens = await response.json();

    if (!response.ok) {
      throw refreshedTokens;
    }

    return {
      ...token,
      accessToken: refreshedTokens.access_token,
      expiresAt: Math.floor(Date.now() / 1000) + refreshedTokens.expires_in,
      refreshToken: refreshedTokens.refresh_token ?? token.refreshToken,
    };
  } catch (error) {
    console.error('Token refresh failed:', error);
    return { ...token, error: 'RefreshAccessTokenError' };
  }
}

declare module 'next-auth' {
  interface Session {
    user?: {
      id: string;
      email?: string | null;
      image?: string | null;
      name?: string | null;
    };
    accessToken?: string;
  }

  interface User {
    id: string;
  }
}

// JWT module augmentation moved to next-auth module

export const { handlers, signIn, signOut, auth } = NextAuth(authConfig);

// Export for API routes (user registration)
export { mockUsers };
