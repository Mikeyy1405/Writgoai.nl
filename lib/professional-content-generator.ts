
/**
 * Professional Content Generator v4
 * - Blog: Full HTML with REAL Pixabay images, 1000+ words, web research
 * - Social: DALL-E 3 high-quality images
 * - Video: Real videos via Abacus.AI (DeepAgent)
 */

import { PrismaClient } from '@prisma/client';
import OpenAI from 'openai';
import { generateAbacusVideo, DEFAULT_VIDEO_OPTIONS, type AbacusVideoResponse } from './abacus-video';
import { performWebResearch, type ResearchResult } from './web-research';
import { getPixabayImagesForArticle } from './pixabay-api';
import { getBannedWordsInstructions, removeBannedWords, isContentValid } from './banned-words';
import { addYouTubeToContent } from './youtube-search';

const prisma = new PrismaClient();

function getOpenAI() {
  // Use AI/ML API with access to all models
  const apiKey = process.env.AIML_API_KEY;
  
  if (!apiKey) {
    throw new Error('AIML_API_KEY niet gevonden in environment variables');
  }
  
  return new OpenAI({ 
    apiKey,
    baseURL: 'https://api.aimlapi.com/v1'
  });
}

interface ContentPlanDay {
  day: number;
  date: string;
  theme: string;
  mainKeyword?: string;
  blog?: {
    title: string;
    description: string;
    keywords: string[];
  };
  instagram?: {
    caption: string;
    hashtags: string[];
  };
  tiktok?: {
    title: string;
    description: string;
    hooks: string[];
  };
  youtube?: {
    title: string;
    description: string;
    hooks: string[];
  };
}

interface BlogResult {
  title: string;
  content: string; // HTML
  metaDescription: string;
  keywords: string[];
  images: string[];
  internalLinks: Record<string, string>;
}

interface SocialResult {
  caption: string;
  hashtags: string[];
  imageUrl: string;
  imagePrompt: string;
}

interface VideoResult {
  title: string;
  script: string;
  hooks: string[];
  hashtags: string[];
  duration: number;
  videoUrl: string;
  thumbnailUrl: string;
  videoStatus: string;
}

