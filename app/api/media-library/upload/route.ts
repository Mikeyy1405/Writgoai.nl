import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase-server';
import { createClient as createAdminClient } from '@supabase/supabase-js';


export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

const MEDIA_LIBRARY_BUCKET = 'media-library';

let supabaseAdmin: ReturnType<typeof createAdminClient> | null = null;

function getSupabaseAdmin() {
  if (!supabaseAdmin) {
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

    if (!supabaseUrl || !supabaseServiceKey) {
      throw new Error('Missing Supabase environment variables');
    }

    supabaseAdmin = createAdminClient(supabaseUrl, supabaseServiceKey);
  }
  return supabaseAdmin;
}

/**
 * POST /api/media-library/upload
 *
 * Upload media (images/videos) to the media library
 * Accepts multipart/form-data with file upload
 */
export async function POST(request: NextRequest) {
  try {
    const supabase = createClient();

    // Check authentication
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Parse form data
    const formData = await request.formData();
    const file = formData.get('file') as File;
    const title = formData.get('title') as string || '';
    const description = formData.get('description') as string || '';
    const tags = formData.get('tags') as string || '';
    const altText = formData.get('altText') as string || '';

    if (!file) {
      return NextResponse.json({ error: 'No file provided' }, { status: 400 });
    }

    // Validate file type
    const allowedImageTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp', 'image/gif'];
    const allowedVideoTypes = ['video/mp4', 'video/webm', 'video/quicktime'];
    const allowedTypes = [...allowedImageTypes, ...allowedVideoTypes];

    if (!allowedTypes.includes(file.type)) {
      return NextResponse.json({
        error: 'Invalid file type. Allowed: images (jpg, png, webp, gif) and videos (mp4, webm, mov)'
      }, { status: 400 });
    }

    // Validate file size (max 50MB for videos, 10MB for images)
    const maxSize = allowedVideoTypes.includes(file.type) ? 50 * 1024 * 1024 : 10 * 1024 * 1024;
    if (file.size > maxSize) {
      const maxSizeMB = maxSize / (1024 * 1024);
      return NextResponse.json({
        error: `File too large. Maximum size: ${maxSizeMB}MB`
      }, { status: 400 });
    }

    // Ensure bucket exists
    await ensureBucketExists();

    // Convert file to buffer
    const arrayBuffer = await file.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);

    // Generate storage path
    const timestamp = Date.now();
    const sanitizedFilename = file.name.replace(/[^a-z0-9.-]/gi, '_');
    const year = new Date().getFullYear();
    const month = String(new Date().getMonth() + 1).padStart(2, '0');
    const fileType = allowedImageTypes.includes(file.type) ? 'images' : 'videos';
    const storagePath = `${fileType}/${year}/${month}/${user.id}/${timestamp}_${sanitizedFilename}`;

    // Upload to Supabase Storage
    const admin = getSupabaseAdmin();
    const { data: uploadData, error: uploadError } = await admin.storage
      .from(MEDIA_LIBRARY_BUCKET)
      .upload(storagePath, buffer, {
        contentType: file.type,
        cacheControl: '31536000',
        upsert: false
      });

    if (uploadError) {
      console.error('Upload error:', uploadError);
      return NextResponse.json({
        error: 'Failed to upload file'
      }, { status: 500 });
    }

    // Get public URL
    const { data: { publicUrl } } = admin.storage
      .from(MEDIA_LIBRARY_BUCKET)
      .getPublicUrl(uploadData.path);

    // Get image/video dimensions if possible
    let width: number | null = null;
    let height: number | null = null;
    let duration: number | null = null;

    // For images, we could use sharp to get dimensions, but for now we'll skip
    // Client can send dimensions if needed

    // Parse tags
    const tagsArray = tags ? tags.split(',').map(t => t.trim()).filter(Boolean) : [];

    // Save to database
    const mediaType = allowedImageTypes.includes(file.type) ? 'image' : 'video';
    const { data: mediaRecord, error: dbError } = await supabase
      .from('media')
      .insert({
        user_id: user.id,
        type: mediaType,
        url: publicUrl,
        storage_path: uploadData.path,
        filename: file.name,
        mime_type: file.type,
        file_size: file.size,
        title: title || file.name,
        description,
        alt_text: altText,
        tags: tagsArray,
        width,
        height,
        duration,
        status: 'uploaded',
        uploaded_at: new Date().toISOString()
      })
      .select()
      .single();

    if (dbError) {
      console.error('Database error:', dbError);
      // Try to clean up uploaded file
      await admin.storage.from(MEDIA_LIBRARY_BUCKET).remove([uploadData.path]);
      return NextResponse.json({
        error: 'Failed to save media record'
      }, { status: 500 });
    }

    return NextResponse.json({
      success: true,
      media: mediaRecord
    });

  } catch (error: any) {
    console.error('Upload error:', error);
    return NextResponse.json({
      error: error.message || 'Internal server error'
    }, { status: 500 });
  }
}

/**
 * Ensure the media library bucket exists
 */
async function ensureBucketExists(): Promise<void> {
  try {
    const admin = getSupabaseAdmin();
    const { data: buckets } = await admin.storage.listBuckets();

    const bucketExists = buckets?.some(b => b.name === MEDIA_LIBRARY_BUCKET);

    if (!bucketExists) {
      console.log('Creating media library bucket...');

      const { error } = await admin.storage.createBucket(MEDIA_LIBRARY_BUCKET, {
        public: true,
        fileSizeLimit: 52428800, // 50MB
        allowedMimeTypes: [
          'image/png',
          'image/jpeg',
          'image/jpg',
          'image/webp',
          'image/gif',
          'video/mp4',
          'video/webm',
          'video/quicktime'
        ]
      });

      if (error && !error.message.includes('already exists')) {
        console.error('Failed to create bucket:', error);
      } else {
        console.log('Media library bucket created');
      }
    }
  } catch (error: any) {
    console.error('Bucket check failed:', error.message);
  }
}
