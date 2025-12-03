'use client';

import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import { ModernSidebar } from '@/components/modern-sidebar';
import WritgoAgentWidget from '@/components/writgo-agent-widget';

export default function ClientPortalLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const { data: session, status } = useSession() || {};
  const router = useRouter();
  const [isMounted, setIsMounted] = useState(false);

  useEffect(() => {
    setIsMounted(true);
  }, []);

  useEffect(() => {
    if (status === 'unauthenticated') {
      router.push('/client-login');
    }
  }, [status, router]);

  if (status === 'loading') {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-950">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-blue-500 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          {isMounted && <p className="text-gray-400">Laden...</p>}
        </div>
      </div>
    );
  }

  if (!session) {
    return null;
  }

  // Allow both clients and admins to access the portal
  return (
    <div className="flex min-h-screen bg-gray-950">
      <ModernSidebar />
      <div className="flex-1 overflow-x-hidden lg:ml-0">
        <div className="pt-16 lg:pt-0">
          {children}
        </div>
      </div>
      {/* AI Agent Widget - altijd beschikbaar */}
      <WritgoAgentWidget />
    </div>
  );
}
