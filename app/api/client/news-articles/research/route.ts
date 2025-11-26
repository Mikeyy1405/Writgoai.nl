
import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth-options';
import { prisma } from '@/lib/db';
import { chatCompletion, webSearch } from '@/lib/aiml-api';

// Helper to send progress updates
function sendProgress(
  encoder: TextEncoder,
  controller: ReadableStreamDefaultController,
  message: string,
  type: 'info' | 'success' | 'error' = 'info'
) {
  const data = JSON.stringify({ type, message }) + '\n';
  controller.enqueue(encoder.encode(data));
}

// Extract topic/industry from website URL
async function extractTopicFromWebsite(websiteUrl: string, language: string) {
  try {
    const systemPrompt = `Je bent een website analyzer. Op basis van een website URL, identificeer je het hoofdonderwerp, de industrie of het vakgebied waar de website over gaat. Geef ALLEEN het onderwerp terug, geen uitleg.`;

    const userPrompt = `Website URL: ${websiteUrl}\n\nWat is het hoofdonderwerp/de industrie van deze website? Geef alleen het onderwerp (bijv. "Bitcoin en cryptocurrency", "beleggingen", "yoga", "reizen", etc.)`;

    const response = await chatCompletion({
      model: 'gpt-4o',
      messages: [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: userPrompt }
      ],
      max_tokens: 100,
      temperature: 0.3,
    });

    const topic = response?.choices?.[0]?.message?.content?.trim() || '';
    return topic;
  } catch (error) {
    console.error('Topic extraction error:', error);
    return websiteUrl; // Fallback to URL
  }
}

