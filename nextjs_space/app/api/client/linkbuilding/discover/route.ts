
/**
 * Linkbuilding Discovery API
 * 
 * Discover potential linkbuilding partners based on niche and relevance
 */

import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth-options';
import { prisma } from '@/lib/db';

export const maxDuration = 300;
export const dynamic = 'force-dynamic';

/**
 * GET: Discover potential linkbuilding partners
 */
export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.email) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const client = await prisma.client.findUnique({
      where: { email: session.user.email },
      include: {
        projects: {
          select: {
            id: true,
            name: true,
            niche: true,
            keywords: true,
            contentPillars: true,
          },
        },
      },
    });

    if (!client) {
      return NextResponse.json({ error: 'Client not found' }, { status: 404 });
    }

    const { searchParams } = new URL(request.url);
    const projectId = searchParams.get('projectId');
    const niche = searchParams.get('niche');

    // Get current partnerships and pending requests to exclude
    const existingPartnerIds = await prisma.linkbuildingPartnership.findMany({
      where: {
        OR: [
          { requestingClientId: client.id },
          { targetClientId: client.id },
        ],
        status: { in: ['active', 'paused'] },
      },
      select: {
        requestingClientId: true,
        targetClientId: true,
      },
    });

    const pendingRequestIds = await prisma.linkbuildingRequest.findMany({
      where: {
        OR: [
          { fromClientId: client.id },
          { toClientId: client.id },
        ],
        status: 'pending',
      },
      select: {
        fromClientId: true,
        toClientId: true,
      },
    });

    // Extract IDs to exclude
    const excludeIds = new Set<string>();
    excludeIds.add(client.id); // Don't include self

    existingPartnerIds.forEach((p) => {
      excludeIds.add(p.requestingClientId);
      excludeIds.add(p.targetClientId);
    });

    pendingRequestIds.forEach((r) => {
      excludeIds.add(r.fromClientId);
      excludeIds.add(r.toClientId);
    });

    // Find potential partners
    const whereClause: any = {
      id: { notIn: Array.from(excludeIds) },
      projects: {
        some: {},
      },
    };

    // Filter by niche if provided
    if (niche) {
      whereClause.projects.some.niche = {
        contains: niche,
        mode: 'insensitive',
      };
    }

    const potentialPartners = await prisma.client.findMany({
      where: whereClause,
      select: {
        id: true,
        name: true,
        companyName: true,
        website: true,
        projects: {
          select: {
            id: true,
            name: true,
            niche: true,
            keywords: true,
            contentPillars: true,
            websiteUrl: true,
          },
          take: 3,
        },
      },
      take: 20,
    });

    // Calculate relevance scores
    const partnersWithScores = potentialPartners.map((partner) => {
      let relevanceScore = 0;
      const matchingTopics: string[] = [];

      // Get current client's keywords and topics
      const myKeywords = new Set<string>();
      const myTopics = new Set<string>();

      if (projectId) {
        const project = client.projects.find((p) => p.id === projectId);
        if (project) {
          project.keywords.forEach((k) => myKeywords.add(k.toLowerCase()));
          project.contentPillars.forEach((t) => myTopics.add(t.toLowerCase()));
        }
      } else {
        client.projects.forEach((p) => {
          p.keywords.forEach((k) => myKeywords.add(k.toLowerCase()));
          p.contentPillars.forEach((t) => myTopics.add(t.toLowerCase()));
        });
      }

      // Check for keyword and topic matches
      partner.projects.forEach((project) => {
        project.keywords.forEach((keyword) => {
          if (myKeywords.has(keyword.toLowerCase())) {
            relevanceScore += 10;
            if (!matchingTopics.includes(keyword)) {
              matchingTopics.push(keyword);
            }
          }
        });

        project.contentPillars.forEach((pillar) => {
          if (myTopics.has(pillar.toLowerCase())) {
            relevanceScore += 15;
            if (!matchingTopics.includes(pillar)) {
              matchingTopics.push(pillar);
            }
          }
        });
      });

      // Niche match bonus
      if (niche) {
        partner.projects.forEach((project) => {
          if (project.niche?.toLowerCase().includes(niche.toLowerCase())) {
            relevanceScore += 20;
          }
        });
      }

      return {
        ...partner,
        relevanceScore,
        matchingTopics,
      };
    });

    // Sort by relevance score
    partnersWithScores.sort((a, b) => b.relevanceScore - a.relevanceScore);

    return NextResponse.json({
      success: true,
      partners: partnersWithScores,
    });
  } catch (error: any) {
    console.error('Error discovering partners:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to discover partners' },
      { status: 500 }
    );
  }
}
