/**
 * Admin Settings Page
 * Redirects from /dashboard/agency/settings
 */

'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';

export default function AdminSettingsPage() {
  const router = useRouter();

  useEffect(() => {
    // Redirect to the actual settings page
    router.replace('/dashboard/agency/settings');
  }, [router]);

  return (
    <div className="flex items-center justify-center min-h-screen">
      <p className="text-gray-400">Redirecting...</p>
    </div>
  );
}
