
import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth-options';
import {
  analyzeWebsite,
  performSERPAnalysis,
  performKeywordResearch,
  collectImages,
  generateContentStructure,
  generateBlogContent,
  generateMarkdownFile,
  type WebsiteAnalysis,
  type SERPAnalysis,
  type KeywordResearch,
  type CollectedImage,
  type ContentOutline,
  type GeneratedBlog,
} from '@/lib/seo-automated-workflow';

export const maxDuration = 300; // 5 minutes

export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Niet geautoriseerd' }, { status: 401 });
    }

    const body = await req.json();
    const {
      topic,
      wordCount = 1500,
      keywords = '',
      websiteUrl = '',
      numberOfImages = 4, // Verminderd van 12 naar 4 voor betere content balans
      projectId = null, // Add projectId
      enableWebsiteAnalysis = true,
      enableSERPAnalysis = true,
      enableKeywordResearch = true,
      enableImageCollection = true,
      enableOutlineGeneration = true,
      // Content Options
      includeFAQ = false,
      includeTables = false,
      includeYouTube = false,
      includeDirectAnswer = true,
      generateFeaturedImage = true,
      // Bol.com Integration
      useBolcomIntegration = false,
      numberOfProducts = 3,
      // Partner Link
      includePartnerLink = false,
      partnerLinkText = '',
      partnerLinkUrl = '',
    } = body;

    if (!topic) {
      return NextResponse.json({ error: 'Onderwerp is verplicht' }, { status: 400 });
    }

    // ✅ AUTOMATISCHE PRODUCTDETECTIE: Als de titel producten suggereert, schakel Bol.com in
    const autoDetectProducts = /(^(beste|top)\s+|^\d+\s+|^deze\s+\d+\s+|\d+\s+(beste|goedkoopste|energiezuinige|populairste|duurzaamste|snelste))/i.test(topic.trim());
    let finalUseBolcom = useBolcomIntegration;
    let finalNumberOfProducts = numberOfProducts;
    
    if (autoDetectProducts && !useBolcomIntegration) {
      console.log(`🤖 AUTO-DETECTIE: Producten gedetecteerd in titel "${topic}" - Bol.com integratie ingeschakeld`);
      finalUseBolcom = true;
      // Verhoog aantal producten voor productlijst artikelen
      if (/^\d+\s+/i.test(topic.trim())) {
        const numberMatch = topic.match(/^(\d+)/);
        if (numberMatch) {
          const detectedNumber = parseInt(numberMatch[1]);
          finalNumberOfProducts = Math.min(detectedNumber, 10); // Max 10 producten
          console.log(`   📊 Aantal producten aangepast naar ${finalNumberOfProducts}`);
        }
      }
    }

    // Start streaming response
    const stream = new TransformStream();
    const writer = stream.writable.getWriter();
    const encoder = new TextEncoder();

    const sendUpdate = async (data: any) => {
      await writer.write(encoder.encode(JSON.stringify(data) + '\n'));
    };

    // Process in background
    (async () => {
      try {
        // STAP 1: Website Analyse
        let websiteAnalysis: WebsiteAnalysis | null = null;
        if (enableWebsiteAnalysis) {
          await sendUpdate({ step: 'website-analysis', status: 'in-progress', progress: 10 });
          
          try {
            websiteAnalysis = await analyzeWebsite(websiteUrl);
            await sendUpdate({ 
              step: 'website-analysis', 
              status: 'completed', 
              progress: 20, 
              data: websiteAnalysis 
            });
          } catch (error: any) {
            console.error('Website analysis error:', error);
            await sendUpdate({ 
              step: 'website-analysis', 
              status: 'error', 
              error: error.message,
              progress: 20,
            });
            // Continue met defaults
            websiteAnalysis = {
              toneOfVoice: 'Professioneel maar toegankelijk, behulpzaam en informatief',
              writingStyle: 'Gebruik van je vorm, korte alineas, scanbare structuur met duidelijke koppen',
              targetAudience: 'Lezers die op zoek zijn naar betrouwbare informatie over het onderwerp',
              contentStructure: 'H2/H3 headers, bullet points, praktische informatie en concrete voorbeelden',
              affiliatePartnerships: [],
              keyThemes: [],
            };
          }
        } else {
          websiteAnalysis = {
            toneOfVoice: 'Professioneel maar toegankelijk, behulpzaam en informatief',
            writingStyle: 'Gebruik van je vorm, korte alineas, scanbare structuur met duidelijke koppen',
            targetAudience: 'Lezers die op zoek zijn naar betrouwbare informatie over het onderwerp',
            contentStructure: 'H2/H3 headers, bullet points, praktische informatie en concrete voorbeelden',
            affiliatePartnerships: [],
            keyThemes: [],
          };
          await sendUpdate({ step: 'website-analysis', status: 'skipped', progress: 20 });
        }

        // STAP 2: Keyword Research
        let keywordResearch: KeywordResearch;
        if (enableKeywordResearch) {
          await sendUpdate({ step: 'keyword-research', status: 'in-progress', progress: 30 });
          
          try {
            const providedKeywords = keywords.split(',').map((k: string) => k.trim()).filter(Boolean);
            keywordResearch = await performKeywordResearch(topic, providedKeywords[0]);
            
            await sendUpdate({ 
              step: 'keyword-research', 
              status: 'completed', 
              progress: 40, 
              data: keywordResearch 
            });
          } catch (error: any) {
            console.error('Keyword research error:', error);
            await sendUpdate({ 
              step: 'keyword-research', 
              status: 'error', 
              error: error.message,
              progress: 40,
            });
            // Continue met basic keyword data
            keywordResearch = {
              focusKeyword: keywords.split(',')[0]?.trim() || topic,
              relatedKeywords: keywords.split(',').map((k: string) => k.trim()).filter(Boolean),
              lsiKeywords: [],
              searchIntent: 'informational',
              competition: 'medium',
              keywordDensity: 1.5,
              suggestions: [],
            };
          }
        } else {
          keywordResearch = {
            focusKeyword: keywords.split(',')[0]?.trim() || topic,
            relatedKeywords: keywords.split(',').map((k: string) => k.trim()).filter(Boolean),
            lsiKeywords: [],
            searchIntent: 'informational',
            competition: 'medium',
            keywordDensity: 1.5,
            suggestions: [],
          };
          await sendUpdate({ step: 'keyword-research', status: 'skipped', progress: 40 });
        }

        // STAP 3: SERP Analyse (Concurrentie Analyse)
        let serpAnalysis: SERPAnalysis | null = null;
        if (enableSERPAnalysis) {
          await sendUpdate({ 
            step: 'serp-analysis', 
            status: 'in-progress', 
            progress: 45,
            message: 'Analyseren van top-rankende content...' 
          });
          
          try {
            serpAnalysis = await performSERPAnalysis(topic);
            
            await sendUpdate({ 
              step: 'serp-analysis', 
              status: 'completed', 
              progress: 50, 
              data: serpAnalysis,
              message: 'SERP analyse voltooid - Concurrenten geanalyseerd'
            });
          } catch (error: any) {
            console.error('SERP analysis error:', error);
            await sendUpdate({ 
              step: 'serp-analysis', 
              status: 'error', 
              error: error.message,
              progress: 50,
            });
            // Continue without SERP analysis
            serpAnalysis = null;
          }
        } else {
          await sendUpdate({ step: 'serp-analysis', status: 'skipped', progress: 50 });
        }

        // STAP 4: Afbeeldingen Verzamelen
        let images: CollectedImage[] = [];
        if (enableImageCollection) {
          await sendUpdate({ step: 'image-collection', status: 'in-progress', progress: 55 });
          
          try {
            images = await collectImages(topic, numberOfImages);
            await sendUpdate({ 
              step: 'image-collection', 
              status: 'completed', 
              progress: 58, 
              data: { imageCount: images.length } 
            });
          } catch (error: any) {
            console.error('Image collection error:', error);
            await sendUpdate({ 
              step: 'image-collection', 
              status: 'error', 
              error: error.message,
              progress: 58,
            });
            images = [];
          }
        } else {
          await sendUpdate({ step: 'image-collection', status: 'skipped', progress: 58 });
        }

        // STAP 4.5: Bol.com Producten (skip logica is ingebouwd in generateBlogContent)
        if (finalUseBolcom) {
          await sendUpdate({ 
            step: 'bolcom-products', 
            status: 'in-progress', 
            progress: 60,
            message: 'Zoeken naar relevante Bol.com producten...'
          });
          
          // Note: Daadwerkelijke product zoekactie gebeurt in generateBlogContent
          // Hier alleen progress update
          await sendUpdate({ 
            step: 'bolcom-products', 
            status: 'completed', 
            progress: 62,
            message: `Bol.com producten gevonden (${finalNumberOfProducts} producten)`
          });
        } else {
          await sendUpdate({ step: 'bolcom-products', status: 'skipped', progress: 62 });
        }

        // STAP 5: Content Structuur
        let outline: ContentOutline;
        if (enableOutlineGeneration) {
          await sendUpdate({ 
            step: 'outline-generation', 
            status: 'in-progress', 
            progress: 67,
            message: 'AI creëert content structuur...'
          });
          
          try {
            console.log('📋 Starting content structure generation...');
            outline = await generateContentStructure(
              topic,
              keywords.split(',').map((k: string) => k.trim()).filter(Boolean),
              websiteAnalysis!,
              keywordResearch,
              serpAnalysis,
              wordCount
            );
            
            console.log('✅ Content structure generated successfully');
            await sendUpdate({ 
              step: 'outline-generation', 
              status: 'completed', 
              progress: 75, 
              message: 'Content structuur gereed!',
              data: outline 
            });
          } catch (error: any) {
            console.error('❌ Outline generation error:', error);
            console.error('   Error name:', error.name);
            console.error('   Error message:', error.message);
            console.error('   Error stack:', error.stack);
            
            await sendUpdate({ 
              step: 'outline-generation', 
              status: 'error', 
              error: error.message || 'Fout bij content structuur generatie',
              message: `Fout: ${error.message}`,
              progress: 67,
            });
            
            // Send final error and close stream
            await sendUpdate({
              step: 'complete',
              status: 'error',
              error: error.message || 'Content structuur kon niet worden gegenereerd',
              progress: 67,
            });
            
            return; // Stop processing
          }
        } else {
          throw new Error('Outline generation cannot be skipped');
        }

        // STAP 6: Blog Content Genereren
        await sendUpdate({ 
          step: 'content-generation', 
          status: 'in-progress', 
          progress: 80,
          message: 'AI schrijft volledige blog content... (dit kan 1-2 minuten duren)'
        });
        
        try {
          console.log('🚀 Starting blog content generation...');
          console.log(`📊 Parameters: topic="${topic}", wordCount=${wordCount}, images=${images.length}`);
          
          // Extra progress update na 15 seconden
          const progressTimer = setTimeout(async () => {
            await sendUpdate({ 
              step: 'content-generation', 
              status: 'in-progress', 
              progress: 85,
              message: 'Content wordt nog steeds gegenereerd, even geduld...'
            });
          }, 15000);
          
          const blog: GeneratedBlog = await generateBlogContent(
            outline,
            topic,
            wordCount,
            websiteAnalysis!,
            keywordResearch,
            images,
            {
              includeFAQ,
              includeTables,
              includeYouTube,
              includeDirectAnswer,
              generateFeaturedImage,
              // Bol.com Integration
              useBolcomIntegration: finalUseBolcom,
              numberOfProducts: finalNumberOfProducts,
              projectId, // Pass projectId for Bol.com integration
              // Partner Link
              includePartnerLink,
              partnerLinkText,
              partnerLinkUrl,
            }
          );
          
          clearTimeout(progressTimer);
          
          console.log('✅ Blog content generation successful');
          console.log(`📊 Generated: ${blog.wordCount} words, ${blog.content.length} chars`);
          
          // Auto-link products (automatically link product mentions)
          if (projectId) {
            try {
              const { prisma } = await import('@/lib/db');
              const project = await prisma.project.findUnique({
                where: { id: projectId },
                select: {
                  id: true,
                  bolcomEnabled: true,
                  bolcomClientId: true,
                  bolcomClientSecret: true,
                  bolcomAffiliateId: true,
                },
              });
              
              if (project?.bolcomEnabled && project?.bolcomClientId && project?.bolcomClientSecret && project?.bolcomAffiliateId) {
                const { autoLinkProducts } = await import('@/lib/auto-link-products');
                
                const autoLinkResult = await autoLinkProducts({
                  projectId: project.id,
                  content: blog.content,
                  credentials: {
                    clientId: project.bolcomClientId,
                    clientSecret: project.bolcomClientSecret,
                    affiliateId: project.bolcomAffiliateId,
                  },
                });
                
                blog.content = autoLinkResult.content;
                
                if (autoLinkResult.linksInserted > 0) {
                  console.log(`🔗 Auto-linked ${autoLinkResult.linksInserted} products in Deep Research Writer: ${autoLinkResult.productsLinked.join(', ')}`);
                }
              }
            } catch (error) {
              console.error('❌ Error auto-linking products in Deep Research Writer:', error);
            }
          }
          
          await sendUpdate({ 
            step: 'content-generation', 
            status: 'completed', 
            progress: 90, 
            message: `Blog content voltooid (${blog.wordCount} woorden)`,
            data: { 
              wordCount: blog.wordCount,
              bannedWordsFound: blog.bannedWordsFound,
            } 
          });

          // STAP 7: Opslaan in Content Bibliotheek
          await sendUpdate({ 
            step: 'markdown-export', 
            status: 'in-progress', 
            progress: 95, 
            message: 'Content opslaan in bibliotheek...' 
          });
          
          try {
            console.log('💾 Saving content to database...');
            
            // Save to Content Library
            const { prisma } = await import('@/lib/db');
            const savedContent = await prisma.savedContent.create({
              data: {
                clientId: session.user.id,
                type: 'blog',
                title: blog.title || topic,
                content: blog.content.replace(/<[^>]*>/g, ''), // Plain text voor zoeken
                contentHtml: blog.content, // HTML content voor editor
                category: 'deep-research',
                tags: ['ai-generated', 'deep-writer', 'seo-optimized'],
                description: blog.metaDescription, // Gebruik gegenereerde meta description
                keywords: keywordResearch.relatedKeywords.slice(0, 10),
                metaDesc: blog.metaDescription, // SEO meta description
                imageUrls: images.map(img => img.url),
                wordCount: blog.wordCount,
                generatorType: 'deep-writer', // Mark as Deep Writer generated
              },
            });

            console.log(`✅ Content saved with ID: ${savedContent.id}`);

            await sendUpdate({ 
              step: 'markdown-export', 
              status: 'completed', 
              progress: 100,
              message: 'Content opgeslagen! Redirecting naar editor...',
            });

            // Send final result with content ID for redirect
            await sendUpdate({
              step: 'complete',
              status: 'success',
              progress: 100,
              result: {
                contentId: savedContent.id, // ID for redirect to editor
                blog,
                keywordResearch,
                websiteAnalysis,
                images,
              },
            });
            
            console.log('🎉 Workflow completed successfully');
          } catch (saveError: any) {
            console.error('❌ Error saving content:', saveError);
            console.error('❌ Save error details:', saveError.message, saveError.stack);
            await sendUpdate({ 
              step: 'markdown-export', 
              status: 'error', 
              error: 'Kon content niet opslaan: ' + saveError.message,
              progress: 95,
            });
            throw saveError;
          }
        } catch (error: any) {
          console.error('❌ Content generation error:', error);
          console.error('❌ Error details:', {
            message: error.message,
            stack: error.stack,
            name: error.name,
          });
          
          await sendUpdate({ 
            step: 'content-generation', 
            status: 'error', 
            error: error.message || 'Content generatie mislukt - probeer het opnieuw',
            progress: 90,
          });
          throw error;
        }
      } catch (error: any) {
        console.error('Workflow error:', error);
        await sendUpdate({
          step: 'error',
          status: 'error',
          error: error.message || 'Er is een fout opgetreden',
        });
      } finally {
        await writer.close();
      }
    })();

    return new Response(stream.readable, {
      headers: {
        'Content-Type': 'application/json',
        'Cache-Control': 'no-cache',
        'Connection': 'keep-alive',
      },
    });
  } catch (error: any) {
    console.error('Deep Research Writer API error:', error);
    return NextResponse.json(
      { error: error.message || 'Er is een fout opgetreden' },
      { status: 500 }
    );
  }
}
