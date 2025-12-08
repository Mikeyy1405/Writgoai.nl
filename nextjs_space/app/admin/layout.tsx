'use client';

import { useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { AdminLayout } from '@/components/admin/admin-layout';
import { isUserAdmin } from '@/lib/navigation-config';

interface AdminLayoutPropsType {
  children: React.ReactNode;
}

export default function AdminLayoutWrapper({ children }: AdminLayoutPropsType) {
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
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#FF6B35]"></div>
      </div>
    );
  }

  return <AdminLayout>{children}</AdminLayout>;
}
