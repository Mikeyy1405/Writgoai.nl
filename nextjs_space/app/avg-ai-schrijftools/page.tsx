
'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';

export default function AVGAISchrijftoolsRedirect() {
  const router = useRouter();

  useEffect(() => {
    // Redirect to homepage
    router.replace('/');
  }, [router]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-800">
      <div className="text-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-orange-600 mx-auto mb-4"></div>
        <p className="text-gray-600">Je wordt doorgestuurd...</p>
      </div>
    </div>
  );
}
