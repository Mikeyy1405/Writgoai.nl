'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Loader2 } from 'lucide-react';

export default function SEORedirect() {
  const router = useRouter();

  useEffect(() => {
    // Redirect to linkbuilding page
    router.replace('/admin/linkbuilding');
  }, [router]);

  return (
    <div className="min-h-screen bg-gray-950 flex items-center justify-center">
      <div className="text-center">
        <Loader2 className="w-8 h-8 text-[#FF9933] animate-spin mx-auto mb-4" />
        <p className="text-gray-400">Doorverwijzen naar SEO & Linkbuilding...</p>
      </div>
    </div>
  );
}
