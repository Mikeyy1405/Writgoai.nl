
/**
 * Video SEO Content Generator
 * Generates platform-specific SEO content for YouTube, TikTok, and Instagram
 */

interface VideoSEOContent {
  youtube: {
    title: string;
    description: string;
    tags: string[];
    hashtags: string[];
    timestamps: Array<{ time: string; label: string }>;
  };
  tiktok: {
    caption: string;
    hashtags: string[];
    bestPostTime: string;
    soundSuggestions: string[];
  };
  instagram: {
    caption: string;
    hashtags: string[];
    firstComment: string;
  };
}

interface GenerateSEOOptions {
  topic: string;
  script: string;
  language: 'nl' | 'en';
  platform: 'youtube' | 'tiktok' | 'instagram' | 'all';
  duration: number;
  keywords?: string[];
}

/**
 * Generate comprehensive SEO content for video
 */
export async function generateVideoSEO(options: GenerateSEOOptions): Promise<VideoSEOContent> {
  const apiKey = process.env.AIML_API_KEY;
  if (!apiKey) {
    throw new Error('AIML_API_KEY niet geconfigureerd');
  }

  const { topic, script, language, platform, duration, keywords = [] } = options;

  try {
    console.log('[Video SEO] Generating SEO content for:', platform, topic);

    const systemPrompt = `Je bent een expert in video SEO en social media marketing. 
Genereer professionele, platform-geoptimaliseerde SEO content in ${language === 'nl' ? 'Nederlands' : 'Engels'}.

BELANGRIJK:
- Gebruik relevante keywords natuurlijk
- Houd rekening met platform-specifieke best practices
- Maak titels aantrekkelijk maar niet clickbait
- Gebruik trending hashtags waar relevant
- Optimaliseer voor zoekmachines en algoritmes`;

    const userPrompt = `Genereer complete SEO content voor een ${duration} seconden video over: "${topic}"

Script samenvatting: ${script.substring(0, 500)}...

${keywords.length > 0 ? `Target keywords: ${keywords.join(', ')}` : ''}

Genereer voor ${platform === 'all' ? 'YouTube, TikTok én Instagram' : platform.toUpperCase()}:

${platform === 'youtube' || platform === 'all' ? `
YouTube:
- Titel (max 60 karakters, keyword-rijk, aantrekkelijk)
- Beschrijving (300+ woorden, SEO-geoptimaliseerd met keywords, call-to-action)
- 20 relevante tags (mix van breed en specifiek)
- 5 trending hashtags
- 4-5 timestamps met labels (verdeel de video in secties)
` : ''}

${platform === 'tiktok' || platform === 'all' ? `
TikTok:
- Caption (150 karakters, engaging hook + call-to-action)
- 15 trending hashtags (mix van niche en breed)
- Beste post tijd (gebaseerd op niche)
- 3 sound suggesties
` : ''}

${platform === 'instagram' || platform === 'all' ? `
Instagram Reels:
- Caption (engaging, met emojis, call-to-action)
- 25 relevante hashtags (groot/medium/klein bereik mix)
- First comment suggestie (voor extra engagement)
` : ''}

Formatteer als JSON met deze structuur:
{
  "youtube": { "title": "", "description": "", "tags": [], "hashtags": [], "timestamps": [{"time": "", "label": ""}] },
  "tiktok": { "caption": "", "hashtags": [], "bestPostTime": "", "soundSuggestions": [] },
  "instagram": { "caption": "", "hashtags": [], "firstComment": "" }
}`;

    const response = await fetch('https://api.aimlapi.com/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        model: 'gpt-4o',
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: userPrompt },
        ],
        temperature: 0.7,
        response_format: { type: 'json_object' },
      }),
    });

    if (!response.ok) {
      throw new Error('SEO generation API request failed');
    }

    const data = await response.json();
    const content = data.choices[0].message.content;
    const seoData: VideoSEOContent = JSON.parse(content);

    console.log('[Video SEO] Generated SEO content successfully');
    return seoData;
  } catch (error: any) {
    console.error('[Video SEO] Generation error:', error);
    
    // Return fallback SEO content
    return generateFallbackSEO(topic, language, duration);
  }
}

