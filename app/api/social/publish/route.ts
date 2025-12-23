import { NextResponse } from 'next/server';
import { getLateClient, type MediaItem } from '@/lib/late-client';
import { createClient } from '@supabase/supabase-js';

export const dynamic = 'force-dynamic';

const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

interface PublishRequest {
  post_id: string;
  account_ids: string[];
  scheduled_for?: string;
  publish_now?: boolean;
}

export async function POST(request: Request) {
  try {
    const body: PublishRequest = await request.json();
    const { post_id, account_ids, scheduled_for, publish_now } = body;

    if (!post_id) {
      return NextResponse.json({ error: 'Post ID is required' }, { status: 400 });
    }

    // Get the post
    const { data: post, error: postError } = await supabaseAdmin
      .from('social_posts')
      .select('*')
      .eq('id', post_id)
      .single();

    if (postError || !post) {
      return NextResponse.json({ error: 'Post not found' }, { status: 404 });
    }

    const lateClient = getLateClient();

    if (!lateClient.isConfigured()) {
      // No Late API - just update status to show it's ready
      await supabaseAdmin
        .from('social_posts')
        .update({
          status: 'ready',
          updated_at: new Date().toISOString(),
        })
        .eq('id', post_id);

      return NextResponse.json({
        success: true,
        message: 'Post marked as ready. Copy the content to post manually.',
        manual: true,
      });
    }

    // Get accounts
    const { data: accounts } = await supabaseAdmin
      .from('social_accounts')
      .select('*')
      .in('id', account_ids);

    if (!accounts || accounts.length === 0) {
      return NextResponse.json({ error: 'No valid accounts found' }, { status: 400 });
    }

    // Upload image if present
    let mediaItems: MediaItem[] = [];
    if (post.image_url) {
      console.log('📤 Uploading media from URL:', post.image_url);
      try {
        const media = await lateClient.uploadMediaFromUrl(post.image_url);
        mediaItems.push(media);
        console.log('✅ Media uploaded successfully:', media.mediaId);
      } catch (e: any) {
        console.error('❌ Media upload failed:', e.message);
        
        // Check if Instagram is in the platforms
        const hasInstagram = accounts.some(acc => acc.platform === 'instagram');
        if (hasInstagram) {
          return NextResponse.json({ 
            error: 'Instagram posts vereisen altijd een afbeelding of video. Media upload is mislukt: ' + e.message 
          }, { status: 400 });
        }
        // For other platforms, continue without media but log warning
        console.warn('⚠️ Continuing without media for non-Instagram platforms');
      }
    }

    // Create post on Late
    const platforms = accounts.map(acc => ({
      platform: acc.platform,
      accountId: acc.late_account_id,
    }));

    // Validate Instagram requires media
    const hasInstagram = platforms.some(p => p.platform === 'instagram');
    if (hasInstagram && mediaItems.length === 0) {
      return NextResponse.json({ 
        error: 'Instagram posts vereisen altijd een afbeelding of video. Voeg eerst media toe aan je post.' 
      }, { status: 400 });
    }

    const latePost = await lateClient.createPost({
      content: post.content,
      mediaItems: mediaItems.length > 0 ? mediaItems : undefined,
      platforms,
      scheduledFor: scheduled_for,
      timezone: 'Europe/Amsterdam',
      publishNow: publish_now,
      isDraft: !publish_now && !scheduled_for,
    });

    // Update our post
    await supabaseAdmin
      .from('social_posts')
      .update({
        late_post_id: latePost._id,
        status: latePost.status,
        scheduled_for: scheduled_for || null,
        published_at: publish_now ? new Date().toISOString() : null,
        updated_at: new Date().toISOString(),
      })
      .eq('id', post_id);

    return NextResponse.json({
      success: true,
      late_post_id: latePost._id,
      status: latePost.status,
    });
  } catch (error: any) {
    console.error('Publish error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

// Delete a post
export async function DELETE(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const postId = searchParams.get('post_id');

    if (!postId) {
      return NextResponse.json({ error: 'Post ID is required' }, { status: 400 });
    }

    // Get the post
    const { data: post } = await supabaseAdmin
      .from('social_posts')
      .select('late_post_id')
      .eq('id', postId)
      .single();

    // Delete from Late if exists
    if (post?.late_post_id) {
      try {
        const lateClient = getLateClient();
        if (lateClient.isConfigured()) {
          await lateClient.deletePost(post.late_post_id);
        }
      } catch (e) {
        console.warn('Failed to delete from Late:', e);
      }
    }

    // Delete from our database
    const { error } = await supabaseAdmin
      .from('social_posts')
      .delete()
      .eq('id', postId);

    if (error) {
      throw error;
    }

    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error('Delete error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

// Update a post
export async function PATCH(request: Request) {
  try {
    const body = await request.json();
    const { post_id, content, image_url } = body;

    if (!post_id) {
      return NextResponse.json({ error: 'Post ID is required' }, { status: 400 });
    }

    const updates: any = {
      updated_at: new Date().toISOString(),
    };

    if (content !== undefined) updates.content = content;
    if (image_url !== undefined) updates.image_url = image_url;

    const { data: post, error } = await supabaseAdmin
      .from('social_posts')
      .update(updates)
      .eq('id', post_id)
      .select()
      .single();

    if (error) {
      throw error;
    }

    return NextResponse.json({ success: true, post });
  } catch (error: any) {
    console.error('Update error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
