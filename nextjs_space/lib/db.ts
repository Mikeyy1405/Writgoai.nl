// Database client using Supabase
// This file provides a consistent interface for database operations
import { supabase, supabaseAdmin } from './supabase'

// Export both clients for different use cases
// - Use 'db' for server-side operations that need admin privileges
// - Use 'supabase' for client-side operations (respects RLS)
export const db = supabaseAdmin
export { supabase }

// For backwards compatibility with existing code that uses 'prisma'
// This will be gradually phased out as we migrate all queries
export const prisma = db
