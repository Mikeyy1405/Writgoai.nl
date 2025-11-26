
import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth-options';
import { prisma } from '@/lib/db';

const GETLATE_API_KEY = process.env.GETLATE_API_KEY || process.env.LATE_DEV_API_KEY;

interface PublishRequest {
  postId: string;
}

export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.email) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body: PublishRequest = await req.json();
    const { postId } = body;

    if (!postId) {
      return NextResponse.json({ error: 'Post ID is vereist' }, { status: 400 });
    }

    // Get client
    const client = await prisma.client.findUnique({
      where: { email: session.user.email },
    });

    if (!client) {
      return NextResponse.json({ error: 'Client niet gevonden' }, { status: 404 });
    }

    // Find post and verify ownership
    const post = await prisma.socialMediaPost.findFirst({
      where: { id: postId },
      include: { 
        project: {
          include: {
            socialMediaConfig: true,
          },
        },
      },
    });

    if (!post || post.project.clientId !== client.id) {
      return NextResponse.json({ error: 'Post niet gevonden' }, { status: 404 });
    }

    // Check if Getlate is configured for this project
    if (!post.project.socialMediaConfig?.getlateProfileId) {
      return NextResponse.json(
        { error: 'Getlate is niet gekoppeld aan dit project. Ga naar Social Media Instellingen om Getlate te koppelen.' },
        { status: 400 }
      );
    }

    if (!GETLATE_API_KEY) {
      return NextResponse.json(
        { error: 'Getlate API key is niet geconfigureerd' },
        { status: 500 }
      );
    }

    // Publish to Getlate
    const getlateResponse = await fetch('https://getlate.dev/api/v1/posts', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${GETLATE_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        profileId: post.project.socialMediaConfig.getlateProfileId,
        content: post.content,
        platforms: post.platforms.map((platform: string) => ({
          platform: platform,
        })),
        mediaUrls: post.mediaUrl ? [post.mediaUrl] : [],
        scheduleDate: new Date().toISOString(), // Post immediately
      }),
    });

    if (!getlateResponse.ok) {
      const errorData = await getlateResponse.json().catch(() => ({}));
      throw new Error(errorData.message || 'Fout bij publiceren via Getlate');
    }

    // Update post status
    const updatedPost = await prisma.socialMediaPost.update({
      where: { id: postId },
      data: {
        status: 'published',
        publishedAt: new Date(),
      },
    });

    return NextResponse.json({
      success: true,
      post: updatedPost,
    });
  } catch (error) {
    console.error('Error publishing post:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Fout bij publiceren van post' },
      { status: 500 }
    );
  }
}
