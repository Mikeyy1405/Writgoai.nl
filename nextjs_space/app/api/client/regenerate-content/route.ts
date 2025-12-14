
import { NextRequest, NextResponse } from 'next/server';
import { getAuthenticatedClient, isAuthError } from '@/lib/auth-helpers';
import { prisma } from '@/lib/db';
import { generateDailyContentForClient } from '@/lib/professional-content-generator';

export const dynamic = 'force-dynamic';
export const maxDuration = 300;

export async function POST(req: NextRequest) {
  try {
    const auth = await getAuthenticatedClient();
    
    if (isAuthError(auth)) {
      return NextResponse.json(
        { error: auth.error }, 
        { status: auth.status }
      );
    }

    // Use client.id (from Client table), NOT session.user.id
    const clientId = auth.client.id;

    const { contentId, contentType } = await req.json();

    if (!contentId || !contentType) {
      return NextResponse.json({ error: 'contentId en contentType zijn verplicht' }, { status: 400 });
    }

    // Validate content type
    const validTypes = ['blog', 'social', 'reel', 'all'];
    if (!validTypes.includes(contentType)) {
      return NextResponse.json({ error: 'Ongeldig content type' }, { status: 400 });
    }

    // Get the content piece
    const content = await prisma.contentPiece.findUnique({
      where: { id: contentId }
    });

    if (!content) {
      return NextResponse.json({ error: 'Content niet gevonden' }, { status: 404 });
    }

    // Verify ownership
    if (content.clientId !== clientId) {
      return NextResponse.json({ error: 'Geen toegang' }, { status: 403 });
    }

    console.log(`🔄 Regenerating ${contentType} for content ${contentId}, theme: ${content.theme}`);

    // For now, we'll regenerate the entire content piece
    // We can optimize this later to regenerate only specific content types
    
    // Delete the existing content
    await prisma.contentPiece.delete({
      where: { id: contentId }
    });

    // Update the day number in content plan back to 'not generated'
    const client = await prisma.client.findUnique({
      where: { id: clientId },
      select: { contentPlan: true }
    });

    if (client?.contentPlan) {
      const plan = client.contentPlan as any[];
      const dayIndex = plan.findIndex(d => d.day === content.dayNumber);
      
      if (dayIndex !== -1) {
        plan[dayIndex].generated = false;
        
        await prisma.client.update({
          where: { id: clientId },
          data: { contentPlan: plan }
        });
      }
    }

    // Generate new content for this day
    const result = await generateDailyContentForClient(clientId);

    if (!result) {
      return NextResponse.json({
        error: 'Kon content niet opnieuw genereren'
      }, { status: 500 });
    }

    console.log(`✅ Content successfully regenerated: ${result.id}`);

    return NextResponse.json({
      success: true,
      message: `Content succesvol opnieuw gegenereerd`,
      content: result
    });

  } catch (error: any) {
    console.error('Regenerate error:', error);
    return NextResponse.json({
      error: 'Server fout',
      details: error.message
    }, { status: 500 });
  }
}
