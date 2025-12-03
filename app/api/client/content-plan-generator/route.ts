

export const dynamic = "force-dynamic";
import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth-options';
import { prisma } from '@/lib/db';

interface WebsiteScan {
  websiteAnalysis: {
    name: string;
    description: string;
    targetAudience: string;
    toneOfVoice: string;
    contentStyle: string[];
  };
  nicheAnalysis: {
    primaryNiche: string;
    subNiches: string[];
    keywords: string[];
    topics: string[];
  };
  contentStrategy: {
    contentPillars: string[];
    contentTypes: string[];
  };
}

/**
 * Generate Website Scan from URL
 */
async function scanWebsite(url: string): Promise<WebsiteScan> {
  try {
    console.log('Scanning website:', url);
    
    // Try to scrape basic info
    const response = await fetch(url, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (compatible; ContentPlanBot/1.0)',
      },
    });

    if (!response.ok) {
      throw new Error(`Failed to fetch website: ${response.status}`);
    }

    const html = await response.text();
    
    // Extract basic info
    const titleMatch = html.match(/<title>(.*?)<\/title>/i);
    const descMatch = html.match(/<meta\s+name=["']description["']\s+content=["'](.*?)["']/i);
    
    const websiteName = titleMatch ? titleMatch[1] : new URL(url).hostname;
    const description = descMatch ? descMatch[1] : '';

    // Use AI to analyze the scraped content
    const aiPrompt = `
Analyseer deze website en geef een gestructureerde analyse:

Website: ${websiteName}
URL: ${url}
Meta Description: ${description}

HTML Content (eerste 3000 karakters):
${html.substring(0, 3000)}

Geef een JSON response met:
{
  "websiteAnalysis": {
    "name": "Bedrijfsnaam",
    "description": "Korte beschrijving van wat het bedrijf doet",
    "targetAudience": "Beschrijving van de doelgroep",
    "toneOfVoice": "Professional/Casual/Friendly/etc",
    "contentStyle": ["Educatief", "Inspirerend", etc]
  },
  "nicheAnalysis": {
    "primaryNiche": "Hoofd niche",
    "subNiches": ["sub niche 1", "sub niche 2"],
    "keywords": ["keyword1", "keyword2", ... 15 keywords],
    "topics": ["topic1", "topic2", ... 10 topics]
  },
  "contentStrategy": {
    "contentPillars": ["pillar1", "pillar2", "pillar3"],
    "contentTypes": ["Blog", "Video", "Social Media", etc]
  }
}
`;

    const apiKey = process.env.AIML_API_KEY;
    if (!apiKey) {
      throw new Error('AIML_API_KEY not configured');
    }

    const aiResponse = await fetch('https://api.aimlapi.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        model: 'gpt-5-chat-latest',
        messages: [
          { role: 'system', content: 'Je bent een expert website analist die gestructureerde analyses maakt.' },
          { role: 'user', content: aiPrompt }
        ],
        temperature: 0.7,
        max_tokens: 2000,
        response_format: { type: "json_object" }
      }),
    });

    if (!aiResponse.ok) {
      throw new Error('AI analysis failed');
    }

    const aiData = await aiResponse.json();
    const analysis = JSON.parse(aiData.choices[0].message.content);
    
    return analysis as WebsiteScan;

  } catch (error) {
    console.error('Website scan failed, using fallback:', error);
    
    // Fallback analysis
    const domain = new URL(url).hostname.replace('www.', '');
    return {
      websiteAnalysis: {
        name: domain,
        description: `Website gebaseerd op ${domain}`,
        targetAudience: 'Algemeen publiek',
        toneOfVoice: 'Professional',
        contentStyle: ['Informatief', 'Educatief']
      },
      nicheAnalysis: {
        primaryNiche: domain.split('.')[0],
        subNiches: ['Algemeen', 'Tips', 'Gidsen'],
        keywords: [domain, 'tips', 'gids', 'informatie', 'advies'],
        topics: ['Algemene informatie', 'Tips en tricks', 'Best practices']
      },
      contentStrategy: {
        contentPillars: ['Educatie', 'Inspiratie', 'Community'],
        contentTypes: ['Blog', 'Video', 'Social Media']
      }
    };
  }
}

