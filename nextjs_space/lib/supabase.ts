import { createClient, SupabaseClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
const supabaseServiceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY

// Validate environment variables
if (!supabaseUrl) {
  console.error('Missing NEXT_PUBLIC_SUPABASE_URL - Set this in your .env file or environment variables')
}
if (!supabaseAnonKey) {
  console.error('Missing NEXT_PUBLIC_SUPABASE_ANON_KEY - Set this in your .env file or environment variables')
}
if (!supabaseServiceRoleKey) {
  console.error('Missing SUPABASE_SERVICE_ROLE_KEY - Set this in your .env file or environment variables (required for admin operations)')
}

// Singleton instances
let supabaseInstance: SupabaseClient | null = null
let supabaseAdminInstance: SupabaseClient | null = null

// Client-side Supabase client (singleton)
export const supabase: SupabaseClient = (() => {
  if (!supabaseInstance && supabaseUrl && supabaseAnonKey) {
    supabaseInstance = createClient(supabaseUrl, supabaseAnonKey, {
      auth: {
        persistSession: true,
        storageKey: 'writgo-supabase-auth',
        autoRefreshToken: true,
        detectSessionInUrl: true,
      }
    })
  }
  if (!supabaseInstance) {
    throw new Error('Failed to initialize Supabase client. Check that NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY are set.')
  }
  return supabaseInstance
})()

// Server-side Supabase admin client (singleton)
export const supabaseAdmin: SupabaseClient = (() => {
  if (!supabaseAdminInstance && supabaseUrl && supabaseServiceRoleKey) {
    supabaseAdminInstance = createClient(supabaseUrl, supabaseServiceRoleKey, {
      auth: {
        persistSession: false,
        autoRefreshToken: false,
      }
    })
  }
  if (!supabaseAdminInstance) {
    throw new Error('Failed to initialize Supabase admin client. Check that NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY are set.')
  }
  return supabaseAdminInstance
})()

export type Language = 'NL' | 'EN' | 'DE' | 'ES' | 'FR' | 'IT' | 'PT' | 'PL' | 'SV' | 'DA';
