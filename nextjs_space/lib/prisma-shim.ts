/**
 * Prisma Compatibility Shim
 * 
 * This provides a Prisma-like interface over Supabase to allow gradual migration.
 * This is a TEMPORARY solution - files should be migrated to use Supabase directly.
 * 
 * WARNING: This does NOT implement all Prisma features and may have limitations.
 */

import { supabaseAdmin } from './supabase';

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
    
    // Return a handler for this specific table
    return {
      // findUnique: Find a single record by unique field
      findUnique: async ({ where, include, select }: any) => {
        const query = supabaseAdmin.from(tableName).select('*');
        
        // Apply where conditions
        if (where) {
          Object.entries(where).forEach(([key, value]) => {
            if (value !== null && value !== undefined) {
              query.eq(key, value);
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
        let query = supabaseAdmin.from(tableName).select('*');
        
        // Apply where conditions
        if (where) {
          Object.entries(where).forEach(([key, value]) => {
            if (value && typeof value === 'object') {
              // Handle nested conditions
              if ('not' in value) {
                query = query.not(key, 'eq', value.not);
              }
            } else if (value !== null && value !== undefined) {
              query.eq(key, value);
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
        let query = supabaseAdmin.from(tableName).select('*');
        
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
              query.eq(key, value);
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
        
        return data || [];
      },
      
      // create: Create a new record
      create: async ({ data, select, include }: any) => {
        const { data: result, error } = await supabaseAdmin
          .from(tableName)
          .insert(data)
          .select()
          .single();
        
        if (error) {
          throw error;
        }
        
        return result;
      },
      
      // update: Update a record
      update: async ({ where, data, select, include }: any) => {
        let query = supabaseAdmin.from(tableName).update(data);
        
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
        let query = supabaseAdmin.from(tableName).update(data);
        
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
        let query = supabaseAdmin.from(tableName).delete();
        
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
        let query = supabaseAdmin.from(tableName).delete();
        
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
        let query = supabaseAdmin.from(tableName).select('*', { count: 'exact', head: true });
        
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
          let query = supabaseAdmin.from(tableName).select('*', { count: 'exact', head: true });
          
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
