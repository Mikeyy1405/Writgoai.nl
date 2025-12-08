/**
 * Legacy Redirect: /dashboard/agency -> /admin
 */

'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';

export default function LegacyAgencyDashboardPage() {
  const router = useRouter();

  useEffect(() => {
    router.replace('/admin');
  }, [router]);

  return (
    <div className="flex items-center justify-center min-h-screen bg-black">
      <p className="text-gray-400">Redirecting to Admin Portal...</p>
    </div>
  );
}