/**
 * Generate fallback SEO content if API fails
 */
function generateFallbackSEO(topic: string, language: 'nl' | 'en', duration: number): VideoSEOContent {
  const isNL = language === 'nl';

  return {
    youtube: {
      title: isNL ? `${topic} - Complete Gids` : `${topic} - Complete Guide`,
      description: isNL
        ? `In deze video leer je alles over ${topic}. Perfect voor beginners en gevorderden!\n\n🎯 In deze video:\n- Uitleg en tips\n- Praktische voorbeelden\n- Stap-voor-stap instructies\n\n💡 Vond je dit nuttig? Vergeet niet te liken en te abonneren voor meer content!\n\n#${topic.replace(/\s+/g, '')}`
        : `Learn everything about ${topic} in this comprehensive guide. Perfect for beginners and advanced users!\n\n🎯 In this video:\n- Tips and explanations\n- Practical examples\n- Step-by-step guide\n\n💡 Found this helpful? Don't forget to like and subscribe!\n\n#${topic.replace(/\s+/g, '')}`,
      tags: [
        topic,
        `${topic} ${isNL ? 'tutorial' : 'guide'}`,
        `${topic} ${isNL ? 'tips' : 'tips'}`,
        `${topic} ${duration} ${isNL ? 'seconden' : 'seconds'}`,
        isNL ? 'tutorial nederlands' : 'tutorial',
        isNL ? 'shorts nederlands' : 'shorts',
      ],
      hashtags: ['#Shorts', '#Tutorial', `#${topic.replace(/\s+/g, '')}`],
      timestamps: [
        { time: '0:00', label: isNL ? 'Intro' : 'Intro' },
        { time: `0:${Math.floor(duration / 3)}`, label: isNL ? 'Hoofdpunten' : 'Main Points' },
        { time: `0:${Math.floor((duration * 2) / 3)}`, label: isNL ? 'Tips' : 'Tips' },
      ],
    },
    tiktok: {
      caption: isNL
        ? `✨ ${topic} in ${duration} seconden! Volg voor meer tips 👉 #fyp`
        : `✨ ${topic} in ${duration} seconds! Follow for more 👉 #fyp`,
      hashtags: [
        '#fyp',
        '#foryou',
        '#viral',
        `#${topic.replace(/\s+/g, '').toLowerCase()}`,
        '#tutorial',
        '#tips',
        isNL ? '#nederlands' : '#english',
        '#trending',
        '#2024',
        '#howto',
      ],
      bestPostTime: isNL ? 'Tussen 18:00-21:00 (beste engagement)' : 'Between 6PM-9PM (best engagement)',
      soundSuggestions: ['Trending sound', 'Upbeat music', 'Viral audio'],
    },
    instagram: {
      caption: isNL
        ? `✨ ${topic} - alles wat je moet weten!\n\n💡 Vond je dit nuttig? Vergeet niet te liken en te volgen voor meer! 👉\n\n#reels #${topic.replace(/\s+/g, '').toLowerCase()}`
        : `✨ ${topic} - everything you need to know!\n\n💡 Found this useful? Don't forget to like and follow! 👉\n\n#reels #${topic.replace(/\s+/g, '').toLowerCase()}`,
      hashtags: [
        '#reels',
        '#instagram',
        '#viral',
        `#${topic.replace(/\s+/g, '').toLowerCase()}`,
        '#tutorial',
        '#tips',
        '#howto',
        '#explore',
      ],
      firstComment: isNL
        ? '💬 Wat vond je van deze video? Laat het weten in de comments!'
        : '💬 What did you think? Let me know in the comments!',
    },
  };
}
