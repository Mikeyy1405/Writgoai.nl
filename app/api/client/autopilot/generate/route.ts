export const dynamic = "force-dynamic";
export const maxDuration = 300; // 5 minuten voor complexe blog generatie met AI
export const runtime = 'nodejs';

/**
 * AUTOPILOT Blog Generation API
 * ✅ NOW USES EXACT SAME PROCESS AS MANUAL WRITGO WRITER!
 * - aiml-agent.generateBlog() for HTML generation (same as manual mode)
 * - product-box-generator for bol.com integration
 * - tone-of-voice-helper for custom tone
 */

import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth-options';
import { prisma } from '@/lib/db';
import { hasEnoughCredits, deductCredits, CREDIT_COSTS } from '@/lib/credits';
import { generateBlog } from '@/lib/aiml-agent';  // ✅ SAME AS MANUAL WRITER
import { getClientToneOfVoice } from '@/lib/tone-of-voice-helper';
import { 
  processProductBoxes,
  type ProductInfo 
} from '@/lib/product-box-generator';
import { autoSaveToLibrary } from '@/lib/content-library-helper';
import { detectBannedWords, removeBannedWords, isContentValid } from '@/lib/banned-words';
import { 
  loadWordPressSitemap, 
  type SitemapPage,
  findRelevantInternalLinksWithAI,
  insertInternalLinksIntoHTML
} from '@/lib/sitemap-loader';

// OLD findRelevantAffiliateLinks FUNCTION REMOVED
// Link selection is now done BEFORE generation and integrated naturally by AI

/**
 * Update AutopilotJob progress in database
 */
async function updateJobProgress(
  jobId: string,
  updates: {
    status?: string;
    progress?: number;
    currentStep?: string;
    contentId?: string;
    publishedUrl?: string;
    error?: string;
  }
) {
  try {
    await prisma.autopilotJob.update({
      where: { id: jobId },
      data: {
        ...updates,
        updatedAt: new Date(),
        ...(updates.status === 'completed' || updates.status === 'failed' 
          ? { completedAt: new Date() } 
          : {}),
      },
    });
    console.log(`📊 Job ${jobId} updated:`, updates);
  } catch (error) {
    console.error('Failed to update job progress:', error);
  }
}

// OLD FUNCTIONS REMOVED - Links are now integrated naturally during blog generation
// The AI now integrates affiliate and product links contextually while writing,
// resulting in much more natural and varied language.

