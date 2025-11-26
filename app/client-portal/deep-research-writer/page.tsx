'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Loader2 } from 'lucide-react';

export default function DeepResearchWriterRedirect() {
  const router = useRouter();

  useEffect(() => {
    // Redirect to Writgo Writer
    router.replace('/client-portal/content-generator');
  }, [router]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-black">
      <div className="text-center">
        <Loader2 className="w-12 h-12 mx-auto mb-4 animate-spin text-purple-500" />
        <p className="text-gray-400">Doorverwijzen naar Writgo Writer...</p>
      </div>
    </div>
  );
}
