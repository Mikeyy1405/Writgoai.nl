'use client';

import { createBrowserClient } from '@supabase/ssr';

export const supabase = createBrowserClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://placeholder.supabase.co',
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || 'placeholder-key',
  {
    cookies: {
      get(name: string) {
        if (typeof document === 'undefined') return undefined;
        const cookie = document.cookie
          .split('; ')
          .find(row => row.startsWith(`${name}=`));
        return cookie ? cookie.split('=')[1] : undefined;
      },
      set(name: string, value: string, options: any) {
        if (typeof document === 'undefined') return;

        let cookie = `${name}=${value}`;

        if (options?.maxAge) {
          cookie += `; max-age=${options.maxAge}`;
        }
        if (options?.path) {
          cookie += `; path=${options.path}`;
        }
        if (options?.domain) {
          cookie += `; domain=${options.domain}`;
        }
        if (options?.sameSite) {
          cookie += `; samesite=${options.sameSite}`;
        }
        if (options?.secure) {
          cookie += '; secure';
        }

        document.cookie = cookie;
      },
      remove(name: string, options: any) {
        if (typeof document === 'undefined') return;

        let cookie = `${name}=; max-age=0`;

        if (options?.path) {
          cookie += `; path=${options.path}`;
        }
        if (options?.domain) {
          cookie += `; domain=${options.domain}`;
        }

        document.cookie = cookie;
      },
    },
  }
);
