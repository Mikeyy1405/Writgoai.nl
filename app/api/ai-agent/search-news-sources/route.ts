

export const dynamic = "force-dynamic";
import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth-options';
import { performWebResearch } from '@/lib/web-research-v2';
import { deductCredits } from '@/lib/credits';

export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { topic, clientId } = await req.json();

    if (!topic) {
      return NextResponse.json({ error: 'Topic is required' }, { status: 400 });
    }

    // Deduct credits (5 credits for source search)
    const creditCheck = await deductCredits(clientId || (session.user as any).id, 5, 'Nieuwsbronnen zoeken');
    if (!creditCheck.success) {
      return NextResponse.json({ error: creditCheck.error }, { status: 402 });
    }

    // Search for news sources using web research
    const searchResults = await performWebResearch(topic, []);

    // Format sources from research result
    const sources = searchResults.sources.map((sourceUrl: string, index: number) => ({
      id: `source-${index}`,
      title: searchResults.topHeadings[index] || topic,
      url: sourceUrl,
      snippet: searchResults.keyInsights[index]?.substring(0, 200) || '',
      source: new URL(sourceUrl).hostname,
      publishedDate: new Date().toISOString().split('T')[0],
    }));

    return NextResponse.json({
      sources,
      count: sources.length,
    });
  } catch (error: any) {
    console.error('Error searching news sources:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to search news sources' },
      { status: 500 }
    );
  }
}