// Web research for news articles using actual web search
async function performWebResearch(
  input: string, 
  sourceType: 'website' | 'topic', 
  language: string = 'nl',
  sendProgressFn: (message: string, type?: 'info' | 'success' | 'error') => void
) {
  try {
    let searchTopic = input;
    
    // If source is a website, extract the topic first
    if (sourceType === 'website') {
      sendProgressFn('🔍 Onderwerp van website analyseren...');
      searchTopic = await extractTopicFromWebsite(input, language);
      sendProgressFn(`✅ Onderwerp geïdentificeerd: ${searchTopic}`, 'success');
    }
    
    // Get current date for highly specific search
    const now = new Date();
    const todayFormatted = now.toLocaleDateString('nl-NL', { 
      day: 'numeric', 
      month: 'long', 
      year: 'numeric' 
    });
    const yesterdayFormatted = new Date(now.getTime() - 86400000).toLocaleDateString('nl-NL', { 
      day: 'numeric', 
      month: 'long', 
      year: 'numeric' 
    });
    
    // Step 1: Perform multiple targeted searches for VERY recent news
    // Focus on last 24-48 hours with explicit date references
    const searchQueries = language === 'nl' ? [
      `${searchTopic} nieuws ${todayFormatted} laatste 24 uur`,
      `${searchTopic} actueel ${todayFormatted} breaking`,
      `${searchTopic} nieuws ${yesterdayFormatted} ${todayFormatted}`,
    ] : [
      `${searchTopic} news ${todayFormatted} last 24 hours`,
      `${searchTopic} breaking news ${todayFormatted}`,
      `${searchTopic} latest ${yesterdayFormatted} ${todayFormatted}`,
    ];
    
    sendProgressFn(`🌐 Zoeken naar actueel nieuws over: ${searchTopic}...`);
    sendProgressFn(`📅 Focus op: ${todayFormatted} en ${yesterdayFormatted}`);
    console.log(`🔍 Performing multiple web searches for very recent news`);
    
    // Perform all searches in parallel
    const searchResults = await Promise.all(
      searchQueries.map(query => webSearch(query))
    );
    
    // Combine all results
    let combinedResults = '';
    let totalChars = 0;
    
    for (let i = 0; i < searchResults.length; i++) {
      const result = searchResults[i];
      if (result.success && result.results) {
        combinedResults += `\n\n=== ZOEKRESULTAAT ${i + 1} (${searchQueries[i]}) ===\n${result.results}`;
        totalChars += result.results.length;
      }
    }
    
    if (!combinedResults || totalChars === 0) {
      throw new Error('Geen nieuwsresultaten gevonden');
    }

    console.log(`✅ Web searches completed: ${totalChars} characters from ${searchQueries.length} searches`);
    sendProgressFn(`✅ ${totalChars} karakters aan nieuwsdata gevonden uit ${searchQueries.length} zoekopdrachten`, 'success');

    // Step 2: Analyze search results with AI to extract ONLY very recent news items
    sendProgressFn('🤖 AI analyseert nieuwsresultaten...');
    
    const systemPrompt = `Je bent een nieuwsonderzoeker gespecialiseerd in het vinden van het MEEST ACTUELE nieuws. Je krijgt web search resultaten en moet ALLEEN het allernieuwste nieuws identificeren (laatste 24-48 uur).

KRITIEKE REGEL: Selecteer ALLEEN nieuwsitems die:
- Vandaag of gisteren zijn gepubliceerd (${todayFormatted} of ${yesterdayFormatted})
- Actuele gebeurtenissen, koersbewegingen, aankondigingen of ontwikkelingen bevatten
- Specifieke recente data, cijfers of gebeurtenissen noemen

NEGEER:
- Algemene trends zonder specifieke datum
- Oudere nieuwsitems (ouder dan 48 uur)
- Evergreen content of algemene informatie

Focus op actuele gebeurtenissen IN DE INDUSTRIE/HET VAKGEBIED van "${searchTopic}", zoals:
- Voor "Bitcoin": koersbeweging vandaag/gisteren, nieuwe regelgeving aangekondigd, grote transacties
- Voor "beleggingen": marktbewegingen vandaag, nieuwe producten gelanceerd, economische cijfers gepubliceerd
- Voor "yoga": nieuwe studie gepubliceerd, trend gespot, event aangekondigd
- Voor "reizen": nieuwe bestemmingen geopend, reisadviezen aangepast, prijswijzigingen`;

    const userPrompt = `DATUM VANDAAG: ${todayFormatted}

Op basis van deze actuele web search resultaten over "${searchTopic}":\n\n${combinedResults}\n\nGeef een gestructureerd overzicht van ALLEEN het meest recente nieuws (laatste 24-48 uur):\n\n1. RECENTE NIEUWSGEBEURTENISSEN (met exacte datum en tijd indien mogelijk):\n   - Wat is er vandaag of gisteren gebeurd?\n   - Concrete cijfers, koersen, aankondigingen\n   - Specifieke gebeurtenissen met datum\n\n2. BREAKING DEVELOPMENTS:\n   - Wat is er net aangekondigd?\n   - Welke nieuwe ontwikkelingen zijn gaande?\n   - Actuele veranderingen in de markt/industrie\n\n3. TIJDGEVOELIGE TRENDS:\n   - Wat gebeurt er op dit moment?\n   - Welke patronen zie je vandaag/deze week?\n   - Recente verschuivingen\n\n4. CONCRETE DATA VOOR ARTIKELEN:\n   - Specifieke cijfers van vandaag/gisteren\n   - Namen, bedrijven, personen in het nieuws\n   - Actuele events en aankondigingen\n\nBELANGRIJK: Als er geen actueel nieuws (laatste 24-48 uur) in de resultaten staat, geef dit duidelijk aan. Verzin geen nieuws!`;

    const response = await chatCompletion({
      model: 'claude-sonnet-4-20250514',
      messages: [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: userPrompt }
      ],
      max_tokens: 4000,
      temperature: 0.5, // Lower temperature for more factual output
    });

    const content = response?.choices?.[0]?.message?.content || '';
    sendProgressFn('✅ Nieuwsanalyse voltooid', 'success');

    // Extract sources (URLs) from the search results for verification
    const sourceUrls: { url: string; title: string }[] = [];
    
    // Try to extract URLs from the search results using regex
    const urlRegex = /https?:\/\/[^\s<>"{}|\\^`\[\]]+/g;
    const urls = combinedResults.match(urlRegex) || [];
    
    // Deduplicate and limit to top 10 sources
    const uniqueUrls = Array.from(new Set(urls))
      .filter(url => {
        try {
          const urlObj = new URL(url);
          // Filter out common non-article URLs
          return !url.includes('javascript:') && 
                 !url.includes('mailto:') &&
                 !urlObj.hostname.includes('google.') &&
                 !urlObj.hostname.includes('facebook.') &&
                 !urlObj.hostname.includes('twitter.');
        } catch {
          return false;
        }
      })
      .slice(0, 10);
    
    // Extract titles from the search results for each URL
    for (const url of uniqueUrls) {
      // Try to find a title near this URL in the search results
      const urlIndex = combinedResults.indexOf(url);
      if (urlIndex > -1) {
        // Look for text before the URL (likely a title)
        const textBefore = combinedResults.substring(Math.max(0, urlIndex - 200), urlIndex);
        const lines = textBefore.split('\n').filter(l => l.trim());
        const possibleTitle = lines[lines.length - 1]?.trim() || new URL(url).hostname;
        
        sourceUrls.push({
          url,
          title: possibleTitle.length > 100 ? possibleTitle.substring(0, 100) + '...' : possibleTitle
        });
      }
    }

    return {
      success: true,
      researchData: content,
      extractedTopic: searchTopic,
      sources: sourceUrls, // Add sources for verification
    };
  } catch (error) {
    console.error('Research error:', error);
    sendProgressFn('❌ Fout bij research', 'error');
    return {
      success: false,
      error: 'Fout bij het uitvoeren van research',
    };
  }
}

