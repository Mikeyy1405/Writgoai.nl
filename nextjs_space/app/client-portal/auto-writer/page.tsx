'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Loader2 } from 'lucide-react';

/**
 * Redirect: Auto Writer → Schrijven
 * Deze pagina is verouderd en redirect naar de nieuwe unified schrijven pagina
 */
export default function AutoWriterRedirect() {
  const router = useRouter();

  useEffect(() => {
    router.replace('/client-portal/schrijven');
  }, [router]);

  return (
    <div className="flex items-center justify-center min-h-screen">
      <div className="text-center">
        <Loader2 className="h-8 w-8 animate-spin mx-auto mb-4" />
        <p className="text-muted-foreground">Doorsturen naar nieuwe schrijfomgeving...</p>
      </div>
    </div>
  );
}
