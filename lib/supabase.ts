import { createClient } from '@supabase/supabase-js';

let _supabase: ReturnType<typeof createClient> | null = null;
let _supabaseAdmin: ReturnType<typeof createClient> | null = null;

export function getSupabase() {
  if (!_supabase) {
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

    if (!supabaseUrl || !supabaseAnonKey) {
      throw new Error('Missing Supabase environment variables');
    }

    _supabase = createClient(supabaseUrl, supabaseAnonKey);
  }
  return _supabase;
}

export function getSupabaseAdmin() {
  if (!_supabaseAdmin) {
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

    if (!supabaseUrl || !supabaseServiceKey) {
      throw new Error('Missing Supabase environment variables');
    }

    _supabaseAdmin = createClient(
      supabaseUrl,
      supabaseServiceKey,
      {
        auth: {
          autoRefreshToken: false,
          persistSession: false
        }
      }
    );
  }
  return _supabaseAdmin;
}

// Deprecated: use getSupabase() instead
export const supabase = new Proxy({} as ReturnType<typeof createClient>, {
  get: (target, prop) => {
    return (getSupabase() as any)[prop];
  }
});

// Deprecated: use getSupabaseAdmin() instead
export const supabaseAdmin = new Proxy({} as ReturnType<typeof createClient>, {
  get: (target, prop) => {
    return (getSupabaseAdmin() as any)[prop];
  }
});

// Database types
export type User = {
  id: string;
  email: string;
  name: string;
  created_at: string;
  updated_at: string;
};

export type Project = {
  id: string;
  user_id: string;
  name: string;
  website_url: string;
  wp_url: string | null;
  wp_username: string | null;
  wp_password: string | null;
  created_at: string;
  updated_at: string;
};

export type Article = {
  id: string;
  project_id: string;
  title: string;
  content: string;
  status: 'draft' | 'published';
  published_at: string | null;
  created_at: string;
  updated_at: string;
};