// Generate article suggestions based on research
async function generateSuggestions(
  researchData: string, 
  sourceInput: string, 
  language: string = 'nl',
  sendProgressFn: (message: string, type?: 'info' | 'success' | 'error') => void
) {
  sendProgressFn('✨ Artikel suggesties genereren...');
  
  // Get current date
  const now = new Date();
  const todayFormatted = now.toLocaleDateString('nl-NL', { 
    day: 'numeric', 
    month: 'long', 
    year: 'numeric' 
  });
  
  const systemPrompt = `Je bent een creatieve nieuwsredacteur gespecialiseerd in ACTUEEL nieuws. Je maakt artikel suggesties die:

1. VERWIJZEN NAAR SPECIFIEKE RECENTE GEBEURTENISSEN (vandaag/gisteren)
2. CONCRETE CIJFERS, KOERSEN OF DATA NOEMEN in de titel
3. TIJDGEVOELIG ZIJN - het moet nu geschreven worden
4. ACTIONABLE NEWS bevatten - dingen die net gebeurd zijn of gebeuren

VOORBEELDEN VAN GOEDE TITELS:
✅ "Bitcoin stijgt naar €85.000: Wat dit betekent voor beleggers" (specifiek cijfer)
✅ "Nederlandse overheid kondigt nieuwe crypto-regels aan: Dit verandert er" (specifieke aankondiging)
✅ "Tesla daalt 15% na winstcijfers: Analyse van de impact" (specifiek percentage en event)
✅ "Yoga apps groeien 300% in 2025: Top 5 trends" (specifiek cijfer en trend)

VOORBEELDEN VAN SLECHTE TITELS:
❌ "Waarom Bitcoin belangrijk is" (te algemeen, geen specifieke event)
❌ "De toekomst van cryptocurrency" (geen actuele hook)
❌ "5 yoga tips voor beginners" (evergreen, niet nieuwswaardig)

Elk artikel moet:
- Een specifieke recente gebeurtenis of cijfer bevatten
- Relevantie voor NU hebben
- Concrete informatie bieden die snel veroudert`;

  const userPrompt = `DATUM VANDAAG: ${todayFormatted}

Op basis van deze research over "${sourceInput}":\n\n${researchData}\n\nGenereer 5 ZEER ACTUELE nieuwsartikel suggesties. Voor elk artikel:

1. TITEL: Moet specifieke cijfers, data of recente events bevatten
   - Gebruik concrete getallen waar mogelijk
   - Vermeld "vandaag", "gisteren" of specifieke data
   - Maak het tijdgevoelig en urgent

2. BESCHRIJVING: 2-3 zinnen met:
   - Wat is er precies gebeurd (vandaag/gisteren)?
   - Concrete cijfers en feiten
   - Waarom dit NU belangrijk is

3. HOEK: De specifieke invalshoek
   - Focus op de meest actuele angle
   - Wat maakt dit nieuwswaardig NU?

4. RELEVANTIE: Waarom dit artikel NU geschreven moet worden
   - Wat is de tijdgevoelige component?
   - Welk recent event triggert dit artikel?

BELANGRIJK: 
- Als er geen actueel nieuws in de research staat, geef dit aan
- Verzin GEEN cijfers of events die niet in de research staan
- Focus op wat er echt vandaag/gisteren is gebeurd

Formatteer je antwoord als JSON array met deze structuur:
[{
  "title": "Artikel titel met specifieke cijfers/data",
  "description": "Korte beschrijving met concrete details",
  "angle": "Hoofdhoek",
  "relevance": "Waarom dit NU actueel is"
}]`;

  try {
    const response = await chatCompletion({
      model: 'claude-sonnet-4-20250514',
      messages: [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: userPrompt }
      ],
      max_tokens: 3000,
      temperature: 0.7, // Lower temperature for more factual suggestions
    });

    const content = response?.choices?.[0]?.message?.content || '';
    
    // Extract JSON from response
    const jsonMatch = content.match(/\[[\s\S]*\]/);
    if (jsonMatch) {
      const suggestions = JSON.parse(jsonMatch[0]);
      sendProgressFn(`✅ ${suggestions.length} actuele artikel suggesties gegenereerd`, 'success');
      return {
        success: true,
        suggestions,
      };
    }

    sendProgressFn('❌ Geen geldige suggesties gegenereerd', 'error');
    return {
      success: false,
      error: 'Geen geldige suggesties gegenereerd',
    };
  } catch (error) {
    console.error('Suggestion generation error:', error);
    sendProgressFn('❌ Fout bij genereren suggesties', 'error');
    return {
      success: false,
      error: 'Fout bij het genereren van suggesties',
    };
  }
}

