'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';

export default function AdminDashboard() {
  const router = useRouter();

  useEffect(() => {
    // Redirect to the new simplified Overzicht page
    router.replace('/admin/overzicht');
  }, [router]);

  return (
    <div className="flex items-center justify-center min-h-[400px]">
      <div className="text-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#FF9933] mx-auto mb-4"></div>
        <p className="text-gray-500">Doorverwijzen naar overzicht...</p>
      </div>
    </div>
  );
}
