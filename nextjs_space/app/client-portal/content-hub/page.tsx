'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Loader2 } from 'lucide-react';

/**
 * Content Hub Redirect Page
 * 
 * This page redirects users to the projects page since Content Hub
 * is now integrated into each project (as a tab in /client-portal/projects/[id]).
 * 
 * Website configuration is done on a per-project basis, so users should
 * access the Content Hub through their specific project.
 */
export default function ContentHubPage() {
  const router = useRouter();

  useEffect(() => {
    // Redirect to projects page
    router.replace('/client-portal/projects');
  }, [router]);

  return (
    <div className="flex items-center justify-center min-h-screen">
      <div className="text-center">
        <Loader2 className="h-8 w-8 animate-spin mx-auto mb-4 text-primary" />
        <p className="text-muted-foreground">Doorverwijzen naar projecten...</p>
      </div>
    </div>
  );
}
