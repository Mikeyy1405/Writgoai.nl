
import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth-options';
import { PrismaClient } from '@prisma/client';
import { generateDailyContentForClient } from '@/lib/professional-content-generator';

const prisma = new PrismaClient();

export const dynamic = 'force-dynamic';
export const maxDuration = 300; // 5 minutes timeout
export const fetchCache = 'force-no-store';

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user?.email) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    
    // Get client
    const client = await prisma.client.findUnique({
      where: { email: session.user.email }
    });
    
    if (!client) {
      return NextResponse.json({ error: 'Client not found' }, { status: 404 });
    }
    
    // Check if client has WordPress connected
    if (!client.wordpressUrl || !client.wordpressUsername || !client.wordpressPassword) {
      return NextResponse.json({ 
        error: 'WordPress niet verbonden. Verbind eerst je WordPress website.' 
      }, { status: 400 });
    }
    
    // Check if client has content plan
    if (!client.contentPlan) {
      return NextResponse.json({ 
        error: 'Geen content plan gevonden. Scan eerst je website om een content plan te maken.' 
      }, { status: 400 });
    }
    
    // Parse request body to get contentTypes, dayNumber, and custom topic (optional)
    let contentTypes: string[] = [];
    let dayNumber: number | undefined = undefined;
    let customTopic: string | undefined = undefined;
    let customKeywords: string[] = [];
    try {
      const body = await request.json();
      contentTypes = body.contentTypes || [];
      dayNumber = body.dayNumber; // specific day to generate
      customTopic = body.customTopic; // custom topic from AI agent
      customKeywords = body.customKeywords || []; // custom keywords
    } catch (e) {
      // No body or invalid JSON - generate all types (default behavior)
      contentTypes = [];
    }
    
    console.log(`🚀 Manual content generation triggered for client ${client.id}${dayNumber ? ` (day ${dayNumber})` : ''}${contentTypes.length > 0 ? ` (types: ${contentTypes.join(', ')})` : ''}${customTopic ? ` (custom topic: ${customTopic})` : ''}`);
    
    // Generate content
    const result = await generateDailyContentForClient(
      client.id, 
      contentTypes, 
      dayNumber, 
      customTopic, 
      customKeywords
    );
    
    if (!result) {
      return NextResponse.json({ 
        error: 'Alle dagen in je huidige plan zijn al gegenereerd. Genereer een nieuw plan om door te gaan.' 
      }, { status: 400 });
    }
    
    // Build message based on what was generated
    let message = 'Content succesvol gegenereerd!';
    if (contentTypes.length > 0) {
      const typeNames: Record<string, string> = {
        blog: 'Blog artikel',
        social: 'Social media post',
        reel: 'Video'
      };
      const generated = contentTypes.map(t => typeNames[t] || t).join(' + ');
      message = `${generated} gegenereerd voor Dag ${result.dayNumber}!`;
    } else {
      message = `Volledige content set gegenereerd voor Dag ${result.dayNumber}!`;
    }
    
    return NextResponse.json({
      success: true,
      message: message,
      contentId: result.id,
      theme: result.theme
    });
    
  } catch (error) {
    console.error('Error generating content:', error);
    return NextResponse.json(
      { 
        error: 'Content generatie mislukt', 
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}
