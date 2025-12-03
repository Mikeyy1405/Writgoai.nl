'use client';

// Deze tool is nu geïntegreerd in de Content Kalender
// Redirect naar Content Kalender
import { useEffect } from 'react';
import { useRouter } from 'next/navigation';

export default function ContentPlanGeneratorRedirect() {
  const router = useRouter();
  
  useEffect(() => {
    router.replace('/client-portal/content-kalender');
  }, [router]);
  
  return null;
}
