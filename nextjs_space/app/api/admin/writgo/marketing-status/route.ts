export const dynamic = "force-dynamic";

import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth-options';
import { prisma } from '@/lib/prisma-shim';

/**
 * GET /api/admin/writgo/marketing-status
 * 
 * Check if Writgo.nl is set up as an internal client for marketing automation
 */
export async function GET(request: Request) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session || !session.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    
    // Only allow admin access
    if (session.user.email !== 'info@writgo.nl') {
      return NextResponse.json({ error: 'Forbidden: Admin access required' }, { status: 403 });
    }
    
    // Check if Writgo.nl internal client exists
    // We look for a client with email 'marketing@writgo.nl' or name 'Writgo.nl Internal'
    const writgoClient = await prisma.client.findFirst({
      where: {
        email: 'marketing@writgo.nl'
      }
    });
    
    if (!writgoClient) {
      return NextResponse.json({
        isSetup: false
      });
    }
    
    // Get the primary project for this client
    const primaryProject = await prisma.project.findFirst({
      where: {
        clientId: writgoClient.id,
        isPrimary: true
      }
    });
    
    // Check for connected social media platforms (if applicable)
    // This would require checking the social media connections table
    // For now, we'll return basic info
    
    return NextResponse.json({
      isSetup: true,
      clientId: writgoClient.id,
      projectId: primaryProject?.id,
      hasAutomation: writgoClient.automationActive || false,
      connectedPlatforms: [] // TODO: Add logic to fetch connected platforms
    });
  } catch (error: any) {
    console.error('Failed to fetch marketing status:', error);
    return NextResponse.json({ 
      error: 'Failed to load marketing status',
      details: process.env.NODE_ENV === 'development' ? error.message : undefined
    }, { status: 500 });
  }
}
