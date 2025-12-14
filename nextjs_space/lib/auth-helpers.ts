/**
 * Authentication Helper Functions
 * 
 * Provides consistent client lookup and authentication patterns
 * to avoid session.user.id vs client.id confusion.
 * 
 * SECURITY NOTE:
 * - getAuthenticatedClient() returns the Client record for the authenticated user
 * - This works for both regular clients AND admin users who have client records
 * - The function ensures data isolation by requiring a valid Client table record
 * - Use this instead of session.user.id to ensure correct client lookup
 */

import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth-options';
import { prisma } from '@/lib/db';

export interface AuthenticatedClientResult {
  session: {
    user: {
      id: string;
      email: string;
      name?: string | null;
      role?: string;
    };
  };
  client: {
    id: string;
    email: string;
    name: string | null;
    subscriptionCredits: number;
    topUpCredits: number;
    // Add other client fields as needed
  };
}

export interface AuthErrorResult {
  error: string;
  status: 401 | 404;
}

/**
 * Get authenticated client from session
 * 
 * This function resolves the session.user.id vs client.id mismatch by:
 * 1. Getting the session (which contains user info from either User or Client table)
 * 2. Looking up the actual Client record via email
 * 3. Returning both session and client for use in API endpoints
 * 
 * @returns Object with session and client, or error object
 */
export async function getAuthenticatedClient(): Promise<AuthenticatedClientResult | AuthErrorResult> {
  const session = await getServerSession(authOptions);
  
  if (!session?.user?.email) {
    return { error: 'Niet ingelogd', status: 401 };
  }
  
  // Look up the Client record via email
  // This is CRITICAL because session.user.id might be from User table,
  // but we need the Client table ID for clientId foreign keys
  const client = await prisma.client.findUnique({
    where: { email: session.user.email },
    select: {
      id: true,
      email: true,
      name: true,
      subscriptionCredits: true,
      topUpCredits: true,
    }
  });
  
  if (!client) {
    return { error: 'Client niet gevonden', status: 404 };
  }
  
  return { 
    session: {
      user: {
        id: session.user.id,
        email: session.user.email,
        name: session.user.name,
        role: session.user.role,
      }
    }, 
    client 
  };
}

/**
 * Check if the result is an error
 */
export function isAuthError(result: AuthenticatedClientResult | AuthErrorResult): result is AuthErrorResult {
  return 'error' in result;
}
