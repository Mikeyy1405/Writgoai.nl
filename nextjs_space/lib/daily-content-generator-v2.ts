
// Nieuwe dagelijkse content generator met DALL-E 3 afbeeldingen
// Genereert: 1 blog + 1 social post + 1 reel script per dag

import OpenAI from 'openai';


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

export async function generateDailyContentForClient(clientId: string) {
  console.log(`🚀 Starting content generation for client ${clientId}`);
  
  const client = await prisma.client.findUnique({
    where: { id: clientId },
    include: {
      lateDevAccounts: {
        where: { isActive: true }
      }
    }
  });
  
  if (!client || !client.automationActive) {
    console.log('❌ Client not found or automation not active');
    return null;
  }
  
  if (!client.contentPlan) {
    console.log('❌ No content plan found for client');
    return null;
  }
  
  // Parse content plan
  const contentPlan = client.contentPlan as unknown as ContentPlanDay[];
  
  // Find today's content (or next available day)
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  
  let dayToGenerate = contentPlan.find(day => {
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
  
  console.log(`📅 Generating content for Day ${dayToGenerate.day}: ${dayToGenerate.theme}`);
  
  // Check if already generated
  const existing = await prisma.contentPiece.findFirst({
    where: {
      clientId,
      dayNumber: dayToGenerate.day
    }
  });
  
  if (existing) {
    console.log('⚠️  Content already exists for this day');
    return existing;
  }
  
  // Create content piece
  const contentPiece = await prisma.contentPiece.create({
    data: {
      clientId,
      dayNumber: dayToGenerate.day,
      theme: dayToGenerate.theme,
      scheduledFor: new Date(dayToGenerate.date),
      status: 'generating'
    }
  });
  
  try {
    // Generate all content in parallel
    console.log('🤖 Generating blog, social post, and reel...');
    
    const [blog, social, reel] = await Promise.all([
      generateBlogArticle(dayToGenerate, client),
      generateSocialPost(dayToGenerate, client),
      generateReelScript(dayToGenerate, client)
    ]);
    
    // Generate image for social post with DALL-E 3
    console.log('🎨 Generating image with DALL-E 3...');
    const socialImage = await generateSocialImage(dayToGenerate.theme, social.imagePrompt);
    
    // Update content piece
    await prisma.contentPiece.update({
      where: { id: contentPiece.id },
      data: {
        // Blog
        blogTitle: blog.title,
        blogContent: blog.content,
        blogKeywords: blog.keywords,
        blogMetaDesc: blog.metaDescription,
        
        // Social
        socialCaption: social.caption,
        socialHashtags: social.hashtags,
        socialImageUrl: socialImage.url,
        socialImagePrompt: socialImage.prompt,
        socialPlatforms: getSocialPlatforms(client),
        
        // Reel
        reelScript: reel.script,
        reelTitle: reel.title,
        reelHooks: reel.hooks,
        reelHashtags: reel.hashtags,
        reelDuration: reel.duration,
        reelPlatforms: getReelPlatforms(client),
        
        // Status
        status: 'draft',
        generatedAt: new Date()
      }
    });
    
    console.log('✅ Content generated successfully!');
    
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

async function generateBlogArticle(day: ContentPlanDay, client: any) {
  const openai = getOpenAI();
  
  const blogInfo = day.blog || {
    title: day.theme,
    description: `Een artikel over ${day.theme}`,
    keywords: [day.mainKeyword || day.theme]
  };
  
  const prompt = `Je bent een professionele content schrijver. Schrijf een uitgebreid en boeiend blog artikel.

ONDERWERP: ${blogInfo.title}
BESCHRIJVING: ${blogInfo.description}
KEYWORDS: ${blogInfo.keywords.join(', ')}

CONTEXT:
- Website: ${client.website || 'Niet opgegeven'}
- Doelgroep: ${client.targetAudience || 'Algemeen publiek'}
- Brand voice: ${client.brandVoice || 'Professioneel en vriendelijk'}
- Extra keywords: ${client.keywords?.join(', ') || 'Geen'}

VEREISTEN:
- Minimaal 800 woorden, liefst 1000-1500 woorden
- SEO geoptimaliseerd met goede use van keywords (niet overdrijven!)
- Duidelijke structuur met H2 en H3 kopjes (gebruik ## en ### markdown)
- Introductie, meerdere secties met praktische informatie, en conclusie
- Gebruik bullet points en genummerde lijsten waar nuttig
- Schrijf in een natuurlijke, vlotte stijl
- Voeg praktische tips en voorbeelden toe
- Eindig met een call-to-action

OUTPUT FORMAT (JSON):
{
  "title": "SEO-geoptimaliseerde titel",
  "metaDescription": "Meta description (exact 125 karakters, begint met hoofdletter)",
  "content": "Volledige artikel content in Markdown format",
  "keywords": ["keyword1", "keyword2", "keyword3"]
}`;

  const response = await openai.chat.completions.create({
    model: 'gpt-4o',
    messages: [{ role: 'user', content: prompt }],
    temperature: 0.7,
    max_tokens: 4000,
    response_format: { type: 'json_object' }
  });
  
  const result = JSON.parse(response.choices[0].message.content || '{}');
  
  return {
    title: result.title || blogInfo.title,
    content: result.content || '',
    metaDescription: result.metaDescription || blogInfo.description,
    keywords: result.keywords || blogInfo.keywords
  };
}

async function generateSocialPost(day: ContentPlanDay, client: any) {
  const openai = getOpenAI();
  
  const socialInfo = day.instagram || {
    caption: day.theme,
    hashtags: []
  };
  
  const prompt = `Je bent een social media expert. Maak een boeiende Instagram/Facebook post.

ONDERWERP: ${day.theme}
BASIS CAPTION: ${socialInfo.caption}

CONTEXT:
- Doelgroep: ${client.targetAudience || 'Algemeen publiek'}
- Brand voice: ${client.brandVoice || 'Professioneel en vriendelijk'}

VEREISTEN:
- Pakkende opening (eerste zin moet aandacht trekken!)
- Max 300 karakters voor de caption (Instagram best practice)
- 7-10 relevante hashtags
- Call-to-action aan het einde
- Emoji's gebruiken waar passend (niet overdrijven!)
- Geschikt voor Instagram, Facebook, LinkedIn

PROMPT VOOR AFBEELDING:
- Beschrijf een visueel aantrekkelijke afbeelding die past bij het onderwerp
- Denk aan: stijl, kleuren, compositie, mood
- Geschikt voor social media (vierkant formaat, opvallend)

OUTPUT FORMAT (JSON):
{
  "caption": "De social media post text",
  "hashtags": ["#hashtag1", "#hashtag2", ...],
  "imagePrompt": "Gedetailleerde beschrijving voor DALL-E 3 image generation"
}`;

  const response = await openai.chat.completions.create({
    model: 'gpt-4o',
    messages: [{ role: 'user', content: prompt }],
    temperature: 0.8,
    max_tokens: 1000,
    response_format: { type: 'json_object' }
  });
  
  const result = JSON.parse(response.choices[0].message.content || '{}');
  
  return {
    caption: result.caption || socialInfo.caption,
    hashtags: result.hashtags || socialInfo.hashtags,
    imagePrompt: result.imagePrompt || `Professional image about ${day.theme}`
  };
}

async function generateReelScript(day: ContentPlanDay, client: any) {
  const openai = getOpenAI();
  
  const tiktokInfo = day.tiktok || day.youtube || {
    title: day.theme,
    description: `Een video over ${day.theme}`,
    hooks: []
  };
  
  const prompt = `Je bent een viral content creator. Schrijf een boeiend Reel/Short script.

ONDERWERP: ${tiktokInfo.title}
BESCHRIJVING: ${tiktokInfo.description}

CONTEXT:
- Doelgroep: ${client.targetAudience || 'Algemeen publiek'}
- Brand voice: ${client.brandVoice || 'Professioneel en vriendelijk'}

VEREISTEN:
- Duur: 30-60 seconden (90-180 woorden)
- PAKKENDE OPENING: Eerste 3 seconden zijn cruciaal! (hook)
- Duidelijke voice-over tekst
- Visuele aanwijzingen tussen [haakjes]
- Praktische informatie of entertainment value
- Sterke call-to-action aan het einde
- Geschikt voor TikTok, YouTube Shorts EN Instagram Reels

STRUCTUUR:
HOOK (0-3 sec): [Visuele instructie]
"Pakkende opening tekst..."

MIDDENSTUK (3-40 sec): [Visuele instructie]
"Inhoud met waarde..."

AFSLUITING (40-60 sec): [Visuele instructie]
"CTA en afsluiting..."

OUTPUT FORMAT (JSON):
{
  "title": "Titel voor YouTube/TikTok",
  "script": "Volledige script met visual cues",
  "hooks": ["Hook optie 1", "Hook optie 2", "Hook optie 3"],
  "hashtags": ["#hashtag1", "#hashtag2", ...],
  "duration": 45
}`;

  const response = await openai.chat.completions.create({
    model: 'gpt-4o',
    messages: [{ role: 'user', content: prompt }],
    temperature: 0.85,
    max_tokens: 1500,
    response_format: { type: 'json_object' }
  });
  
  const result = JSON.parse(response.choices[0].message.content || '{}');
  
  return {
    title: result.title || tiktokInfo.title,
    script: result.script || '',
    hooks: result.hooks || tiktokInfo.hooks || [],
    hashtags: result.hashtags || [],
    duration: result.duration || 45
  };
}

async function generateSocialImage(theme: string, imagePrompt: string) {
  const openai = getOpenAI();
  
  console.log('🎨 DALL-E 3 prompt:', imagePrompt);
  
  try {
    const response = await openai.images.generate({
      model: 'dall-e-3',
      prompt: imagePrompt,
      n: 1,
      size: '1024x1024',
      quality: 'standard',
      style: 'vivid' // or 'natural'
    });
    
    const imageUrl = response.data?.[0]?.url;
    
    if (!imageUrl) {
      throw new Error('No image URL returned from DALL-E 3');
    }
    
    console.log('✅ Image generated:', imageUrl);
    
    return {
      url: imageUrl,
      prompt: imagePrompt
    };
    
  } catch (error) {
    console.error('❌ DALL-E 3 error:', error);
    
    // Fallback: gebruik placeholder
    return {
      url: `https://placehold.co/1024x1024/FF9933/FFFFFF?text=${encodeURIComponent(theme)}`,
      prompt: imagePrompt
    };
  }
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
  console.log('🤖 Running daily content generation...');
  
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
