'use client';

import { useEffect } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { Loader2 } from 'lucide-react';

export default function SuperAdminClientDetail() {
  const router = useRouter();
  const params = useParams();
  const clientId = params.id as string;

  useEffect(() => {
    router.replace(`/dashboard/agency/clients/${clientId}`);
  }, [router, clientId]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-900">
      <div className="text-center">
        <Loader2 className="h-8 w-8 animate-spin text-green-500 mx-auto mb-4" />
        <p className="text-gray-400">Doorverwijzen naar Agency Dashboard...</p>
      </div>
    </div>
  );
}
