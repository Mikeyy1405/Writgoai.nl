/**
 * AIML API Service
 * Content generation via AIML API
 */

const AIML_API_URL = 'https://api.aimlapi.com/v1/chat/completions';
const AIML_API_KEY = process.env.AIML_API_KEY;

interface BlogContentParams {
  title: string;
  outline?: string;
  niche?: string;
  targetAudience?: string;
  keywords?: string[];
  tone?: string;
}

interface SocialContentParams {
  topic: string;
  platform: string;
  niche?: string;
  tone?: string;
}

interface ContentPlanParams {
  niche: string;
  targetAudience: string;
  blogPostsPerWeek: number;
  socialPostsPerDay: number;
  contentThemes?: string[];
}

interface BlogTopic {
  title: string;
  outline: string;
  keywords: string[];
}

interface SocialTopic {
  topic: string;
  platform: string;
}

interface ContentPlanResult {
  blogTopics: BlogTopic[];
  socialTopics: SocialTopic[];
}

/**
 * Generate full blog post content
 */
export async function generateBlogContent(params: BlogContentParams): Promise<string> {
  try {
    if (!AIML_API_KEY) {
      throw new Error('AIML_API_KEY not configured');
    }

    const systemPrompt = `Je bent een professionele content writer${params.niche ? ` gespecialiseerd in ${params.niche}` : ''}. Schrijf SEO-geoptimaliseerde, informatieve en boeiende blog posts${params.targetAudience ? ` voor ${params.targetAudience}` : ''}.`;

    const userPrompt = `Schrijf een volledige blog post over: "${params.title}"

${params.outline ? `Outline:\n${params.outline}\n\n` : ''}${params.keywords && params.keywords.length > 0 ? `Keywords: ${params.keywords.join(', ')}\n\n` : ''}

Vereisten:
- Minimaal 800 woorden
- Gebruik headers (H2, H3) voor structuur
- Voeg praktische tips en voorbeelden toe
- Schrijf in een ${params.tone || 'professionele maar toegankelijke'} toon
- Optimaliseer voor SEO zonder dat het onnatuurlijk voelt
- Voeg een sterke introductie en conclusie toe
- Gebruik korte alinea's voor leesbaarheid

Formaat: Geef alleen de blog content in HTML formaat (met <h2>, <h3>, <p>, <ul>, <li> tags).`;

    const response = await fetch(AIML_API_URL, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${AIML_API_KEY}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        model: 'gpt-4o-mini',
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: userPrompt }
        ],
        max_tokens: 2500,
        temperature: 0.7
      })
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`AIML API error: ${response.statusText} - ${errorText}`);
    }

    const data = await response.json();
    return data.choices[0].message.content;
  } catch (error) {
    console.error('AIML API error:', error);
    throw error;
  }
}

/**
 * Generate social media content
 */
export async function generateSocialContent(params: SocialContentParams): Promise<{ content: string; hashtags: string[] }> {
  try {
    if (!AIML_API_KEY) {
      throw new Error('AIML_API_KEY not configured');
    }

    const platformLimits: Record<string, number> = {
      instagram: 2200,
      facebook: 500,
      twitter: 280,
      linkedin: 700
    };

    const maxLength = platformLimits[params.platform] || 500;

    const systemPrompt = `Je bent een social media content creator${params.niche ? ` gespecialiseerd in ${params.niche}` : ''}. Maak boeiende posts voor ${params.platform}.`;

    const userPrompt = `Maak een ${params.platform} post over: "${params.topic}"

Vereisten:
- Maximaal ${maxLength} karakters
- ${params.tone || 'Professioneel maar toegankelijk'}
- Voeg relevante hashtags toe (3-5 stuks)
- Maak het engaging en actionable
- Gebruik emoji's waar passend (maar niet overdreven)
- Zorg voor een sterke call-to-action

Formaat:
Content: [de post tekst]
Hashtags: [hashtag1, hashtag2, hashtag3]`;

    const response = await fetch(AIML_API_URL, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${AIML_API_KEY}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        model: 'gpt-4o-mini',
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: userPrompt }
        ],
        max_tokens: 500,
        temperature: 0.8
      })
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`AIML API error: ${response.statusText} - ${errorText}`);
    }

    const data = await response.json();
    const result = data.choices[0].message.content;

    // Parse content and hashtags
    const contentMatch = result.match(/Content:\s*(.+?)(?=Hashtags:|$)/s);
    const hashtagsMatch = result.match(/Hashtags:\s*(.+)/s);

    const content = contentMatch ? contentMatch[1].trim() : result;
    const hashtags = hashtagsMatch 
      ? hashtagsMatch[1].split(',').map((h: string) => h.trim().replace(/[\[\]]/g, ''))
      : [];

    return { content, hashtags };
  } catch (error) {
    console.error('AIML API error:', error);
    throw error;
  }
}

/**
 * Generate 30-day content plan
 */
export async function generate30DayContentPlan(params: ContentPlanParams): Promise<ContentPlanResult> {
  try {
    if (!AIML_API_KEY) {
      throw new Error('AIML_API_KEY not configured');
    }

    const systemPrompt = `Je bent een content strategie expert. Maak gedetailleerde 30-dagen contentplannen die logisch opgebouwd zijn en variatie bieden.`;

    const totalBlogs = params.blogPostsPerWeek * 4; // ~4 weken
    const totalSocial = params.socialPostsPerDay * 30;

    const userPrompt = `Maak een 30-dagen contentplan voor:
Niche: ${params.niche}
Doelgroep: ${params.targetAudience}
Blog posts: ${totalBlogs} (${params.blogPostsPerWeek} per week)
Social media posts: ${totalSocial} (${params.socialPostsPerDay} per dag)
${params.contentThemes ? `Content thema's: ${params.contentThemes.join(', ')}` : ''}

Geef een JSON response met:
{
  "blogTopics": [
    {
      "title": "Blog titel",
      "outline": "Korte outline met hoofdpunten (3-5 bullets)",
      "keywords": ["keyword1", "keyword2", "keyword3"]
    }
  ],
  "socialTopics": [
    {
      "topic": "Social media onderwerp",
      "platform": "instagram" // of facebook, linkedin, twitter
    }
  ]
}

Vereisten:
- Blog topics moeten relevant zijn voor de doelgroep
- Zorg voor variatie in onderwerpen (informatief, praktisch, inspirerend)
- Social posts moeten verschillende platforms benutten
- Balans tussen educatief en promotioneel content
- Denk aan actualiteit en seizoensgebonden onderwerpen`;

    const response = await fetch(AIML_API_URL, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${AIML_API_KEY}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        model: 'gpt-4o',
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: userPrompt }
        ],
        max_tokens: 4000,
        temperature: 0.7,
        response_format: { type: 'json_object' }
      })
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`AIML API error: ${response.statusText} - ${errorText}`);
    }

    const data = await response.json();
    const result = JSON.parse(data.choices[0].message.content);
    
    return result as ContentPlanResult;
  } catch (error) {
    console.error('AIML API error:', error);
    throw error;
  }
}
