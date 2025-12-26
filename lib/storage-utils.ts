/**
 * Storage utilities for saving images to Supabase Storage
 */

import { createClient } from '@supabase/supabase-js';

let supabaseAdmin: ReturnType<typeof createClient> | null = null;

function getSupabaseAdmin(): ReturnType<typeof createClient> {
  if (!supabaseAdmin) {
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

    if (!supabaseUrl || !supabaseServiceKey) {
      throw new Error('Missing Supabase environment variables');
    }

    supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey);
  }
  return supabaseAdmin!;
}

const STORAGE_BUCKET = 'social-media-images';

/**
 * Download image from URL and upload to Supabase Storage
 * Returns permanent public URL
 */
export async function saveImageFromUrl(
  imageUrl: string,
  filename: string,
  folder: string = 'social'
): Promise<string> {
  console.log('📥 Downloading image from:', imageUrl);

  try {
    // Download image from URL
    const response = await fetch(imageUrl, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (compatible; WritgoBot/1.0)',
      },
    });

    if (!response.ok) {
      throw new Error(`Failed to download image: ${response.status} ${response.statusText}`);
    }

    const blob = await response.blob();
    const arrayBuffer = await blob.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);

    console.log(`📦 Image downloaded: ${buffer.length} bytes`);

    // Ensure bucket exists
    await ensureBucketExists();

    // Generate unique filename with organized folder structure
    const timestamp = Date.now();
    const sanitizedFilename = filename.replace(/[^a-z0-9.-]/gi, '_');
    const year = new Date().getFullYear();
    const month = String(new Date().getMonth() + 1).padStart(2, '0');
    const storagePath = `${folder}/${year}/${month}/${timestamp}_${sanitizedFilename}`;

    console.log('📤 Uploading to Supabase Storage:', storagePath);

    // Upload to Supabase Storage
    const { data, error } = await getSupabaseAdmin().storage
      .from(STORAGE_BUCKET)
      .upload(storagePath, buffer, {
        contentType: blob.type || 'image/png',
        cacheControl: '31536000', // 1 year cache
        upsert: false
      });

    if (error) {
      console.error('❌ Upload error:', error);
      throw new Error(`Storage upload failed: ${error.message}`);
    }

    console.log('✅ Upload successful:', data.path);

    // Get public URL
    const { data: { publicUrl } } = getSupabaseAdmin().storage
      .from(STORAGE_BUCKET)
      .getPublicUrl(data.path);

    console.log('🔗 Public URL:', publicUrl);

    // Verify the URL is accessible
    const verifyResponse = await fetch(publicUrl, { method: 'HEAD' });
    if (!verifyResponse.ok) {
      throw new Error(`Uploaded image not accessible: ${verifyResponse.status}`);
    }

    return publicUrl;
  } catch (error: any) {
    console.error('❌ CRITICAL: Failed to save image permanently:', error.message);
    console.error('❌ Original URL:', imageUrl);
    console.error('❌ This will cause publishing to fail when the temporary URL expires!');

    // IMPORTANT: Don't fall back to temporary URL - this causes publishing to fail later
    // Instead, throw the error so the caller knows something is wrong
    throw new Error(`Failed to save image to permanent storage: ${error.message}`);
  }
}

/**
 * Ensure the storage bucket exists and is public
 */
async function ensureBucketExists(): Promise<void> {
  try {
    const { data: buckets } = await getSupabaseAdmin().storage.listBuckets();

    const bucketExists = buckets?.some(b => b.name === STORAGE_BUCKET);

    if (!bucketExists) {
      console.log('📦 Creating storage bucket:', STORAGE_BUCKET);

      const { error } = await getSupabaseAdmin().storage.createBucket(STORAGE_BUCKET, {
        public: true,
        fileSizeLimit: 10485760, // 10MB
        allowedMimeTypes: ['image/png', 'image/jpeg', 'image/jpg', 'image/webp', 'image/gif']
      });

      if (error && !error.message.includes('already exists')) {
        console.error('❌ Failed to create bucket:', error);
      } else {
        console.log('✅ Bucket created successfully');
      }
    }
  } catch (error: any) {
    console.error('❌ Bucket check failed:', error.message);
    // Non-fatal - bucket might already exist
  }
}

/**
 * Delete image from storage
 */
export async function deleteImage(publicUrl: string): Promise<boolean> {
  try {
    // Extract path from public URL
    const urlParts = publicUrl.split(`/${STORAGE_BUCKET}/`);
    if (urlParts.length < 2) {
      console.warn('Invalid storage URL:', publicUrl);
      return false;
    }

    const filePath = urlParts[1];

    const { error } = await getSupabaseAdmin().storage
      .from(STORAGE_BUCKET)
      .remove([filePath]);

    if (error) {
      console.error('Failed to delete image:', error);
      return false;
    }

    console.log('✅ Image deleted:', filePath);
    return true;
  } catch (error: any) {
    console.error('Delete image error:', error);
    return false;
  }
}
