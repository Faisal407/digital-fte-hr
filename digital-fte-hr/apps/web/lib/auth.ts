/**
 * NextAuth.js v5 Configuration
 * Uses Supabase Auth for authentication
 *
 * IMPORTANT: Supabase credentials required in .env.local
 * - NEXT_PUBLIC_SUPABASE_URL: Your Supabase project URL
 * - SUPABASE_SECRET: Service role secret key
 */

import NextAuth from 'next-auth';
import type { NextAuthConfig } from 'next-auth';
import GitHub from 'next-auth/providers/github';
import Google from 'next-auth/providers/google';

export const authConfig: NextAuthConfig = {
  providers: [
    // Email/Password handled by Supabase directly (see login page)
    GitHub({
      clientId: process.env.AUTH_GITHUB_ID,
      clientSecret: process.env.AUTH_GITHUB_SECRET,
    }),
    Google({
      clientId: process.env.AUTH_GOOGLE_ID,
      clientSecret: process.env.AUTH_GOOGLE_SECRET,
    }),
  ],

  pages: {
    signIn: '/auth/login',
    error: '/auth/error',
  },

  callbacks: {
    async jwt({ token, account, user }) {
      if (account) {
        token.accessToken = account.access_token;
        token.refreshToken = account.refresh_token;
      }

      if (user) {
        token.id = user.id;
        token.email = user.email;
      }

      return token;
    },

    async session({ session, token }) {
      if (session.user) {
        session.user.id = token.id as string;
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
