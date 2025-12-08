'use client';

import { useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { UnifiedLayout } from '@/components/dashboard/unified-layout';
import { getNavItems, isUserAdmin } from '@/lib/navigation-config';

interface AdminLayoutProps {
  children: React.ReactNode;
}

export default function AdminLayout({ children }: AdminLayoutProps) {
  const { data: session, status } = useSession() || {};
  const router = useRouter();

  useEffect(() => {
    if (status === 'unauthenticated') {
      router.push('/client-login');
    } else if (status === 'authenticated') {
      // Check if user is admin
      const isAdmin = isUserAdmin(session?.user?.email, session?.user?.role);
      if (!isAdmin) {
        router.push('/client-portal');
      }
    }
  }, [status, session, router]);

  if (status === 'loading') {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#FF9933]"></div>
      </div>
    );
  }

  // Check if user is admin
  const isAdmin = isUserAdmin(session?.user?.email, session?.user?.role);
  
  // Get navigation items for admin
  const navItems = getNavItems(isAdmin);

  return (
    <UnifiedLayout
      navItems={navItems}
      isAdmin={isAdmin}
      headerTitle="Admin Portal"
      headerDescription="Beheer klanten, projecten en content"
    >
      {children}
    </UnifiedLayout>
  );
}
