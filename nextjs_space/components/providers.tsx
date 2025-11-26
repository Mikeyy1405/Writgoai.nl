
'use client';

import { SessionProvider } from 'next-auth/react';
import { Toaster } from '@/components/ui/toaster';
import { LanguageProvider } from '@/lib/i18n/context';

export function Providers({ children }: { children: React.ReactNode }) {
  return (
    <SessionProvider>
      <LanguageProvider>
        {children}
        <Toaster />
      </LanguageProvider>
    </SessionProvider>
  );
}
