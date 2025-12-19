/**
 * Authentication Helper for Server Actions
 * Simplified auth wrapper for Next.js Server Actions
 */

import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth-options';
import { prisma } from '@/lib/db';

export interface AuthSession {
  user: {
    id: string;
    email: string;
    name?: string | null;
    role?: string;
  };
}

/**
 * Get authenticated session for Server Actions
 * Throws error if not authenticated
 */
export async function auth(): Promise<AuthSession> {
  const session = await getServerSession(authOptions);
  
  if (!session?.user?.email) {
    throw new Error('Niet geautoriseerd - log opnieuw in');
  }

  return {
    user: {
      id: session.user.id || '',
      email: session.user.email,
      name: session.user.name,
      role: session.user.role,
    },
  };
}

/**
 * Get client from authenticated session
 * Returns client data or throws error
 */
export async function getAuthenticatedClient() {
  const session = await auth();
  
  const client = await prisma.client.findUnique({
    where: { email: session.user.email },
  });

  if (!client) {
    throw new Error('Client niet gevonden');
  }

  return client;
}

/**
 * Check if user is admin
 */
export async function requireAdmin() {
  const session = await auth();
  
  if (session.user.role !== 'admin' && session.user.email !== 'info@WritgoAI.nl') {
    throw new Error('Toegang geweigerd - admin rechten vereist');
  }

  return session;
}

/**
 * Get authenticated user (works for both admins and clients)
 */
export async function getAuthenticatedUser() {
  const session = await auth();
  
  // Try to find in Client table first
  const client = await prisma.client.findUnique({
    where: { email: session.user.email },
  });

  if (client) {
    return { type: 'client' as const, user: client };
  }

  // Try User table
  const user = await prisma.user.findUnique({
    where: { email: session.user.email },
  });

  if (user) {
    return { type: 'admin' as const, user };
  }

  throw new Error('Gebruiker niet gevonden');
}