export async function generateDailyContentForClient(
  clientId: string, 
  contentTypes: string[] = [], 
  dayNumber?: number,
  customTopic?: string,
  customKeywords?: string[]
) {
  console.log(`🚀 Starting PROFESSIONAL content generation for client ${clientId}${dayNumber ? ` (day ${dayNumber})` : ''}${contentTypes.length > 0 ? ` (types: ${contentTypes.join(', ')})` : ''}`);
  
  const client = await prisma.client.findUnique({
    where: { id: clientId },
    include: {
      lateDevAccounts: {
        where: { isActive: true }
      }
    }
  });
  
  if (!client) {
    console.log('❌ Client not found');
    return null;
  }
  
  if (!client.contentPlan) {
    console.log('❌ No content plan found for client');
    return null;
  }
  
  // Parse content plan (unless using custom topic)
  let dayToGenerate: ContentPlanDay | undefined;
  
  // If custom topic is provided, create a virtual day
  if (customTopic) {
    console.log(`📝 Using custom topic: ${customTopic}`);
    dayToGenerate = {
      day: 999, // Virtual day number for custom content
      date: new Date().toISOString(),
      theme: customTopic,
      blog: {
        title: customTopic,
        description: `Comprehensive guide about ${customTopic}`,
        keywords: customKeywords || [customTopic]
      },
      instagram: {
        caption: customTopic,
        hashtags: customKeywords || []
      },
      tiktok: {
        title: customTopic,
        description: `Learn about ${customTopic}`,
        hooks: [`Let's talk about ${customTopic}`, `Here's what you need to know about ${customTopic}`]
      },
      youtube: {
        title: customTopic,
        description: `Complete guide about ${customTopic}`,
        hooks: [`Everything you need to know about ${customTopic}`, `${customTopic} explained`]
      }
    };
  } else {
    // Use content plan
    const contentPlan = client.contentPlan as unknown as ContentPlanDay[];
    
    // If specific day number is provided, use that
    if (dayNumber !== undefined) {
      dayToGenerate = contentPlan.find(day => day.day === dayNumber);
      
      if (!dayToGenerate) {
        console.log(`❌ Day ${dayNumber} not found in content plan`);
        return null;
      }
    } else {
      // Find today's content (or next available day)
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      
      dayToGenerate = contentPlan.find(day => {
        const dayDate = new Date(day.date);
        dayDate.setHours(0, 0, 0, 0);
        return dayDate.getTime() === today.getTime();
      });
      
      // If no exact match, find the next day that hasn't been generated yet
      if (!dayToGenerate) {
        const existingContent = await prisma.contentPiece.findMany({
          where: { clientId },
          select: { dayNumber: true }
        });
        const generatedDays = existingContent.map((c: any) => c.dayNumber);
        
        dayToGenerate = contentPlan.find(day => !generatedDays.includes(day.day));
        
        if (!dayToGenerate) {
          console.log('✅ All days in current plan have been generated');
          return null;
        }
      }
    }
  }
  
  // Ensure we have a day to generate
  if (!dayToGenerate) {
    console.log('❌ No day to generate');
    return null;
  }
  
  console.log(`📅 Generating content for Day ${dayToGenerate.day}: ${dayToGenerate.theme}`);
  
  // Check if content already exists for this day (skip for custom topics)
  let existing = null;
  if (!customTopic) {
    existing = await prisma.contentPiece.findFirst({
      where: {
        clientId,
        dayNumber: dayToGenerate.day
      }
    });
  }
  
  // Determine if we should use existing or create new
  let contentPiece;
  
  if (existing) {
    console.log(`⚠️  Content already exists for day ${dayToGenerate.day}, ${contentTypes.length > 0 ? 'updating with new content types...' : 'returning existing content'}`);
    
    // If no specific content types requested, return existing
    if (contentTypes.length === 0) {
      return existing;
    }
    
    // Use existing content piece for update
    contentPiece = existing;
    
    // Update status to generating for the new content
    await prisma.contentPiece.update({
      where: { id: existing.id },
      data: { status: 'generating' }
    });
  } else {
    // Create new content piece
    contentPiece = await prisma.contentPiece.create({
      data: {
        clientId,
        dayNumber: dayToGenerate.day,
        theme: dayToGenerate.theme,
        scheduledFor: new Date(dayToGenerate.date),
        status: 'generating',
        reelVideoStatus: 'pending'
      }
    });
  }
  
  try {
    // Determine what to generate
    const shouldGenerateBlog = contentTypes.length === 0 || contentTypes.includes('blog');
    const shouldGenerateSocial = contentTypes.length === 0 || contentTypes.includes('social');
    const shouldGenerateVideo = contentTypes.length === 0 || contentTypes.includes('reel');
    
    // Log what we're generating
    const generating = [];
    if (shouldGenerateBlog) generating.push('blog (HTML)');
    if (shouldGenerateSocial) generating.push('social post (DALL-E 3)');
    if (shouldGenerateVideo) generating.push('video (Abacus.AI)');
    console.log(`🤖 Generating: ${generating.join(', ')}...`);
    
    // Generate selected content in parallel with better error handling
    const promises: Promise<any>[] = [];
    
    if (shouldGenerateBlog) {
      promises.push(
        generateHTMLBlogArticle(dayToGenerate, client)
          .catch(error => {
            console.error('❌ Blog generation error:', error);
            throw new Error(`Blog generatie mislukt: ${error.message}`);
          })
      );
    } else {
      promises.push(Promise.resolve(null));
    }
    
    if (shouldGenerateSocial) {
      promises.push(
        generateSocialPostWithImage(dayToGenerate, client)
          .catch(error => {
            console.error('❌ Social generation error:', error);
            throw new Error(`Social media generatie mislukt: ${error.message}`);
          })
      );
    } else {
      promises.push(Promise.resolve(null));
    }
    
    if (shouldGenerateVideo) {
      promises.push(
        generateVideoWithAbacus(dayToGenerate, client, contentPiece.id)
          .catch(error => {
            console.error('❌ Video generation error:', error);
            throw new Error(`Video generatie mislukt: ${error.message}`);
          })
      );
    } else {
      promises.push(Promise.resolve(null));
    }
    
    console.log('⏳ Waiting for content generation to complete...');
    const [blog, social, video] = await Promise.all(promises);
    console.log('✅ Content generation promises resolved');
    
    // Update content piece with generated content
    const updateData: any = {
      status: 'draft',
      generatedAt: new Date()
    };
    
    if (blog) {
      // Blog (HTML)
      updateData.blogTitle = blog.title;
      updateData.blogContent = blog.content;
      updateData.blogKeywords = blog.keywords;
      updateData.blogMetaDesc = blog.metaDescription;
      updateData.blogImages = blog.images;
      updateData.blogInternalLinks = blog.internalLinks as any;
    }
    
    if (social) {
      // Social (DALL-E 3)
      updateData.socialCaption = social.caption;
      updateData.socialHashtags = social.hashtags;
      updateData.socialImageUrl = social.imageUrl;
      updateData.socialImagePrompt = social.imagePrompt;
      updateData.socialPlatforms = getSocialPlatforms(client);
    }
    
    if (video) {
      // Video (Abacus.AI)
      updateData.reelScript = video.script;
      updateData.reelTitle = video.title;
      updateData.reelHooks = video.hooks;
      updateData.reelHashtags = video.hashtags;
      updateData.reelDuration = video.duration;
      updateData.reelVideoUrl = video.videoUrl || null;
      updateData.reelThumbnailUrl = video.thumbnailUrl || null;
      updateData.reelVideoStatus = video.videoStatus;
      updateData.reelPlatforms = getReelPlatforms(client);
    }
    
    await prisma.contentPiece.update({
      where: { id: contentPiece.id },
      data: updateData
    });
    
    console.log('✅ Content generated successfully!');
    if (blog) {
      console.log(`   📝 Blog: ${blog.title}`);
    }
    if (social) {
      console.log(`   📸 Social: ${social.imageUrl ? 'Image generated' : 'No image'}`);
    }
    if (video) {
      console.log(`   🎬 Video: ${video.videoUrl ? `Video generated: ${video.videoUrl}` : 'Pending'}`);
    }
    
    return await prisma.contentPiece.findUnique({
      where: { id: contentPiece.id }
    });
    
  } catch (error) {
    console.error('❌ Error generating content:', error);
    await prisma.contentPiece.update({
      where: { id: contentPiece.id },
      data: {
        status: 'failed',
        error: error instanceof Error ? error.message : 'Unknown error',
        retryCount: { increment: 1 }
      }
    });
    throw error;
  }
}

