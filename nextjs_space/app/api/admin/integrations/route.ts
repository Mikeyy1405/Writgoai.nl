import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth-options';
import { prisma } from '@/lib/db';

export const dynamic = 'force-dynamic';

/**
 * GET /api/admin/integrations - Get all platform integrations overview
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
    
    // Get WordPress integration status
    const wordpressProjects = await prisma.project.findMany({
      where: {
        wordpressUrl: { not: null },
        isActive: true,
      },
      select: {
        id: true,
        wordpressUrl: true,
        clientId: true,
      }
    });
    
    const wordpressIntegration = {
      id: 'wordpress',
      name: 'WordPress',
      type: 'wordpress' as const,
      status: wordpressProjects.length > 0 ? 'connected' as const : 'disconnected' as const,
      clientCount: new Set(wordpressProjects.map(p => p.clientId)).size,
      lastSync: wordpressProjects.length > 0 ? new Date().toISOString() : undefined,
    };
    
    // Get WooCommerce integration status (same as WordPress for now)
    const woocommerceIntegration = {
      id: 'woocommerce',
      name: 'WooCommerce',
      type: 'woocommerce' as const,
      status: 'disconnected' as const,
      clientCount: 0,
    };
    
    // Get Social Media integration status
    const socialAccounts = await prisma.socialMediaAccount.findMany({
      where: {
        isActive: true,
      },
      select: {
        id: true,
        platform: true,
        projectId: true,
        project: {
          select: {
            clientId: true,
          }
        }
      }
    }).catch(() => []);
    
    const socialIntegration = {
      id: 'social',
      name: 'Social Media',
      type: 'social' as const,
      status: socialAccounts.length > 0 ? 'connected' as const : 'disconnected' as const,
      clientCount: new Set(socialAccounts.map(a => a.project?.clientId).filter(Boolean)).size,
      lastSync: socialAccounts.length > 0 ? new Date().toISOString() : undefined,
    };
    
    // Get Email integration status
    const emailIntegration = {
      id: 'email',
      name: 'Email',
      type: 'email' as const,
      status: 'connected' as const,
      clientCount: 1, // Admin email
    };
    
    const integrations = [
      wordpressIntegration,
      woocommerceIntegration,
      socialIntegration,
      emailIntegration,
    ];
    
    return NextResponse.json({ integrations });
  } catch (error) {
    console.error('Failed to fetch integrations:', error);
    return NextResponse.json(
      { error: 'Failed to fetch integrations' },
      { status: 500 }
    );
  }
}
