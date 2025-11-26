
import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';

export async function GET(
  request: NextRequest,
  { params }: { params: { taskId: string } }
) {
  try {
    const taskId = params.taskId;

    const deliverable = await prisma.deliverable.findFirst({
      where: { taskId },
      include: {
        Task: {
          include: {
            Client: true,
          },
        },
      },
    });

    if (!deliverable) {
      return NextResponse.json({ error: 'Article not found' }, { status: 404 });
    }

    // Haal HTML content uit notes
    const notes = JSON.parse(deliverable.notes || '{}');
    const htmlContent = notes.htmlContent || '<h1>Content not available</h1>';

    return new NextResponse(htmlContent, {
      headers: {
        'Content-Type': 'text/html; charset=utf-8',
        'Content-Disposition': `inline; filename="${deliverable.fileName}"`,
      },
    });
  } catch (error) {
    console.error('Error fetching article:', error);
    return NextResponse.json(
      { error: 'Failed to fetch article' },
      { status: 500 }
    );
  }
}
