
'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Loader2 } from 'lucide-react';

export default function SuperAdminRoot() {
  const router = useRouter();

  useEffect(() => {
    router.replace('/superadmin/dashboard');
  }, [router]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900">
      <Loader2 className="h-8 w-8 animate-spin text-orange-500" />
    </div>
  );
}
