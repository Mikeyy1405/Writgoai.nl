
import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth-options';
import { prisma } from '@/lib/db';
import { uploadChatFile, validateFile } from '@/lib/chat-file-upload';

export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.email) {
      return NextResponse.json({ error: 'Niet geautoriseerd' }, { status: 401 });
    }

    const client = await prisma.client.findUnique({
      where: { email: session.user.email },
    });

    if (!client) {
      return NextResponse.json({ error: 'Client niet gevonden' }, { status: 404 });
    }

    const formData = await req.formData();
    const file = formData.get('file') as File;
    const conversationId = formData.get('conversationId') as string;

    if (!file || !conversationId) {
      return NextResponse.json(
        { error: 'file en conversationId zijn verplicht' },
        { status: 400 }
      );
    }

    // Validate file
    const validation = validateFile(file);
    if (!validation.valid) {
      return NextResponse.json({ error: validation.error }, { status: 400 });
    }

    // Verify conversation ownership
    const conversation = await prisma.conversation.findUnique({
      where: { id: conversationId },
    });

    if (!conversation) {
      return NextResponse.json({ error: 'Conversatie niet gevonden' }, { status: 404 });
    }

    if (conversation.clientId !== client.id) {
      return NextResponse.json({ error: 'Geen toegang tot deze conversatie' }, { status: 403 });
    }

    // Upload file to S3
    const uploadedFile = await uploadChatFile(file, conversationId);

    return NextResponse.json({
      success: true,
      file: uploadedFile,
    });
  } catch (error: any) {
    console.error('File upload error:', error);
    return NextResponse.json({ error: error.message || 'Fout bij uploaden bestand' }, { status: 500 });
  }
}
