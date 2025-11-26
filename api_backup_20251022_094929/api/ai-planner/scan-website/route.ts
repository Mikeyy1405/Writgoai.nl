
import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth-options';
import { prisma } from '@/lib/db';
import { scanWebsite } from '@/lib/website-scanner';

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user?.email) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { websiteUrl } = await request.json();

    if (!websiteUrl) {
      return NextResponse.json({ error: 'Website URL is required' }, { status: 400 });
    }

    // Get client
    const client = await prisma.client.findUnique({
      where: { email: session.user.email },
      include: { AIProfile: true },
    });

    if (!client) {
      return NextResponse.json({ error: 'Client not found' }, { status: 404 });
    }

    // Scan website
    console.log('Scanning website:', websiteUrl);
    const scanResult = await scanWebsite(websiteUrl);

    // Update AI Profile with scan results
    const aiProfile = await prisma.clientAIProfile.upsert({
      where: { clientId: client.id },
      create: {
        clientId: client.id,
        websiteName: scanResult.websiteAnalysis.name,
        websiteUrl: websiteUrl,
        companyDescription: scanResult.websiteAnalysis.description,
        targetAudience: scanResult.websiteAnalysis.targetAudience,
        problemStatement: scanResult.websiteAnalysis.problemStatement,
        solutionStatement: scanResult.websiteAnalysis.solutionStatement,
        uniqueFeatures: scanResult.websiteAnalysis.uniqueFeatures,
        toneOfVoice: scanResult.websiteAnalysis.toneOfVoice,
        contentStyle: scanResult.websiteAnalysis.contentStyle,
        aiScanResults: JSON.stringify(scanResult),
        aiScanCompleted: true,
        lastAIScanAt: new Date(),
      },
      update: {
        websiteName: scanResult.websiteAnalysis.name,
        websiteUrl: websiteUrl,
        companyDescription: scanResult.websiteAnalysis.description,
        targetAudience: scanResult.websiteAnalysis.targetAudience,
        problemStatement: scanResult.websiteAnalysis.problemStatement,
        solutionStatement: scanResult.websiteAnalysis.solutionStatement,
        uniqueFeatures: scanResult.websiteAnalysis.uniqueFeatures,
        toneOfVoice: scanResult.websiteAnalysis.toneOfVoice,
        contentStyle: scanResult.websiteAnalysis.contentStyle,
        aiScanResults: JSON.stringify(scanResult),
        aiScanCompleted: true,
        lastAIScanAt: new Date(),
      },
    });

    return NextResponse.json({
      success: true,
      scanResult,
      profile: aiProfile,
    });

  } catch (error) {
    console.error('Error in scan-website API:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Internal server error' },
      { status: 500 }
    );
  }
}
