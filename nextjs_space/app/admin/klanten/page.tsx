'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Loader2 } from 'lucide-react';

export default function KlantenRedirect() {
  const router = useRouter();

  useEffect(() => {
    router.replace('/admin/clients');
  }, [router]);

  return (
    <div className="min-h-screen bg-black flex items-center justify-center">
      <div className="text-center">
        <Loader2 className="w-8 h-8 text-orange-500 animate-spin mx-auto mb-4" />
        <p className="text-zinc-400">Doorverwijzen naar klanten...</p>
      </div>
    </div>
  );
}