/**
 * Generate Website Scan from Keyword
 */
async function analyzeKeyword(keyword: string): Promise<WebsiteScan> {
  try {
    console.log('Analyzing keyword:', keyword);

    const apiKey = process.env.AIML_API_KEY;
    if (!apiKey) {
      throw new Error('AIML_API_KEY not configured');
    }

    const aiPrompt = `
Analyseer deze niche/keyword en maak een complete content strategie:

Niche/Keyword: "${keyword}"

Geef een JSON response met volledige strategie:
{
  "websiteAnalysis": {
    "name": "Bedrijfsnaam gebaseerd op de niche",
    "description": "Wat voor soort content/bedrijf past bij deze niche",
    "targetAudience": "Gedetailleerde doelgroep beschrijving",
    "toneOfVoice": "Passende tone (Professional/Casual/Friendly/Inspirational/etc)",
    "contentStyle": ["stijl1", "stijl2", "stijl3"]
  },
  "nicheAnalysis": {
    "primaryNiche": "Hoofd niche",
    "subNiches": ["relevante sub niche 1", "sub niche 2", "sub niche 3"],
    "keywords": ["15 relevant keywords voor deze niche"],
    "topics": ["10 content topics die passen bij deze niche"]
  },
  "contentStrategy": {
    "contentPillars": ["pillar1", "pillar2", "pillar3", "pillar4"],
    "contentTypes": ["Content types die passen bij deze niche"]
  }
}
`;

    const aiResponse = await fetch('https://api.aimlapi.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        model: 'gpt-5-chat-latest',
        messages: [
          { role: 'system', content: 'Je bent een expert content strategist die uitgebreide niche analyses maakt.' },
          { role: 'user', content: aiPrompt }
        ],
        temperature: 0.8,
        max_tokens: 2000,
        response_format: { type: "json_object" }
      }),
    });

    if (!aiResponse.ok) {
      throw new Error('AI analysis failed');
    }

    const aiData = await aiResponse.json();
    const analysis = JSON.parse(aiData.choices[0].message.content);
    
    return analysis as WebsiteScan;

  } catch (error) {
    console.error('Keyword analysis failed:', error);
    throw error;
  }
}

/**
 * Generate Content Plan
 */
