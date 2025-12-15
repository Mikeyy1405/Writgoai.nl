import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth-options';
import { prisma } from '@/lib/db';
import { GetlateClient } from '@/lib/getlate-client';

export const dynamic = 'force-dynamic';

/**
 * POST /api/simplified/social-media/post
 * Post social media content naar Getlate.Dev
 */
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.email) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { postId, action, scheduledDate } = body;

    // Validatie
    if (!postId || !action) {
      return NextResponse.json(
        { error: 'postId en action zijn verplicht' },
        { status: 400 }
      );
    }

    if (!['now', 'schedule'].includes(action)) {
      return NextResponse.json(
        { error: 'action moet "now" of "schedule" zijn' },
        { status: 400 }
      );
    }

    if (action === 'schedule' && !scheduledDate) {
      return NextResponse.json(
        { error: 'scheduledDate is verplicht voor action=schedule' },
        { status: 400 }
      );
    }

    // Haal client op
    const client = await prisma.client.findUnique({
      where: { email: session.user.email },
    });

    if (!client) {
      return NextResponse.json({ error: 'Client niet gevonden' }, { status: 404 });
    }

    // Haal post op met project
    const post = await prisma.socialMediaPost.findFirst({
      where: { id: postId },
      include: {
        // Workaround: we kunnen niet direct relatie volgen via strategyId
        // omdat die niet bestaat in de schema. We moeten projectId gebruiken.
      },
    });

    if (!post) {
      return NextResponse.json({ error: 'Post niet gevonden' }, { status: 404 });
    }

    // Haal project op
    const project = await prisma.project.findFirst({
      where: { 
        id: post.projectId || '',
        clientId: client.id 
      },
    });

    if (!project) {
      return NextResponse.json({ error: 'Project niet gevonden of geen toegang' }, { status: 403 });
    }

    // Check of Getlate.Dev API key is geconfigureerd
    if (!project.getlateApiKey) {
      return NextResponse.json(
        { error: 'Getlate.Dev API key niet geconfigureerd voor dit project. Configureer dit in Instellingen.' },
        { status: 400 }
      );
    }

    // Initialize Getlate client
    const getlate = new GetlateClient(project.getlateApiKey);

    // Test connection first
    const connectionTest = await getlate.testConnection();
    if (!connectionTest.success) {
      await prisma.socialMediaPost.update({
        where: { id: postId },
        data: {
          status: 'failed',
          errorMessage: `Getlate.Dev connectie gefaald: ${connectionTest.error}`,
        },
      });

      return NextResponse.json(
        { error: `Getlate.Dev connectie gefaald: ${connectionTest.error}` },
        { status: 500 }
      );
    }

    try {
      // Prepare post data
      const postData: any = {
        platforms: [post.platform],
        content: post.content || '',
        mediaUrls: post.mediaUrls || [],
      };

      // Add scheduled date if action is schedule
      if (action === 'schedule' && scheduledDate) {
        postData.scheduledFor = new Date(scheduledDate).toISOString();
      }

      // Create post via Getlate.Dev
      const result = await getlate.createPost(postData);

      // Update post in database
      const updateData: any = {
        status: action === 'schedule' ? 'scheduled' : 'posted',
        getlatePostId: result.id,
        errorMessage: null,
      };

      if (action === 'schedule') {
        updateData.scheduledDate = new Date(scheduledDate);
      } else {
        updateData.publishedAt = new Date();
      }

      await prisma.socialMediaPost.update({
        where: { id: postId },
        data: updateData,
      });

      return NextResponse.json({
        success: true,
        message: action === 'schedule' ? 'Post succesvol ingepland!' : 'Post succesvol gepubliceerd!',
        getlatePostId: result.id,
        status: result.status,
      });
    } catch (error: any) {
      console.error('Getlate.Dev API error:', error);

      // Update post status to failed
      await prisma.socialMediaPost.update({
        where: { id: postId },
        data: {
          status: 'failed',
          errorMessage: error.message || 'Onbekende fout bij posten',
        },
      });

      return NextResponse.json(
        { error: `Fout bij posten naar Getlate.Dev: ${error.message}` },
        { status: 500 }
      );
    }
  } catch (error) {
    console.error('Error posting to Getlate.Dev:', error);
    return NextResponse.json(
      { error: 'Fout bij posten naar social media' },
      { status: 500 }
    );
  }
}
