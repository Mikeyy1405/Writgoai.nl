/**
 * 🚀 SIMPLE CONTENT GENERATOR - Non-Streaming Version
 * 
 * Voor auto-generate flow zonder streaming complexity
 * - Direct JSON response
 * - Opslaan in SavedContent
 * - Simpel en betrouwbaar
 */

import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth-options';
import { prisma } from '@/lib/db';
import { chatCompletion, TEXT_MODELS } from '@/lib/aiml-api';

export const runtime = 'nodejs';
export const maxDuration = 300; // 5 minuten
export const dynamic = 'force-dynamic';

export async function POST(request: NextRequest) {
  try {
    console.log('[Generate Simple] ========== START ==========');
    
    // Auth check
    const session = await getServerSession(authOptions);
    if (!session?.user?.email) {
      return NextResponse.json(
        { success: false, error: 'Niet ingelogd' },
        { status: 401 }
      );
    }
    
    const body = await request.json();
    const { title, keywords, projectId, targetAudience, contentType } = body;
    
    console.log('[Generate Simple] Title:', title);
    console.log('[Generate Simple] Keywords:', keywords);
    console.log('[Generate Simple] Project ID:', projectId);
    
    if (!title) {
      return NextResponse.json(
        { success: false, error: 'Titel is verplicht' },
        { status: 400 }
      );
    }
    
    // Get client
    const client = await prisma.client.findUnique({
      where: { email: session.user.email }
    });
    
    if (!client) {
      return NextResponse.json(
        { success: false, error: 'Client niet gevonden' },
        { status: 404 }
      );
    }
    
    // Get project if provided
    let project = null;
    if (projectId) {
      project = await prisma.project.findFirst({
        where: { 
          id: projectId,
          clientId: client.id
        }
      });
    }
    
    // Build AI prompt
    const prompt = `
Schrijf een uitgebreid, SEO-geoptimaliseerd artikel in het Nederlands.

Titel: ${title}
${keywords ? `Focus Keywords: ${keywords}` : ''}
${targetAudience ? `Doelgroep: ${targetAudience}` : ''}
${project ? `Website: ${project.websiteUrl || project.name}` : ''}

Vereisten:
- Minimaal 1500 woorden
- Gebruik H2 en H3 headers voor structuur
- SEO-geoptimaliseerd met natuurlijk gebruik van keywords
- Leesbaar en informatief voor de doelgroep
- Voeg waar relevant interne links toe
- Schrijf in een professionele maar toegankelijke toon

Formaat:
- Begin met een korte introductie (2-3 alinea's)
- Gebruik duidelijke H2 headers voor hoofdsecties
- Gebruik H3 headers voor subsecties
- Sluit af met een conclusie

Schrijf het volledige artikel nu:
`.trim();
    
    console.log('[Generate Simple] Calling AI...');
    
    // Call AI API - gebruik chatCompletion
    const aiResponse = await chatCompletion([
      { role: 'user', content: prompt }
    ], {
      model: TEXT_MODELS.CLAUDE_SONNET_4,
      temperature: 0.7,
      max_tokens: 4000
    });
    
    const content = aiResponse.content;
    
    console.log('[Generate Simple] Content generated:', content.length, 'characters');
    
    if (!content || content.length < 100) {
      throw new Error('Geen content gegenereerd');
    }
    
    // Save to database
    const savedContent = await prisma.savedContent.create({
      data: {
        title: title,
        content: content,
        projectId: projectId || null,
        clientId: client.id,
        status: 'draft',
        createdAt: new Date()
      }
    });
    
    console.log('[Generate Simple] ✅ SUCCESS - Content ID:', savedContent.id);
    
    return NextResponse.json({
      success: true,
      id: savedContent.id,
      title: savedContent.title,
      content: savedContent.content,
      wordCount: content.split(/\s+/).filter(w => w).length
    });
    
  } catch (error: any) {
    console.error('[Generate Simple] ❌ ERROR:', error);
    return NextResponse.json(
      { 
        success: false, 
        error: error.message || 'Onbekende fout',
        details: process.env.NODE_ENV === 'development' ? error.stack : undefined
      },
      { status: 500 }
    );
  }
}
