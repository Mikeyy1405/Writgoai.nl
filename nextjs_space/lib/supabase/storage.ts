import { supabaseAdmin } from '@/lib/supabase';

const BRANDING_BUCKET = 'branding';

/**
 * Upload a branding file to Supabase Storage
 * @param file - File buffer to upload
 * @param fileName - Original filename
 * @param contentType - MIME type of the file
 * @returns Public URL of the uploaded file
 */
export async function uploadBrandingFile(
  file: Buffer,
  fileName: string,
  contentType: string
): Promise<string> {
  const timestamp = Date.now();
  const sanitizedName = fileName.replace(/[^a-zA-Z0-9._-]/g, '_');
  const filePath = `${timestamp}-${sanitizedName}`;

  const { data, error } = await supabaseAdmin.storage
    .from(BRANDING_BUCKET)
    .upload(filePath, file, {
      contentType,
      upsert: true,
    });

  if (error) {
    console.error('[Storage] Upload error:', error);
    throw new Error(`Upload mislukt: ${error.message}`);
  }

  // Get public URL
  const { data: urlData } = supabaseAdmin.storage
    .from(BRANDING_BUCKET)
    .getPublicUrl(data.path);

  return urlData.publicUrl;
}

/**
 * Delete a branding file from Supabase Storage
 * @param fileUrl - Public URL of the file to delete
 */
export async function deleteBrandingFile(fileUrl: string): Promise<void> {
  // Extract file path from URL
  const urlParts = fileUrl.split(`/storage/v1/object/public/${BRANDING_BUCKET}/`);
  if (urlParts.length < 2) return;
  
  const filePath = urlParts[1];
  
  const { error } = await supabaseAdmin.storage
    .from(BRANDING_BUCKET)
    .remove([filePath]);

  if (error) {
    console.error('[Storage] Delete error:', error);
    // Don't throw - file might already be deleted
  }
}
