/**
 * NextAuth.js v5 Configuration
 * Uses AWS Cognito OAuth for authentication
 *
 * IMPORTANT: Real Cognito credentials required in .env.local
 * - AWS_COGNITO_CLIENT_ID: from Cognito App Client
 * - AWS_COGNITO_CLIENT_SECRET: from Cognito App Client
 * - AWS_COGNITO_ISSUER: https://cognito-idp.{region}.amazonaws.com/{user-pool-id}
 */

import NextAuth from 'next-auth';
import type { NextAuthConfig } from 'next-auth';
import Cognito from 'next-auth/providers/cognito';

export const authConfig: NextAuthConfig = {
  providers: [
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