export async function POST(request: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.email) {
    return new Response(
      JSON.stringify({ type: 'error', message: 'Niet geautoriseerd' }),
      { status: 401 }
    );
  }

  const client = await prisma.client.findUnique({
    where: { email: session.user.email },
    include: { projects: true },
  });

  if (!client) {
    return new Response(
      JSON.stringify({ type: 'error', message: 'Client niet gevonden' }),
      { status: 404 }
    );
  }

  const body = await request.json();
  const { projectId, sourceType, sourceInput, language = 'nl' } = body;

  if (!projectId || !sourceType || !sourceInput) {
    return new Response(
      JSON.stringify({ type: 'error', message: 'Ontbrekende vereiste velden' }),
      { status: 400 }
    );
  }

  if (!['website', 'topic'].includes(sourceType)) {
    return new Response(
      JSON.stringify({ type: 'error', message: 'Ongeldig brontype' }),
      { status: 400 }
    );
  }

  // Verify project ownership
  const project = await prisma.project.findFirst({
    where: {
      id: projectId,
      clientId: client.id,
    },
  });

  if (!project) {
    return new Response(
      JSON.stringify({ type: 'error', message: 'Project niet gevonden' }),
      { status: 404 }
    );
  }

  // Return streaming response
  const encoder = new TextEncoder();
  const stream = new ReadableStream({
    async start(controller) {
      try {
        // Create research record
        sendProgress(encoder, controller, '📝 Research record aanmaken...');
        const research = await prisma.newsResearch.create({
          data: {
            projectId,
            sourceType,
            sourceInput,
            status: 'researching',
            suggestions: [],
          },
        });
        sendProgress(encoder, controller, '✅ Research gestart', 'success');

        // Perform research with progress updates
        const researchResult = await performWebResearch(
          sourceInput, 
          sourceType as 'website' | 'topic', 
          language,
          (message, type) => sendProgress(encoder, controller, message, type)
        );
        
        if (!researchResult.success) {
          await prisma.newsResearch.update({
            where: { id: research.id },
            data: { status: 'failed' },
          });
          
          sendProgress(encoder, controller, researchResult.error || 'Research mislukt', 'error');
          const errorData = JSON.stringify({ 
            type: 'complete', 
            success: false, 
            error: researchResult.error 
          }) + '\n';
          controller.enqueue(encoder.encode(errorData));
          controller.close();
          return;
        }

        // Generate suggestions with progress updates
        const suggestionsResult = await generateSuggestions(
          researchResult.researchData,
          researchResult.extractedTopic || sourceInput,
          language,
          (message, type) => sendProgress(encoder, controller, message, type)
        );

        if (!suggestionsResult.success) {
          await prisma.newsResearch.update({
            where: { id: research.id },
            data: {
              status: 'completed',
              researchData: {
                content: researchResult.researchData,
                sources: researchResult.sources || [],
                extractedTopic: researchResult.extractedTopic,
              },
            },
          });
          
          sendProgress(encoder, controller, suggestionsResult.error || 'Suggesties genereren mislukt', 'error');
          const errorData = JSON.stringify({ 
            type: 'complete', 
            success: false, 
            error: suggestionsResult.error 
          }) + '\n';
          controller.enqueue(encoder.encode(errorData));
          controller.close();
          return;
        }

        // Update research with results
        sendProgress(encoder, controller, '💾 Resultaten opslaan...');
        const updatedResearch = await prisma.newsResearch.update({
          where: { id: research.id },
          data: {
            status: 'completed',
            researchData: {
              content: researchResult.researchData,
              sources: researchResult.sources || [],
              extractedTopic: researchResult.extractedTopic,
            },
            suggestions: suggestionsResult.suggestions,
          },
        });
        sendProgress(encoder, controller, '✅ Suggesties opgeslagen', 'success');

        // Send completion message with data
        const completeData = JSON.stringify({ 
          type: 'complete', 
          success: true, 
          research: updatedResearch 
        }) + '\n';
        controller.enqueue(encoder.encode(completeData));
        controller.close();
      } catch (error) {
        console.error('Research streaming error:', error);
        sendProgress(encoder, controller, 'Er is een fout opgetreden', 'error');
        const errorData = JSON.stringify({ 
          type: 'complete', 
          success: false, 
          error: 'Er is een fout opgetreden' 
        }) + '\n';
        controller.enqueue(encoder.encode(errorData));
        controller.close();
      }
    },
  });

  return new Response(stream, {
    headers: {
      'Content-Type': 'text/event-stream',
      'Cache-Control': 'no-cache',
      'Connection': 'keep-alive',
    },
  });
}

