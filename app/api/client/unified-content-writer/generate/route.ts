
import { NextRequest, NextResponse } from 'next/server';

export const dynamic = "force-dynamic";
export const maxDuration = 300;
export const runtime = 'nodejs';

import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth-options';
import { prisma } from '@/lib/db';
import { chatCompletion } from '@/lib/aiml-api';
import { CREDIT_COSTS } from '@/lib/credits';
import { autoSaveToLibrary } from '@/lib/content-library-helper';
import { loadWordPressSitemap, findRelevantInternalLinks } from '@/lib/sitemap-loader';
import { generateSmartImage } from '@/lib/smart-image-generator';
import { getBannedWordsInstructions, removeBannedWords, isContentValid } from '@/lib/banned-words';
import { publishToWordPress } from '@/lib/wordpress-publisher';
import { searchBolcomProducts, generateBolcomAffiliateLink } from '@/lib/bolcom-api';

/**
 * 🚀 UNIFIED CONTENT WRITER
 * - Een tool voor alle content generatie behoeften
 * - Simpele, robuuste streaming zonder complexe heartbeats
 * - Combineert alle features van Content Specialist en Blog Generator
 */

export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.email) {
    return NextResponse.json({ error: 'Niet geautoriseerd' }, { status: 401 });
  }

  const body = await req.json();
  const {
    topic,
    projectId,
    topicalTopicId,
    language = 'nl',
    wordCount = 1500,
    tone = 'professional',
    includeImages = true,
    imageCount = 2,
    includeFAQ = false,
    includeInternalLinks = true,
    bolProducts = [],
    publishToWordPress: shouldPublishToWordPress = false,
  } = body;

  if (!topic) {
    return NextResponse.json({ error: 'Onderwerp is verplicht' }, { status: 400 });
  }

  console.log(`🚀 [UnifiedWriter] Start: "${topic}"`);

  // Create streaming response with simplified progress tracking
  const stream = new TransformStream();
  const writer = stream.writable.getWriter();
  const encoder = new TextEncoder();

  // Simple progress function - no complex state management
  const sendProgress = async (message: string, progress: number) => {
    try {
      const data = JSON.stringify({ status: message, progress, message }) + '\n';
      await writer.write(encoder.encode(`data: ${data}\n\n`));
      console.log(`📊 [${progress}%] ${message}`);
    } catch (error) {
      console.error('❌ Progress send error:', error);
    }
  };

  // Start generation in background
  (async () => {
    try {
      await sendProgress('🚀 Content generatie gestart...', 5);

      // Check user credits
      const user = await prisma.client.findUnique({
        where: { email: session.user.email },
        select: { 
          id: true, 
          subscriptionCredits: true,
          topUpCredits: true,
          isUnlimited: true
        },
      });

      const totalCredits = user ? user.subscriptionCredits + user.topUpCredits : 0;
      const requiredCredits = CREDIT_COSTS.BLOG_POST;
      
      if (!user || (!user.isUnlimited && totalCredits < requiredCredits)) {
        const errorData = JSON.stringify({ 
          error: `Onvoldoende credits. Je hebt ${requiredCredits} credits nodig.`,
          status: 'error',
          progress: 0,
          done: true
        }) + '\n\n';
        await writer.write(encoder.encode(errorData));
        await writer.close();
        return;
      }

      await sendProgress('✅ Credits gecontroleerd', 10);

      // Load project context
      let projectContext = '';
      let sitemapUrl = '';
      let bolcomAffiliateId = '';
      let internalLinks: Array<{ title: string; url: string }> = [];

      if (projectId) {
        await sendProgress('📂 Project laden...', 15);
        
        const project = await prisma.project.findUnique({
          where: { id: projectId },
          select: { 
            name: true, 
            description: true, 
            websiteUrl: true,
            language: true,
            bolcomAffiliateId: true,
            wordpressUrl: true,
            wordpressUsername: true,
            wordpressPassword: true,
          },
        });

        if (project) {
          projectContext = `Project: ${project.name}\nWebsite: ${project.websiteUrl || 'N/A'}`;
          sitemapUrl = project.websiteUrl || '';
          bolcomAffiliateId = project.bolcomAffiliateId || '';
          
          await sendProgress(`✅ Project: ${project.name}`, 20);

          // Load sitemap for internal links
          if (sitemapUrl && includeInternalLinks) {
            try {
              await sendProgress('🔍 Sitemap scannen...', 25);
              const sitemap = await loadWordPressSitemap(sitemapUrl);
              internalLinks = findRelevantInternalLinks(sitemap, topic, 5);
              await sendProgress(`✅ ${internalLinks.length} interne links gevonden`, 30);
            } catch (error) {
              console.log('⚠️ Sitemap niet beschikbaar');
              await sendProgress('⚠️ Sitemap overgeslagen', 30);
            }
          } else {
            await sendProgress('⏭️ Sitemap overgeslagen', 30);
          }
        }
      } else {
        await sendProgress('⏭️ Geen project geselecteerd', 30);
      }

      // Generate keywords (simple, no AI needed)
      const keywords = topic.split(' ').slice(0, 5);
      await sendProgress('🔑 Keywords gegenereerd', 35);

      // Web research with Gemini
      await sendProgress('🔍 Web research starten...', 40);
      
      const researchResponse = await chatCompletion({
        model: 'google/gemini-3-pro-preview',
        messages: [
          {
            role: 'system',
            content: 'Je bent een SEO research expert. Zoek actuele informatie en trends.'
          },
          {
            role: 'user',
            content: `Zoek actuele informatie over: ${topic}

Keywords: ${keywords.join(', ')}
${projectContext}

Geef:
1. Actuele trends en statistieken
2. Veelgestelde vragen  
3. Belangrijke feiten
4. Gerelateerde onderwerpen

Formaat: Gestructureerd overzicht in het ${language === 'nl' ? 'Nederlands' : 'Engels'}`
          }
        ],
        temperature: 0.3,
        max_tokens: 2000
      });

      const research = researchResponse.choices[0]?.message?.content || '';
      await sendProgress('✅ Research voltooid', 45);

      // Generate featured image with research context
      let featuredImageUrl = '';
      if (includeImages) {
        await sendProgress('🖼️ Featured hero image genereren...', 50);
        try {
          // Extract first meaningful sentence from research for context
          const researchFirstLine = research.split('\n').find(line => line.trim().length > 20) || '';
          const contextHint = researchFirstLine.substring(0, 100);
          
          const featuredPrompt = `Professional high-quality hero image for: ${topic}.
Context: ${contextHint}
Wide hero shot, photorealistic professional photography, modern editorial magazine style.
Excellent composition, natural lighting, vibrant colors, sharp focus, ultra detailed.
Dynamic perspective, trending editorial style, professional quality.
NO TEXT, NO WATERMARKS, NO LOGOS, NO CAPTIONS.
8K resolution, magazine cover quality photography.`;

          console.log(`🎯 [Featured Image] Topic: "${topic}"`);

          const imageResult = await generateSmartImage({
            prompt: featuredPrompt,
            projectId,
            type: 'featured',
            width: 1920,
            height: 1080,
          });

          if (imageResult.success && imageResult.imageUrl) {
            featuredImageUrl = imageResult.imageUrl;
            await sendProgress('✅ Featured image gegenereerd', 52);
          }
        } catch (error) {
          console.log('⚠️ Featured image generatie mislukt');
          await sendProgress('⚠️ Featured image overgeslagen', 52);
        }
      } else {
        await sendProgress('⏭️ Geen featured image', 52);
      }

      // Build internal links context
      let internalLinksContext = '';
      if (internalLinks.length > 0) {
        internalLinksContext = `

**🔗 INTERNE LINKS - NATUURLIJK INTEGREREN:**

Beschikbare links (${internalLinks.length} stuks):
${internalLinks.map((link, i) => `${i + 1}. "${link.title}" → ${link.url}`).join('\n')}

✅ Voeg minimaal 60% van deze links toe IN lopende zinnen (NIET als aparte zin!)
❌ Geen aparte "Lees ook" secties
✅ Format: <a href="URL">anchor tekst</a>`;
      }

      // Build Bol.com products context
      let bolProductsContext = '';
      if (bolProducts && bolProducts.length > 0) {
        bolProductsContext = `

**🛒 BOL.COM PRODUCTEN - NATUURLIJK INTEGREREN:**

Producten (${bolProducts.length} stuks):
${bolProducts.map((p: any, i: number) => `${i + 1}. "${p.title}" - ${p.price} - ${p.url}`).join('\n')}

✅ Noem deze producten op natuurlijke momenten in de tekst
✅ Gebruik affiliate links: <a href="${bolProducts[0]?.url}" target="_blank" rel="noopener">product naam</a>
✅ Geef eerlijke reviews/aanbevelingen`;
      }

      // Content writing with Claude
      await sendProgress('✍️ AI schrijft artikel...', 55);
      console.log('🤖 Starting Claude content generation...');

      const writingPrompt = `Schrijf een professioneel ${language} artikel over: ${topic}

**ARTIKEL SPECIFICATIES:**
- Woordenaantal: ${wordCount} woorden
- Toon: ${tone}
- Taal: ${language === 'nl' ? 'Nederlands' : 'English'}
- SEO geoptimaliseerd: Ja

**RESEARCH DATA:**
${research}

${projectContext ? `**PROJECT CONTEXT:**\n${projectContext}\n` : ''}
${internalLinksContext}
${bolProductsContext}

**KRITIEKE OUTPUT FORMAT VEREISTE:**
🚨 GEBRUIK ALLEEN HTML TAGS - GEEN MARKDOWN!
🚨 GEEN \`\`\`html of \`\`\` code blocks
🚨 Begin DIRECT met <h1> tag
🚨 Gebruik <h2>, <h3>, <p>, <ul>, <li>, <strong>, etc.
🚨 NOOIT markdown syntax zoals ## of **tekst**

**ARTIKEL STRUCTUUR:**
✅ Begin met <h1>Hoofdtitel</h1> (gebaseerd op onderwerp)
✅ Intro paragraaf: 3-4 zinnen in <p> tag, noem keyword
✅ Gebruik <h2> en <h3> voor secties met natuurlijke paragrafen
✅ Afsluitende paragraaf: 4-5 zinnen in <p> tag
❌ NOOIT twee headings direct achter elkaar

**NEDERLANDSE HOOFDLETTERS (VERPLICHT):**
✅ GOED: <h2>De voordelen van AI voor bedrijven</h2>
❌ FOUT: <h2>De Voordelen Van AI Voor Bedrijven</h2>
Alleen eerste letter hoofdletter!

**SCHRIJFSTIJL VOOR 100% HUMAN SCORE:**
✅ Conversationeel (B1-niveau Nederlands)
✅ Gebruik 'je/jij' vorm
✅ Wissel zinslengtes af (kort 40%, middel 40%, lang 20%)
✅ Vermijd formele woorden: "uiteraard" → "natuurlijk", "optimaal" → "goed"
✅ Geen AI-patronen of herhalingen
✅ Concrete voorbeelden (geen fictieve personen)

**OPMAAK:**
✅ Minimaal 2-3 <ul><li> lijsten (VERPLICHT)
✅ <strong> voor belangrijke punten (max 2-3 per paragraaf)
${includeFAQ ? '✅ FAQ sectie met <details><summary> voor accordion' : '❌ Geen FAQ'}

${getBannedWordsInstructions()}

**AFBEELDINGEN:**
${imageCount > 0 ? `
- Voeg PRECIES ${imageCount} afbeeldingen toe op logische plekken:
  ${Array.from({length: imageCount}, (_, i) => 
    `* IMAGE_PLACEHOLDER_${i + 1}: ${i === 0 ? 'Na intro sectie' : i === 1 ? 'Halverwege artikel' : 'Voor conclusie'}`
  ).join('\n  ')}
- Format: <img src="IMAGE_PLACEHOLDER_X" alt="DETAILED_IMAGE_DESCRIPTION" />
- ⚠️ BELANGRIJK: Geef bij alt text een GEDETAILLEERDE beschrijving van wat de afbeelding moet tonen:
  * Beschrijf de specifieke visuele inhoud die past bij die sectie
  * Gebruik 8-15 woorden in de alt text
  * Geef concrete, specifieke details over wat er op de afbeelding moet staan
  * Voorbeeld: "Moderne yoga studio met groene planten en natuurlijk licht door grote ramen"
  * NIET algemeen zoals "yoga afbeelding" maar SPECIFIEK zoals "vrouw doet downward dog pose op paarse mat in lichte kamer"
` : '❌ GEEN afbeeldingen'}

**KRITIEKE LENGTE VEREISTE:**
🚨 Target: ${wordCount} woorden
🚨 Schrijf het COMPLETE artikel tot ${wordCount} woorden
🚨 Stop NIET voortijdig - maak het artikel COMPLEET af

Schrijf nu het VOLLEDIGE en COMPLETE artikel in PURE HTML (geen markdown, geen code blocks)!`;

      // AI CALL - Simple, no heartbeat complexity
      const contentResponse = await chatCompletion({
        model: 'claude-sonnet-4-5',
        messages: [
          {
            role: 'user',
            content: writingPrompt
          }
        ],
        temperature: 0.8,
        max_tokens: Math.min(Math.ceil((wordCount + 200) * 2.5), 7000) // Safe limit
      });

      console.log('✅ AI response received');
      await sendProgress('✅ AI klaar, content verwerken...', 70);

      let content = contentResponse.choices[0]?.message?.content || '';

      // Clean up content
      content = content.replace(/```[\w]*\n?/g, '');
      content = content.replace(/```\n?$/g, '');
      content = content.replace(/^### (.+)$/gm, '<h3>$1</h3>');
      content = content.replace(/^## (.+)$/gm, '<h2>$1</h2>');
      content = content.replace(/^# (.+)$/gm, '<h1>$1</h1>');
      content = content.replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>');
      content = content.replace(/^- (.+)$/gm, '<li>$1</li>');
      content = content.replace(/(<li>[\s\S]+?<\/li>)(?!\n*<li>)/g, (match) => {
        if (!match.includes('<ul>')) {
          return `<ul>\n${match}\n</ul>`;
        }
        return match;
      });

      // Check banned words
      const validation = isContentValid(content);
      if (!validation.valid) {
        content = removeBannedWords(content);
      }

      const actualWordCount = content.split(/\s+/).filter(w => w.length > 0).length;
      await sendProgress(`✅ Artikel compleet: ${actualWordCount} woorden`, 75);

      // Generate mid-text images
      if (imageCount > 0 && includeImages) {
        await sendProgress(`🖼️ ${imageCount} contextuele afbeeldingen genereren...`, 78);
        
        for (let i = 1; i <= Math.min(imageCount, 5); i++) {
          const placeholder = `IMAGE_PLACEHOLDER_${i}`;
          
          // Extract the alt text from the generated content - this is what the AI described should be in the image!
          const imgTagMatch = content.match(new RegExp(`<img[^>]*src="${placeholder}"[^>]*alt="([^"]+)"[^>]*>`, 'i'));
          
          if (imgTagMatch) {
            try {
              const altText = imgTagMatch[1];
              console.log(`🎯 [Image ${i}] Alt text: "${altText}"`);
              
              // Use the AI's detailed description as the image prompt!
              const contextualPrompt = `Professional high-quality photorealistic image: ${altText}.
High quality professional photography, excellent composition and lighting.
Sharp focus, vibrant natural colors, modern editorial style.
NO TEXT, NO WATERMARKS, NO LOGOS, NO CAPTIONS.
Ultra detailed, 8K resolution, professional photography.`;

              await sendProgress(`🎨 Afbeelding ${i}/${imageCount}: ${altText.substring(0, 40)}...`, 78 + (i * 3));

              const imgResult = await generateSmartImage({
                prompt: contextualPrompt,
                projectId,
                type: 'mid-text',
                width: 1920,
                height: 1080,
              });

              if (imgResult.success && imgResult.imageUrl) {
                // Replace placeholder with actual image, keeping the detailed alt text
                content = content.replace(
                  new RegExp(`<img[^>]*src="${placeholder}"[^>]*>`, 'g'),
                  `<img src="${imgResult.imageUrl}" alt="${altText}" loading="lazy" style="width: 100%; height: auto; border-radius: 8px; margin: 20px 0;" />`
                );
                console.log(`✅ [Image ${i}] Generated successfully`);
              }
            } catch (error) {
              console.log(`⚠️ Image ${i} generatie mislukt:`, error);
            }
          }
        }
        
        await sendProgress(`✅ Alle afbeeldingen gegenereerd`, 90);
      } else {
        await sendProgress('⏭️ Geen afbeeldingen', 82);
      }

      // Save to content library
      await sendProgress('💾 Opslaan in content library...', 85);

      const title = topic;
      const savedContent = await autoSaveToLibrary({
        clientId: user.id,
        projectId: projectId || null,
        type: 'blog',
        title,
        content,
        language: language.toUpperCase(),
      });

      const contentId = savedContent.contentId || '';
      await sendProgress(`✅ Opgeslagen (ID: ${contentId.substring(0, 8)}...)`, 88);

      // Update topical topic if applicable
      if (topicalTopicId && contentId) {
        try {
          await prisma.topicalTopic.update({
            where: { id: topicalTopicId },
            data: {
              status: 'completed',
              isCompleted: true,
              contentId: contentId
            }
          });
        } catch (topicError) {
          console.error('⚠️ Kon topical topic niet updaten:', topicError);
        }
      }

      // WordPress publishing
      let wordpressUrl = '';
      if (shouldPublishToWordPress && projectId) {
        try {
          await sendProgress('📤 WordPress publiceren...', 92);
          
          const project = await prisma.project.findUnique({
            where: { id: projectId },
            select: {
              wordpressUrl: true,
              wordpressUsername: true,
              wordpressPassword: true,
              name: true,
            }
          });

          if (project?.wordpressUrl && project.wordpressUsername && project.wordpressPassword) {
            const wpResult = await publishToWordPress(
              {
                siteUrl: project.wordpressUrl,
                username: project.wordpressUsername,
                applicationPassword: project.wordpressPassword,
              },
              {
                title,
                content,
                excerpt: '',
                status: 'publish',
                categories: [],
                tags: keywords || [],
                featuredImageUrl: featuredImageUrl || undefined,
              }
            );

            if (wpResult && wpResult.link) {
              wordpressUrl = wpResult.link;
              await sendProgress('✅ WordPress: gepubliceerd', 95);
              
              await prisma.savedContent.update({
                where: { id: contentId },
                data: { 
                  publishedUrl: wordpressUrl,
                  publishedAt: new Date()
                }
              });
            }
          }
        } catch (wpError) {
          console.error('⚠️ WordPress publicatie gefaald:', wpError);
        }
      } else {
        await sendProgress('⏭️ Geen WordPress publicatie', 95);
      }

      // Deduct credits
      if (!user.isUnlimited) {
        if (user.subscriptionCredits >= requiredCredits) {
          await prisma.client.update({
            where: { id: user.id },
            data: { subscriptionCredits: { decrement: requiredCredits } }
          });
        } else {
          const remaining = requiredCredits - user.subscriptionCredits;
          await prisma.client.update({
            where: { id: user.id },
            data: {
              subscriptionCredits: 0,
              topUpCredits: { decrement: remaining }
            }
          });
        }
      }

      await sendProgress('🎉 Compleet!', 100);

      // Send final success payload
      if (!contentId) {
        throw new Error('Content werd opgeslagen maar geen ID ontvangen');
      }
      
      const successPayload = {
        status: 'complete',
        success: true,
        done: true,
        progress: 100,
        contentId: contentId,
        title,
        content: content,
        wordCount: actualWordCount,
        creditsUsed: requiredCredits,
        message: wordpressUrl 
          ? `Content succesvol gegenereerd en gepubliceerd naar WordPress! 🚀` 
          : 'Content succesvol gegenereerd en opgeslagen!',
        redirectUrl: `/client-portal/content-library/${contentId}/edit`,
        wordpressUrl: wordpressUrl || undefined,
      };
      
      console.log('[UnifiedWriter] ✅ Sending success payload');
      
      const successData = `data: ${JSON.stringify(successPayload)}\n\n`;
      await writer.write(encoder.encode(successData));
      await writer.close();
      console.log('✅ [UnifiedWriter] Stream closed successfully');

    } catch (error: any) {
      console.error('❌ [UnifiedWriter] Generation error:', error);
      
      const errorMessage = error.message || 'Content generatie mislukt';
      const errorData = `data: ${JSON.stringify({
        status: 'error',
        error: errorMessage,
        progress: 0,
        done: true
      })}\n\n`;
      
      await writer.write(encoder.encode(errorData));
      await writer.close();
    }
  })();

  return new Response(stream.readable, {
    headers: {
      'Content-Type': 'text/event-stream',
      'Cache-Control': 'no-cache',
      'Connection': 'keep-alive',
    },
  });
}
