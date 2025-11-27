import { createClient as createSupabaseClient } from '@supabase/supabase-js'
import type { Database } from '@/types/supabase'

// Global Supabase client for server-side operations (service role - bypasses RLS)
const globalForSupabase = globalThis as unknown as {
  supabase: ReturnType<typeof createSupabaseClient<Database>> | undefined
}

// Service role client for server-side operations (use carefully - bypasses RLS)
export const supabase = globalForSupabase.supabase ?? createSupabaseClient<Database>(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!,
  {
    auth: {
      autoRefreshToken: false,
      persistSession: false
    }
  }
)

if (process.env.NODE_ENV !== 'production') {
  globalForSupabase.supabase = supabase
}

// Export createClient for browser-side operations (respects RLS)
export { createClient } from './client'

// Export createServiceClient for explicit service role usage
export { createServiceClient } from './server'
