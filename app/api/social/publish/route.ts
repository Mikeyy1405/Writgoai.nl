import { NextResponse } from 'next/server';
import { getLateClient, type MediaItem } from '@/lib/late-client';
import { createClient } from '@supabase/supabase-js';

export const dynamic = 'force-dynamic';

let supabaseAdmin: ReturnType<typeof createClient> | null = null;

function getSupabaseAdmin() {
  if (!supabaseAdmin) {
    supabaseAdmin = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    );
  }
  return supabaseAdmin as any;
}

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
    const { data: post, error: postError } = await getSupabaseAdmin()
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
      await getSupabaseAdmin()
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
    const { data: accounts } = await getSupabaseAdmin()
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

      // First verify the image is accessible
      try {
        const checkResponse = await fetch(post.image_url, { method: 'HEAD' });
        if (!checkResponse.ok) {
          throw new Error(`Image URL not accessible: ${checkResponse.status} ${checkResponse.statusText}`);
        }
        console.log('✅ Image URL is accessible');
      } catch (e: any) {
        console.error('❌ Image URL check failed:', e.message);

        const hasInstagram = accounts.some((acc: any) => acc.platform === 'instagram');
        const hasTikTok = accounts.some((acc: any) => acc.platform === 'tiktok');

        if (hasInstagram || hasTikTok) {
          const platform = hasInstagram ? 'Instagram' : 'TikTok';
          return NextResponse.json({
            error: `${platform} vereist een afbeelding, maar de afbeelding URL is niet toegankelijk (${e.message}). Dit gebeurt meestal omdat:\n\n1. De afbeelding niet correct is opgeslagen in Supabase Storage\n2. De tijdelijke URL van AIML is verlopen\n3. Er is geen internetverbinding met de afbeelding\n\nGenereer de post opnieuw om een nieuwe afbeelding te maken.`,
            image_url: post.image_url,
            suggestion: 'Regenerate the post to create a new image'
          }, { status: 400 });
        }

        console.warn('⚠️ Image not accessible, continuing without media for platforms that don\'t require it');
      }

      // Now try to upload to Late
      if (post.image_url) {
        try {
          const media = await lateClient.uploadMediaFromUrl(post.image_url);
          mediaItems.push(media);
          console.log('✅ Media uploaded to Late.dev successfully:', {
            mediaId: media.mediaId,
            url: media.url,
            type: media.type,
          });
        } catch (e: any) {
          console.error('❌ Media upload to Late.dev failed:', e.message);
          console.error('📸 Failed image URL:', post.image_url);

          // Check if Instagram or TikTok is in the platforms (they require media)
          const hasInstagram = accounts.some((acc: any) => acc.platform === 'instagram');
          const hasTikTok = accounts.some((acc: any) => acc.platform === 'tiktok');

          if (hasInstagram || hasTikTok) {
            const platform = hasInstagram ? 'Instagram' : 'TikTok';
            return NextResponse.json({
              error: `${platform} vereist een afbeelding, maar het uploaden naar Late.dev is mislukt: ${e.message}\n\nDit kan komen door:\n1. Netwerkproblemen\n2. Onjuist beeldformaat\n3. Bestand te groot\n\nGenereer de post opnieuw.`,
              image_url: post.image_url,
              late_error: e.message
            }, { status: 400 });
          }
          // For other platforms, continue without media but log warning
          console.warn('⚠️ Continuing without media for platforms that don\'t require it');
        }
      }
    }

    // Create post on Late
    const platforms = accounts.map((acc: any) => ({
      platform: acc.platform,
      accountId: acc.late_account_id,
    }));

    // Validate Instagram requires media
    const hasInstagram = platforms.some((p: any) => p.platform === 'instagram');
    if (hasInstagram && mediaItems.length === 0) {
      return NextResponse.json({
        error: 'Instagram posts vereisen altijd een afbeelding of video. Voeg eerst media toe aan je post.'
      }, { status: 400 });
    }

    console.log('📤 Creating post on Late with:', {
      platforms: platforms.map((p: any) => p.platform),
      mediaCount: mediaItems.length,
      hasSchedule: !!scheduled_for,
      publishNow: publish_now,
    });

    const latePost = await lateClient.createPost({
      content: post.content,
      mediaItems: mediaItems.length > 0 ? mediaItems : undefined,
      platforms,
      scheduledFor: scheduled_for,
      timezone: 'Europe/Amsterdam',
      publishNow: publish_now,
      isDraft: !publish_now && !scheduled_for,
    });

    console.log('✅ Late post created:', {
      latePostId: latePost._id,
      status: latePost.status,
    });

    // Update our post
    await getSupabaseAdmin()
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
    const { data: post } = await getSupabaseAdmin()
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
    const { error } = await getSupabaseAdmin()
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

    const { data: post, error } = await getSupabaseAdmin()
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
