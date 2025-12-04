'use client';

import { useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import {
  LayoutDashboard,
  Users,
  FileText,
  ClipboardList,
  MessageSquare,
  Receipt,
  Settings,
  TrendingUp,
  Bot,
  FolderKanban,
} from 'lucide-react';
import { UnifiedLayout } from '@/components/dashboard/unified-layout';

interface AgencyLayoutProps {
  children: React.ReactNode;
}

const agencyNavItems = [
  {
    label: 'Dashboard',
    href: '/dashboard/agency',
    icon: LayoutDashboard,
  },
  {
    label: 'Klanten',
    href: '/dashboard/agency/clients',
    icon: Users,
    adminOnly: true,
  },
  {
    label: 'Opdrachten',
    href: '/dashboard/agency/assignments',
    icon: ClipboardList,
  },
  {
    label: 'Verzoeken',
    href: '/dashboard/agency/requests',
    icon: MessageSquare,
    adminOnly: true,
  },
  {
    label: 'Facturen',
    href: '/dashboard/agency/invoices',
    icon: FileText,
    adminOnly: true,
  },
  // Analytics page doesn't exist yet - commented out to prevent 404 errors
  // {
  //   label: 'Analytics',
  //   href: '/dashboard/agency/analytics',
  //   icon: TrendingUp,
  //   adminOnly: true,
  // },
  {
    label: 'divider',
    href: '',
    icon: null,
    isDivider: true,
  },
  {
    label: 'AI Agent',
    href: '/dashboard/agent',
    icon: Bot,
    adminOnly: true,
    badge: 'NEW',
  },
  {
    label: 'Content Hub',
    href: '/dashboard/content-hub',
    icon: FolderKanban,
    adminOnly: true,
    badge: 'NEW',
  },
  {
    label: 'divider',
    href: '',
    icon: null,
    isDivider: true,
  },
  // Settings page doesn't exist yet - commented out to prevent 404 errors
  // {
  //   label: 'Instellingen',
  //   href: '/dashboard/agency/settings',
  //   icon: Settings,
  // },
];

export default function AgencyLayout({ children }: AgencyLayoutProps) {
  const { data: session, status } = useSession() || {};
  const router = useRouter();

  useEffect(() => {
    if (status === 'unauthenticated') {
      router.push('/inloggen');
    }
  }, [status, router]);

  if (status === 'loading') {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#FF9933]"></div>
      </div>
    );
  }

  return (
    <UnifiedLayout
      navItems={agencyNavItems}
      isAdmin={true}
      headerTitle="Agency Dashboard"
      headerDescription="Beheer klanten, opdrachten en facturen"
    >
      {children}
    </UnifiedLayout>
  );
}
