/**
 * Prisma Compatibility Shim
 * 
 * This provides a Prisma-like interface over Supabase to allow gradual migration.
 * This is a TEMPORARY solution - files should be migrated to use Supabase directly.
 * 
 * WARNING: This does NOT implement all Prisma features and may have limitations.
 */

import { supabaseAdmin } from './supabase';

/**
 * Table name mapping: Prisma camelCase -> Supabase PascalCase
 * Maps the camelCase names used in code to the PascalCase table names in Supabase
 */
const TABLE_NAME_MAP: Record<string, string> = {
  // Client & Project tables
  client: 'Client',
  project: 'Project',
  // Content & Brand tables
  blogPost: 'BlogPost',
  brandSettings: 'BrandSettings',
  savedContent: 'SavedContent',
  video: 'Video',
  // Credit & Transaction tables
  creditTransaction: 'CreditTransaction',
  // Auth tables
  user: 'User',
  passwordResetToken: 'PasswordResetToken',
  // Email system tables
  mailboxConnection: 'MailboxConnection',
  inboxEmail: 'InboxEmail',
  emailThread: 'EmailThread',
  emailAutoReplyConfig: 'EmailAutoReplyConfig',
  emailDraft: 'EmailDraft',
  // Content Plan tables
  contentPlan: 'ContentPlan',
  contentPlanItem: 'ContentPlanItem',
  // Topical Authority Map tables
  topicalAuthorityMap: 'TopicalAuthorityMap',
  topicalMapArticle: 'TopicalMapArticle',
  batchJob: 'BatchJob',
  // Social Media Pipeline tables
  socialMediaStrategy: 'SocialMediaStrategy',
  socialMediaPost: 'SocialMediaPost',
  // Autopilot Configuration table
  autopilotConfig: 'AutopilotConfig',
  autopilotLog: 'AutopilotLog',
  // Website Analysis table
  websiteAnalysis: 'WebsiteAnalysis',
  // Getlate Integration tables
  connectedSocialAccount: 'ConnectedSocialAccount',
  // Project-based system tables
  affiliateLink: 'AffiliateLink',
  knowledgeBase: 'KnowledgeBase',
  projectSettings: 'ProjectSettings',
};

