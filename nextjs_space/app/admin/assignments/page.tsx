/**
 * Admin Assignments Page
 * Redirects from /dashboard/agency/assignments
 */

'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';

export default function AdminAssignmentsPage() {
  const router = useRouter();

  useEffect(() => {
    // Redirect to the actual assignments page
    router.replace('/dashboard/agency/assignments');
  }, [router]);

  return (
    <div className="flex items-center justify-center min-h-screen">
      <p className="text-gray-400">Redirecting...</p>
    </div>
  );
}
