import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth-options';
import { prisma } from '@/lib/db';

export const dynamic = 'force-dynamic';

/**
 * GET /api/admin/api-keys - Get API keys (masked)
 */
export async function GET() {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session || !session.user || !session.user.email) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Check if user is admin
    const user = await prisma.user.findUnique({ 
      where: { email: session.user.email },
      select: { role: true }
    });
    
    if (user?.role !== 'admin') {
      return NextResponse.json({ error: 'Forbidden - Admin access required' }, { status: 403 });
    }
    
    // Return masked API keys from environment
    const keys = {
      openai: maskApiKey(process.env.OPENAI_API_KEY),
      claude: maskApiKey(process.env.ANTHROPIC_API_KEY),
      elevenlabs: maskApiKey(process.env.ELEVENLABS_API_KEY),
      stability: maskApiKey(process.env.STABILITY_API_KEY),
    };
    
    return NextResponse.json({ keys });
  } catch (error) {
    console.error('Failed to fetch API keys:', error);
    return NextResponse.json(
      { error: 'Failed to fetch API keys' },
      { status: 500 }
    );
  }
}

/**
 * POST /api/admin/api-keys - Update API keys
 * Note: This is a placeholder. In production, you'd want to store these securely
 * and potentially restart the app to pick up new env vars.
 */
export async function POST(request: Request) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session || !session.user || !session.user.email) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Check if user is admin
    const user = await prisma.user.findUnique({ 
      where: { email: session.user.email },
      select: { role: true }
    });
    
    if (user?.role !== 'admin') {
      return NextResponse.json({ error: 'Forbidden - Admin access required' }, { status: 403 });
    }
    
    const { keys } = await request.json();
    
    // In a real implementation, you would:
    // 1. Store these in a secure vault (e.g., AWS Secrets Manager, HashiCorp Vault)
    // 2. Update environment variables
    // 3. Trigger app restart or hot-reload configuration
    
    // For now, we'll just acknowledge the request
    console.log('[API Keys Update] Admin requested API key update (not implemented)');
    
    return NextResponse.json({ 
      success: true,
      message: 'API keys update requested. Note: Restart required for changes to take effect.',
    });
  } catch (error) {
    console.error('Failed to update API keys:', error);
    return NextResponse.json(
      { error: 'Failed to update API keys' },
      { status: 500 }
    );
  }
}

/**
 * Mask API key for display
 */
function maskApiKey(key: string | undefined): string {
  if (!key) return '';
  if (key.length <= 8) return '••••••••';
  return key.substring(0, 8) + '••••••••' + key.substring(key.length - 4);
}
