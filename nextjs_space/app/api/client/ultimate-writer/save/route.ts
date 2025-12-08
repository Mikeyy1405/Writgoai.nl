import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth-options';
import { prisma } from '@/lib/db';
import { Language } from '@prisma/client';

export const dynamic = 'force-dynamic';

/**
 * 💾 ULTIMATE WRITER - SAVE TO CONTENT LIBRARY
 */

export async function POST(request: NextRequest) {
  console.log('💾 [Ultimate Writer] Save API called');

  try {
    // 1. Authentication
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });
    }

    // 2. Get client
    const client = await prisma.client.findUnique({
      where: { email: session.user.email! },
      select: { id: true },
    });

    if (!client) {
      return NextResponse.json({ error: 'Client not found' }, { status: 404 });
    }

    // 3. Parse request
    const body = await request.json();
    const { content, metaDescription, config, stats } = body;

    // 4. Create title from topic
    const title = config.topic.slice(0, 100);

    // 5. Save to content library (saved_content table)
    const savedContent = await prisma.savedContent.create({
      data: {
        clientId: client.id,
        projectId: config.projectId || undefined,
        title,
        content,
        contentHtml: content,
        metaDesc: metaDescription,
        type: config.contentType,
        language: config.language === 'nl' ? Language.NL : Language.EN,
        wordCount: stats.wordCount,
        characterCount: stats.characterCount,
        keywords: [config.primaryKeyword, ...config.secondaryKeywords.split(',').map((k: string) => k.trim()).filter(Boolean)],
        generatorType: 'ultimate-writer',
      },
    });

    console.log('✅ [Ultimate Writer] Content saved:', savedContent.id);

    return NextResponse.json({
      success: true,
      id: savedContent.id,
    });
  } catch (error: any) {
    console.error('❌ [Ultimate Writer] Save error:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to save content' },
      { status: 500 }
    );
  }
}
