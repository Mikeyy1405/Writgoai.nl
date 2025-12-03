
'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Loader2 } from 'lucide-react';

export default function BlogWriterRedirect() {
  const router = useRouter();

  useEffect(() => {
    // Redirect to new Content Writer
    router.replace('/client-portal/content-writer');
  }, [router]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-black">
      <div className="text-center">
        <Loader2 className="w-12 h-12 mx-auto mb-4 animate-spin text-[#ff6b35]" />
        <p className="text-gray-400">Doorverwijzen naar Content Writer...</p>
      </div>
    </div>
  );
}
