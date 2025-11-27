import { PrismaClient } from '@prisma/client'
import { createClient as createSupabaseClient } from '@supabase/supabase-js'
import type { Database } from '@/types/supabase'

// Feature flag for Supabase migration
// Set USE_SUPABASE=true in .env to use Supabase instead of Prisma
const USE_SUPABASE = process.env.USE_SUPABASE === 'true'

// Prisma client (legacy - for backwards compatibility during migration)
const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined
}

export const prisma = globalForPrisma.prisma ?? new PrismaClient()

if (process.env.NODE_ENV !== 'production') globalForPrisma.prisma = prisma

// Supabase client (new - for migration)
const globalForSupabase = globalThis as unknown as {
  supabase: ReturnType<typeof createSupabaseClient<Database>> | undefined
}

// Service role client for server-side operations (bypasses RLS)
// Only initialize if Supabase env vars are present
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY

export const supabase = supabaseUrl && supabaseServiceKey 
  ? (globalForSupabase.supabase ?? createSupabaseClient<Database>(
      supabaseUrl,
      supabaseServiceKey,
      {
        auth: {
          autoRefreshToken: false,
          persistSession: false
        }
      }
    ))
  : null

if (process.env.NODE_ENV !== 'production' && supabase) {
  globalForSupabase.supabase = supabase
}

// Export feature flag for use in API routes
export const useSupabase = USE_SUPABASE && !!supabase
