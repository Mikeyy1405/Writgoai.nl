// Database client using Supabase
// This file provides a consistent interface for database operations
import { supabase, supabaseAdmin } from './supabase'

// Export both clients for different use cases
// - Use 'db' for server-side operations that need admin privileges
// - Use 'supabase' for client-side operations (respects RLS)
export const db = supabaseAdmin
export { supabase, supabaseAdmin }

// Temporary Prisma compatibility layer for gradual migration
// This should be removed once all files are converted to use Supabase directly
export { prisma } from './prisma-shim'