// GET - Get research history for a project
export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.email) {
      return NextResponse.json(
        { error: 'Niet geautoriseerd' },
        { status: 401 }
      );
    }

    const client = await prisma.client.findUnique({
      where: { email: session.user.email },
    });

    if (!client) {
      return NextResponse.json(
        { error: 'Client niet gevonden' },
        { status: 404 }
      );
    }

    const { searchParams } = new URL(request.url);
    const projectId = searchParams.get('projectId');

    if (!projectId) {
      return NextResponse.json(
        { error: 'ProjectId is verplicht' },
        { status: 400 }
      );
    }

    // Verify project ownership
    const project = await prisma.project.findFirst({
      where: {
        id: projectId,
        clientId: client.id,
      },
    });

    if (!project) {
      return NextResponse.json(
        { error: 'Project niet gevonden' },
        { status: 404 }
      );
    }

    const researches = await prisma.newsResearch.findMany({
      where: { projectId },
      orderBy: { createdAt: 'desc' },
      include: {
        _count: {
          select: { articles: true },
        },
      },
    });

    return NextResponse.json({
      success: true,
      researches,
    });
  } catch (error) {
    console.error('GET Research API error:', error);
    return NextResponse.json(
      { error: 'Er is een fout opgetreden' },
      { status: 500 }
    );
  }
}
