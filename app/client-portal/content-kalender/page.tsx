'use client';

/**
 * Redirect to Content Research
 * Content kalender is vervangen door Content Research tool
 */

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';

export default function ContentKalenderRedirect() {
  const router = useRouter();

  useEffect(() => {
    // Immediate redirect to content research
    router.replace('/client-portal/content-research');
  }, [router]);

  return null;
}
