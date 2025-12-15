import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth-options';
import { uploadBrandingFile } from '@/lib/supabase/storage';

export const dynamic = 'force-dynamic';

export const maxDuration = 60;

export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    
    // Check if user is admin
    if (!session?.user?.email || session.user.role !== 'admin') {
      return NextResponse.json({ error: 'Niet geautoriseerd' }, { status: 401 });
    }

    const formData = await req.formData();
    const file = formData.get('file') as File;
    const type = formData.get('type') as string;

    if (!file) {
      return NextResponse.json({ error: 'Geen bestand gevonden' }, { status: 400 });
    }

    // Validate file type
    const allowedMimeTypes = [
      'image/png',
      'image/jpeg',
      'image/gif',
      'image/webp',
      'image/svg+xml'
    ];
    
    if (!allowedMimeTypes.includes(file.type)) {
      return NextResponse.json({ 
        error: 'Alleen PNG, JPEG, GIF, WebP en SVG afbeeldingen zijn toegestaan' 
      }, { status: 400 });
    }

    // Validate file size (max 5MB)
    const MAX_FILE_SIZE = 5 * 1024 * 1024;
    if (file.size > MAX_FILE_SIZE) {
      return NextResponse.json({ 
        error: 'Bestand is te groot. Maximaal 5MB toegestaan.' 
      }, { status: 400 });
    }

    console.log('[Branding Upload] Uploading file:', file.name, 'Size:', file.size, 'Type:', type);

    // Convert to buffer and upload to Supabase Storage
    const buffer = Buffer.from(await file.arrayBuffer());
    const fileName = `${type}/${file.name}`;
    
    const { publicUrl, storedFileName } = await uploadBrandingFile(buffer, fileName, file.type);

    console.log('[Branding Upload] File uploaded successfully:', publicUrl);

    return NextResponse.json({
      success: true,
      url: publicUrl,
      fileName: file.name,
      storedFileName,
      fileType: file.type,
      fileSize: file.size,
      type,
    });

  } catch (error) {
    console.error('[Branding Upload] Error:', error);
    return NextResponse.json({ 
      error: error instanceof Error ? error.message : 'Upload mislukt. Probeer het opnieuw.' 
    }, { status: 500 });
  }
}
