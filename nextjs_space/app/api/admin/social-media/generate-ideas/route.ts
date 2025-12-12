import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth-options';

export const dynamic = 'force-dynamic';
export const maxDuration = 300; // 5 minutes timeout

/**
 * POST /api/admin/social-media/generate-ideas
 * Generates social media content ideas based on website analysis
 */
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user?.email) {
      return NextResponse.json(
        { error: 'Niet geautoriseerd' },
        { status: 401 }
      );
    }

    const { 
      websiteUrl, 
      websiteAnalysis, 
      numberOfIdeas, 
      platforms 
    } = await request.json();

    if (!websiteAnalysis || !websiteAnalysis.niche) {
      return NextResponse.json(
        { error: 'Website analyse data is verplicht' },
        { status: 400 }
      );
    }

    console.log('[Social Media Ideas] Generating ideas for:', {
      website: websiteUrl,
      niche: websiteAnalysis.niche,
      ideas: numberOfIdeas,
      platforms: platforms?.join(', '),
    });

    // Generate social media content ideas
    const ideas = await generateSocialMediaIdeas(
      websiteAnalysis,
      numberOfIdeas || 20,
      platforms || ['linkedin', 'instagram', 'facebook']
    );

    console.log('[Social Media Ideas] Generated:', ideas.length, 'ideas');

    return NextResponse.json({
      success: true,
      ideas,
      totalIdeas: ideas.length,
    });
  } catch (error: any) {
    console.error('[Social Media Ideas] Error:', error);
    return NextResponse.json(
      { error: error.message || 'Content ideeën generatie mislukt' },
      { status: 500 }
    );
  }
}

/**
 * Generate social media content ideas using AI
 */
