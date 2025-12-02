'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Loader2 } from 'lucide-react';

export default function SuperAdminDashboard() {
  const router = useRouter();

  useEffect(() => {
    router.replace('/dashboard/agency');
  }, [router]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-900">
      <div className="text-center">
        <Loader2 className="h-8 w-8 animate-spin text-green-500 mx-auto mb-4" />
        <p className="text-gray-400">Doorverwijzen naar Agency Dashboard...</p>
      </div>
    </div>
  );
}
