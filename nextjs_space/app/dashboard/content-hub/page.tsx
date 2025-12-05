'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Loader2 } from 'lucide-react';

/**
 * Dashboard Content Hub page - Redirects to Agency Content Hub
 * This page redirects to the agency-specific content hub for Writgo.nl blog management.
 */
export default function DashboardContentHubPage() {
  const router = useRouter();

  useEffect(() => {
    // Redirect to Agency Content Hub
    router.replace('/dashboard/agency/content-hub');
  }, [router]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-black">
      <div className="text-center">
        <Loader2 className="w-16 h-16 animate-spin text-[#FF9933] mx-auto mb-4" />
        <p className="text-zinc-400">Doorverwijzen naar Content Hub...</p>
      </div>
    </div>
  );
}
