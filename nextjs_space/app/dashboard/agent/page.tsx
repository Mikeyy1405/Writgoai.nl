/**
 * AI Agent Terminal Page
 * Terminal-style chat interface for the admin to interact with the AI agent
 */

import { Metadata } from 'next';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth-options';
import { redirect } from 'next/navigation';
import { AgentTerminal } from '@/components/agent/agent-terminal';

export const metadata: Metadata = {
  title: 'AI Agent Terminal | WritgoAI',
  description: 'Chat met de AI agent om taken uit te voeren',
};

export default async function AgentPage() {
  // Check authentication
  const session = await getServerSession(authOptions);
  
  if (!session?.user) {
    redirect('/login');
  }

  // Check if user is admin
  const user = session.user as any;
  if (user.role !== 'admin' && user.role !== 'superadmin') {
    redirect('/dashboard');
  }

  return (
    <div className="h-screen w-full">
      <AgentTerminal />
    </div>
  );
}
