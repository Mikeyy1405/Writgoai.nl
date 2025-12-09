
import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth-options';
import { publishToLatedev } from '@/lib/latedev';


export const dynamic = 'force-dynamic';
export const maxDuration = 60;

// Publish to WordPress
async function publishToWordPress(
  contentPiece: any,
  wpUrl: string,
  wpUsername: string,
  wpPassword: string
) {
  try {
    const endpoint = `${wpUrl}/wp-json/wp/v2/posts`;
    
    const postData = {
      title: contentPiece.blogTitle,
      content: contentPiece.blogContent,
      status: 'publish',
      meta_description: contentPiece.blogMetaDesc
    };
    
    const response = await fetch(endpoint, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Basic ${Buffer.from(`${wpUsername}:${wpPassword}`).toString('base64')}`
      },
      body: JSON.stringify(postData)
    });
    
    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`WordPress API error: ${response.status} - ${errorText}`);
    }
    
    const result = await response.json();
    
    return {
      success: true,
      wordpressId: result.id,
      url: result.link
    };
    
  } catch (error) {
    console.error('WordPress publish error:', error);
    throw error;
  }
}

// Publish to social media via Late.dev
async function publishToSocial(
  contentPiece: any,
  lateDevAccounts: any[]
) {
  try {
    // Get account IDs for the requested platforms
    const accountIds = lateDevAccounts
      .filter(acc => contentPiece.socialPlatforms?.includes(acc.platform) ?? true)
      .map(acc => acc.accountId);
    
    if (accountIds.length === 0) {
      throw new Error('No connected accounts found for requested platforms');
    }
    
    const result = await publishToLatedev(
      contentPiece.socialCaption,
      contentPiece.socialImageUrl ? [contentPiece.socialImageUrl] : [],
      accountIds
    );
    
    if (!result.success) {
      throw new Error(result.error || 'Publication failed');
    }
    
    return {
      success: true,
      lateDevId: result.lateDevId
    };
    
  } catch (error) {
    console.error('Social media publish error:', error);
    throw error;
  }
}

export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user?.email) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    
    const { id } = params;
    const body = await request.json();
    const { publishType } = body; // 'blog', 'social', 'reel', or 'all'
    
    // Get client with all necessary data
    const client = await prisma.client.findUnique({
      where: { email: session.user.email },
      include: {
        lateDevAccounts: true
      }
    });
    
    if (!client) {
      return NextResponse.json({ error: 'Client not found' }, { status: 404 });
    }
    
    // Get content piece
    const contentPiece = await prisma.contentPiece.findFirst({
      where: { 
        id,
        clientId: client.id 
      }
    });
    
    if (!contentPiece) {
      return NextResponse.json({ error: 'Content not found' }, { status: 404 });
    }
    
    const updates: any = {};
    const results: any = {};
    
    // Publish blog to WordPress
    if ((publishType === 'blog' || publishType === 'all') && contentPiece.blogTitle && contentPiece.blogContent) {
      if (!client.wordpressUrl || !client.wordpressUsername || !client.wordpressPassword) {
        return NextResponse.json({ 
          error: 'WordPress credentials not configured' 
        }, { status: 400 });
      }
      
      try {
        const wpResult = await publishToWordPress(
          contentPiece,
          client.wordpressUrl,
          client.wordpressUsername,
          client.wordpressPassword
        );
        
        updates.blogPublished = true;
        updates.blogPublishedAt = new Date();
        updates.blogUrl = wpResult.url;
        updates.blogWordpressId = wpResult.wordpressId;
        
        results.blog = { success: true, url: wpResult.url };
      } catch (error) {
        results.blog = { 
          success: false, 
          error: error instanceof Error ? error.message : 'Unknown error' 
        };
      }
    }
    
    // Publish social media post via Late.dev
    if ((publishType === 'social' || publishType === 'all') && contentPiece.socialCaption) {
      if (client.lateDevAccounts.length === 0) {
        return NextResponse.json({ 
          error: 'No social media accounts connected' 
        }, { status: 400 });
      }
      
      try {
        const socialResult = await publishToSocial(
          contentPiece,
          client.lateDevAccounts
        );
        
        updates.socialPublished = true;
        updates.socialPublishedAt = new Date();
        updates.socialLateDevId = socialResult.lateDevId;
        
        results.social = { success: true, lateDevId: socialResult.lateDevId };
      } catch (error) {
        results.social = { 
          success: false, 
          error: error instanceof Error ? error.message : 'Unknown error' 
        };
      }
    }
    
    // Reel/video publishing (currently not implemented - would need video generation)
    if ((publishType === 'reel' || publishType === 'all') && contentPiece.reelScript) {
      results.reel = { 
        success: false, 
        error: 'Video generation not yet implemented. Script is ready for manual use.' 
      };
    }
    
    // Update status if everything published
    if (results.blog?.success || results.social?.success) {
      const allPublished = 
        (!contentPiece.blogTitle || updates.blogPublished) &&
        (!contentPiece.socialCaption || updates.socialPublished);
      
      if (allPublished) {
        updates.status = 'published';
        updates.publishedAt = new Date();
      }
    }
    
    // Update content piece
    const updated = await prisma.contentPiece.update({
      where: { id },
      data: updates
    });
    
    // Check if any failures
    const hasFailures = Object.values(results).some((r: any) => !r.success);
    
    return NextResponse.json({
      success: !hasFailures,
      results,
      content: updated
    });
    
  } catch (error) {
    console.error('Error publishing content:', error);
    return NextResponse.json(
      { error: 'Failed to publish content' },
      { status: 500 }
    );
  }
}
