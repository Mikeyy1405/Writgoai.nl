/**
 * Legacy Redirect: /dashboard/agency/invoices -> /admin/invoices
 */

'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';

export default function LegacyInvoicesPage() {
  const router = useRouter();

  useEffect(() => {
    router.replace('/admin/invoices');
  }, [router]);

  return (
    <div className="flex items-center justify-center min-h-screen bg-black">
      <p className="text-gray-400">Redirecting to Admin Portal...</p>
    </div>
  );
}
