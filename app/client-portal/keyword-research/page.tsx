
'use client';

/**
 * Direct redirect to new Content Research tool
 * Old keyword research has been replaced
 */

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';

export default function KeywordResearchRedirect() {
  const router = useRouter();

  useEffect(() => {
    // Immediate redirect
    router.replace('/client-portal/content-research');
  }, [router]);

  return null;
}
