'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Loader2 } from 'lucide-react';

export default function AIAgentPage() {
  const router = useRouter();

  useEffect(() => {
    router.push('/client-portal');
  }, [router]);

  return (
    <div className="min-h-screen bg-black flex items-center justify-center">
      <div className="text-center">
        <Loader2 className="w-12 h-12 animate-spin text-[#ff6b35] mx-auto mb-4" />
        <p className="text-gray-400">Doorverwijzen naar WritgoAI Tools...</p>
      </div>
    </div>
  );
}
