'use client';

import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { useEffect } from 'react';
import {
  LayoutDashboard,
  FileText,
  Video,
  ShoppingBag,
  Receipt,
  Settings,
  PenTool,
  Search,
  Map,
  Image,
  Wand2,
  Library,
  FolderKanban,
  Send,
  Plus,
} from 'lucide-react';
import { UnifiedLayout } from '@/components/dashboard/unified-layout';
import WritgoAgentWidget from '@/components/writgo-agent-widget';

const clientNavItems = [
  {
    label: 'Dashboard',
    href: '/client-portal',
    icon: LayoutDashboard,
  },
  {
    label: 'Content Maken',
    href: '/client-portal/create',
    icon: Plus,
  },
  {
    label: 'Mijn Content',
    href: '/client-portal/content-library',
    icon: Library,
  },
  {
    label: 'Publiceren',
    href: '/client-portal/publish',
    icon: Send,
  },
  {
    label: 'Instellingen',
    href: '/client-portal/account',
    icon: Settings,
  },
];

export default function ClientPortalLayout({
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
    
    // Admin moet naar agency dashboard, niet client portal
    if (status === 'authenticated' && session?.user?.email === 'info@writgo.nl') {
      router.push('/dashboard/agency');
      return;
    }
  }, [status, session, router]);

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
  const isAdmin = session?.user?.email === 'info@writgo.nl';

  return (
    <>
      <UnifiedLayout
        navItems={clientNavItems}
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
