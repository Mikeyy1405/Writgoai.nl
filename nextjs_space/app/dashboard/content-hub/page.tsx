'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Loader2 } from 'lucide-react';

/**
 * Dashboard Content Hub page - Redirects to Client Portal Content Hub
 * This page has been deprecated in favor of the unified Content Hub interface.
 */
export default function DashboardContentHubPage() {
  const router = useRouter();

  useEffect(() => {
    // Redirect to Client Portal Content Hub
    router.replace('/client-portal/content-hub');
  }, [router]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-black">
      <div className="text-center">
        <Loader2 className="w-16 h-16 border-4 border-[#FF9933] animate-spin mx-auto mb-4" />
        <p className="text-zinc-400">Doorverwijzen naar Content Hub...</p>
      </div>
    </div>
  );
}
