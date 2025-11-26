

export const dynamic = "force-dynamic";
/**
 * API Route: Rescan Website
 * POST: Re-scan website voor updates
 */

import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth-options';
import { prisma } from '@/lib/db';
import { scanWebsite } from '@/lib/website-scanner';

export async function POST(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user?.email) {
      return NextResponse.json({ error: 'Niet ingelogd' }, { status: 401 });
    }
    
    const client = await prisma.client.findUnique({
      where: { email: session.user.email },
    });
    
    if (!client) {
      return NextResponse.json({ error: 'Client niet gevonden' }, { status: 404 });
    }
    
    const project = await prisma.project.findFirst({
      where: {
        id: params.id,
        clientId: client.id,
      }
    });
    
    if (!project) {
      return NextResponse.json({ error: 'Project niet gevonden' }, { status: 404 });
    }
    
    // Scan website
    const scanResult = await scanWebsite(project.websiteUrl);
    
    // Update project with scan results
    await prisma.project.update({
      where: { id: project.id },
      data: {
        targetAudience: scanResult.websiteAnalysis.targetAudience,
        brandVoice: scanResult.websiteAnalysis.toneOfVoice,
        niche: scanResult.nicheAnalysis.primaryNiche,
        keywords: scanResult.nicheAnalysis.keywords,
        contentPillars: scanResult.contentStrategy.contentPillars,
        sitemapScannedAt: new Date(),
      }
    });
    
    return NextResponse.json({
      success: true,
      message: 'Website opnieuw gescand!',
      scanResult
    });
    
  } catch (error) {
    console.error('Error rescanning website:', error);
    return NextResponse.json(
      { error: 'Er ging iets mis bij het scannen' },
      { status: 500 }
    );
  }
}