async function generateContentPlan(websiteScan: WebsiteScan, days: number): Promise<any[]> {
  try {
    console.log('Generating content plan for', days, 'days...');

    const apiKey = process.env.AIML_API_KEY;
    if (!apiKey) {
      throw new Error('AIML_API_KEY not configured');
    }

    const prompt = `
Je bent een expert content strategist die gepersonaliseerde contentplannen maakt.

**Bedrijf Info:**
- Naam: ${websiteScan.websiteAnalysis.name}
- Niche: ${websiteScan.nicheAnalysis.primaryNiche}
- Doelgroep: ${websiteScan.websiteAnalysis.targetAudience}
- Tone of voice: ${websiteScan.websiteAnalysis.toneOfVoice}
- Content pillars: ${websiteScan.contentStrategy.contentPillars.join(', ')}

**Keywords (top 15):**
${websiteScan.nicheAnalysis.keywords.slice(0, 15).join(', ')}

**Topics:**
${websiteScan.nicheAnalysis.topics.join(', ')}

**Opdracht:**
Genereer een ${days}-daags contentplan met DAGELIJKSE content voor:
- 1 Blog artikel (800-1200 woorden)
- 1 Instagram post
- 1 TikTok video
- 1 YouTube Short

**Belangrijke vereisten:**
1. Elk dagthema moet uniek en relevant zijn
2. Alle content moet aangesloten zijn op het hoofdthema van die dag
3. Gebruik verschillende keywords en topics door het plan heen
4. Blog titels moeten SEO-geoptimaliseerd zijn
5. Social media content moet engaging en actionable zijn
6. TikTok en YouTube moeten virale potentie hebben
7. Alle content moet in het Nederlands zijn
8. Tone of voice moet consistent zijn: ${websiteScan.websiteAnalysis.toneOfVoice}

Geef je antwoord terug als een JSON object met een "contentPlan" array:

{
  "contentPlan": [
    {
      "day": 1,
      "date": "${new Date().toISOString().split('T')[0]}",
      "theme": "Overkoepelend thema",
      "mainKeyword": "Hoofdkeyword",
      "blog": {
        "title": "SEO titel (55 karakters)",
        "description": "Beschrijving (150-160 karakters)",
        "keywords": ["kw1", "kw2", "kw3"],
        "outline": ["Inleiding", "H2: Punt 1", "H2: Punt 2", "Conclusie"]
      },
      "instagram": {
        "caption": "Caption met emoji's (220 chars)",
        "hashtags": ["#tag1", "#tag2", "#tag3", "#tag4", "#tag5"],
        "imageIdea": "Beschrijving ideale afbeelding"
      },
      "tiktok": {
        "title": "TikTok titel (100 chars)",
        "description": "Beschrijving (150 chars)",
        "hooks": ["Hook 1", "Hook 2", "Hook 3"],
        "hashtags": ["#tag1", "#tag2", "#tag3", "#tag4"]
      },
      "youtube": {
        "title": "YouTube titel (70 chars)",
        "description": "Video beschrijving",
        "thumbnail": "Thumbnail beschrijving",
        "hooks": ["Hook 1", "Hook 2", "Hook 3"]
      }
    }
  ]
}

Genereer EXACT ${days} dagen met volledige content.
`;

    const aiResponse = await fetch('https://api.aimlapi.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        model: 'gpt-5-chat-latest',
        messages: [
          { role: 'system', content: 'Je bent een expert content strategist.' },
          { role: 'user', content: prompt }
        ],
        temperature: 0.8,
        max_tokens: 16000,
        response_format: { type: "json_object" }
      }),
    });

    if (!aiResponse.ok) {
      const errorText = await aiResponse.text();
      throw new Error(`AI API error: ${aiResponse.status} - ${errorText}`);
    }

    const aiData = await aiResponse.json();
    const result = JSON.parse(aiData.choices[0].message.content);
    
    let contentPlan = result.contentPlan || result;
    if (!Array.isArray(contentPlan)) {
      contentPlan = [contentPlan];
    }

    // Add dates
    const today = new Date();
    contentPlan.forEach((day: any, index: number) => {
      const date = new Date(today);
      date.setDate(date.getDate() + index);
      day.date = date.toISOString().split('T')[0];
      day.day = index + 1;
    });

    return contentPlan;

  } catch (error) {
    console.error('Content plan generation failed:', error);
    throw error;
  }
}

/**
 * POST - Generate Content Plan
 */
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.email) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { mode, url, keyword, days = 7 } = body;

    let websiteScan: WebsiteScan;

    if (mode === 'url-based') {
      if (!url) {
        return NextResponse.json({ error: 'URL is required' }, { status: 400 });
      }
      websiteScan = await scanWebsite(url);
    } else if (mode === 'keyword-based') {
      if (!keyword) {
        return NextResponse.json({ error: 'Keyword is required' }, { status: 400 });
      }
      websiteScan = await analyzeKeyword(keyword);
    } else {
      return NextResponse.json({ error: 'Invalid mode' }, { status: 400 });
    }

    const contentPlan = await generateContentPlan(websiteScan, days);

    return NextResponse.json({
      success: true,
      contentPlan,
      websiteScan
    });

  } catch (error: any) {
    console.error('Error generating content plan:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to generate content plan' },
      { status: 500 }
    );
  }
}
