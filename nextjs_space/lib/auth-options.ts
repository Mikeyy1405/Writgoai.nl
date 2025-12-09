
import { NextAuthOptions } from 'next-auth';
import CredentialsProvider from 'next-auth/providers/credentials';
import { PrismaAdapter } from '@next-auth/prisma-adapter';
import { prisma } from '@/lib/db';
import bcrypt from 'bcryptjs';

// Admin emails that should get admin privileges
const adminEmails = ['info@writgoai.nl', 'info@writgo.nl'];

export const authOptions: NextAuthOptions = {
  adapter: PrismaAdapter(prisma),
  providers: [
    // Universal Login Provider - checks both User and Client tables
    CredentialsProvider({
      id: 'universal-login',
      name: 'Universal Login',
      credentials: {
        email: { label: 'Email', type: 'email' },
        password: { label: 'Password', type: 'password' },
      },
      async authorize(credentials) {
        if (!credentials?.email || !credentials?.password) {
          throw new Error('Email en wachtwoord zijn verplicht');
        }

        // Check if admin user (info@WritgoAI.nl or other users in User table)
        const user = await prisma.user.findUnique({
          where: { email: credentials.email },
        });

        if (user && user.password) {
          const isPasswordValid = await bcrypt.compare(
            credentials.password,
            user.password
          );

          if (isPasswordValid) {
            return {
              id: user.id,
              email: user.email,
              name: user.name,
              role: user.role || 'admin',
            };
          }
        }

        // Check if client user
        const client = await prisma.client.findUnique({
          where: { email: credentials.email },
        });

        if (client && client.password) {
          const isPasswordValid = await bcrypt.compare(
            credentials.password,
            client.password
          );

          if (isPasswordValid) {
            // Special handling for admin emails - give admin role
            const role = adminEmails.includes(client.email.toLowerCase()) ? 'admin' : 'client';
            
            return {
              id: client.id,
              email: client.email,
              name: client.name,
              role: role,
            };
          }
        }

        throw new Error('Ongeldige inloggegevens');
      },
    }),
    // Legacy admin-login provider for backwards compatibility
    CredentialsProvider({
      id: 'admin-login',
      name: 'Admin Login',
      credentials: {
        email: { label: 'Email', type: 'email' },
        password: { label: 'Password', type: 'password' },
      },
      async authorize(credentials) {
        if (!credentials?.email || !credentials?.password) {
          throw new Error('Email en wachtwoord zijn verplicht');
        }

        const user = await prisma.user.findUnique({
          where: { email: credentials.email },
        });

        if (!user || !user.password) {
          throw new Error('Ongeldige inloggegevens');
        }

        const isPasswordValid = await bcrypt.compare(
          credentials.password,
          user.password
        );

        if (!isPasswordValid) {
          throw new Error('Ongeldige inloggegevens');
        }

        return {
          id: user.id,
          email: user.email,
          name: user.name,
          role: user.role || 'admin',
        };
      },
    }),
    // Legacy client-login provider for backwards compatibility
    CredentialsProvider({
      id: 'client-login',
      name: 'Client Login',
      credentials: {
        email: { label: 'Email', type: 'email' },
        password: { label: 'Password', type: 'password' },
      },
      async authorize(credentials) {
        if (!credentials?.email || !credentials?.password) {
          throw new Error('Email en wachtwoord zijn verplicht');
        }

        const client = await prisma.client.findUnique({
          where: { email: credentials.email },
        });

        if (!client || !client.password) {
          throw new Error('Ongeldige inloggegevens');
        }

        const isPasswordValid = await bcrypt.compare(
          credentials.password,
          client.password
        );

        if (!isPasswordValid) {
          throw new Error('Ongeldige inloggegevens');
        }

        // Special handling for admin emails - give admin role
        const role = adminEmails.includes(client.email.toLowerCase()) ? 'admin' : 'client';

        return {
          id: client.id,
          email: client.email,
          name: client.name,
          role: role,
        };
      },
    }),
  ],
  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        token.id = user.id;
        token.role = user.role;
      }
      return token;
    },
    async session({ session, token }) {
      if (session.user) {
        session.user.id = token.id as string;
        session.user.role = token.role as string;
      }
      return session;
    },
  },
  pages: {
    signIn: '/inloggen',
    error: '/inloggen',
  },
  session: {
    strategy: 'jwt',
  },
  secret: process.env.NEXTAUTH_SECRET,
  debug: process.env.NODE_ENV === 'development',
};
