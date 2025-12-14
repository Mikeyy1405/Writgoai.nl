'use client';

import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { useEffect } from 'react';
import { UnifiedLayout } from '@/components/dashboard/unified-layout';
import WritgoAgentWidget from '@/components/writgo-agent-widget';
import { getClientNavItems } from '@/lib/client-navigation-simple';

export default function ClientLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const { data: session, status } = useSession() || {};
  const router = useRouter();

  useEffect(() => {
    if (status === 'unauthenticated') {
      router.push('/client-login');
      return;
    }
  }, [status, router]);

  if (status === 'loading') {
    return (
      <div className="min-h-screen flex items-center justify-center bg-black">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-[#FF9933] border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-zinc-400">Laden...</p>
        </div>
      </div>
    );
  }

  if (!session) {
    return null;
  }

  // Check if user is admin
  const isAdmin = session?.user?.role === 'admin' || session?.user?.role === 'superadmin';
  
  // Get simplified client navigation items
  const navItems = getClientNavItems();

  return (
    <>
      <UnifiedLayout
        navItems={navItems}
        isAdmin={isAdmin}
        headerTitle="Client Portal"
        headerDescription="Jouw persoonlijke content dashboard"
      >
        {children}
      </UnifiedLayout>
      {/* AI Agent Widget - altijd beschikbaar */}
      <WritgoAgentWidget />
    </>
  );
}