// Create a Proxy that intercepts property access and returns table-specific handlers
export const prisma = new Proxy({} as any, {
  get(target, tableName: string) {
    if (tableName === '$disconnect') {
      // Return a no-op function for $disconnect
      return async () => {
        // Supabase doesn't need explicit disconnection
      };
    }
    
    if (tableName === '$queryRaw') {
      // Return a function that executes raw SQL
      return async (query: TemplateStringsArray | string, ...values: any[]) => {
        console.warn('$queryRaw is not fully supported in Prisma shim. Consider rewriting to use Supabase RPC or direct queries.');
        throw new Error('$queryRaw is not implemented in Prisma shim. Please convert this query to use Supabase directly.');
      };
    }
    
    // Map the table name to the correct Supabase table name
    const actualTableName = TABLE_NAME_MAP[tableName] || tableName;
    
    // Return a handler for this specific table
    return {
      // findUnique: Find a single record by unique field
      findUnique: async ({ where, include, select }: any) => {
        let query = supabaseAdmin.from(actualTableName).select('*');
        
        // Apply where conditions
        if (where) {
          Object.entries(where).forEach(([key, value]) => {
            if (value !== null && value !== undefined) {
              query = query.eq(key, value);
            }
          });
        }
        
        const { data, error } = await query.single();
        
        if (error && error.code !== 'PGRST116') { // PGRST116 is "not found"
          throw error;
        }
        
        return data || null;
      },
      
      // findFirst: Find first matching record
      findFirst: async ({ where, orderBy, include, select }: any) => {
        let query = supabaseAdmin.from(actualTableName).select('*');
        
        // Apply where conditions
        if (where) {
          const { OR, ...regularConditions } = where;
          
          // Handle OR conditions if present
          if (OR && Array.isArray(OR) && OR.length > 0) {
            // Build OR filter string for Supabase
            // Note: This handles simple equality conditions only
            // Complex nested operators in OR are not yet supported
            const orFilters = OR.map((condition: any) => {
              const key = Object.keys(condition)[0];
              const value = condition[key];
              // Simple equality for OR conditions
              return `${key}.eq.${value}`;
            }).join(',');
            query = query.or(orFilters);
          }
          
          // Handle regular conditions alongside OR
          Object.entries(regularConditions).forEach(([key, value]) => {
            if (value && typeof value === 'object') {
              // Handle nested conditions
              if ('not' in value) {
                query = query.not(key, 'eq', value.not);
              }
            } else if (value !== null && value !== undefined) {
              query = query.eq(key, value);
            }
          });
        }
        
        // Apply ordering
        if (orderBy) {
          const orderKey = Object.keys(orderBy)[0];
          const orderDir = orderBy[orderKey];
          query = query.order(orderKey, { ascending: orderDir === 'asc' });
        }
        
        query = query.limit(1);
        
        const { data, error } = await query;
        
        if (error) {
          throw error;
        }
        
        return data && data.length > 0 ? data[0] : null;
      },
      
      // findMany: Find multiple records
      findMany: async ({ where, orderBy, include, select, take, skip }: any = {}) => {
        let query = supabaseAdmin.from(actualTableName).select('*');
        
        // Apply where conditions
        if (where) {
          Object.entries(where).forEach(([key, value]) => {
            if (value && typeof value === 'object') {
              // Handle special operators
              if ('not' in value) {
                if (value.not === null) {
                  query = query.not(key, 'is', null);
                } else {
                  query = query.not(key, 'eq', value.not);
                }
              }
              if ('in' in value) {
                query = query.in(key, value.in as any[]);
              }
              if ('gte' in value) {
                query = query.gte(key, value.gte);
              }
              if ('lte' in value) {
                query = query.lte(key, value.lte);
              }
            } else if (value !== null && value !== undefined) {
              query = query.eq(key, value);
            }
          });
        }
        
        // Apply ordering
        if (orderBy) {
          if (Array.isArray(orderBy)) {
            orderBy.forEach((order: any) => {
              const orderKey = Object.keys(order)[0];
              const orderDir = order[orderKey];
              query = query.order(orderKey, { ascending: orderDir === 'asc' });
            });
          } else {
            const orderKey = Object.keys(orderBy)[0];
            const orderDir = orderBy[orderKey];
            query = query.order(orderKey, { ascending: orderDir === 'asc' });
          }
        }
        
        // Apply pagination
        if (skip !== undefined) {
          query = query.range(skip, skip + (take || 100) - 1);
        } else if (take !== undefined) {
          query = query.limit(take);
        }
        
        const { data, error } = await query;
        
        if (error) {
          throw error;
        }
        
        // Handle include._count if requested
        if (include && include._count) {
          // For now, add _count but with placeholder values
          // TODO: Implement proper counting of related records
          const results = data || [];
          return results.map((item: any) => ({
            ...item,
            _count: Object.keys(include._count.select || {}).reduce((acc, key) => {
              acc[key] = 0; // Placeholder - would need to query related tables
              return acc;
            }, {} as Record<string, number>)
          }));
        }
        
        return data || [];
      },
      
      // create: Create a new record
      create: async ({ data, select, include }: any) => {
        // Generate ID explicitly if not provided (fallback for database default)
        // This ensures consistent behavior across all tables
        if (!data.id) {
          // Generate a UUID-style ID as TEXT (matching database pattern)
          const crypto = require('crypto');
          data.id = crypto.randomUUID();
          console.log(`[Prisma Shim] Generated explicit ID for ${actualTableName}:`, data.id);
        }
        
        const { data: result, error } = await supabaseAdmin
          .from(actualTableName)
          .insert(data)
          .select()
          .single();
        
        if (error) {
          // Log detailed error information for debugging
          console.error(`[Prisma Shim] Create error for table ${actualTableName}:`);
          console.error(`[Prisma Shim] - Error code: ${error.code}`);
          console.error(`[Prisma Shim] - Error message: ${error.message}`);
          console.error(`[Prisma Shim] - Error details: ${error.details}`);
          console.error(`[Prisma Shim] - Error hint: ${error.hint}`);
          console.error(`[Prisma Shim] - Data keys being inserted:`, Object.keys(data));
          console.error(`[Prisma Shim] - Sample data values (first 3 keys):`, 
            Object.entries(data).slice(0, 3).map(([k, v]) => 
              `${k}=${typeof v === 'string' ? v.substring(0, 50) : v}`
            ).join(', ')
          );
          
          // Check for common RLS policy errors
          if (error.code === '42501' || error.message?.includes('policy')) {
            console.error(`[Prisma Shim] ⚠️  RLS POLICY ERROR - This might be a Row Level Security issue`);
            console.error(`[Prisma Shim] ⚠️  Make sure the admin user has proper permissions to insert into ${actualTableName}`);
          }
          
          // Check for foreign key constraint errors
          if (error.code === '23503' || error.message?.includes('foreign key')) {
            console.error(`[Prisma Shim] ⚠️  FOREIGN KEY ERROR - Referenced record might not exist`);
          }
          
          // Check for unique constraint errors
          if (error.code === '23505' || error.message?.includes('unique')) {
            console.error(`[Prisma Shim] ⚠️  UNIQUE CONSTRAINT ERROR - Record with this value already exists`);
          }
          
          // Try to stringify full error object (with size limit for performance)
          try {
            const errorStr = JSON.stringify(error, null, 2);
            if (errorStr.length < 10000) { // Only log if less than 10KB
              console.error(`[Prisma Shim] - Full error object:`, errorStr);
            } else {
              console.error(`[Prisma Shim] - Full error object too large to log (${errorStr.length} chars)`);
            }
          } catch (stringifyError) {
            console.error(`[Prisma Shim] - Could not stringify error object`);
          }
          
          throw error;
        }
        
        if (!result) {
          console.error(`[Prisma Shim] Insert succeeded but no result returned for ${actualTableName}`);
          throw new Error(`Insert succeeded but no result returned for ${actualTableName}`);
        }
        
        console.log(`[Prisma Shim] Successfully created record in ${actualTableName} with id:`, result.id);
        return result;
      },
      
      // update: Update a record
      update: async ({ where, data, select, include }: any) => {
        let query = supabaseAdmin.from(actualTableName).update(data);
        
        // Apply where conditions
        if (where) {
          Object.entries(where).forEach(([key, value]) => {
            if (value !== null && value !== undefined) {
              query = query.eq(key, value);
            }
          });
        }
        
        const { data: result, error } = await query.select().single();
        
        if (error) {
          throw error;
        }
        
        return result;
      },
      
      // updateMany: Update multiple records
      updateMany: async ({ where, data }: any) => {
        let query = supabaseAdmin.from(actualTableName).update(data);
        
        // Apply where conditions
        if (where) {
          Object.entries(where).forEach(([key, value]) => {
            if (value !== null && value !== undefined) {
              query = query.eq(key, value);
            }
          });
        }
        
        const { data: result, error, count } = await query.select();
        
        if (error) {
          throw error;
        }
        
        return { count: count || result?.length || 0 };
      },
      
      // delete: Delete a record
      delete: async ({ where }: any) => {
        let query = supabaseAdmin.from(actualTableName).delete();
        
        // Apply where conditions
        if (where) {
          Object.entries(where).forEach(([key, value]) => {
            if (value !== null && value !== undefined) {
              query = query.eq(key, value);
            }
          });
        }
        
        const { data, error } = await query.select().single();
        
        if (error) {
          throw error;
        }
        
        return data;
      },
      
      // deleteMany: Delete multiple records
      deleteMany: async ({ where }: any) => {
        let query = supabaseAdmin.from(actualTableName).delete();
        
        // Apply where conditions
        if (where) {
          Object.entries(where).forEach(([key, value]) => {
            if (value !== null && value !== undefined) {
              query = query.eq(key, value);
            }
          });
        }
        
        const { data, error, count } = await query.select();
        
        if (error) {
          throw error;
        }
        
        return { count: count || data?.length || 0 };
      },
      
      // count: Count records
      count: async ({ where }: any = {}) => {
        let query = supabaseAdmin.from(actualTableName).select('*', { count: 'exact', head: true });
        
        // Apply where conditions
        if (where) {
          Object.entries(where).forEach(([key, value]) => {
            if (value !== null && value !== undefined) {
              query = query.eq(key, value);
            }
          });
        }
        
        const { count, error } = await query;
        
        if (error) {
          throw error;
        }
        
        return count || 0;
      },
      
      // aggregate: Aggregate operations (limited support)
      aggregate: async ({ where, _sum, _avg, _count, _max, _min }: any) => {
        console.warn(`aggregate() is not fully supported for table ${tableName}. Consider using Supabase RPC functions.`);
        
        // Basic count support
        if (_count) {
          let query = supabaseAdmin.from(actualTableName).select('*', { count: 'exact', head: true });
          
          // Apply where conditions
          if (where) {
            Object.entries(where).forEach(([key, value]) => {
              if (value !== null && value !== undefined) {
                query = query.eq(key, value);
              }
            });
          }
          
          const { count, error } = await query;
          
          if (error) {
            throw error;
          }
          
          return { _count: count || 0 };
        }
        
        throw new Error('aggregate() is not fully implemented in Prisma shim. Please convert to use Supabase RPC or direct queries.');
      },
      
      // groupBy: Group by operations (not supported)
      groupBy: async () => {
        throw new Error('groupBy() is not implemented in Prisma shim. Please convert to use Supabase RPC or direct queries.');
      },
    };
  },
});
