import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth-options';
import { prisma } from '@/lib/db';
import { isUserAdmin } from '@/lib/navigation-config';
import { generateContentPlan } from '@/lib/content-plan-generator';

/**
 * POST /api/admin/writgo-marketing/generate-plan
 * Generates content plan for Writgo.nl
 */
export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user?.email || !isUserAdmin(session.user.email, session.user.role)) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await req.json();
    const { days = 7 } = body;

    // Validate days parameter
    if (![7, 14, 30].includes(days)) {
      return NextResponse.json(
        { error: 'Days must be 7, 14, or 30' },
        { status: 400 }
      );
    }

    // Find Writgo.nl client
    const writgoClient = await prisma.client.findFirst({
      where: {
        OR: [
          { email: 'marketing@writgo.nl' },
          { companyName: 'Writgo.nl' }
        ]
      }
    });

    if (!writgoClient) {
      return NextResponse.json(
        { error: 'Writgo.nl client not found. Run setup first.' },
        { status: 404 }
      );
    }

    // Create website scan object for Writgo.nl
    const websiteScan = {
      websiteAnalysis: {
        name: 'Writgo.nl',
        description: 'AI-powered content marketing agency die lokale dienstverleners helpt met omnipresence marketing door AI-gedreven content generatie voor blogs en social media',
        targetAudience: 'Lokale dienstverleners (kappers, installateurs, fysiotherapeuten, advocaten) en MKB-ondernemers die hun online zichtbaarheid willen vergroten',
        toneOfVoice: 'Professioneel maar toegankelijk, Nederlands, expert maar niet complex, oplossingsgericht',
        contentStyle: ['Educatief', 'Inspirerend', 'Praktisch', 'Oplossingsgericht']
      },
      nicheAnalysis: {
        primaryNiche: 'AI Content Marketing & Omnipresence Marketing',
        subNiches: [
          'Lokale marketing',
          'Social media automatisering',
          'SEO content',
          'AI tools voor MKB',
          'Content strategie'
        ],
        keywords: writgoClient.keywords || [
          'omnipresence marketing',
          'AI content agency',
          'social media + SEO pakket',
          'lokale marketing',
          'automatische social media',
          'content marketing MKB',
          'AI content voor lokale bedrijven',
          'social media automatisering',
          'SEO content schrijven',
          'blog content genereren',
          'Instagram marketing',
          'LinkedIn content',
          'lokale zichtbaarheid',
          'online marketing MKB',
          'content strategie'
        ],
        topics: [
          'AI in content marketing',
          'Social media strategie',
          'SEO optimalisatie',
          'Lokale zichtbaarheid',
          'Content automatisering',
          'Marketing voor MKB',
          'Instagram marketing',
          'LinkedIn content',
          'Blog SEO',
          'Content planning'
        ]
      },
      contentStrategy: {
        contentPillars: [
          'AI & Automatisering in Marketing',
          'Lokale Marketing Strategieën',
          'Social Media Content',
          'SEO & Vindbaarheid',
          'MKB Marketing Tips'
        ],
        contentTypes: ['Blog', 'Instagram Posts', 'TikTok Videos', 'YouTube Shorts', 'LinkedIn Posts']
      }
    };

    // Generate content plan
    console.log(`Generating ${days}-day content plan for Writgo.nl...`);
    const contentPlan = await generateContentPlan(websiteScan, days);

    // Save content plan to client
    await prisma.client.update({
      where: { id: writgoClient.id },
      data: {
        contentPlan: JSON.parse(JSON.stringify(contentPlan)),
        lastPlanGenerated: new Date()
      }
    });

    return NextResponse.json({
      success: true,
      contentPlan,
      message: `${days}-day content plan generated successfully`
    });
  } catch (error) {
    console.error('Error generating content plan:', error);
    return NextResponse.json(
      { error: 'Failed to generate content plan' },
      { status: 500 }
    );
  }
}
