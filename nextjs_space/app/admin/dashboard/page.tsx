'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Loader2 } from 'lucide-react';

/**
 * REDIRECT: Oude admin dashboard → nieuwe unified dashboard
 * 
 * Admin gebruikers zien nu hetzelfde unified dashboard als alle andere gebruikers.
 * Dit bestand stuurt automatisch door naar de root (/) waar het nieuwe dashboard staat.
 */
export default function AdminDashboardRedirect() {
  const router = useRouter();

  useEffect(() => {
    console.log('🔄 Redirecting from old admin dashboard to unified dashboard...');
    router.replace('/');
  }, [router]);

  return (
    <div className="flex items-center justify-center min-h-screen">
      <div className="text-center">
        <Loader2 className="h-8 w-8 animate-spin mx-auto mb-4 text-primary" />
        <p className="text-muted-foreground">Doorverwijzen naar het nieuwe dashboard...</p>
      </div>
    </div>
  );
}
