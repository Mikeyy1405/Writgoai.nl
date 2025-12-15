
import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth-options';
import { uploadFile } from '@/lib/s3';

export const dynamic = 'force-dynamic';
export const maxDuration = 60;

export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.email) {
      return NextResponse.json({ error: 'Niet geautoriseerd' }, { status: 401 });
    }

    const formData = await req.formData();
    const file = formData.get('file') as File;

    if (!file) {
      return NextResponse.json({ error: 'Geen bestand gevonden' }, { status: 400 });
    }

    // Validate file type
    const allowedTypes = ['video/', 'audio/', 'image/'];
    const isAllowed = allowedTypes.some(type => file.type.startsWith(type));
    
    if (!isAllowed) {
      return NextResponse.json({ 
        error: 'Alleen video, audio en afbeelding bestanden zijn toegestaan' 
      }, { status: 400 });
    }

    // Validate file size (max 500MB)
    const maxSize = 500 * 1024 * 1024; // 500MB
    if (file.size > maxSize) {
      return NextResponse.json({ 
        error: 'Bestand is te groot. Maximaal 500MB toegestaan.' 
      }, { status: 400 });
    }

    console.log('Uploading file:', file.name, 'Size:', file.size, 'Type:', file.type);

    // Convert file to buffer
    const buffer = Buffer.from(await file.arrayBuffer());

    // Generate S3 key with timestamp and original filename
    const timestamp = Date.now();
    const sanitizedName = file.name.replace(/[^a-zA-Z0-9._-]/g, '_');
    const s3Key = `uploads/${session.user.email}/${timestamp}-${sanitizedName}`;

    // Upload to S3
    const cloudStoragePath = await uploadFile(buffer, s3Key);

    console.log('File uploaded successfully:', cloudStoragePath);

    return NextResponse.json({
      success: true,
      url: cloudStoragePath,
      fileName: file.name,
      fileType: file.type,
      fileSize: file.size,
    });

  } catch (error) {
    console.error('File upload error:', error);
    return NextResponse.json({ 
      error: error instanceof Error ? error.message : 'Upload mislukt' 
    }, { status: 500 });
  }
}
