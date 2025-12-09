import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth-options';
import { uploadFile } from '@/lib/s3';

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
    const type = formData.get('type') as string; // 'logo', 'favicon', etc.

    if (!file) {
      return NextResponse.json({ error: 'Geen bestand gevonden' }, { status: 400 });
    }

    // Validate file type - only images allowed
    if (!file.type.startsWith('image/')) {
      return NextResponse.json({ 
        error: 'Alleen afbeeldingen zijn toegestaan' 
      }, { status: 400 });
    }

    // Validate file size (max 10MB for branding assets)
    const maxSize = 10 * 1024 * 1024; // 10MB
    if (file.size > maxSize) {
      return NextResponse.json({ 
        error: 'Bestand is te groot. Maximaal 10MB toegestaan.' 
      }, { status: 400 });
    }

    console.log('Uploading branding file:', file.name, 'Size:', file.size, 'Type:', type);

    // Convert file to buffer
    const buffer = Buffer.from(await file.arrayBuffer());

    // Generate S3 key with timestamp and type
    const timestamp = Date.now();
    const sanitizedName = file.name.replace(/[^a-zA-Z0-9._-]/g, '_');
    const s3Key = `branding/${type}/${timestamp}-${sanitizedName}`;

    // Upload to S3
    const cloudStoragePath = await uploadFile(buffer, s3Key);

    console.log('Branding file uploaded successfully:', cloudStoragePath);

    return NextResponse.json({
      success: true,
      url: cloudStoragePath,
      fileName: file.name,
      fileType: file.type,
      fileSize: file.size,
      type,
    });

  } catch (error) {
    console.error('Branding file upload error:', error);
    return NextResponse.json({ 
      error: error instanceof Error ? error.message : 'Upload mislukt' 
    }, { status: 500 });
  }
}
