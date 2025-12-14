'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useSession } from 'next-auth/react';

export default function DashboardKalenderPage() {
  const router = useRouter();
  const { data: session, status } = useSession();

  useEffect(() => {
    if (status === 'authenticated') {
      // Redirect naar de client-portal content kalender
      router.replace('/client-portal/content-kalender');
    } else if (status === 'unauthenticated') {
      router.replace('/login');
    }
  }, [status, router]);

  return (
    <div className="min-h-screen bg-black flex items-center justify-center">
      <div className="text-white">Laden...</div>
    </div>
  );
}