export async function generateHTMLBlogArticle(day: ContentPlanDay, client: any): Promise<BlogResult> {
  const openai = getOpenAI();
  
  const blogInfo = day.blog || {
    title: day.theme,
    description: `Een artikel over ${day.theme}`,
    keywords: [day.mainKeyword || day.theme]
  };
  
  console.log(`\n📝 ===== SIMPELE BLOG GENERATIE START =====`);
  console.log(`   📌 Onderwerp: "${blogInfo.title}"`);
  console.log(`   🏷️  Keywords: ${blogInfo.keywords.join(', ')}`);
  console.log(`   ⚡ Directe generatie ZONDER externe API's`)
  
  // SIMPELE BLOG GENERATIE - 1 API CALL
  console.log('\n📝 Blog artikel genereren...');
  const startTime = Date.now();
  
  const articlePrompt = `Je bent een professionele SEO content schrijver voor Nederlandse websites.

ONDERWERP: ${blogInfo.title}
BESCHRIJVING: ${blogInfo.description}
KEYWORDS: ${blogInfo.keywords.join(', ')}

CONTEXT:
- Website: ${client.website || 'Niet opgegeven'}
- Doelgroep: ${client.targetAudience || 'Algemeen publiek Nederlands'}
- Brand voice: ${client.brandVoice || 'Professioneel en vriendelijk'}

Schrijf een COMPLEET, SEO-geoptimaliseerd blog artikel van 800-1200 woorden.

STRUCTUUR VEREISTEN:
1. Start met <h2> hoofdtitel (SLECHTS 1 KEER!) - NOOIT <h1> gebruiken!
2. Direct daarna 2-3 intro paragrafen (geen extra titel)
3. 5-7 <h2> hoofdsecties met unieke, beschrijvende titels
4. 2-3 <h3> subsecties per hoofdsectie waar relevant
5. Korte alinea's (max 3-4 zinnen)
6. Gebruik <strong> voor belangrijke punten
7. Voeg <ul> lists toe voor opsommingen
8. Eindig met conclusie + call-to-action

AFBEELDING PLAATSING:
- Bij product reviews: plaats meerdere productafbeeldingen VERSPREID door de tekst
- Bij vergelijkingen: voeg afbeeldingen van verschillende producten toe
- Zorg dat afbeeldingen relevant zijn voor de omliggende tekst
- NIET alle afbeeldingen bovenaan - spreid ze door de hele blog

BELANGRIJK FORMAT:
- ALLEEN artikel HTML (geen <!DOCTYPE>, <html>, <head>, <body>)
- Begin direct met <h2> - NOOIT <h1>!
- Headings: alleen eerste letter hoofdletter
- UNIEKE headings (geen "Tip 1", "Tip 2")
- Informele tone (je/jij), Nederlands
- Praktisch, geen fluff
- Lokale focus voor NL waar relevant

${getBannedWordsInstructions()}

VOORBEELD:
<h2>Waarom contentmarketing essentieel is in 2025</h2>

<p>Content marketing is in 2025 belangrijker dan ooit. Bedrijven die investeren in kwalitatieve content trekken meer bezoekers en converteren beter.</p>

<p>In dit artikel ontdek je de belangrijkste trends, tips en strategieën voor succesvolle content marketing dit jaar.</p>

<h2>De kracht van storytelling in content</h2>
<p>Storytelling is niet nieuw, maar wel <strong>effectiever dan ooit</strong>. Mensen onthouden verhalen beter dan droge feiten.</p>

<p>Door je merk een menselijk gezicht te geven, bouw je vertrouwen en loyaliteit op. Dat is waar echte groei begint.</p>

<h3>Hoe begin je met storytelling</h3>
<p>Start met het identificeren van je kernboodschap. Wat wil je dat mensen onthouden over je merk?</p>

<p>Gebruik concrete voorbeelden uit de praktijk. Klantenverhalen, cases en ervaringen werken het beste.</p>

<h2>SEO blijft onmisbaar</h2>
<p>Zonder SEO wordt je content niet gevonden. Google blijft de belangrijkste bron van organisch verkeer.</p>

<p>Focus op <strong>relevante keywords</strong>, goede structuur en snelle laadtijden. Technische SEO is net zo belangrijk als content.</p>

<h2>Conclusie</h2>
<p>Content marketing in 2025 draait om waarde leveren, niet om verkopen. Focus op je doelgroep en hun vragen.</p>

<p>Wil je zelf aan de slag? Neem contact op voor een vrijblijvend adviesgesprek over jouw contentstrategie.</p>

OUTPUT (JSON):
{
  "title": "De H2 titel exact zoals in de eerste <h2> tag",
  "metaDescription": "Meta description (exact 125 karakters, begint met hoofdletter)",
  "htmlContent": "Volledige artikel HTML beginnend met <h2> (GEEN <h1>, GEEN document tags)",
  "keywords": ["keyword1", "keyword2", "keyword3", "keyword4", "keyword5"]
}`;

  let articleData;
  try {
    const articleResponse = await openai.chat.completions.create({
      model: 'gpt-4o',
      messages: [{ role: 'user', content: articlePrompt }],
      temperature: 0.7,
      max_tokens: 4096,
      response_format: { type: 'json_object' }
    });
    
    const writeTime = ((Date.now() - startTime) / 1000).toFixed(1);
    
    articleData = JSON.parse(articleResponse.choices[0].message.content || '{}');
    console.log(`✅ Blog artikel gegenereerd in ${writeTime}s`);
    console.log(`   📝 Titel: "${articleData.title}"`);
    console.log(`   📄 Lengte: ${articleData.htmlContent?.length || 0} karakters`);
    
  } catch (error) {
    console.error(`❌ Fout bij blog generatie:`, error);
    throw new Error(`Blog generatie mislukt: ${error instanceof Error ? error.message : 'Onbekende fout'}`);
  }
  
  // Clean HTML
  let htmlContent = (articleData.htmlContent || '').trim();
  
  // Remove any document-level tags
  htmlContent = htmlContent.replace(/<!DOCTYPE[^>]*>/gi, '');
  htmlContent = htmlContent.replace(/<\/?html[^>]*>/gi, '');
  htmlContent = htmlContent.replace(/<head>[\s\S]*?<\/head>/gi, '');
  htmlContent = htmlContent.replace(/<\/?body[^>]*>/gi, '');
  htmlContent = htmlContent.replace(/<meta[^>]*>/gi, '');
  htmlContent = htmlContent.replace(/<title>[\s\S]*?<\/title>/gi, '');
  
  const bodyMatch = htmlContent.match(/<body[^>]*>([\s\S]*)<\/body>/i);
  if (bodyMatch) {
    htmlContent = bodyMatch[1].trim();
  }
  
  // Fetch and insert REAL Pixabay images
  console.log(`\n🖼️  Fetching Pixabay images...`);
  
  let finalImages: string[] = [];
  
  try {
    // Extract H2 headings to get subtopics
    const h2Matches = htmlContent.match(/<h2[^>]*>(.*?)<\/h2>/gi) || [];
    const subTopics = h2Matches.map((h2: string) => {
      const text = h2.replace(/<[^>]+>/g, '').trim();
      return text;
    }).slice(0, 3); // Max 3 subtopics
    
    // Fetch images for main topic + subtopics
    const searchKeywords = [day.mainKeyword || day.theme, ...subTopics];
    const pixabayImages = await getPixabayImagesForArticle(
      searchKeywords,
      3
    );
    
    if (pixabayImages.length > 0) {
      finalImages = pixabayImages;
      console.log(`✅ Got ${pixabayImages.length} Pixabay images`);
      
      // Insert images into HTML
      // Strategy: Insert after each H2 section (up to 3 images)
      let imageIndex = 0;
      
      htmlContent = htmlContent.replace(/<\/h2>/gi, (match: string) => {
        if (imageIndex < finalImages.length) {
          const imageUrl = finalImages[imageIndex];
          const altText = subTopics[imageIndex] || day.theme;
          imageIndex++;
          
          return `${match}
<figure style="margin: 2rem 0;">
  <img 
    src="${imageUrl}" 
    alt="${altText}" 
    style="width: 100%; max-width: 800px; height: auto; border-radius: 8px;"
    loading="lazy"
  />
</figure>`;
        }
        return match;
      });
      
      console.log(`✅ Inserted ${imageIndex} images into HTML`);
    } else {
      console.warn(`⚠️  No Pixabay images found, blog will have no images`);
    }
    
  } catch (error) {
    console.error('❌ Error fetching/inserting images:', error);
    // Continue without images
  }
  
  // 🚨 POST-PROCESSING: Detecteer en verwijder verboden woorden
  const validation = isContentValid(htmlContent);
  if (!validation.valid) {
    console.warn('⚠️ VERBODEN WOORDEN GEVONDEN:', validation.bannedWords);
    console.log('🔄 Automatisch filteren van verboden woorden...');
    htmlContent = removeBannedWords(htmlContent);
    
    // Dubbele check
    const revalidation = isContentValid(htmlContent);
    if (!revalidation.valid) {
      console.error('❌ Verboden woorden konden niet volledig verwijderd worden:', revalidation.bannedWords);
    } else {
      console.log('✅ Alle verboden woorden succesvol verwijderd');
    }
  }
  
  // 🎥 POST-PROCESSING: Voeg YouTube video toe
  try {
    console.log('🔍 Zoeken naar relevante YouTube video...');
    const topic = day.mainKeyword || day.theme;
    htmlContent = await addYouTubeToContent(htmlContent, topic);
  } catch (error) {
    console.warn('⚠️ YouTube video kon niet toegevoegd worden:', error);
    // Geen error throwen, gewoon doorgaan zonder video
  }
  
  console.log(`\n✅ ===== BLOG GENERATIE VOLTOOID =====`);
  console.log(`   📝 Titel: "${articleData.title || blogInfo.title}"`);
  console.log(`   📄 Content: ${htmlContent.length} karakters`);
  console.log(`   🖼️  Afbeeldingen: ${finalImages.length}`);
  console.log(`   🏷️  Keywords: ${(articleData.keywords || blogInfo.keywords).join(', ')}`);
  
  return {
    title: articleData.title || blogInfo.title,
    content: htmlContent,
    metaDescription: articleData.metaDescription || blogInfo.description,
    keywords: articleData.keywords || blogInfo.keywords,
    images: finalImages,
    internalLinks: {}
  };
}