export async function POST(req: NextRequest) {
  const body = await req.json();
  const { articleId, projectId, settings, clientId } = body;

  if (!articleId) {
    return NextResponse.json({ error: 'Article ID verplicht' }, { status: 400 });
  }

  console.log('🚀 Autopilot generatie gestart voor article:', articleId);

  // Get client - either from session or from provided clientId (for background jobs)
  let client;
  
  if (clientId) {
    // Background job - use provided clientId
    console.log('🔄 Using provided clientId for background job:', clientId);
    client = await prisma.client.findUnique({
      where: { id: clientId },
      select: { 
        id: true, 
        email: true,
        subscriptionCredits: true,
        topUpCredits: true,
        isUnlimited: true
      },
    });
  } else {
    // Regular API call - use session
    const session = await getServerSession(authOptions);
    if (!session?.user?.email) {
      return NextResponse.json({ error: 'Niet geautoriseerd' }, { status: 401 });
    }
    
    client = await prisma.client.findUnique({
      where: { email: session.user.email },
      select: { 
        id: true, 
        email: true,
        subscriptionCredits: true,
        topUpCredits: true,
        isUnlimited: true
      },
    });
  }

  if (!client) {
    return NextResponse.json({ error: 'Client niet gevonden' }, { status: 404 });
  }

  // Get article idea
  const articleIdea = await prisma.articleIdea.findUnique({
    where: { id: articleId },
  });

  if (!articleIdea) {
    return NextResponse.json({ error: 'Article idea niet gevonden' }, { status: 404 });
  }

  // Check if already has content
  if (articleIdea.hasContent && articleIdea.contentId) {
    return NextResponse.json({ 
      success: true, 
      contentId: articleIdea.contentId,
      message: 'Content bestaat al'
    });
  }

  // Find or create AutopilotJob for progress tracking
  let autopilotJob = await prisma.autopilotJob.findFirst({
    where: {
      articleId: articleId,
      status: { in: ['pending', 'generating'] }
    }
  });

  if (!autopilotJob) {
    autopilotJob = await prisma.autopilotJob.create({
      data: {
        client: { connect: { id: client.id } },
        articleId: articleId,
        projectId: projectId || null,
        status: 'pending',
        progress: 0,
        currentStep: 'Voorbereiden...',
      },
    });
  }

  // Update status to generating immediately
  await updateJobProgress(autopilotJob.id, {
    status: 'generating',
    progress: 5,
    currentStep: 'Starting generation...',
  });

  // AUTOPILOT AUTO MODE - Settings determined automatically
  // Model: Always Claude Sonnet 4.5 for high-quality SEO content
  const model = 'claude-sonnet-4-5';
  
  // Tone: Will be determined automatically from client tone of voice settings
  // (handled later via getClientToneOfVoice)
  
  // Word count: Will be determined automatically by analyzing top 10 Google competitors
  // (isolated-blog-generator handles this automatically in its competitor analysis)
  const targetWordCount = null; // Let the generator decide based on competitor analysis
  
  // Link display: Use contextual text links (no visual boxes)
  const linkDisplayType = 'ai-mix'; // 🎨 Mix van inline links en productboxen netjes verdeeld door content
  
  // Other settings
  const includeBolcomProducts = settings?.includeBolcomProducts !== false;
  const includeImages = settings?.includeImages !== false;
  
  // ✨ SEO Features - PLACEHOLDER - Deze worden later uit project settings gehaald
  let includeYouTube = false; // Will be overridden by project settings
  let includeFAQ = false; // Will be overridden by project settings
  let includeDirectAnswer = true; // Will be overridden by project settings
  const generateFeaturedImage = true; // Auto mode: always generate featured image
  const seoOptimized = true; // Auto mode: always SEO optimized

  // Credit check (use same logic as Writgo Writer)
  const totalCredits = client.subscriptionCredits + client.topUpCredits;
  const requiredCredits = CREDIT_COSTS.BLOG_POST; // 50 credits
  
  if (!client.isUnlimited && totalCredits < requiredCredits) {
    return NextResponse.json({ 
      error: 'Insufficient credits',
      message: `Je hebt niet genoeg credits. Dit kost ${requiredCredits} credits.`,
      requiredCredits
    }, { status: 402 });
  }

  console.log('🚀 Starting Autopilot AUTO MODE blog generation:', { 
    topic: articleIdea.title, 
    model: 'claude-sonnet-4-5 (fixed)',
    wordCount: 'AUTO (based on Google competitor analysis)',
    tone: 'AUTO (from tone of voice settings)',
    linkDisplayType: 'text-only (no product boxes)',
    includeBolcomProducts,
    includeImages,
    seoOptimized: true
  });

  // Update article status to writing
  await prisma.articleIdea.update({
    where: { id: articleId },
    data: { status: 'writing' },
  });

  // Update job: Starting generation
  await updateJobProgress(autopilotJob.id, {
    status: 'generating',
    progress: 5,
    currentStep: 'Projectinstellingen laden...',
  });

  try {
    // Get project for context, sitemap, bol.com credentials, and affiliate links
    let project = null;
    let projectContext = null;
    let sitemapUrl = null;
    let wordpressApiUrl = null;
    let bolcomCredentials = null;
    let projectAffiliateLinks: any[] = [];

    if (projectId) {
      project = await prisma.project.findUnique({
        where: { id: projectId },
        select: {
          id: true,
          name: true,
          description: true,
          websiteUrl: true,
          language: true, // 🌍 Multi-language support
          wordpressUrl: true,
          wordpressCategory: true, // 🔥 WordPress category ID for auto-selection
          bolcomClientId: true,
          bolcomClientSecret: true,
          bolcomAffiliateId: true, // ✅ Affiliate ID for partner links
          autopilotWordCount: true, // 🎯 Target word count for Autopilot blogs
          autopilotPublishToWritgoaiBlog: true, // 🚀 Publish to WritgoAI blog flag
          autopilotIncludeFAQ: true, // ❓ FAQ sectie opties
          autopilotIncludeDirectAnswer: true, // 🎯 Direct Answer Box opties
          autopilotIncludeYouTube: true, // 🎥 YouTube video embed opties
          autopilotImageCount: true, // 🖼️ Aantal afbeeldingen per artikel
          affiliateLinks: {
            where: { isActive: true },
            select: {
              id: true,
              url: true,
              anchorText: true,
              category: true,
              description: true,
              keywords: true,
            },
          },
        },
      });

      if (project) {
        projectContext = {
          name: project.name,
          url: project.websiteUrl || undefined,
          description: project.description || undefined,
        };
        sitemapUrl = project.websiteUrl || undefined; // 🔗 BUGFIX: Use websiteUrl for internal links
        wordpressApiUrl = project.wordpressUrl || undefined;
        projectAffiliateLinks = project.affiliateLinks || [];
        
        // ✅ OVERRIDE SEO FEATURES MET PROJECT SETTINGS
        // Gebruik project settings in plaats van hardcoded defaults
        includeFAQ = project.autopilotIncludeFAQ ?? false;
        includeDirectAnswer = project.autopilotIncludeDirectAnswer ?? true;
        includeYouTube = project.autopilotIncludeYouTube ?? false;
        
        console.log('🎯 SEO Features uit project settings:', {
          includeFAQ,
          includeDirectAnswer,
          includeYouTube
        });
        
        if (project.bolcomClientId && project.bolcomClientSecret) {
          bolcomCredentials = {
            clientId: project.bolcomClientId,
            clientSecret: project.bolcomClientSecret,
            affiliateId: project.bolcomAffiliateId || undefined, // ✅ Include affiliate ID for partner links
          };
        }
      }
    }

    // Update job: Loading tone of voice
    await updateJobProgress(autopilotJob.id, {
      progress: 10,
      currentStep: 'Tone of voice en projectcontext laden...',
    });

    // Get client tone of voice
    const toneOfVoiceData = await getClientToneOfVoice(client.id, projectId);

    // Build keywords array
    const keywords = [
      articleIdea.focusKeyword,
      ...(articleIdea.secondaryKeywords || [])
    ].filter(Boolean);

    // Update job: Starting content generation
    await updateJobProgress(autopilotJob.id, {
      progress: 15,
      currentStep: 'AI content genereren (hetzelfde proces als Writgo Writer)...',
    });

    // Prepare affiliate links and products BEFORE generation
    let preparedAffiliateLinks: Array<{url: string; anchorText: string; description?: string}> = [];
    let preparedProductLinks: Array<{name: string; url: string; price?: string; description?: string}> = [];

    // Step 1: Find relevant project affiliate links
    if (settings?.includeAffiliateLinks !== false && projectAffiliateLinks.length > 0) {
      try {
        console.log(`🔗 Finding relevant affiliate links from project (${projectAffiliateLinks.length} available)...`);
        
        // Use AI to pre-select relevant affiliate links based on title and keywords
        const preSelectionPrompt = `Analyseer dit artikel onderwerp en selecteer de meest relevante affiliate links.

ARTIKEL TITEL: ${articleIdea.title}
FOCUS KEYWORD: ${articleIdea.focusKeyword}
SECONDARY KEYWORDS: ${articleIdea.secondaryKeywords?.join(', ') || 'geen'}

BESCHIKBARE AFFILIATE LINKS:
${projectAffiliateLinks.map((link, idx) => `${idx + 1}. ${link.anchorText}
   URL: ${link.url}
   Category: ${link.category || 'Algemeen'}
   Description: ${link.description || 'Geen'}
   Keywords: ${(link.keywords as string[])?.join(', ') || 'Geen'}`).join('\n\n')}

Selecteer maximaal 3-4 van de meest relevante links die natuurlijk passen bij dit onderwerp.
Return ALLEEN een JSON array met indices (1-based): [1, 3, 5]
Als geen links relevant zijn: []`;

        const { chatCompletion } = await import('@/lib/aiml-api');
        const selectionResult = await chatCompletion({
          messages: [{ role: 'user', content: preSelectionPrompt }],
          model: 'gpt-4o-mini',
          temperature: 0.3,
          max_tokens: 100,
          trackUsage: {
            clientId: client.id,
            projectId: projectId || undefined,
            feature: 'autopilot_link_selection',
          },
        });
        
        const response = selectionResult.choices[0]?.message?.content || '[]';
        const jsonMatch = response.trim().match(/\[[\d,\s]*\]/);
        
        if (jsonMatch) {
          const selectedIndices = JSON.parse(jsonMatch[0]);
          preparedAffiliateLinks = selectedIndices
            .filter((idx: number) => idx > 0 && idx <= projectAffiliateLinks.length)
            .map((idx: number) => {
              const link = projectAffiliateLinks[idx - 1];
              return {
                url: link.url,
                anchorText: link.anchorText,
                description: link.description || undefined,
              };
            });
          
          console.log(`✅ ${preparedAffiliateLinks.length} relevante affiliate links geselecteerd`);
        }
      } catch (error) {
        console.error('❌ Error selecting affiliate links:', error);
      }
    }

    // Step 2: Find relevant bol.com products
    let enrichedProducts: any[] = []; // Store full product data for "beste" articles
    let reviewProduct: any = null; // Store detailed product data for reviews
    
    // ✅ UITGEBREIDE DETECTIE: Detecteer artikelen met producten
    // Patronen: "beste X", "top 10 X", "deze 8 X", "5 goedkoopste X", etc.
    const isProductListArticle = /(^(beste|top)\s+|^\d+\s+|^deze\s+\d+\s+|\d+\s+(beste|goedkoopste|energiezuinige|populairste))/i.test(articleIdea.title.trim());
    const isReviewArticle = /(review|test|ervaring|evaluatie|beoordeling)$/i.test(articleIdea.title.trim());
    
    console.log('🔍 BOL.COM CHECK:', {
      includeBolcomProducts,
      hasBolcomCredentials: !!bolcomCredentials,
      isProductListArticle,
      isReviewArticle,
      articleTitle: articleIdea.title
    });
    
    if (includeBolcomProducts && bolcomCredentials) {
      try {
        console.log('🛍️ Zoeken naar relevante bol.com producten...');
        
        // Voor "review" artikelen: haal 1 product op met ALLE details
        if (isReviewArticle) {
          console.log(`📝 Type artikel: REVIEW (diepgaand en uitgebreid)`);
          const { findBestProducts } = await import('@/lib/bolcom-product-finder');
          
          const productResult = await findBestProducts(
            {
              query: articleIdea.focusKeyword,
              maxProducts: 1, // Only 1 product for reviews
            },
            bolcomCredentials
          );

          if (productResult.products.length > 0) {
            reviewProduct = productResult.products[0];
            console.log(`✅ Review product gevonden: ${reviewProduct.title}`);
            console.log(`   - Afbeelding: ${reviewProduct.image?.url || 'geen'}`);
            console.log(`   - Prijs: €${reviewProduct.price?.toFixed(2)}`);
            console.log(`   - Voordelen: ${reviewProduct.pros?.length || 0}`);
            console.log(`   - Nadelen: ${reviewProduct.cons?.length || 0}`);
          }
        } else {
          // Voor "beste" of "top" artikelen: haal meer producten en volledige data op
          const maxProducts = isProductListArticle ? 5 : 3;
          console.log(`📋 Type artikel: ${isProductListArticle ? 'PRODUCTLIJST (met voor/nadelen)' : 'REGULIER'}`);
          
          const { findBestProducts } = await import('@/lib/bolcom-product-finder');
          
          const productResult = await findBestProducts(
            {
              query: articleIdea.focusKeyword,
              maxProducts,
            },
            bolcomCredentials
          );

          if (productResult.products.length > 0) {
            console.log(`✅ ${productResult.products.length} bol.com producten gevonden`);
            
            // Voor productlijst artikelen: bewaar volledige data
            if (isProductListArticle) {
              enrichedProducts = productResult.products;
              console.log('📦 Volledige product data opgeslagen voor lijst generatie');
            }
            
            preparedProductLinks = productResult.products.map(p => ({
              name: p.title,
              url: p.affiliateUrl,
              price: `€${p.price.toFixed(2)}`,
              description: p.summary || p.description.substring(0, 100),
            }));
            
            console.log('📦 Producten:', preparedProductLinks.map(p => p.name).join(', '));
          }
        }
      } catch (error) {
        console.error('❌ Error fetching bol.com products:', error);
      }
    }

    // Update job: Starting content generation
    await updateJobProgress(autopilotJob.id, {
      progress: 15,
      currentStep: 'AI content genereren met affiliate links en producten...',
    });

    // ✅ GENERATE BLOG WITH INTEGRATED LINKS
    // Links are now integrated DURING generation for natural placement
    console.log('📝 Generating blog with integrated links...');
    console.log(`   - ${preparedAffiliateLinks.length} affiliate links`);
    console.log(`   - ${preparedProductLinks.length} product links`);
    
    const tone = toneOfVoiceData.toneOfVoice || 'professioneel en informatief';
    const brandInfo = project?.name 
      ? `${project.name}${project.description ? ` - ${project.description}` : ''}`
      : undefined;
    
    // Get target word count from project settings (default: 2000)
    const targetWordCount = project?.autopilotWordCount || 2000;
    console.log(`🎯 Target word count: ${targetWordCount} woorden`);

    // Step 3: Load knowledge base content for context
    let knowledgeBaseContext = '';
    try {
      console.log('📚 Loading knowledge base content...');
      const knowledgeItems = await prisma.projectKnowledge.findMany({
        where: {
          projectId: project.id,
        },
        select: {
          title: true,
          content: true,
          type: true,
          category: true,
          importance: true,
        },
      });

      if (knowledgeItems.length > 0) {
        // Filter by importance and build context
        const importantItems = knowledgeItems.filter(
          item => item.importance === 'high' || item.importance === 'critical'
        );
        const regularItems = knowledgeItems.filter(item => item.importance === 'normal');
        
        // Prioritize critical/high importance items
        const itemsToInclude = [...importantItems, ...regularItems].slice(0, 5); // Max 5 items to avoid token limits
        
        knowledgeBaseContext = itemsToInclude
          .map(item => `[${item.type.toUpperCase()}] ${item.title}${item.category ? ` (${item.category})` : ''}\n${item.content}`)
          .join('\n\n---\n\n');
        
        console.log(`✅ Loaded ${itemsToInclude.length} knowledge base items (${importantItems.length} high priority)`);
      } else {
        console.log('ℹ️ No knowledge base items found');
      }
    } catch (error) {
      console.error('❌ Error loading knowledge base:', error);
      // Continue without knowledge base if loading fails
    }

    // Step 4: Load sitemap for internal linking (AI-GEDREVEN)
    let selectedInternalLinks: Array<{title: string; url: string; relevance?: string}> = [];
    try {
      console.log('🔗 Loading sitemap for AI-driven internal linking...');
      if (project.wordpressUrl || project.websiteUrl) {
        const siteUrl = project.wordpressUrl || project.websiteUrl;
        console.log(`📍 Loading sitemap from: ${siteUrl}`);
        
        const sitemapData = await loadWordPressSitemap(siteUrl, project.wordpressUrl);
        
        if (sitemapData && sitemapData.pages.length > 0) {
          console.log(`✅ Found ${sitemapData.pages.length} pages in sitemap`);
          
          // 🤖 Gebruik AI om de BESTE interne links te selecteren
          selectedInternalLinks = await findRelevantInternalLinksWithAI(
            sitemapData,
            articleIdea.title,
            keywords,
            5 // Maximaal 5 relevante links (mag minder zijn)
          );
          
          if (selectedInternalLinks.length > 0) {
            console.log(`✅ AI selecteerde ${selectedInternalLinks.length} relevante interne links:`);
            selectedInternalLinks.forEach(link => 
              console.log(`   - "${link.title}" (${link.url}) - ${link.relevance}`)
            );
          } else {
            console.log('ℹ️ AI vond geen relevante interne links voor dit artikel');
          }
          
        } else {
          console.log('⚠️ No pages found in sitemap');
        }
      } else {
        console.log('ℹ️ No WordPress URL configured, skipping internal linking');
      }
    } catch (error) {
      console.error('❌ Error loading sitemap for internal linking:', error);
    }

    // Combine affiliate links for AI generation (NO INTERNAL LINKS HERE - they will be forced later)
    const allAffiliateLinks = preparedAffiliateLinks.length > 0 ? preparedAffiliateLinks : [];
    
    console.log('🔗 LINKS VOOR GENERATIE:', {
      affiliateLinks: allAffiliateLinks.length,
      productLinks: preparedProductLinks.length,
      enrichedProducts: enrichedProducts.length,
      reviewProduct: !!reviewProduct
    });
    
    console.log('📦 PRODUCT LINKS DETAIL:', preparedProductLinks.slice(0, 3).map(p => ({ name: p.name, url: p.url.substring(0, 50) + '...' })));

    const htmlContent = await generateBlog(
      articleIdea.title,
      keywords,
      tone,
      brandInfo,
      {
        affiliateLinks: allAffiliateLinks.length > 0 ? allAffiliateLinks : undefined,
        productLinks: preparedProductLinks.length > 0 ? preparedProductLinks : undefined,
        productList: enrichedProducts.length > 0 ? enrichedProducts : undefined, // 🛍️ Full product data for list generation
        reviewProduct: reviewProduct || undefined, // 📝 Single product for in-depth reviews
        targetWordCount: targetWordCount, // 🎯 Pass target word count to generator
        knowledgeBase: knowledgeBaseContext || undefined, // 📚 Knowledge base context
        // ✨ SEO Features - Nu worden deze correct doorgegeven!
        includeFAQ: includeFAQ, // ❓ Veelgestelde vragen sectie
        includeYouTube: includeYouTube, // 🎥 YouTube video embed
        includeDirectAnswer: includeDirectAnswer, // 🎯 Direct Answer Box
        language: (settings?.language || project?.language || articleIdea.language || 'NL') as 'NL' | 'EN' | 'DE' | 'FR' | 'ES', // 🌍 Multi-language support
      }
    );

    console.log('✅ Blog generated successfully with naturally integrated links');

    // Update job: Content generated
    await updateJobProgress(autopilotJob.id, {
      progress: 50,
      currentStep: 'Content gegenereerd met geïntegreerde links...',
    });
    
    // NO MORE POST-GENERATION LINK INSERTION - links are already integrated naturally!
    let modifiedContent = htmlContent;

    // Update job: Finalizing
    await updateJobProgress(autopilotJob.id, {
      progress: 70,
      currentStep: 'Content controleren en finaliseren...',
    });

    // ====== PREVENT CONSECUTIVE IMAGES ======
    // Ensure no 2 images are placed directly after each other
    console.log('🖼️ Checking for consecutive images...');
    
    // Regex to find image tags (including figure tags) with minimal text between them
    const consecutiveImagesPattern = /(<(?:figure|img)[^>]*>(?:.*?<\/figure>|[^<]*>))[\s\n\r]*(<(?:figure|img)[^>]*>(?:.*?<\/figure>|[^<]*>))/gs;
    
    let consecutiveMatches = 0;
    modifiedContent = modifiedContent.replace(consecutiveImagesPattern, (match, img1, img2) => {
      consecutiveMatches++;
      console.log(`⚠️ Found consecutive images #${consecutiveMatches}, adding spacing...`);
      
      // Add a separator paragraph between images
      return `${img1}\n\n<p class="my-4">&nbsp;</p>\n\n${img2}`;
    });
    
    if (consecutiveMatches > 0) {
      console.log(`✅ Fixed ${consecutiveMatches} consecutive image pairs with spacing`);
    } else {
      console.log('✅ No consecutive images found');
    }
    
    // ====== VOEG INTERNE LINKS TOE (POST-PROCESSING) ======
    // 🔗 AI-gedreven interne link insertie - voegt alleen RELEVANTE links toe uit sitemap
    console.log('🔍 INTERNE LINKS CHECK:', {
      selectedLinksCount: selectedInternalLinks.length,
      selectedLinks: selectedInternalLinks.map(l => ({ title: l.title, url: l.url })),
      contentLength: modifiedContent.length
    });
    
    if (selectedInternalLinks.length > 0) {
      console.log(`🔗 Proberen ${selectedInternalLinks.length} relevante interne links toe te voegen...`);
      
      try {
        const contentBefore = modifiedContent;
        modifiedContent = await insertInternalLinksIntoHTML(
          modifiedContent,
          selectedInternalLinks,
          3 // Target aantal links (niet geforceerd)
        );
        
        const contentChanged = contentBefore !== modifiedContent;
        const linkCountBefore = (contentBefore.match(/<a href/g) || []).length;
        const linkCountAfter = (modifiedContent.match(/<a href/g) || []).length;
        
        console.log('✅ Interne links insertie compleet:', {
          contentChanged,
          linksBefore: linkCountBefore,
          linksAfter: linkCountAfter,
          linksAdded: linkCountAfter - linkCountBefore
        });
      } catch (error) {
        console.error('❌ Error bij toevoegen interne links:', error);
        console.log('⚠️ Artikel wordt gepubliceerd zonder interne links');
      }
    } else {
      console.log('✅ Geen relevante interne links gevonden in sitemap - artikel wordt gepubliceerd zonder interne links');
    }
    
    // ====== FINAL BANNED WORDS CHECK ======
    // Validate and clean content after all modifications (affiliate links, product boxes, etc.)
    console.log('🔍 Final banned words check...');
    const contentValidation = isContentValid(modifiedContent);
    
    if (!contentValidation.valid) {
      console.warn('⚠️ Verboden woorden gevonden in autopilot output:', contentValidation.bannedWords);
      console.log('🧹 Removing banned words from final content...');
      
      // Remove banned words from content
      modifiedContent = removeBannedWords(modifiedContent);
      
      // Re-validate
      const revalidation = isContentValid(modifiedContent);
      if (!revalidation.valid) {
        console.error('❌ Verboden woorden konden niet volledig verwijderd worden:', revalidation.bannedWords);
        // Log but continue - better to have some content than none
      } else {
        console.log('✅ Alle verboden woorden succesvol verwijderd');
      }
    } else {
      console.log('✅ Geen verboden woorden gevonden');
    }

    // Calculate accurate word count (strip HTML tags)
    const textOnly = modifiedContent.replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ');
    const actualWordCount = textOnly.split(/\s+/).filter(w => w.length > 0).length;

    // Update job: Saving
    await updateJobProgress(autopilotJob.id, {
      progress: 80,
      currentStep: 'Content opslaan in bibliotheek...',
    });

    // ====== GENERATE AI IMAGES WITH SMART PROMPTS (INCLUDING FEATURED IMAGE) ======
    console.log('🎨 Generating context-aware AI images for article...');
    
    // Generate AI images based on project settings (default 2)
    const numImages = project?.autopilotImageCount || 2;
    const generatedImageUrls: string[] = [];
    
    try {
      const { generateImage, chatCompletion } = await import('@/lib/aiml-api');
      
      // Extract H2 headings and first paragraphs for context
      const h2Headings = modifiedContent.match(/<h2[^>]*>(.*?)<\/h2>/gi) || [];
      const headingTexts = h2Headings
        .map(h => h.replace(/<[^>]+>/g, '').trim())
        .filter(Boolean)
        .slice(0, 3); // Use first 3 main sections
      
      console.log(`📋 Found ${headingTexts.length} main sections for image generation`);
      
      // Extract full paragraphs for better context
      const paragraphMatches = modifiedContent.match(/<p[^>]*>(.*?)<\/p>/gi) || [];
      const firstParagraphs = paragraphMatches
        .slice(0, 5)
        .map(p => p.replace(/<[^>]+>/g, '').trim())
        .filter(Boolean);
      
      // Use AI to generate very specific, high-quality image prompts
      const promptGenerationPrompt = `Je bent een expert fotograaf en visueel content creator. Genereer zeer specifieke, gedetailleerde AI image prompts voor een artikel.

ARTIKEL TITEL: ${articleIdea.title}
FOCUS KEYWORD: ${articleIdea.focusKeyword}
HOOFD SECTIES: ${headingTexts.join(' | ')}
KEYWORDS: ${keywords.join(', ')}
CONTEXT PARAGRAFEN:
${firstParagraphs.slice(0, 3).map((p, i) => `${i + 1}. ${p.substring(0, 200)}...`).join('\n')}

TAAK: Genereer ${numImages} zeer specifieke, visueel rijke image prompts die PERFECT passen bij de CONTEXT van dit artikel.

⚠️ KRITIEKE REGELS:
1. Elk prompt moet DIRECT GERELATEERD zijn aan de artikel CONTEXT - gebruik de hoofd secties en paragrafen!
2. Gebruik CONCRETE, visuele details die je LETTERLIJK zou kunnen fotograferen
3. Focus op REALISTISCHE, professionele fotografische beelden - GEEN abstracte concepten
4. Denk aan: Wat zou een lezer ECHT willen zien als illustratie bij deze content?
5. Gebruik het focus keyword "${articleIdea.focusKeyword}" in elk prompt waar relevant
6. Varieer de PERSPECTIEVEN: close-up, medium shot, wide shot
7. Specificeer SETTING, LIGHTING, STYLE voor elke foto

VOORBEELDEN VAN GOEDE, CONTEXT-RIJKE PROMPTS:
- Voor "waterfilter review" artikel: "Close-up shot of person filling glass with crystal clear filtered water from modern chrome kitchen faucet with under-sink water filter system visible, natural daylight, sharp focus on water stream, professional product photography"
- Voor "beste printer 2025": "Modern home office desk with color inkjet printer printing vibrant photos, white background, papers in tray, close-up of ink cartridges being installed, bright studio lighting, product review style photography"
- Voor "yoga beginners guide": "Young woman in comfortable athleisure clothing performing basic yoga stretch on blue mat in bright minimalist living room, morning sunlight through window, instructional photography angle, relaxed atmosphere"

SLECHTE VOORBEELDEN (te generiek/abstract):
- "water purification concept" ❌ (te abstract)
- "printing technology" ❌ (te vaag)
- "wellness lifestyle" ❌ (niet visueel specifiek)
- "modern office" ❌ (niet gerelateerd aan artikel content)

Analyseer de artikel context en genereer ${numImages} prompts als JSON array. 

⚠️ ELK PROMPT MOET:
- 20-35 woorden lang zijn
- Zeer specifieke visuele elementen bevatten die je LETTERLIJK zou kunnen fotograferen
- DIRECT gerelateerd zijn aan een van de hoofd secties
- Professioneel fotorealistisch zijn (geen illustraties/cartoons)
- Een duidelijke SETTING, SUBJECT en STYLE hebben

JSON format:
{
  "prompts": [
    "specific detailed prompt 1 based on section 1...",
    "specific detailed prompt 2 based on section 2...",
    "specific detailed prompt 3 based on section 3..."
  ]
}`;

      console.log('🤖 Generating intelligent image prompts with AI...');
      
      const promptResponse = await chatCompletion({
        messages: [{ role: 'user', content: promptGenerationPrompt }],
        model: 'gpt-4o', // Use GPT-4 for intelligent prompt generation
        temperature: 0.7,
        max_tokens: 800,
        trackUsage: {
          clientId: client.id,
          projectId: projectId || undefined,
          feature: 'autopilot_image_prompts',
        },
      });
      
      let imagePrompts: string[] = [];
      
      try {
        const content = promptResponse.choices[0]?.message?.content || '{}';
        const jsonMatch = content.match(/\{[\s\S]*\}/);
        
        if (jsonMatch) {
          const parsed = JSON.parse(jsonMatch[0]);
          imagePrompts = parsed.prompts || [];
        }
      } catch (parseError) {
        console.warn('⚠️ Failed to parse AI-generated prompts, using fallback');
      }
      
      // Fallback to smart default prompts if AI generation fails
      if (imagePrompts.length === 0) {
        imagePrompts = [
          `Professional high-quality photograph showing ${articleIdea.focusKeyword}, realistic detailed image, ${keywords[0] || 'main subject'} in focus, professional lighting, sharp details`,
          `Real-world example of ${articleIdea.focusKeyword} in use, ${keywords[1] || 'context'}, photorealistic style, detailed product shot, modern setting`,
          `Close-up detailed view of ${articleIdea.focusKeyword}, ${keywords[2] || 'key aspect'}, professional product photography, clean background, high resolution`,
        ];
      }
      
      console.log(`✨ Generated ${imagePrompts.length} intelligent image prompts`);
      imagePrompts.forEach((prompt, i) => console.log(`  ${i + 1}. ${prompt.substring(0, 100)}...`));
      
      console.log(`🎨 Generating ${numImages} high-quality AI images with GPT Image...`);
      
      // Generate images in parallel with GPT Image for maximum quality
      const imageGenerationPromises = imagePrompts.slice(0, numImages).map(async (prompt, index) => {
        try {
          const result = await generateImage({
            prompt: prompt + ', professional photography, high detail, sharp focus, 8k quality',
            model: 'SD_3', // 💰 Cost-optimized: $0.037 vs $0.18 for GPT-image-1
            num_images: 1,
          });
          
          if (result.success && result.images && result.images.length > 0) {
            console.log(`✅ Generated high-quality AI image ${index + 1}/${numImages}`);
            return result.images[0];
          } else {
            console.warn(`⚠️ Failed to generate AI image ${index + 1}: ${result.error}`);
            return null;
          }
        } catch (error) {
          console.error(`❌ Error generating AI image ${index + 1}:`, error);
          return null;
        }
      });
      
      const imageResults = await Promise.all(imageGenerationPromises);
      
      // Filter out null values
      generatedImageUrls.push(...imageResults.filter((url): url is string => url !== null));
      
      console.log(`✅ Successfully generated ${generatedImageUrls.length}/${numImages} high-quality AI images`);
      
    } catch (error) {
      console.error('❌ Error in AI image generation:', error);
      // Continue without images if generation fails
    }
    
    // If AI image generation failed or produced no images, fallback to Pixabay
    if (generatedImageUrls.length === 0) {
      console.log('⚠️ AI image generation failed, falling back to Pixabay...');
      
      try {
        const { getPixabayImagesForArticle } = await import('@/lib/pixabay-api');
        const subtopics = keywords.slice(0, 3);
        const searchKeywords = [articleIdea.title, ...subtopics];
        const pixabayImages = await getPixabayImagesForArticle(searchKeywords, subtopics.length);
        
        if (pixabayImages.length > 0) {
          generatedImageUrls.push(...pixabayImages);
          console.log(`✅ Fetched ${pixabayImages.length} images from Pixabay as fallback`);
        }
      } catch (error) {
        console.error('❌ Pixabay fallback also failed:', error);
      }
    }
    
    // ====== INSERT GENERATED IMAGES INTO CONTENT ======
    // Check for placeholders first to avoid duplicate insertions
    const imagePlaceholders = modifiedContent.match(/\[IMAGE-\d+\]|IMAGE_PLACEHOLDER_\d+/g) || [];
    const hasPlaceholders = imagePlaceholders.length > 0;
    
    if (generatedImageUrls.length > 0) {
      console.log(`🖼️ Inserting ${generatedImageUrls.length} unique images into content...`);
      
      // 🔥 ENSURE UNIQUE IMAGES - Remove any potential duplicates
      const uniqueImageUrls = Array.from(new Set(generatedImageUrls));
      console.log(`✅ Verified ${uniqueImageUrls.length} unique images (removed ${generatedImageUrls.length - uniqueImageUrls.length} duplicates)`);
      
      if (hasPlaceholders) {
        // If placeholders exist, use them (don't do strategic insertion)
        console.log(`🖼️ Found ${imagePlaceholders.length} image placeholders, using placeholder replacement`);
        
        // 🎯 IMPORTANT: First image is featured image, skip it for content images
        // Start from index 1 for content images to avoid using featured image
        let contentImageIndex = 1; // Start from second image (first is featured)
        
        for (let i = 0; i < imagePlaceholders.length && contentImageIndex < uniqueImageUrls.length; i++) {
          const placeholder = imagePlaceholders[i];
          const imageUrl = uniqueImageUrls[contentImageIndex];
          const altText = `${articleIdea.title} - Afbeelding ${i + 1}`;
          const imgTag = `<figure class="my-6">
  <img src="${imageUrl}" alt="${altText}" class="w-full h-auto rounded-lg shadow-md" />
  <figcaption class="text-sm text-gray-600 mt-2 text-center italic">${keywords[i] || articleIdea.focusKeyword}</figcaption>
</figure>`;
          
          // Replace only the first occurrence of this placeholder
          modifiedContent = modifiedContent.replace(placeholder, imgTag);
          contentImageIndex++; // Move to next image
        }
        
        // Remove any remaining unreplaced placeholders
        const remainingPlaceholders = imagePlaceholders.slice(contentImageIndex - 1);
        remainingPlaceholders.forEach(placeholder => {
          modifiedContent = modifiedContent.replace(placeholder, '');
        });
        
        console.log(`✅ Replaced ${contentImageIndex - 1} image placeholders with unique content images`);
        if (remainingPlaceholders.length > 0) {
          console.log(`⚠️ Removed ${remainingPlaceholders.length} extra placeholders (not enough unique images)`);
        }
      } else {
        // No placeholders, use strategic position insertion
        console.log(`🖼️ No placeholders found, using strategic position insertion`);
        
        const paragraphs = modifiedContent.match(/<p[^>]*>.*?<\/p>/gs) || [];
        
        if (paragraphs.length > 3 && uniqueImageUrls.length > 1) {
          // Calculate how many images to insert (skip first one as it's featured)
          const contentImages = uniqueImageUrls.slice(1); // Skip featured image
          const numImagesToInsert = Math.min(contentImages.length, 3); // Max 3 images in content
          
          if (numImagesToInsert > 0) {
            const insertPositions = [
              Math.floor(paragraphs.length * 0.25), // After 25% of content
              Math.floor(paragraphs.length * 0.5),  // After 50% of content
              Math.floor(paragraphs.length * 0.75), // After 75% of content
            ].slice(0, numImagesToInsert);
            
            // 🎯 CREATE UNIQUE MARKER FOR EACH INSERTION POINT
            const markerPrefix = `__IMAGE_INSERTION_MARKER_${Date.now()}_`;
            
            // First pass: Add unique markers at insertion points
            insertPositions.forEach((position, index) => {
              const targetParagraph = paragraphs[position];
              if (targetParagraph) {
                const marker = `${markerPrefix}${index}__`;
                let replaced = false;
                modifiedContent = modifiedContent.replace(targetParagraph, (match) => {
                  if (!replaced) {
                    replaced = true;
                    return match + '\n' + marker;
                  }
                  return match;
                });
              }
            });
            
            // Second pass: Replace markers with actual images (from content images, not featured)
            insertPositions.forEach((position, index) => {
              const marker = `${markerPrefix}${index}__`;
              const imageUrl = contentImages[index]; // Use content images (not featured)
              
              const altText = `${articleIdea.title} - Afbeelding ${index + 1}`;
              const imgTag = `<figure class="my-6">
  <img src="${imageUrl}" alt="${altText}" class="w-full h-auto rounded-lg shadow-md" />
  <figcaption class="text-sm text-gray-600 mt-2 text-center italic">${keywords[index] || articleIdea.focusKeyword}</figcaption>
</figure>`;
              
              // Replace the unique marker with the image
              modifiedContent = modifiedContent.replace(marker, imgTag);
            });
            
            console.log(`✅ Inserted ${insertPositions.length} unique images at strategic positions`);
          }
        }
      }
    }
    
    // Extract image URLs from HTML content (after replacement)
    console.log('🖼️ Extracting image URLs from HTML...');
    const imageUrlMatches = modifiedContent.match(/<img[^>]+src="([^">]+)"/g) || [];
    const contentImageUrls = imageUrlMatches.map(img => {
      const srcMatch = img.match(/src="([^">]+)"/);
      return srcMatch ? srcMatch[1] : '';
    }).filter(Boolean);
    console.log(`✅ Found ${contentImageUrls.length} images in content`);

    // Build complete image URLs array: featured image first, then content images
    const allImageUrls = [
      generatedImageUrls[0], // Featured image (first generated image)
      ...contentImageUrls     // Images actually in the content
    ].filter(Boolean);
    
    console.log(`✅ Total images: 1 featured + ${contentImageUrls.length} in content = ${allImageUrls.length} total`);

    // Auto-link products (automatically link product mentions in Autopilot content)
    if (project?.bolcomEnabled && project?.bolcomClientId && project?.bolcomClientSecret && project?.bolcomAffiliateId) {
      try {
        const { autoLinkProducts } = await import('@/lib/auto-link-products');
        
        const autoLinkResult = await autoLinkProducts({
          projectId: project.id,
          content: modifiedContent,
          credentials: {
            clientId: project.bolcomClientId,
            clientSecret: project.bolcomClientSecret,
            affiliateId: project.bolcomAffiliateId,
          },
        });
        
        modifiedContent = autoLinkResult.content;
        
        if (autoLinkResult.linksInserted > 0) {
          console.log(`🔗 Auto-linked ${autoLinkResult.linksInserted} products in Autopilot: ${autoLinkResult.productsLinked.join(', ')}`);
        }
      } catch (error) {
        console.error('❌ Error auto-linking products in Autopilot:', error);
      }
    }

    // ====== ADD YOUTUBE VIDEO IF ENABLED ======
    if (includeYouTube && articleIdea.title) {
      try {
        console.log('🎥 YouTube video embed enabled, searching for relevant video...');
        const { addYouTubeToContent } = await import('@/lib/youtube-search');
        
        modifiedContent = await addYouTubeToContent(
          modifiedContent,
          articleIdea.title
        );
        
        console.log('✅ YouTube video processing completed');
      } catch (error) {
        console.error('❌ Error adding YouTube video:', error);
        // Continue without YouTube video if it fails
      }
    }

    // Generate simple meta description from first paragraph
    const firstParagraph = modifiedContent.match(/<p>(.*?)<\/p>/)?.[1] || '';
    const metaDescription = firstParagraph
      .replace(/<[^>]+>/g, '')
      .substring(0, 160)
      .trim();

    // Save to SavedContent with WordPress category from project
    console.log(`💾 Saving content with category: ${project?.wordpressCategory}, thumbnailUrl: ${allImageUrls[0]}`);
    
    const savedContent = await prisma.savedContent.create({
      data: {
        clientId: client.id,
        projectId: projectId || null,
        type: 'blog',
        title: articleIdea.title,
        content: modifiedContent,
        contentHtml: modifiedContent,
        language: (settings?.language || project?.language || articleIdea.language || 'NL'), // 🌍 Multi-language support
        metaDesc: metaDescription || articleIdea.title,
        category: articleIdea.category || undefined,
        wordpressCategory: project?.wordpressCategory || undefined, // 🔥 WordPress category ID (as string)
        tags: keywords,
        keywords: keywords,
        slug: articleIdea.slug,
        wordCount: actualWordCount,
        generatorType: 'autopilot',
        thumbnailUrl: allImageUrls[0] || undefined, // 🔥 First AI-generated image as featured/thumbnail
        imageUrls: allImageUrls, // 🔥 Featured image + content images
      },
    });
    
    console.log(`✅ Content saved with ID: ${savedContent.id}, Category: ${savedContent.wordpressCategory}, Images: ${allImageUrls.length}`);

    // Also save to content library (like Writgo Writer)
    try {
      await autoSaveToLibrary({
        clientId: client.id,
        projectId: projectId || undefined,
        type: 'blog',
        title: articleIdea.title,
        content: modifiedContent,
        category: articleIdea.category || 'blog',
        tags: keywords,
      });
    } catch (error) {
      console.warn('Failed to auto-save to library:', error);
    }

    // Link content to article idea
    await prisma.articleIdea.update({
      where: { id: articleId },
      data: {
        hasContent: true,
        contentId: savedContent.id,
        status: 'completed',
        generatedAt: new Date(),
      },
    });

    // Deduct credits
    await deductCredits(
      client.id,
      requiredCredits,
      `Autopilot: ${articleIdea.title.substring(0, 50)}`,
      { model }
    );

    console.log(`💳 Deducted ${requiredCredits} credits`);
    console.log(`✅ Autopilot generation completed: ${savedContent.id}`);

    // Update job: Completed
    await updateJobProgress(autopilotJob.id, {
      status: 'completed',
      progress: 100,
      currentStep: 'Succesvol voltooid!',
      contentId: savedContent.id,
    });

    // Initialize publishing variables
    let publishedUrl = null;
    let publishError = null;

    // 🚀 PUBLISH TO WRITGOAI BLOG IF ENABLED
    // Security: Only allow for info@WritgoAI.nl and WritgoAI projects
    const isWritgoAiProject = client.email === 'info@WritgoAI.nl' && 
                              project?.websiteUrl?.includes('WritgoAI.nl');
    
    if (project?.autopilotPublishToWritgoaiBlog && isWritgoAiProject) {
      try {
        console.log('📝 Publishing to WritgoAI blog...');
        
        // Generate slug from focus keyword (short and SEO-friendly)
        let baseSlug = articleIdea.focusKeyword
          .toLowerCase()
          .replace(/[éèëê]/g, 'e')
          .replace(/[áàäâ]/g, 'a')
          .replace(/[óòöô]/g, 'o')
          .replace(/[úùüû]/g, 'u')
          .replace(/[íìïî]/g, 'i')
          .replace(/[^a-z0-9]+/g, '-')
          .replace(/^-+|-+$/g, '');
        
        // Check if slug exists and make unique with numeric suffix
        let slug = baseSlug;
        let counter = 2;
        
        while (await prisma.blogPost.findUnique({ where: { slug } })) {
          slug = `${baseSlug}-${counter}`;
          counter++;
        }
        
        // Extract excerpt from first paragraph
        const firstParagraph = modifiedContent.match(/<p>(.*?)<\/p>/)?.[1] || '';
        const excerpt = firstParagraph
          .replace(/<[^>]+>/g, '')
          .substring(0, 300)
          .trim();
        
        // Calculate reading time (200 words per minute)
        const readingTimeMinutes = Math.max(5, Math.round(actualWordCount / 200));
        
        // Create blog post
        const blogPost = await prisma.blogPost.create({
          data: {
            title: articleIdea.title,
            slug: slug,
            excerpt: excerpt || articleIdea.title,
            content: modifiedContent,
            featuredImage: allImageUrls[0] || null,
            metaTitle: articleIdea.title.substring(0, 60),
            metaDescription: (excerpt || articleIdea.title).substring(0, 155),
            focusKeyword: keywords[0] || articleIdea.title.split(' ')[0],
            category: articleIdea.category || 'AI & Content Marketing',
            tags: keywords,
            status: 'published',
            publishedAt: new Date(),
            authorName: 'WritgoAI Redactie',
            readingTimeMinutes: readingTimeMinutes,
            views: 0
          }
        });
        
        const writgoaiBlogUrl = `https://WritgoAI.nl/${slug}`;
        console.log(`✅ Published to WritgoAI blog: ${writgoaiBlogUrl}`);
        console.log(`   Blog Post ID: ${blogPost.id}`);
        
        // Update saved content with published URL
        await prisma.savedContent.update({
          where: { id: savedContent.id },
          data: {
            publishedUrl: writgoaiBlogUrl,
            publishedAt: new Date(),
          },
        });

        // Update article idea with published status
        await prisma.articleIdea.update({
          where: { id: articleId },
          data: {
            status: 'published',
            publishedAt: new Date(),
          },
        });
        
        // Set publishedUrl for job completion status
        publishedUrl = writgoaiBlogUrl;
      } catch (error) {
        console.error('❌ Failed to publish to WritgoAI blog:', error);
        // Don't fail the whole job if blog publish fails
      }
    }

    // 🚀 AUTO-PUBLISH TO WORDPRESS IF ENABLED
    // Check if auto-publish is enabled for this project
    // Skip WordPress publish for Writgo.nl (uses internal blog system)
    if (project && project.wordpressUrl && !isWritgoAiProject) {
      try {
        console.log('📤 Auto-publishing to WordPress...');
        
        // Update job: Publishing
        await updateJobProgress(autopilotJob.id, {
          status: 'publishing',
          progress: 85,
          currentStep: 'Publiceren naar WordPress...',
        });

        const { getWordPressConfig, publishToWordPress } = await import('@/lib/wordpress-publisher');

        // Get WordPress config
        const wpConfig = await getWordPressConfig({
          clientEmail: client.email!,
          projectId: projectId || undefined,
        });

        if (wpConfig) {
          // Prepare excerpt
          let excerpt = metaDescription;
          
          // Prepare WordPress categories array
          const wpCategories: number[] = [];
          
          // If project has a specific category set, use that
          if (project?.wordpressCategory) {
            const categoryId = parseInt(project.wordpressCategory, 10);
            if (!isNaN(categoryId)) {
              wpCategories.push(categoryId);
              console.log(`✅ Using WordPress category: ${categoryId}`);
            }
          } else {
            // 🤖 AI CATEGORY SELECTION: Fetch WordPress categories and let AI choose the best one
            console.log('🤖 No category set - using AI to select best WordPress category...');
            
            try {
              // Fetch all WordPress categories
              const categoriesResponse = await fetch(`${wpConfig.siteUrl}/wp-json/wp/v2/categories?per_page=100`, {
                headers: {
                  'Authorization': 'Basic ' + Buffer.from(`${wpConfig.username}:${wpConfig.applicationPassword}`).toString('base64'),
                },
              });
              
              if (categoriesResponse.ok) {
                const categories = await categoriesResponse.json();
                
                if (categories && categories.length > 0) {
                  console.log(`📋 Found ${categories.length} WordPress categories`);
                  
                  // Use AI to select the most appropriate category
                  const { chatCompletion } = await import('@/lib/aiml-api');
                  
                  const categorySelectionPrompt = `Je bent een WordPress content expert. Selecteer de meest passende categorie voor dit artikel.

ARTIKEL TITEL: ${articleIdea.title}
FOCUS KEYWORD: ${articleIdea.focusKeyword}
SECONDARY KEYWORDS: ${keywords.slice(1).join(', ')}

BESCHIKBARE WORDPRESS CATEGORIEËN:
${categories.map((cat: any) => `- ID ${cat.id}: ${cat.name}${cat.description ? ` (${cat.description})` : ''}`).join('\n')}

TAAK: Selecteer de BESTE categorie voor dit artikel. Kies de categorie die het meest relevant is voor het onderwerp.

Return ALLEEN het category ID nummer (niets anders): bijvoorbeeld "5" of "12"

Als geen enkele categorie perfect past, kies dan de meest algemene/brede categorie.`;

                  const categoryResponse = await chatCompletion({
                    messages: [{ role: 'user', content: categorySelectionPrompt }],
                    model: 'gpt-4o-mini',
                    temperature: 0.2,
                    max_tokens: 10,
                    trackUsage: {
                      clientId: client.id,
                      projectId: projectId || undefined,
                      feature: 'autopilot_category_selection',
                    },
                  });
                  
                  const selectedCategoryIdStr = categoryResponse.choices[0]?.message?.content?.trim() || '';
                  const selectedCategoryId = parseInt(selectedCategoryIdStr, 10);
                  
                  if (!isNaN(selectedCategoryId)) {
                    const selectedCategory = categories.find((cat: any) => cat.id === selectedCategoryId);
                    if (selectedCategory) {
                      wpCategories.push(selectedCategoryId);
                      console.log(`✅ AI selected WordPress category: ${selectedCategoryId} (${selectedCategory.name})`);
                      console.log(`✅ Category will be used in publish: [${selectedCategoryId}]`);
                    } else {
                      console.warn(`⚠️ AI selected invalid category ID: ${selectedCategoryId}`);
                      console.warn(`⚠️ Available categories:`, categories.map((c: any) => `${c.id}: ${c.name}`).join(', '));
                      // Gebruik de eerste category als fallback
                      if (categories.length > 0) {
                        wpCategories.push(categories[0].id);
                        console.log(`✅ Using first category as fallback: ${categories[0].id} (${categories[0].name})`);
                      }
                    }
                  } else {
                    console.warn(`⚠️ AI did not return valid category ID: "${selectedCategoryIdStr}"`);
                    // Gebruik de eerste category als fallback
                    if (categories.length > 0) {
                      wpCategories.push(categories[0].id);
                      console.log(`✅ Using first category as fallback: ${categories[0].id} (${categories[0].name})`);
                    }
                  }
                }
              } else {
                console.warn(`⚠️ Failed to fetch WordPress categories: ${categoriesResponse.status}`);
              }
            } catch (error) {
              console.error('❌ Error in AI category selection:', error);
              // Continue without category if selection fails
            }
          }
          
          console.log(`📤 Publishing to WordPress with featured image: ${allImageUrls[0]}, category: ${wpCategories}`);
          
          // Publish to WordPress WITH FEATURED IMAGE AND CATEGORY
          const publishResult = await publishToWordPress(wpConfig, {
            title: articleIdea.title,
            content: modifiedContent,
            excerpt: excerpt,
            status: 'publish',
            tags: keywords || [],
            categories: wpCategories.length > 0 ? wpCategories : undefined, // ✅ AUTO-SELECT CATEGORY
            featuredImageUrl: allImageUrls[0] || undefined, // ✅ SET FEATURED IMAGE (first AI-generated image, NOT in content)
            seoTitle: articleIdea.title,
            seoDescription: metaDescription || articleIdea.title,
            focusKeyword: articleIdea.focusKeyword,
            useGutenberg: true,
          });
          
          console.log(`✅ Published to WordPress: ${publishResult.link}`);

          publishedUrl = publishResult.link;

          // Update saved content with published URL
          await prisma.savedContent.update({
            where: { id: savedContent.id },
            data: {
              publishedUrl: publishResult.link,
              publishedAt: new Date(),
            },
          });

          // Update article idea with published status
          await prisma.articleIdea.update({
            where: { id: articleId },
            data: {
              status: 'published',
              publishedAt: new Date(),
            },
          });

          // Deduct publishing credits (small cost)
          await deductCredits(
            client.id,
            10,
            `Autopilot WordPress publicatie: ${articleIdea.title.substring(0, 50)}`
          );

          console.log(`✅ Published to WordPress: ${publishResult.link}`);
        } else {
          publishError = 'WordPress not configured';
          console.warn('⚠️ WordPress not configured, skipping auto-publish');
        }
      } catch (error: any) {
        publishError = error.message || 'Publishing failed';
        console.error('❌ Auto-publish failed:', error);
        // Don't fail the whole process if publishing fails
        // The content is still generated successfully
      }
    }

    // Update job: Completed
    await updateJobProgress(autopilotJob.id, {
      status: 'completed',
      progress: 100,
      currentStep: publishedUrl 
        ? (isWritgoAiProject ? 'Gepubliceerd naar WritgoAI Blog! ✅' : 'Gepubliceerd naar WordPress! ✅')
        : 'Content gegenereerd ✅',
      publishedUrl: publishedUrl || undefined,
    });

    return NextResponse.json({
      success: true,
      contentId: savedContent.id,
      jobId: autopilotJob.id,
      publishedUrl: publishedUrl || undefined,
      publishError: publishError || undefined,
      message: publishedUrl 
        ? (isWritgoAiProject 
            ? 'Content gegenereerd en gepubliceerd naar WritgoAI Blog!'
            : 'Content gegenereerd en gepubliceerd naar WordPress!')
        : 'Content gegenereerd',
      creditsUsed: requiredCredits + (publishedUrl ? 10 : 0),
      wordCount: actualWordCount,
      imageCount: allImageUrls.length,
    });

  } catch (error: any) {
    // Update job: Failed
    await updateJobProgress(autopilotJob.id, {
      status: 'failed',
      progress: 0,
      error: error.message || 'Generatie mislukt',
    });

    // If generation fails, revert article status
    await prisma.articleIdea.update({
      where: { id: articleId },
      data: { status: 'idea' },
    });

    console.error('❌ Autopilot generation failed:', error);
    return NextResponse.json(
      { error: error.message || 'Generatie mislukt' },
      { status: 500 }
    );
  }
}
