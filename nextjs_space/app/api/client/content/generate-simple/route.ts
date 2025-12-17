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
    
    // Validate and sanitize inputs
    const safeTitle = title && typeof title === 'string' ? String(title).trim() : '';
    const safeKeywords = keywords && typeof keywords === 'string' ? String(keywords).trim() : '';
    const safeProjectId = projectId && typeof projectId === 'string' ? String(projectId).trim() : null;
    const safeTargetAudience = targetAudience && typeof targetAudience === 'string' ? String(targetAudience).trim() : '';
    
    console.log('[Generate Simple] Title:', safeTitle);
    console.log('[Generate Simple] Keywords:', safeKeywords);
    console.log('[Generate Simple] Project ID:', safeProjectId);
    console.log('[Generate Simple] Target Audience:', safeTargetAudience);
    
    if (!safeTitle || safeTitle.length === 0) {
      return NextResponse.json(
        { success: false, error: 'Titel is verplicht en mag niet leeg zijn' },
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
    if (safeProjectId) {
      project = await prisma.project.findFirst({
        where: { 
          id: safeProjectId,
          clientId: client.id
        }
      });
    }
    
    // Build AI prompt with safe values
    const prompt = `
Schrijf een uitgebreid, SEO-geoptimaliseerd artikel in het Nederlands.

Titel: ${safeTitle}
${safeKeywords ? `Focus Keywords: ${safeKeywords}` : ''}
${safeTargetAudience ? `Doelgroep: ${safeTargetAudience}` : ''}
${project?.websiteUrl ? `Website: ${project.websiteUrl}` : (project?.name ? `Project: ${project.name}` : '')}

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
    console.log('[Generate Simple] Prompt length:', prompt.length);
    
    // Call AI API - gebruik chatCompletion met correct format
    const aiResponse = await chatCompletion({
      model: TEXT_MODELS.CLAUDE_SONNET_4,
      messages: [
        { role: 'user', content: prompt }
      ],
      temperature: 0.7,
      max_tokens: 4000
    });
    
    // Extract content from response
    const content = aiResponse.choices?.[0]?.message?.content || aiResponse.content;
    
    console.log('[Generate Simple] Content generated:', content.length, 'characters');
    
    if (!content || content.length < 100) {
      throw new Error('Geen content gegenereerd');
    }
    
    // Save to database with validated data
    const savedContent = await prisma.savedContent.create({
      data: {
        title: safeTitle,
        content: content,
        projectId: safeProjectId || null,
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
    console.error('[Generate Simple] Error name:', error.name);
    console.error('[Generate Simple] Error message:', error.message);
    console.error('[Generate Simple] Error stack:', error.stack);
    
    // Provide user-friendly error messages
    let userMessage = 'Er ging iets mis bij het genereren van content';
    
    if (error.message?.includes('timeout')) {
      userMessage = 'De AI deed er te lang over. Probeer het opnieuw met kortere tekst.';
    } else if (error.message?.includes('API')) {
      userMessage = 'De AI service is tijdelijk niet bereikbaar. Probeer het later opnieuw.';
    } else if (error.message?.includes('Geen content')) {
      userMessage = 'Er kon geen content gegenereerd worden. Probeer een andere titel of keywords.';
    } else if (error.message) {
      userMessage = error.message;
    }
    
    return NextResponse.json(
      { 
        success: false, 
        error: userMessage,
        technicalDetails: process.env.NODE_ENV === 'development' ? {
          message: error.message,
          stack: error.stack,
          name: error.name
        } : undefined
      },
      { status: 500 }
    );
  }
}
