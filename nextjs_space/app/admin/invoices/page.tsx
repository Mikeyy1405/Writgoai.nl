/**
 * Admin Invoices Page
 * Redirects from /dashboard/agency/invoices
 */

'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';

export default function AdminInvoicesPage() {
  const router = useRouter();

  useEffect(() => {
    // Redirect to the actual invoices page
    router.replace('/dashboard/agency/invoices');
  }, [router]);

  return (
    <div className="flex items-center justify-center min-h-screen">
      <p className="text-gray-400">Redirecting...</p>
    </div>
  );
}
