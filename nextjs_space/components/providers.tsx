
'use client';

import { SessionProvider } from 'next-auth/react';
import { Toaster } from '@/components/ui/toaster';
import { LanguageProvider } from '@/lib/i18n/context';
import { BrandProvider } from '@/lib/brand-context';

export function Providers({ children }: { children: React.ReactNode }) {
  return (
    <SessionProvider>
      <BrandProvider>
        <LanguageProvider>
          {children}
          <Toaster />
        </LanguageProvider>
      </BrandProvider>
    </SessionProvider>
  );
}
