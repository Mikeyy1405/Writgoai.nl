'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Loader2 } from 'lucide-react';

/**
 * Site Planner page - Redirects to Content Hub
 * This page has been deprecated in favor of the unified Content Hub interface.
 */
export default function SitePlannerPage() {
  const router = useRouter();

  useEffect(() => {
    // Redirect to Content Hub
    router.replace('/client-portal/projects');
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
