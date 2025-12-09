import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth-options';

// Next.js route configuration - max execution time in seconds
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
    const type = formData.get('type') as string; // 'logo', 'logoLight', 'logoDark', etc.

    if (!file) {
      return NextResponse.json({ error: 'Geen bestand gevonden' }, { status: 400 });
    }

    // Validate file type - only specific image formats allowed
    const allowedMimeTypes = [
      'image/png',
      'image/jpeg',
      'image/jpg',
      'image/gif',
      'image/webp',
      'image/svg+xml'
    ];
    
    if (!allowedMimeTypes.includes(file.type)) {
      return NextResponse.json({ 
        error: 'Alleen PNG, JPEG, GIF, WebP en SVG afbeeldingen zijn toegestaan' 
      }, { status: 400 });
    }

    // Validate file size (max 5MB for database storage)
    // Note: Base64 encoding adds ~33% overhead, so actual DB storage will be ~6.7MB
    const maxSize = 5 * 1024 * 1024; // 5MB
    if (file.size > maxSize) {
      return NextResponse.json({ 
        error: 'Bestand is te groot. Maximaal 5MB toegestaan voor database opslag.' 
      }, { status: 400 });
    }

    console.log('[Branding Upload] Processing file:', file.name, 'Size:', file.size, 'Type:', type);

    // Convert file to Base64 data URL
    const buffer = Buffer.from(await file.arrayBuffer());
    const base64 = buffer.toString('base64');
    const dataUrl = `data:${file.type};base64,${base64}`;

    console.log('[Branding Upload] File converted to Base64, length:', dataUrl.length);

    return NextResponse.json({
      success: true,
      url: dataUrl,
      fileName: file.name,
      fileType: file.type,
      fileSize: file.size,
      type,
    });

  } catch (error) {
    console.error('[Branding Upload] Error:', error);
    return NextResponse.json({ 
      error: error instanceof Error ? error.message : 'Upload mislukt' 
    }, { status: 500 });
  }
}
