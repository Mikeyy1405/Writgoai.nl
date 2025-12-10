import { supabaseAdmin } from '@/lib/supabase';

const BRANDING_BUCKET = 'branding';

/**
 * Upload a branding file to Supabase Storage
 * @param file - File buffer to upload
 * @param fileName - Original filename
 * @param contentType - MIME type of the file
 * @returns Object with public URL and stored filename
 */
export async function uploadBrandingFile(
  file: Buffer,
  fileName: string,
  contentType: string
): Promise<{ publicUrl: string; storedFileName: string }> {
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

  return {
    publicUrl: urlData.publicUrl,
    storedFileName: data.path,
  };
}

/**
 * Delete a branding file from Supabase Storage
 * @param fileUrl - Public URL of the file to delete
 */
export async function deleteBrandingFile(fileUrl: string): Promise<void> {
  try {
    // Parse the URL and extract the file path
    const url = new URL(fileUrl);
    const pathMatch = url.pathname.match(/\/storage\/v1\/object\/public\/branding\/(.+)/);
    
    if (!pathMatch || !pathMatch[1]) {
      console.warn('[Storage] Could not extract file path from URL:', fileUrl);
      return;
    }
    
    const filePath = pathMatch[1];
    
    const { error } = await supabaseAdmin.storage
      .from(BRANDING_BUCKET)
      .remove([filePath]);

    if (error) {
      console.error('[Storage] Delete error:', error);
      // Don't throw - file might already be deleted
    }
  } catch (err) {
    console.error('[Storage] Invalid URL format:', fileUrl, err);
    // Don't throw - invalid URL should not break the flow
  }
}
