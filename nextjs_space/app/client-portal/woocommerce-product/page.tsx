
'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Loader2 } from 'lucide-react';

export default function WooCommerceProductRedirect() {
  const router = useRouter();

  useEffect(() => {
    // Redirect to the correct plural URL
    router.replace('/client-portal/woocommerce-products');
  }, [router]);

  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-gray-900">
      <Loader2 className="h-8 w-8 animate-spin text-orange-500 mb-4" />
      <p className="text-gray-400">Redirecting...</p>
    </div>
  );
}
