'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';

export default function DashboardPage() {
  const router = useRouter();

  useEffect(() => {
    // Redirect all users (admin and clients) to the Tools Dashboard
    router.replace('/client-portal');
  }, [router]);

  return (
    <div className="flex items-center justify-center min-h-screen bg-black">
      <div className="text-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#FF9933] mx-auto"></div>
        <p className="mt-4 text-zinc-400">Doorverwijzen naar Tools Dashboard...</p>
      </div>
    </div>
  );
}
