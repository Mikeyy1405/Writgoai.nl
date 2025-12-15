
import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth-options';
import { prisma } from '@/lib/db';
import { sendStreamingChatCompletion } from '@/lib/aiml-chat-client';
import { getDefaultModel } from '@/lib/aiml-chat-models';
import { generateImage, IMAGE_MODELS, webSearch } from '@/lib/aiml-api';
import { DEFAULT_CHAT_SETTINGS, PERSONALITY_PRESETS, type ChatSettings } from '@/lib/chat-settings';
import { uploadFile, getDownloadUrl } from '@/lib/s3';
import { scrapeWebsite, detectWebsiteAnalysisRequest } from '@/lib/website-scraper';
import { getBannedWordsInstructions } from '@/lib/banned-words';

export const dynamic = 'force-dynamic';

/**
 * Helper function to convert base64 data URL to S3 hosted URL
 */
async function uploadBase64ImageToS3(base64DataUrl: string): Promise<string> {
  try {
    // Extract base64 data from data URL
    const matches = base64DataUrl.match(/^data:([A-Za-z-+\/]+);base64,(.+)$/);
    if (!matches || matches.length !== 3) {
      throw new Error('Invalid base64 data URL format');
    }

    const contentType = matches[1];
    const base64Data = matches[2];
    const buffer = Buffer.from(base64Data, 'base64');

    // Generate unique filename
    const timestamp = Date.now();
    const extension = contentType.split('/')[1] || 'png';
    const fileName = `chat-images/${timestamp}.${extension}`;

    // Upload to S3
    console.log('📤 Uploading image to S3...', { size: buffer.length, contentType });
    const s3Key = await uploadFile(buffer, fileName, contentType);
    
    // Get signed URL (valid for 7 days)
    const signedUrl = await getDownloadUrl(s3Key, 7 * 24 * 60 * 60);
    console.log('✅ Image uploaded to S3 successfully');
    
    return signedUrl;
  } catch (error) {
    console.error('❌ Failed to upload image to S3:', error);
    throw error;
  }
}

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

    const body = await req.json();
    const { 
      conversationId, 
      message, 
      model, 
      attachments, 
      temperature,
      chatSettings = DEFAULT_CHAT_SETTINGS 
    } = body;

    if (!conversationId || !message) {
      return NextResponse.json(
        { error: 'conversationId en message zijn verplicht' },
        { status: 400 }
      );
    }

    // Extract chat settings
    const settings: ChatSettings = {
      ...DEFAULT_CHAT_SETTINGS,
      ...chatSettings
    };

    // Get conversation to verify ownership
    let conversation = await prisma.conversation.findUnique({
      where: { id: conversationId },
      include: {
        messages: {
          orderBy: { createdAt: 'asc' },
          take: 50, // Last 50 messages for context
        },
      },
    });

    // Create conversation if it doesn't exist
    if (!conversation) {
      conversation = await prisma.conversation.create({
        data: {
          id: conversationId,
          clientId: client.id,
          title: message.substring(0, 100),
        },
        include: {
          messages: true,
        },
      });
    }

    // Verify ownership
    if (conversation.clientId !== client.id) {
      return NextResponse.json({ error: 'Geen toegang tot deze conversatie' }, { status: 403 });
    }

    // Save user message
    await prisma.chatMessage.create({
      data: {
        conversationId,
        role: 'user',
        content: message,
        attachments: attachments || null,
        model: model || getDefaultModel(),
      },
    });

    // 🎨 Check if user wants to generate an image
    const imageGenerationTriggers = [
      'maak een afbeelding',
      'maak een ai afbeelding',
      'maak een ai-afbeelding',
      'genereer een afbeelding',
      'genereer een ai afbeelding',
      'genereer een ai-afbeelding',
      'creëer een afbeelding',
      'create an image',
      'generate an image',
      'make an image',
      'make an ai image',
      'generate an ai image',
      'maak van mijn afbeelding',
      'maak er een ai versie van',
      'maak er een ai-versie van',
    ];

    const messageLower = message.toLowerCase();
    const shouldGenerateImage = imageGenerationTriggers.some(trigger => 
      messageLower.includes(trigger)
    );

    // Handle two image generation scenarios:
    // 1. User uploaded an image and wants to transform it
    // 2. User wants to generate an image from text description
    const hasUploadedImages = attachments?.some((f: any) => f.type?.startsWith('image/'));
    
    if (shouldGenerateImage && hasUploadedImages) {
      // SCENARIO 1: Transform uploaded image
      try {
        console.log('🎨 Image generation detected in chat!');
        
        // First, let AI analyze the image and create a prompt
        const analyzeMessages = [
          {
            role: 'system' as const,
            content: 'Je bent een expert in het maken van AI image generation prompts. Analyseer de afbeelding en maak een gedetailleerde prompt (in het Engels) voor een AI image generator. Beschrijf alleen het onderwerp, de stijl, kleuren, compositie, en sfeer. Geef ALLEEN de prompt terug, geen extra tekst.'
          },
          {
            role: 'user' as const,
            content: [
              { 
                type: 'text' as const, 
                text: 'Maak een gedetailleerde prompt voor deze afbeelding die ik kan gebruiken in een AI image generator:'
              },
              ...attachments
                .filter((f: any) => f.type?.startsWith('image/'))
                .map((f: any) => ({
                  type: 'image_url' as const,
                  image_url: { url: f.url }
                }))
            ]
          }
        ];

        // Get the AI-generated prompt
        const promptResponse = await sendStreamingChatCompletion({
          model: model || getDefaultModel(),
          messages: analyzeMessages,
          temperature: 0.7,
          stream: false,
        });

        let imagePrompt = '';
        if ('choices' in promptResponse) {
          imagePrompt = promptResponse.choices[0]?.message?.content || '';
        }

        console.log('🎨 AI generated prompt:', imagePrompt);

        if (imagePrompt) {
          // Generate the image using Flux Pro (best quality)
          const imageResult = await generateImage({
            prompt: imagePrompt,
            model: 'FLUX_PRO',
            width: 1536,
            height: 1024,
          });

          if (imageResult.success && imageResult.images && imageResult.images.length > 0) {
            let generatedImageUrl = imageResult.images[0];
            
            console.log('✅ Image generated successfully!');
            console.log('🖼️ Image URL type:', generatedImageUrl.startsWith('data:') ? 'Base64 Data URL' : 'External URL');
            console.log('🖼️ Image URL length:', generatedImageUrl.length);
            
            // Upload to S3 if it's a base64 data URL (to avoid database size issues)
            if (generatedImageUrl.startsWith('data:')) {
              console.log('📤 Converting base64 to S3 hosted URL...');
              try {
                generatedImageUrl = await uploadBase64ImageToS3(generatedImageUrl);
                console.log('✅ Image now hosted on S3:', generatedImageUrl.substring(0, 100));
              } catch (uploadError) {
                console.error('⚠️ S3 upload failed, using base64 (might be too large for DB):', uploadError);
                // Continue with base64 URL as fallback
              }
            }
            
            // Save assistant response with the generated image
            const assistantMessage = `Ik heb een AI-versie van je afbeelding gemaakt! 🎨\n\n**Gebruikte prompt:** ${imagePrompt}\n\n![Generated Image](${generatedImageUrl})`;
            
            await prisma.chatMessage.create({
              data: {
                conversationId,
                role: 'assistant',
                content: assistantMessage,
                model: model || getDefaultModel(),
              },
            });

            console.log('💾 Message saved to database with image');

            // Return the image directly without further AI processing
            return new Response(
              new ReadableStream({
                start(controller) {
                  const encoder = new TextEncoder();
                  controller.enqueue(encoder.encode(`data: ${JSON.stringify({ content: assistantMessage })}\n\n`));
                  controller.enqueue(encoder.encode('data: [DONE]\n\n'));
                  controller.close();
                },
              }),
              {
                headers: {
                  'Content-Type': 'text/event-stream',
                  'Cache-Control': 'no-cache',
                  Connection: 'keep-alive',
                },
              }
            );
          } else {
            console.error('❌ Image generation failed:', imageResult.error || 'No images returned');
          }
        }
      } catch (imageError: any) {
        console.error('❌ Image generation error (transform):', imageError);
        // Continue with normal chat flow if image generation fails
      }
    } else if (shouldGenerateImage && !hasUploadedImages) {
      // SCENARIO 2: Generate image from text description
      try {
        console.log('🎨 Text-to-image generation detected in chat!');
        
        // Extract the image description from the message
        // Remove the trigger words to get the actual description
        let imageDescription = message;
        for (const trigger of imageGenerationTriggers) {
          imageDescription = imageDescription.replace(new RegExp(trigger, 'gi'), '').trim();
        }
        
        // Clean up common prefixes
        imageDescription = imageDescription.replace(/^(van|of|voor|met|about|for)\s+/gi, '').trim();
        
        console.log('🎨 Extracted description:', imageDescription);

        if (imageDescription && imageDescription.length > 5) {
          // Use AI to create a detailed English prompt
          const promptEnhanceMessages = [
            {
              role: 'system' as const,
              content: 'Je bent een expert in het maken van AI image generation prompts. Zet de Nederlandse of Engelse beschrijving om in een gedetailleerde Engels prompt voor Flux Pro. Beschrijf het onderwerp, de stijl, compositie, kleuren, belichting, en sfeer. Geef ALLEEN de prompt terug in het Engels, geen extra tekst.'
            },
            {
              role: 'user' as const,
              content: `Maak een gedetailleerde Flux Pro prompt voor: ${imageDescription}`
            }
          ];

          const promptResponse = await sendStreamingChatCompletion({
            model: model || getDefaultModel(),
            messages: promptEnhanceMessages,
            temperature: 0.7,
            stream: false,
          });

          let enhancedPrompt = '';
          if ('choices' in promptResponse) {
            enhancedPrompt = promptResponse.choices[0]?.message?.content || '';
          }

          console.log('🎨 Enhanced prompt:', enhancedPrompt);

          if (enhancedPrompt) {
            // Generate the image using Flux Pro
            const imageResult = await generateImage({
              prompt: enhancedPrompt,
              model: 'FLUX_PRO',
              width: 1536,
              height: 1024,
            });

            if (imageResult.success && imageResult.images && imageResult.images.length > 0) {
              let generatedImageUrl = imageResult.images[0];
              
              console.log('✅ Image generated successfully!');
              console.log('🖼️ Image URL type:', generatedImageUrl.startsWith('data:') ? 'Base64 Data URL' : 'External URL');
              console.log('🖼️ Image URL length:', generatedImageUrl.length);
              
              // Upload to S3 if it's a base64 data URL (to avoid database size issues)
              if (generatedImageUrl.startsWith('data:')) {
                console.log('📤 Converting base64 to S3 hosted URL...');
                try {
                  generatedImageUrl = await uploadBase64ImageToS3(generatedImageUrl);
                  console.log('✅ Image now hosted on S3:', generatedImageUrl.substring(0, 100));
                } catch (uploadError) {
                  console.error('⚠️ S3 upload failed, using base64 (might be too large for DB):', uploadError);
                  // Continue with base64 URL as fallback
                }
              }
              
              // Save assistant response with the generated image
              const assistantMessage = `Ik heb de afbeelding gegenereerd! 🎨\n\n**Gebruikte prompt:** ${enhancedPrompt}\n\n![Generated Image](${generatedImageUrl})`;
              
              await prisma.chatMessage.create({
                data: {
                  conversationId,
                  role: 'assistant',
                  content: assistantMessage,
                  model: model || getDefaultModel(),
                },
              });

              console.log('💾 Message saved to database with image');

              // Return the image directly without further AI processing
              return new Response(
                new ReadableStream({
                  start(controller) {
                    const encoder = new TextEncoder();
                    controller.enqueue(encoder.encode(`data: ${JSON.stringify({ content: assistantMessage })}\n\n`));
                    controller.enqueue(encoder.encode('data: [DONE]\n\n'));
                    controller.close();
                  },
                }),
                {
                  headers: {
                    'Content-Type': 'text/event-stream',
                    'Cache-Control': 'no-cache',
                    Connection: 'keep-alive',
                  },
                }
              );
            } else {
              console.error('❌ Image generation failed:', imageResult.error || 'No images returned');
            }
          }
        }
      } catch (imageError: any) {
        console.error('❌ Image generation error (text-to-image):', imageError);
        // Continue with normal chat flow if image generation fails
      }
    }

    // 🌐 Check if user wants to analyze a website
    const websiteUrl = detectWebsiteAnalysisRequest(message);
    let websiteAnalysisContext = '';
    
    if (websiteUrl) {
      try {
        console.log('🌐 Website analysis detected:', websiteUrl);
        const websiteData = await scrapeWebsite(websiteUrl);
        
        if (websiteData.success) {
          // Build context for AI
          websiteAnalysisContext = `\n\n📊 **Website Analyse Resultaten voor ${websiteUrl}:**\n\n`;
          
          if (websiteData.title) {
            websiteAnalysisContext += `**Titel:** ${websiteData.title}\n\n`;
          }
          
          if (websiteData.description) {
            websiteAnalysisContext += `**Beschrijving:** ${websiteData.description}\n\n`;
          }
          
          if (websiteData.content) {
            websiteAnalysisContext += `**Content (eerste 5000 tekens):**\n${websiteData.content}\n\n`;
          }
          
          if (websiteData.images && websiteData.images.length > 0) {
            websiteAnalysisContext += `**Afbeeldingen gevonden:** ${websiteData.images.length} afbeeldingen\n`;
            websiteAnalysisContext += `Eerste afbeeldingen:\n${websiteData.images.slice(0, 5).map(img => `- ${img}`).join('\n')}\n\n`;
          }
          
          if (websiteData.links && websiteData.links.length > 0) {
            websiteAnalysisContext += `**Links gevonden:** ${websiteData.links.length} links\n`;
            websiteAnalysisContext += `Belangrijkste links:\n${websiteData.links.slice(0, 10).map(link => `- ${link}`).join('\n')}\n\n`;
          }
          
          console.log('✅ Website analysis completed successfully');
        } else {
          websiteAnalysisContext = `\n\n⚠️ **Website Analyse Fout:**\nKon ${websiteUrl} niet laden: ${websiteData.error}\n\n`;
          console.error('❌ Website analysis failed:', websiteData.error);
        }
      } catch (analysisError: any) {
        console.error('❌ Website analysis error:', analysisError);
        websiteAnalysisContext = `\n\n⚠️ **Website Analyse Fout:**\nEr ging iets mis bij het analyseren van de website: ${analysisError.message}\n\n`;
      }
    }

    // Build enhanced message content with vision support
    let userMessageContent: string | Array<{type: 'text' | 'image_url'; text?: string; image_url?: {url: string}}>;
    
    // Check if there are image attachments for vision support
    const hasImages = attachments?.some((file: any) => 
      file.type?.startsWith('image/')
    );

    if (hasImages) {
      // Use vision format with content array
      const contentBlocks: Array<{type: 'text' | 'image_url'; text?: string; image_url?: {url: string}}> = [
        { type: 'text', text: message + websiteAnalysisContext }
      ];

      // Add image URLs
      attachments
        .filter((file: any) => file.type?.startsWith('image/'))
        .forEach((file: any) => {
          if (file.url) {
            contentBlocks.push({
              type: 'image_url',
              image_url: { url: file.url }
            });
          }
        });

      userMessageContent = contentBlocks;
    } else {
      // Regular text message, optionally with non-image file descriptions
      let textMessage = message;
      if (attachments && attachments.length > 0) {
        const fileDescriptions = attachments.map((file: any) => {
          const fileType = file.type || 'onbekend bestandstype';
          const fileName = file.name || 'onbekend bestand';
          const fileSize = file.size ? `(${(file.size / 1024).toFixed(1)} KB)` : '';
          
          return `- ${fileName} ${fileSize} - Type: ${fileType}`;
        }).join('\n');

        textMessage = `${message}\n\n**Geüploade bestanden:**\n${fileDescriptions}`;
      }
      
      // Add website analysis context if present
      textMessage += websiteAnalysisContext;
      
      userMessageContent = textMessage;
    }

    // 🔍 Check if web search is needed
    let webSearchResults = '';
    if (settings.webSearchEnabled) {
      // Detect if user is asking for current information
      const searchTriggers = [
        'zoek', 'zoek voor', 'zoek naar', 'search', 'find',
        'actueel', 'actuele', 'recent', 'recente', 'latest', 'nieuwste',
        'vandaag', 'today', 'deze week', 'this week', 'dit jaar', 'this year',
        'prijs', 'prijzen', 'price', 'prices', 'kosten', 'cost',
        'vakantie', 'vacation', 'holiday', 'trip', 'reis', 'reizen',
        'hotel', 'hotels', 'accommodatie', 'accommodation',
        'restaurant', 'restaurants', 'eten', 'food',
        'weer', 'weather', 'temperatuur', 'temperature',
        'nieuws', 'news', 'gebeurtenis', 'event',
        'update', 'updates', 'wanneer', 'when', 'hoe laat', 'what time',
      ];

      const messageLower = message.toLowerCase();
      const needsWebSearch = searchTriggers.some(trigger => messageLower.includes(trigger));

      if (needsWebSearch) {
        try {
          console.log('🔍 Performing web search for:', message);
          const searchResult = await webSearch(message);
          
          if (searchResult.success && searchResult.results) {
            webSearchResults = searchResult.results;
            console.log('✅ Web search completed successfully');
          }
        } catch (searchError: any) {
          console.error('❌ Web search error:', searchError);
          // Continue without web search if it fails
        }
      }
    }

    // Build system prompt with personality preset
    const personalityPrompt = PERSONALITY_PRESETS[settings.personality].systemPrompt;
    const webSearchNote = settings.webSearchEnabled && webSearchResults
      ? `\n\n🌐 **Web Search Results**: Ik heb actuele informatie opgezocht voor je vraag. Gebruik deze informatie in je antwoord:\n\n${webSearchResults}`
      : settings.webSearchEnabled
      ? '\n\n🌐 **Web Search Enabled**: Je hebt toegang tot real-time web informatie wanneer nodig.'
      : '';
    const reasoningModeNote = settings.reasoningMode === 'thinking'
      ? '\n\n🧠 **Thinking Mode Active**: Neem de tijd voor complexe redeneringen en geef gedetailleerde, doordachte antwoorden.'
      : settings.reasoningMode === 'instant'
      ? '\n\n⚡ **Instant Mode Active**: Geef snelle, bondige antwoorden zonder onnodige uitleg.'
      : '';
    const artifactsModeNote = settings.artifactsMode && model === 'anthropic/claude-4-5-sonnet'
      ? `\n\n📦 **Artifacts Mode Active**: Je bent in Artifacts Mode. Genereer complete, gestructureerde output zoals:
- Complete websites (HTML + CSS + JavaScript)
- React/Next.js componenten
- Complete applicaties en tools
- Gestructureerde documenten en templates
- Herbruikbare code libraries

Focus op het leveren van production-ready, standalone artifacts die direct gebruikt kunnen worden.`
      : '';
    
    // Get WritgoAI banned words instructions
    const bannedWordsInstructions = getBannedWordsInstructions('nl');

    // Build messages array for AI
    const messages = [
      {
        role: 'system' as const,
        content: `Je bent de WritgoAI Assistent, een slimme en behulpzame AI-assistent voor WritgoAI (writgo.nl), het complete platform voor AI-gedreven contentcreatie en marketingautomatisering.

📝 **BELANGRIJKE TEKSTOPMAAK REGELS - ALTIJD VOLGEN:**

**1. HTML Formatting voor Teksten:**
Als je teksten schrijft of herschrijft, gebruik ALTIJD deze HTML structuur:
- **H1** voor de hoofdtitel (gebruik slechts 1x per tekst)
- **H2** voor hoofdsecties (primaire onderwerpen)
- **H3** voor subsecties (subonderwerpen binnen H2)
- **H4-H6** voor verdere hiërarchie waar nodig
- **<strong>** voor belangrijke termen en begrippen
- **<em>** voor nadruk
- **<ul>** en **<li>** voor ongeordende lijsten
- **<ol>** en **<li>** voor genummerde lijsten
- **<p>** voor paragrafen (maar laat de tags weg voor natuurlijke flow)

**Voorbeeld correcte structuur:**
\`\`\`html
<h1>De Ultieme Gids voor AI Content Marketing</h1>

<p>AI content marketing revolutioneert de manier waarop bedrijven communiceren met hun doelgroep. In deze gids leer je alles over de nieuwste technieken en strategieën.</p>

<h2>Wat is AI Content Marketing?</h2>

<p>AI content marketing combineert <strong>kunstmatige intelligentie</strong> met traditionele marketingprincipes om meer relevante en gepersonaliseerde content te creëren.</p>

<h3>Voordelen van AI in Marketing</h3>

<ul>
<li><strong>Snelheid:</strong> Genereer content in seconden in plaats van uren</li>
<li><strong>Consistentie:</strong> Behoud een consistente tone-of-voice over alle kanalen</li>
<li><strong>Personalisatie:</strong> Stem content af op individuele gebruikers</li>
<li><strong>Datagedreven:</strong> Maak beslissingen gebaseerd op real-time analytics</li>
</ul>

<h2>Best Practices voor AI Content</h2>

<p>Wanneer je AI gebruikt voor content creatie, is het belangrijk om een aantal best practices te volgen:</p>

<ol>
<li>Start met een duidelijke briefing en doelstellingen</li>
<li>Review en edit altijd AI-gegenereerde content handmatig</li>
<li>Voeg persoonlijke inzichten en expertise toe</li>
<li>Optimaliseer voor SEO zonder de leesbaarheid te schaden</li>
<li>Test verschillende prompts voor het beste resultaat</li>
</ol>

<h3>Tools en Platforms</h3>

<p>Er zijn verschillende tools beschikbaar voor AI content marketing. <strong>WritgoAI</strong> biedt een all-in-one oplossing met features zoals...</p>
\`\`\`

**2. Heading Hiërarchie Behouden:**
Als een gebruiker een tekst met headings aanlevert:
- ✅ **BEHOUD** alle headings (H1-H6) exact zoals ze zijn
- ✅ **BEHOUD** de hiërarchische structuur (H1 → H2 → H3, etc.)
- ✅ **PAS** alleen de tekst aan, niet de heading levels
- ❌ **VERANDER NOOIT** een H2 in een H3 of andersom
- ❌ **VERWIJDER NOOIT** headings zonder expliciete instructie

**3. WritgoAI Schrijfregels:**
- **Natuurlijke Stijl**: Schrijf conversational en toegankelijk, NIET academisch of formeel
- **Geen AI-taal**: Vermijd zinnen zoals "in het huidige digitale landschap", "het is belangrijk om te benadrukken", "kortom", "bovendien"
- **Directe Communicatie**: Kom meteen to-the-point, geen lange introducties
- **Actieve Zinnen**: Gebruik actieve in plaats van passieve zinnen
- **Specifieke Voorbeelden**: Geef concrete voorbeelden in plaats van abstracte concepten
- **Korte Paragrafen**: Maximum 3-4 zinnen per paragraaf voor leesbaarheid
- **Subheadings voor Scanability**: Gebruik voldoende H2/H3 voor overzicht
- **Voeg Praktische Waarde Toe**: Geef actionable tips, niet alleen theorie

${bannedWordsInstructions}

**❌ ABSOLUUT VERBODEN IN CONTENT:**
- **GEEN horizontale scheidingslijnen** (zoals ---, ***, ___, <hr>, etc.)
- **GEEN kleurcodes of styling** in de tekst (zoals color:#, background:, etc.)
- **GEEN inline styles** voor kleur of opmaak
- **GEEN dividers, separators of horizontal rules**
- **Alleen natuurlijke HTML structuur**: headings, paragrafen, lijsten, strong, em

**✅ WEL toegestaan:**
- Headings (H1-H6) voor structuur
- Paragrafen en lopende tekst
- Lijsten (ul/ol) voor opsommingen
- Bold (<strong>) voor nadruk op belangrijke begrippen
- Italics (<em>) voor subtiele nadruk
- Links in lopende tekst (NOOIT in headings)

**4. Lijst Opmaak:**
- Gebruik **bulletpoints** (<ul>) voor features, voordelen, opties
- Gebruik **nummering** (<ol>) voor stappen, processen, rankings
- Elk lijstitem begint met hoofdletter, eindigt ZONDER punt
- Maak lijstitems visueel consistent (zelfde lengte waar mogelijk)

**5. Link en Formatting Regels:**
- **NOOIT** links in headings (H1-H6)
- Plaats links alleen in lopende tekst
- Gebruik <strong> voor begrippen die je wilt benadrukken
- Gebruik markdown image syntax voor afbeeldingen: ![beschrijving](url)

**6. Herschrijf Instructies:**
Als een gebruiker vraagt om een tekst te herschrijven:
1. **Analyseer** eerst de originele structuur (headings, lijsten, paragrafen)
2. **Behoud** alle heading levels precies zoals ze zijn
3. **Verbeter** de tekst volgens WritgoAI schrijfregels
4. **Verwijder** AI-taal en vervang met natuurlijke formuleringen
5. **Behoud** alle belangrijke informatie en feiten
6. **Geef** de herschreven tekst terug in dezelfde HTML structuur

**Voorbeeld Herschrijf Proces:**

**Input:**
\`\`\`html
<h2>De Voordelen van Content Marketing</h2>
<p>In het huidige digitale tijdperk is content marketing een essentieel onderdeel geworden van elke succesvolle marketingstrategie. Het is belangrijk om te benadrukken dat content marketing tal van voordelen biedt.</p>
\`\`\`

**Output:**
\`\`\`html
<h2>De Voordelen van Content Marketing</h2>
<p>Content marketing is onmisbaar voor moderne bedrijven. Het biedt drie grote voordelen: meer website traffic, hogere conversies en sterkere klantrelaties. Laten we elk voordeel uitdiepen.</p>
\`\`\`

✅ **Notice**: Heading level blijft H2, structuur behouden, tekst verbeterd volgens WritgoAI regels

**Over WritgoAI:**
WritgoAI is een SaaS-platform dat bedrijven en marketeers helpt met:
- AI-gedreven content creatie (blogs, artikelen, productbeschrijvingen)
- Affiliate marketing (met name bol.com integratie)
- WordPress & WooCommerce beheer en optimalisatie
- Social media planning en automatisering
- SEO optimalisatie en Google Search Console integratie
- Originality scanning (AI detectie en humanization)
- Multilingual support (Nederlands, Engels, Duits, Frans, Spaans)

**Belangrijke WritgoAI Functionaliteiten:**
1. **Content Generator** - Maakt SEO-geoptimaliseerde blogs en artikelen
2. **WooCommerce Integratie** - Importeer en optimaliseer producten van bol.com
3. **Affiliate Marketing** - Automatische bol.com product links in content
4. **WordPress Publisher** - Directe publicatie naar WordPress sites
5. **Social Media Planner** - Automatische planning voor Facebook, Instagram, LinkedIn, etc.
6. **Content Research** - AI-powered keyword research en trending topics
7. **Autopilot Mode** - Volledig geautomatiseerde content creatie en publicatie
8. **Originality Scanner** - Detecteert en humaniseert AI-geschreven content
9. **Deep Research Writer** - Uitgebreide research-based artikelen
10. **Google Search Console** - Performance tracking en SEO insights

**Jouw Rol:**
- Beantwoord vragen over WritgoAI functies en diensten
- Help gebruikers met content strategie en affiliate marketing
- Geef advies over WordPress, WooCommerce en SEO
- Assisteer met social media planning en strategie
- Schrijf content op verzoek (blogs, posts, productbeschrijvingen)
- Genereer code snippets wanneer nodig
- **BELANGRIJK: Je kunt afbeeldingen zien en analyseren!**
  - Beschrijf wat je ziet in detail
  - Geef concrete feedback over producten, objecten, mensen in de afbeelding
  - Help met waardebepalingen, identificatie, of andere vragen over de afbeelding
  - Wees specifiek en accuraat in je observaties
- **NIEUW: Je kunt ook AI-afbeeldingen genereren!**
  - Als de gebruiker vraagt om een afbeelding te maken, gebruik je automatisch Flux Pro AI
  - Je genereert eerst een gedetailleerde prompt en maakt dan de afbeelding
  - De afbeelding wordt automatisch in het gesprek getoond
- **NIEUW: Je kunt websites analyseren!**
  - Als de gebruiker vraagt om een website te analyseren of bekijken, scrape je de website automatisch
  - Je ontvangt de titel, beschrijving, content, afbeeldingen en links van de website
  - Geef een grondige analyse van de website, inclusief SEO, design, content kwaliteit, en verbeteringen
  - Je kunt gebruikersinterface, navigatie, teksten, call-to-actions en conversie-optimalisatie beoordelen
- Bij documenten: help met analyse, samenvatting of verwerking

**Belangrijke URLs:**
- Hoofdsite: https://WritgoAI.nl
- Client Portal: https://WritgoAI.nl/client-portal
- Contact: info@WritgoAI.nl

**📝 Persoonlijkheid & Stijl:**
${personalityPrompt}${reasoningModeNote}${webSearchNote}${artifactsModeNote}

Gebruik je kennis om gebruikers te helpen hun content en marketing doelen te bereiken met WritGo.`,
      },
      ...conversation.messages.map((msg) => {
        // For historical messages, use simple text format for now
        // (We could enhance this later to preserve image context)
        let msgContent: string | Array<{type: 'text' | 'image_url'; text?: string; image_url?: {url: string}}> = msg.content;
        
        if (msg.role === 'user' && msg.attachments) {
          const historicalImages = (msg.attachments as any[]).filter((f: any) => 
            f.type?.startsWith('image/')
          );
          
          if (historicalImages.length > 0) {
            // Build vision format for historical messages with images
            const blocks: Array<{type: 'text' | 'image_url'; text?: string; image_url?: {url: string}}> = [
              { type: 'text', text: msg.content }
            ];
            historicalImages.forEach((img: any) => {
              if (img.url) {
                blocks.push({
                  type: 'image_url',
                  image_url: { url: img.url }
                });
              }
            });
            msgContent = blocks;
          } else {
            // Non-image files
            const fileList = (msg.attachments as any[]).map((file: any) => 
              `- ${file.name || 'bestand'} (${file.type || 'onbekend type'})`
            ).join('\n');
            msgContent = `${msg.content}\n\n**Geüploade bestanden:**\n${fileList}`;
          }
        }
        
        return {
          role: msg.role as 'user' | 'assistant',
          content: msgContent,
        };
      }),
      {
        role: 'user' as const,
        content: userMessageContent,
      },
    ];

    // Stream response from AIML API with GPT-5.1 settings
    const stream = await sendStreamingChatCompletion({
      model: model || getDefaultModel(),
      messages,
      temperature: settings.temperature,
      stream: true,
    });

    // Create a TransformStream to handle the streaming response
    const encoder = new TextEncoder();
    let fullResponse = '';

    const readableStream = new ReadableStream({
      async start(controller) {
        try {
          for await (const chunk of stream) {
            const content = chunk.choices[0]?.delta?.content || '';
            if (content) {
              fullResponse += content;
              controller.enqueue(encoder.encode(`data: ${JSON.stringify({ content })}\n\n`));
            }
          }

          // Save assistant response to database
          await prisma.chatMessage.create({
            data: {
              conversationId,
              role: 'assistant',
              content: fullResponse,
              model: model || getDefaultModel(),
            },
          });

          controller.enqueue(encoder.encode('data: [DONE]\n\n'));
          controller.close();
        } catch (error: any) {
          console.error('Streaming error:', error);
          controller.error(error);
        }
      },
    });

    return new Response(readableStream, {
      headers: {
        'Content-Type': 'text/event-stream',
        'Cache-Control': 'no-cache',
        Connection: 'keep-alive',
      },
    });
  } catch (error: any) {
    console.error('Chat send error:', error);
    return NextResponse.json({ error: error.message || 'Fout bij versturen bericht' }, { status: 500 });
  }
}
