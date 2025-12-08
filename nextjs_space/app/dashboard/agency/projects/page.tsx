/**
 * Legacy Redirect: /dashboard/agency/projects -> /admin/projects
 */

'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';

export default function LegacyProjectsPage() {
  const router = useRouter();

  useEffect(() => {
    router.replace('/admin/projects');
  }, [router]);

  return (
    <div className="flex items-center justify-center min-h-screen bg-black">
      <p className="text-gray-400">Redirecting to Admin Portal...</p>
    </div>
  );
}