async function generateSocialMediaIdeas(
  websiteAnalysis: any,
  numberOfIdeas: number,
  platforms: string[]
): Promise<Array<{
  concept: string;
  description: string;
  platforms: string[];
  contentType: string;
  hashtags: string[];
  callToAction: string;
  postExample: string;
}>> {
  const apiKey = process.env.AIML_API_KEY;
  
  if (!apiKey) {
    throw new Error('AIML_API_KEY niet geconfigureerd');
  }

  const platformsFormatted = platforms.map(p => {
    switch (p.toLowerCase()) {
      case 'linkedin': return 'LinkedIn (professioneel, B2B, thought leadership)';
      case 'instagram': return 'Instagram (visueel, inspirerend, lifestyle)';
      case 'facebook': return 'Facebook (community, engagement, algemeen)';
      case 'twitter': return 'Twitter/X (kort, actueel, conversationeel)';
      default: return p;
    }
  }).join('\n- ');

  try {
    const response = await fetch('https://api.aimlapi.com/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'claude-sonnet-4-5',
        messages: [
          {
            role: 'system',
            content: `Je bent een expert social media content strateeg met ervaring in content marketing voor verschillende platforms.`,
          },
          {
            role: 'user',
            content: `Genereer ${numberOfIdeas} diverse social media content ideeën gebaseerd op deze bedrijfsinformatie:

NICHE/INDUSTRIE: ${websiteAnalysis.niche}
DOELGROEP: ${websiteAnalysis.targetAudience}
TONE: ${websiteAnalysis.tone}
PRODUCTEN: ${websiteAnalysis.products?.join(', ') || 'Niet specifiek'}
DIENSTEN: ${websiteAnalysis.services?.join(', ') || 'Niet specifiek'}
USP'S: ${websiteAnalysis.uniqueSellingPoints?.join(', ') || 'Niet specifiek'}

PLATFORMS (maak voor elk idee geschikt):
- ${platformsFormatted}

CONTENT TYPES (mix deze):
- Educational (tips, how-to's, uitleg)
- Promotional (product/service showcase)
- Engagement (vragen, polls, discussies)
- Behind-the-scenes (team, proces, cultuur)
- Customer stories (testimonials, reviews)
- Industry insights (trends, nieuws)
- User-generated content prompts
- Seasonal/trending content

VEREISTEN:
1. Elk idee moet UNIEK en ACTIONABLE zijn
2. Mix van verschillende content types
3. Per platform geoptimaliseerd (LinkedIn = professioneel, Instagram = visueel, etc.)
4. Inclusief relevante hashtags (5-10 per idee)
5. Duidelijke call-to-action
6. Voorbeeld post tekst (ready-to-use)

VERDELING:
- 40% Educational/Informatief
- 30% Engagement/Interactie
- 20% Promotional/Commercieel
- 10% Trendy/Seasonal

OUTPUT JSON FORMAT:
[
  {
    "concept": "Kort, catchy concept titel",
    "description": "1-2 zinnen beschrijving van het idee",
    "platforms": ["linkedin", "facebook"], // Beste platforms voor dit idee
    "contentType": "educational | promotional | engagement | behind-the-scenes | customer-story | industry-insight | ugc-prompt | seasonal",
    "hashtags": ["hashtag1", "hashtag2", ...], // 5-10 relevante hashtags ZONDER #
    "callToAction": "Duidelijke CTA (bijv: 'Download onze gratis gids', 'Volg ons voor meer tips')",
    "postExample": "Complete, ready-to-use post tekst (50-200 woorden). Schrijf natuurlijk en engaging, alsof je het echt zou posten. Gebruik emoji's waar passend."
  }
]

BELANGRIJKE TIPS:
- Denk vanuit de doelgroep: wat willen zij lezen/zien?
- Wees specifiek: geen vage concepten
- Mix korte en lange posts
- Varieer in tone: soms professioneel, soms casual
- Voeg emoji's toe waar passend (vooral voor Instagram/Facebook)
- LinkedIn: langer, thought leadership, professioneel
- Instagram: kort, visueel, emoji-rijk
- Facebook: community-gericht, conversationeel
- Twitter: kort, pakkend, actueel

Genereer ${numberOfIdeas} hoogwaardige, diverse content ideeën in JSON format.`,
          },
        ],
        temperature: 0.9, // Higher creativity for diverse ideas
        max_tokens: numberOfIdeas >= 30 ? 20000 : numberOfIdeas >= 20 ? 16000 : 12000,
      }),
    });

    if (!response.ok) {
      throw new Error(`AI API error: ${response.statusText}`);
    }

    const data = await response.json();
    const aiContent = data.choices[0]?.message?.content || '[]';
    
    console.log('[Social Media Ideas] AI response length:', aiContent.length);
    
    // Parse JSON from AI response
    let ideas: any[] = [];
    
    try {
      // Clean content (remove markdown code blocks)
      const cleanContent = aiContent
        .replace(/```json\n?/g, '')
        .replace(/```\n?/g, '')
        .trim();
      
      // Try to extract JSON array
      const jsonMatch = cleanContent.match(/\[[\s\S]*\]/);
      if (jsonMatch) {
        ideas = JSON.parse(jsonMatch[0]);
      } else {
        ideas = JSON.parse(cleanContent);
      }
      
      console.log('[Social Media Ideas] Parsed:', ideas.length, 'ideas');
    } catch (parseError) {
      console.error('[Social Media Ideas] JSON parse error:', parseError);
      throw new Error('AI retourneerde ongeldige JSON. Probeer opnieuw.');
    }

    // Validate and clean ideas
    const validIdeas = ideas.filter(idea => 
      idea.concept && 
      idea.description && 
      idea.platforms && 
      Array.isArray(idea.platforms) &&
      idea.contentType &&
      idea.postExample
    ).map(idea => ({
      ...idea,
      hashtags: idea.hashtags || [],
      callToAction: idea.callToAction || '',
    }));

    if (validIdeas.length === 0) {
      throw new Error('Geen valide content ideeën gegenereerd');
    }

    console.log('[Social Media Ideas] Valid ideas:', validIdeas.length);
    
    return validIdeas;
  } catch (error: any) {
    console.error('[Social Media Ideas] Generation error:', error);
    throw error;
  }
}
