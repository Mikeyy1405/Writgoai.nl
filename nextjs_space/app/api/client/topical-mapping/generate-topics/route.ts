
import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth-options';
import { prisma } from '@/lib/db';

export const dynamic = 'force-dynamic';

export async function POST(request: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.email) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { topicIds } = await request.json();

    if (!topicIds || !Array.isArray(topicIds) || topicIds.length === 0) {
      return NextResponse.json(
        { error: 'No topics provided' },
        { status: 400 }
      );
    }

    // Verify ownership of all topics
    const topics = await prisma.topicalTopic.findMany({
      where: { id: { in: topicIds } },
      include: {
        category: {
          include: {
            topicalMap: {
              include: {
                project: {
                  include: {
                    client: true
                  }
                }
              }
            }
          }
        }
      }
    });

    // Check if all topics belong to the user
    const unauthorized = topics.some(
      t => t.category.topicalMap.project.client.email !== session.user.email
    );

    if (unauthorized) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
    }

    // Mark all topics as generating
    await prisma.topicalTopic.updateMany({
      where: { id: { in: topicIds } },
      data: { status: 'generating' }
    });

    // In a real implementation, you would queue these for generation
    // For now, we'll simulate generation by creating placeholder content
    let generated = 0;
    
    for (const topic of topics) {
      try {
        // Create a content entry
        const lang = topic.category.topicalMap.language.toUpperCase();
        const validLanguage = ['NL', 'EN', 'FR', 'ES', 'DE'].includes(lang) ? lang : 'NL';
        
        const content = await prisma.savedContent.create({
          data: {
            clientId: topic.category.topicalMap.project.clientId,
            projectId: topic.category.topicalMap.projectId,
            title: topic.title,
            content: `<p>Content voor "${topic.title}" wordt gegenereerd...</p>`,
            language: validLanguage as any,
            type: topic.type === 'commercial' ? 'product-review' : 'blog'
          }
        });

        // Link content to topic
        await prisma.topicalTopic.update({
          where: { id: topic.id },
          data: {
            contentId: content.id,
            status: 'generating'
          }
        });

        generated++;

        // TODO: Queue actual content generation job
        // This would call your content generation API in the background

      } catch (error) {
        console.error(`Error generating content for topic ${topic.id}:`, error);
      }
    }

    return NextResponse.json({
      success: true,
      generated,
      message: `${generated} topics zijn in de wachtrij geplaatst voor generatie`
    });

  } catch (error) {
    console.error('Error generating topics:', error);
    return NextResponse.json(
      { error: 'Failed to generate topics' },
      { status: 500 }
    );
  }
}
