import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth-options';
import { prisma } from '@/lib/prisma-shim';
import { getlateClient } from '@/lib/getlate/client';

export const dynamic = 'force-dynamic';

/**
 * GET /api/admin/projects/[id]
 * Fetch a specific project
 */
export async function GET(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.email) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const project = await prisma.project.findUnique({
      where: { id: params.id }
    });

    if (!project) {
      return NextResponse.json({ error: 'Project not found' }, { status: 404 });
    }

    return NextResponse.json(project);
  } catch (error) {
    console.error('Failed to fetch project:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

/**
 * DELETE /api/admin/projects/[id]
 * Delete a project
 * FIXED: Better error logging and graceful Getlate cleanup
 */
export async function DELETE(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    console.log('[Projects API DELETE] Deleting project:', params.id);
    
    const session = await getServerSession(authOptions);
    if (!session?.user?.email) {
      console.error('[Projects API DELETE] No session');
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    console.log('[Projects API DELETE] User:', session.user.email);

    // Haal client op
    const client = await prisma.client.findUnique({
      where: { email: session.user.email }
    });

    if (!client) {
      console.error('[Projects API DELETE] Client not found for:', session.user.email);
      return NextResponse.json({ error: 'Client not found' }, { status: 404 });
    }

    console.log('[Projects API DELETE] Client found:', client.id);

    // Verify project belongs to client
    const project = await prisma.project.findUnique({
      where: { id: params.id }
    });

    if (!project) {
      console.error('[Projects API DELETE] Project not found:', params.id);
      return NextResponse.json({ error: 'Project not found' }, { status: 404 });
    }

    if (project.clientId !== client.id) {
      console.error('[Projects API DELETE] Project ownership mismatch');
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    console.log('[Projects API DELETE] Ownership verified');

    // Stap 1: Disconnect alle social media accounts via Getlate (OPTIONAL)
    if (project.getlateProfileId) {
      try {
        console.log('[Projects API DELETE] Cleaning up Getlate connections...');
        
        // Get alle connected accounts
        const connectedAccounts = await prisma.connectedSocialAccount.findMany({
          where: { projectId: params.id }
        });

        console.log('[Projects API DELETE] Found', connectedAccounts.length, 'connected accounts');

        // Disconnect elk account
        for (const account of connectedAccounts) {
          try {
            await getlateClient.disconnectAccount(account.getlateAccountId);
            console.log('[Projects API DELETE] ✓ Disconnected Getlate account:', account.getlateAccountId);
          } catch (error: any) {
            console.warn('[Projects API DELETE] ⚠️ Failed to disconnect account:', account.getlateAccountId, error.message);
            // Continue met andere accounts
          }
        }

        // Verwijder alle ConnectedSocialAccount records
        await prisma.connectedSocialAccount.deleteMany({
          where: { projectId: params.id }
        });
        console.log('[Projects API DELETE] ✓ Deleted ConnectedSocialAccount records');

      } catch (error: any) {
        console.error('[Projects API DELETE] ⚠️ Error disconnecting social accounts:', error.message);
        // Don't block deletion
      }

      // Stap 2: Verwijder Getlate profile (OPTIONAL)
      try {
        console.log('[Projects API DELETE] Deleting Getlate profile:', project.getlateProfileId);
        await getlateClient.deleteProfile(project.getlateProfileId);
        console.log('[Projects API DELETE] ✓ Deleted Getlate profile');
      } catch (error: any) {
        console.error('[Projects API DELETE] ⚠️ Failed to delete Getlate profile:', error.message);
        // Continue met project deletion zelfs als Getlate delete faalt
      }
    }

    // Stap 3: Delete WritGo project (CASCADE deletes alle related data)
    console.log('[Projects API DELETE] Deleting project from database...');
    
    await prisma.project.delete({
      where: { id: params.id }
    });

    console.log('[Projects API DELETE] ✓ Successfully deleted project:', params.id);

    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error('[Projects API DELETE] ❌ FATAL ERROR:', error);
    console.error('[Projects API DELETE] Error stack:', error.stack);
    
    return NextResponse.json(
      { 
        error: 'Failed to delete project',
        details: error.message || 'Unknown error'
      },
      { status: 500 }
    );
  }
}

/**
 * PUT /api/admin/projects/[id]
 * Update a project
 */
export async function PUT(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.email) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Haal client op
    const client = await prisma.client.findUnique({
      where: { email: session.user.email }
    });

    if (!client) {
      return NextResponse.json({ error: 'Client not found' }, { status: 404 });
    }

    // Verify project belongs to client
    const project = await prisma.project.findUnique({
      where: { id: params.id }
    });

    if (!project) {
      return NextResponse.json({ error: 'Project not found' }, { status: 404 });
    }

    if (project.clientId !== client.id) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const data = await request.json();

    // Update project
    const updatedProject = await prisma.project.update({
      where: { id: params.id },
      data: {
        name: data.name,
        websiteUrl: data.websiteUrl,
        description: data.description,
        status: data.status
      }
    });

    return NextResponse.json(updatedProject);
  } catch (error) {
    console.error('Failed to update project:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