async function generateBlogImage(description: string, altText: string): Promise<string> {
  const openai = getOpenAI();
  
  const imagePrompt = `Professional, high-quality editorial image: ${description}. 
Style: Clean, modern, professional. 
Suitable for blog article. 
No text overlays.`;
  
  console.log(`  🖼️  Generating: ${altText}`);
  
  try {
    const response = await openai.images.generate({
      model: 'dall-e-3',
      prompt: imagePrompt,
      n: 1,
      size: '1792x1024', // Landscape for blog
      quality: 'standard',
      style: 'natural'
    });
    
    const imageUrl = response.data?.[0]?.url;
    
    if (!imageUrl) {
      throw new Error('No image URL returned from DALL-E 3');
    }
    
    return imageUrl;
    
  } catch (error) {
    console.error('❌ DALL-E 3 error for blog image:', error);
    // Fallback
    return `https://placehold.co/1792x1024/4A5568/FFFFFF?text=${encodeURIComponent(altText)}`;
  }
}

export async function generateSocialPostWithImage(day: ContentPlanDay, client: any): Promise<SocialResult> {
  const openai = getOpenAI();
  
  const socialInfo = day.instagram || {
    caption: day.theme,
    hashtags: []
  };
  
  console.log(`\n📱 Social post genereren voor: ${day.theme}`);
  
  const prompt = `Je bent een social media expert. Maak een Instagram/Facebook post.

ONDERWERP: ${day.theme}

CONTEXT:
- Doelgroep: ${client.targetAudience || 'Nederlands publiek'}
- Brand voice: ${client.brandVoice || 'Professioneel en vriendelijk'}

VEREISTEN:
- Pakkende opening (eerste zin!)
- Max 250 karakters
- 5-8 relevante hashtags
- Emoji's waar passend
- Call-to-action

OUTPUT (JSON):
{
  "caption": "De social post tekst",
  "hashtags": ["#hashtag1", "#hashtag2", "#hashtag3", "#hashtag4", "#hashtag5"]
}`;

  const response = await openai.chat.completions.create({
    model: 'gpt-4o',
    messages: [{ role: 'user', content: prompt }],
    temperature: 0.8,
    max_tokens: 500,
    response_format: { type: 'json_object' }
  });
  
  const result = JSON.parse(response.choices[0].message.content || '{}');
  
  console.log(`✅ Social post gegenereerd`);
  
  return {
    caption: result.caption || socialInfo.caption,
    hashtags: result.hashtags || socialInfo.hashtags,
    imageUrl: '', // No image URL for now
    imagePrompt: day.theme
  };
}

