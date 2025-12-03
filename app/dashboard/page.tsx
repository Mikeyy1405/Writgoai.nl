'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useSession } from 'next-auth/react';

export default function DashboardPage() {
  const router = useRouter();
  const { data: session, status } = useSession();

  useEffect(() => {
    if (status === 'loading') return;
    
    // Admin goes to agency dashboard
    if (session?.user?.email === 'info@writgo.nl') {
      router.replace('/dashboard/agency');
    } else {
      // Regular clients go to client portal
      router.replace('/client-portal');
    }
  }, [router, session, status]);

  return (
    <div className="flex items-center justify-center min-h-screen bg-black">
      <div className="text-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-500 mx-auto"></div>
        <p className="mt-4 text-zinc-400">Doorverwijzen...</p>
      </div>
    </div>
  );
}
