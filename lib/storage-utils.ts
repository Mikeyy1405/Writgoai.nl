/**
 * Storage utilities for saving images to Supabase Storage
 */

import { createClient } from '@supabase/supabase-js';

const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

const STORAGE_BUCKET = 'social-media-images';

/**
 * Download image from URL and upload to Supabase Storage
 * Returns permanent public URL
 */
export async function saveImageFromUrl(
  imageUrl: string,
  filename: string
): Promise<string> {
  try {
    console.log('📥 Downloading image from:', imageUrl);

    // Download image from URL
    const response = await fetch(imageUrl);
    if (!response.ok) {
      throw new Error(`Failed to download image: ${response.status} ${response.statusText}`);
    }

    const blob = await response.blob();
    const arrayBuffer = await blob.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);

    console.log(`📦 Image downloaded: ${buffer.length} bytes`);

    // Ensure bucket exists
    await ensureBucketExists();

    // Generate unique filename
    const timestamp = Date.now();
    const sanitizedFilename = filename.replace(/[^a-z0-9.-]/gi, '_');
    const storagePath = `${timestamp}_${sanitizedFilename}`;

    console.log('📤 Uploading to Supabase Storage:', storagePath);

    // Upload to Supabase Storage
    const { data, error } = await supabaseAdmin.storage
      .from(STORAGE_BUCKET)
      .upload(storagePath, buffer, {
        contentType: blob.type || 'image/png',
        cacheControl: '3600',
        upsert: false
      });

    if (error) {
      console.error('❌ Upload error:', error);
      throw new Error(`Storage upload failed: ${error.message}`);
    }

    console.log('✅ Upload successful:', data.path);

    // Get public URL
    const { data: { publicUrl } } = supabaseAdmin.storage
      .from(STORAGE_BUCKET)
      .getPublicUrl(data.path);

    console.log('🔗 Public URL:', publicUrl);

    return publicUrl;
  } catch (error: any) {
    console.error('❌ Failed to save image:', error.message);
    // If saving fails, return original URL as fallback
    // (better than failing completely)
    console.warn('⚠️ Falling back to original URL');
    return imageUrl;
  }
}

/**
 * Ensure the storage bucket exists and is public
 */
async function ensureBucketExists(): Promise<void> {
  try {
    const { data: buckets } = await supabaseAdmin.storage.listBuckets();

    const bucketExists = buckets?.some(b => b.name === STORAGE_BUCKET);

    if (!bucketExists) {
      console.log('📦 Creating storage bucket:', STORAGE_BUCKET);

      const { error } = await supabaseAdmin.storage.createBucket(STORAGE_BUCKET, {
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

    const { error } = await supabaseAdmin.storage
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
