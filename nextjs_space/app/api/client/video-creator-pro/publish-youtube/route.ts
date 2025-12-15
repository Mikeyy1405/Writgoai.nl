/**
 * API Route: Publish Video to YouTube via Late.dev
 * Direct YouTube publishing met gegenereerde video
 */

import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth-options';
import { prisma } from '@/lib/db';
import { getLateDevApiKey } from '@/lib/latedev';

export const dynamic = 'force-dynamic';

export const maxDuration = 60;

interface PublishYouTubeRequest {
  videoUrl: string;
  thumbnailUrl: string;
  metadata: {
    titel: string;
    beschrijving: string;
    tags: string[];
    category?: string;
  };
  privacy: 'public' | 'unlisted' | 'private';
  scheduledTime?: string; // ISO string
  accountId: string; // Late.dev YouTube account ID
  projectId?: string;
}

export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user?.email) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Get client
    const client = await prisma.client.findUnique({
      where: { email: session.user.email },
    });

    if (!client) {
      return NextResponse.json({ error: 'Client not found' }, { status: 404 });
    }

    const body: PublishYouTubeRequest = await req.json();
    const { videoUrl, thumbnailUrl, metadata, privacy, scheduledTime, accountId, projectId } =
      body;

    // Validate required fields
    if (!videoUrl || !metadata?.titel || !accountId) {
      return NextResponse.json(
        { error: 'Missing required fields: videoUrl, metadata.titel, accountId' },
        { status: 400 }
      );
    }

    const apiKey = getLateDevApiKey();
    if (!apiKey) {
      return NextResponse.json(
        { error: 'Late.dev API key not configured. Please contact support.' },
        { status: 500 }
      );
    }

    console.log('📤 Publishing video to YouTube via Late.dev');
    console.log('  Account ID:', accountId);
    console.log('  Title:', metadata.titel);
    console.log('  Privacy:', privacy);

    // Prepare Late.dev post data
    const postData: any = {
      accountIds: [accountId],
      text: metadata.beschrijving,
      mediaUrls: [videoUrl],
      platform_specific: {
        youtube: {
          title: metadata.titel,
          description: metadata.beschrijving,
          tags: metadata.tags || [],
          categoryId: getCategoryId(metadata.category),
          privacyStatus: privacy || 'unlisted',
          madeForKids: false,
        },
      },
    };

    // Add thumbnail if provided
    if (thumbnailUrl) {
      postData.platform_specific.youtube.thumbnailUrl = thumbnailUrl;
    }

    // Add scheduled time if provided
    if (scheduledTime) {
      postData.scheduledAt = scheduledTime;
    }

    console.log('  Sending request to Late.dev...');

    // Call Late.dev API
    const response = await fetch('https://api.late.dev/api/posts', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${apiKey}`,
      },
      body: JSON.stringify(postData),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('❌ Late.dev API error:', errorText);
      throw new Error(`Late.dev API error: ${response.status} - ${errorText}`);
    }

    const result = await response.json();

    console.log('✅ Video published successfully');
    console.log('  Post ID:', result.id);

    // Store in database for tracking (optional)
    if (projectId) {
      try {
        await prisma.$executeRaw`
          INSERT INTO published_videos (
            client_id, 
            project_id, 
            title, 
            video_url, 
            platform, 
            external_id, 
            metadata
          ) VALUES (
            ${client.id},
            ${projectId},
            ${metadata.titel},
            ${videoUrl},
            'youtube',
            ${result.id},
            ${JSON.stringify({
              beschrijving: metadata.beschrijving,
              tags: metadata.tags,
              category: metadata.category,
              privacy: privacy,
              thumbnailUrl: thumbnailUrl,
              scheduledTime: scheduledTime,
            })}::jsonb
          )
        `;
      } catch (dbError) {
        console.error('Warning: Could not save to database:', dbError);
        // Don't fail the request if database save fails
      }
    }

    return NextResponse.json({
      success: true,
      postId: result.id,
      publishedAt: result.publishedAt || result.createdAt,
      scheduledFor: scheduledTime || null,
      youtubeUrl: result.url || null,
      message: scheduledTime
        ? 'Video scheduled successfully'
        : 'Video published to YouTube successfully',
    });
  } catch (error: any) {
    console.error('YouTube publish error:', error);
    return NextResponse.json(
      {
        error: error.message || 'Failed to publish video to YouTube',
        details: error.stack,
      },
      { status: 500 }
    );
  }
}

/**
 * Get YouTube category ID from category name
 */
function getCategoryId(category?: string): string {
  const categories: Record<string, string> = {
    'Film & Animation': '1',
    'Autos & Vehicles': '2',
    Music: '10',
    'Pets & Animals': '15',
    Sports: '17',
    'Travel & Events': '19',
    Gaming: '20',
    'People & Blogs': '22',
    Comedy: '23',
    Entertainment: '24',
    'News & Politics': '25',
    'Howto & Style': '26',
    Education: '27',
    'Science & Technology': '28',
    'Nonprofits & Activism': '29',
  };

  return categories[category || 'Entertainment'] || '24'; // Default to Entertainment
}