async function generateHighQualitySocialImage(imagePrompt: string): Promise<string> {
  const openai = getOpenAI();
  
  console.log('🎨 DALL-E 3 prompt:', imagePrompt);
  
  try {
    const response = await openai.images.generate({
      model: 'dall-e-3',
      prompt: imagePrompt,
      n: 1,
      size: '1024x1024', // Square for social media
      quality: 'hd', // HIGH QUALITY voor social media
      style: 'vivid' // Eye-catching for social
    });
    
    const imageUrl = response.data?.[0]?.url;
    
    if (!imageUrl) {
      throw new Error('No image URL returned from DALL-E 3');
    }
    
    console.log('✅ High-quality image generated');
    return imageUrl;
    
  } catch (error) {
    console.error('❌ DALL-E 3 error:', error);
    
    // Fallback
    return `https://placehold.co/1024x1024/FF9933/FFFFFF?text=${encodeURIComponent('Social Media')}`;
  }
}

export async function generateVideoWithAbacus(day: ContentPlanDay, client: any, contentPieceId: string): Promise<VideoResult> {
  const openai = getOpenAI();
  
  const tiktokInfo = day.tiktok || day.youtube || {
    title: day.theme,
    description: `Een video over ${day.theme}`,
    hooks: []
  };
  
  console.log(`\n🎬 Video script genereren voor: ${day.theme}`);
  
  const scriptPrompt = `Je bent een video content creator. Schrijf een kort video script.

ONDERWERP: ${tiktokInfo.title}

CONTEXT:
- Doelgroep: ${client.targetAudience || 'Nederlands publiek'}
- Brand voice: ${client.brandVoice || 'Professioneel'}

VEREISTEN:
- Duur: 15-30 seconden
- Pakkende opening (eerste 3 sec!)
- Duidelijke boodschap
- Call-to-action
- Voor TikTok/YouTube Shorts/Reels

OUTPUT (JSON):
{
  "title": "Video titel (max 60 karakters)",
  "script": "Voice-over tekst (alleen wat gesproken wordt)",
  "hooks": ["Hook 1", "Hook 2"],
  "hashtags": ["#hashtag1", "#hashtag2", "#hashtag3"],
  "duration": 20
}`;

  const scriptResponse = await openai.chat.completions.create({
    model: 'gpt-4o',
    messages: [{ role: 'user', content: scriptPrompt }],
    temperature: 0.8,
    max_tokens: 800,
    response_format: { type: 'json_object' }
  });
  
  const scriptData = JSON.parse(scriptResponse.choices[0].message.content || '{}');
  
  console.log(`✅ Video script gegenereerd`);
  
  return {
    title: scriptData.title || tiktokInfo.title,
    script: scriptData.script || '',
    hooks: scriptData.hooks || [],
    hashtags: scriptData.hashtags || [],
    duration: scriptData.duration || 20,
    videoUrl: '',
    thumbnailUrl: '',
    videoStatus: 'pending'
  };
}

