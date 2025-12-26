import { createClient } from '@/lib/supabase/server';
import { NextRequest, NextResponse } from 'next/server';
import { createCipheriv, createDecipheriv, randomBytes } from 'crypto';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

// Encryption helpers
const ENCRYPTION_KEY = process.env.CREDENTIALS_ENCRYPTION_KEY || 'your-32-byte-key-change-this!!';
const ALGORITHM = 'aes-256-gcm';

function encryptCredentials(plaintext: string): {
  encrypted: string;
  iv: string;
  tag: string;
} {
  const key = Buffer.from(ENCRYPTION_KEY, 'utf8').subarray(0, 32);
  const iv = randomBytes(16);
  const cipher = createCipheriv(ALGORITHM, key, iv);

  let encrypted = cipher.update(plaintext, 'utf8', 'hex');
  encrypted += cipher.final('hex');

  const tag = cipher.getAuthTag();

  return {
    encrypted,
    iv: iv.toString('hex'),
    tag: tag.toString('hex'),
  };
}

function decryptCredentials(encrypted: string, iv: string, tag: string): string {
  const key = Buffer.from(ENCRYPTION_KEY, 'utf8').subarray(0, 32);
  const decipher = createDecipheriv(
    ALGORITHM,
    key,
    Buffer.from(iv, 'hex')
  );

  decipher.setAuthTag(Buffer.from(tag, 'hex'));

  let decrypted = decipher.update(encrypted, 'hex', 'utf8');
  decrypted += decipher.final('utf8');

  return decrypted;
}

/**
 * GET /api/agent/credentials
 * List user's credentials (encrypted data NOT returned)
 */
export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient();

    // Get current user
    const {
      data: { user },
      error: userError,
    } = await supabase.auth.getUser();

    if (userError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Get credentials (without encrypted data for security)
    const { data: credentials, error } = await supabase
      .from('agent_credentials')
      .select(
        'id, service_name, service_type, display_name, last_used_at, last_validated_at, is_valid, created_at'
      )
      .eq('user_id', user.id)
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Error fetching credentials:', error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ credentials });
  } catch (error: any) {
    console.error('Error in GET /api/agent/credentials:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

/**
 * POST /api/agent/credentials
 * Add new credentials
 */
export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient();

    // Get current user
    const {
      data: { user },
      error: userError,
    } = await supabase.auth.getUser();

    if (userError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const {
      service_name,
      service_type,
      display_name,
      credentials: plainCredentials,
    } = body;

    if (!service_name || !service_type || !plainCredentials) {
      return NextResponse.json(
        { error: 'service_name, service_type, and credentials are required' },
        { status: 400 }
      );
    }

    // Encrypt credentials
    const { encrypted, iv, tag } = encryptCredentials(
      JSON.stringify(plainCredentials)
    );

    // Check if credentials already exist for this service
    const { data: existing } = await supabase
      .from('agent_credentials')
      .select('id')
      .eq('user_id', user.id)
      .eq('service_name', service_name)
      .single();

    let result;

    if (existing) {
      // Update existing
      result = await supabase
        .from('agent_credentials')
        .update({
          service_type,
          display_name: display_name || service_name,
          encrypted_data: encrypted,
          encryption_iv: iv,
          encryption_tag: tag,
          is_valid: true,
        })
        .eq('id', existing.id)
        .select()
        .single();
    } else {
      // Create new
      result = await supabase
        .from('agent_credentials')
        .insert({
          user_id: user.id,
          service_name,
          service_type,
          display_name: display_name || service_name,
          encrypted_data: encrypted,
          encryption_iv: iv,
          encryption_tag: tag,
          is_valid: true,
        })
        .select()
        .single();
    }

    if (result.error) {
      console.error('Error saving credentials:', result.error);
      return NextResponse.json({ error: result.error.message }, { status: 500 });
    }

    // Return credential info without sensitive data
    const { encrypted_data, encryption_iv, encryption_tag, ...safeData } =
      result.data;

    return NextResponse.json({ credential: safeData }, { status: 201 });
  } catch (error: any) {
    console.error('Error in POST /api/agent/credentials:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

/**
 * DELETE /api/agent/credentials/[id]
 * Delete credentials (handled in separate file)
 */
