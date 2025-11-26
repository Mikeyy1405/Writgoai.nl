'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';

export default function ContentOptimizerPage() {
  const router = useRouter();

  useEffect(() => {
    // Redirect to client portal home
    router.push('/client-portal');
  }, [router]);

  return (
    <div className="container mx-auto py-8 px-4 max-w-7xl">
      <div className="text-center">
        <h1 className="text-4xl font-bold mb-4">Content Optimizer verwijderd</h1>
        <p className="text-gray-600 mb-8">Deze functie is niet meer beschikbaar.</p>
        <p className="text-gray-600">Je wordt automatisch doorgestuurd naar het hoofdmenu...</p>
      </div>
    </div>
  );
}