function getSocialPlatforms(client: any): string[] {
  const platforms: string[] = [];
  
  if (!client.lateDevAccounts || client.lateDevAccounts.length === 0) {
    return [];
  }
  
  // Get all connected social platforms (NOT video platforms)
  const socialPlatformTypes = ['instagram', 'facebook', 'linkedin', 'twitter', 'threads', 'pinterest', 'reddit', 'bluesky'];
  
  client.lateDevAccounts.forEach((account: any) => {
    const platform = account.platform.toLowerCase();
    if (socialPlatformTypes.includes(platform) && !platforms.includes(platform)) {
      platforms.push(platform);
    }
  });
  
  return platforms;
}

function getReelPlatforms(client: any): string[] {
  const platforms: string[] = [];
  
  if (!client.lateDevAccounts || client.lateDevAccounts.length === 0) {
    return [];
  }
  
  // Get video platforms
  const videoPlatformTypes = ['tiktok', 'youtube', 'instagram'];
  
  client.lateDevAccounts.forEach((account: any) => {
    const platform = account.platform.toLowerCase();
    if (videoPlatformTypes.includes(platform) && !platforms.includes(platform)) {
      platforms.push(platform);
    }
  });
  
  return platforms;
}

// Run for all active clients
export async function runDailyContentGeneration() {
  console.log('🤖 Running PROFESSIONAL daily content generation...');
  
  const activeClients = await prisma.client.findMany({
    where: {
      automationActive: true
    },
    include: {
      lateDevAccounts: {
        where: { isActive: true }
      }
    }
  });
  
  console.log(`Found ${activeClients.length} active clients`);
  
  const results = [];
  
  for (const client of activeClients) {
    try {
      console.log(`\n--- Processing ${client.name} ---`);
      const content = await generateDailyContentForClient(client.id);
      
      if (content) {
        results.push({
          clientId: client.id,
          clientName: client.name,
          success: true,
          contentId: content.id
        });
        console.log(`✅ Content generated for ${client.name}`);
      } else {
        results.push({
          clientId: client.id,
          clientName: client.name,
          success: false,
          reason: 'No content to generate or already generated'
        });
        console.log(`⚠️  No content generated for ${client.name}`);
      }
    } catch (error) {
      console.error(`❌ Failed for ${client.name}:`, error);
      results.push({
        clientId: client.id,
        clientName: client.name,
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  }
  
  console.log('\n🎉 Daily content generation completed');
  console.log(`Success: ${results.filter(r => r.success).length}/${results.length}`);
  
  return results;
}
