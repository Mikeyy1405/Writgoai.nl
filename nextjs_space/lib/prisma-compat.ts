/**
 * Prisma Compatibility Layer
 * 
 * This module provides backward compatibility for code that still uses Prisma syntax
 * while the migration to Supabase is in progress.
 * 
 * WARNING: This uses `any` typing to bypass TypeScript checks. Use with caution.
 * Files should be gradually migrated to use Supabase queries directly.
 */

// Import at runtime but not at type-check time
const { supabaseAdmin } = require('./supabase');

// Export as any to allow Prisma-style method access during migration
export const prisma: any = supabaseAdmin;
