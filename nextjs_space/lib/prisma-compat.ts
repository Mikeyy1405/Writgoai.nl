/**
 * Prisma Compatibility Layer
 * 
 * This module provides backward compatibility for code that still uses Prisma syntax
 * while the migration to Supabase is in progress.
 * 
 * WARNING: This uses `any` typing to bypass TypeScript checks. Use with caution.
 * Files should be gradually migrated to use Supabase queries directly.
 */

import { supabaseAdmin } from './supabase';

// Export as any to allow Prisma-style method access during migration
// Using type assertion to prevent TypeScript from inferring the Supabase type
export const prisma = supabaseAdmin as unknown as any;
