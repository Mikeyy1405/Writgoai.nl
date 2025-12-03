
/**
 * AI-Powered Content Plan Generator
 * Generates personalized 30-day content plan for all channels
 */

interface ContentPlanDay {
  day: number;
  date: string;
  theme: string;
  mainKeyword: string;
  blog: {
    title: string;
    description: string;
    keywords: string[];
    outline: string[];
  };
  instagram: {
    caption: string;
    hashtags: string[];
    imageIdea: string;
  };
  tiktok: {
    title: string;
    description: string;
    hooks: string[];
    hashtags: string[];
  };
  youtube: {
    title: string;
    description: string;
    thumbnail: string;
    hooks: string[];
  };
}

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

export async function generateContentPlan(
  websiteScan: WebsiteScan,
  days: number = 7
): Promise<ContentPlanDay[]> {
  try {
    console.log('Starting content plan generation for', days, 'days...');

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

**BELANGRIJKE INSTRUCTIE:**
Geef je antwoord terug als een JSON object met een "contentPlan" array. Gebruik EXACT dit formaat:

\`\`\`json
{
  "contentPlan": [
    {
    "day": 1,
    "date": "${new Date().toISOString().split('T')[0]}",
    "theme": "Overkoepelend thema voor deze dag",
    "mainKeyword": "Hoofdkeyword voor deze dag",
    "blog": {
      "title": "SEO-geoptimaliseerde blog titel (exact 55 karakters)",
      "description": "Korte beschrijving (150-160 karakters)",
      "keywords": ["keyword1", "keyword2", "keyword3"],
      "outline": [
        "Inleiding: Hook en probleem statement",
        "H2: Eerste hoofdstuk",
        "H2: Tweede hoofdstuk",
        "H2: Derde hoofdstuk",
        "Conclusie: Call to action"
      ]
    },
    "instagram": {
      "caption": "Engaging Instagram caption met emoji's (max 220 karakters)",
      "hashtags": ["#hashtag1", "#hashtag2", "#hashtag3", "#hashtag4", "#hashtag5"],
      "imageIdea": "Beschrijving van de ideale afbeelding voor deze post"
    },
    "tiktok": {
      "title": "Pakkende TikTok titel (max 100 karakters)",
      "description": "Video beschrijving (max 150 karakters)",
      "hooks": [
        "Opening hook 1 (eerste 3 seconden)",
        "Opening hook 2 alternatief",
        "Opening hook 3 alternatief"
      ],
      "hashtags": ["#hashtag1", "#hashtag2", "#hashtag3", "#hashtag4"]
    },
    "youtube": {
      "title": "Klikbare YouTube titel (max 70 karakters)",
      "description": "Video beschrijving met keywords",
      "thumbnail": "Beschrijving voor thumbnail ontwerp",
      "hooks": [
        "Opening hook 1",
        "Opening hook 2",
        "Opening hook 3"
      ]
    }
  }
  ]
}
\`\`\`

**BELANGRIJK:**
- Genereer EXACT ${days} dagen
- Zorg dat elk element volledig en nuttig is
- Geen placeholders of "TODO" items
- Alle content moet direct bruikbaar zijn
- Varieer in onderwerpen en keywords
- Zorg voor een goede mix van content types (how-to, tips, case studies, etc.)
`;

    const apiKey = process.env.AIML_API_KEY;
    
    if (!apiKey) {
      throw new Error('AIML_API_KEY niet gevonden in environment variables');
    }
    
    // Use AI/ML API with access to all models
    const baseURL = 'https://api.aimlapi.com/v1';
    
    console.log(`Calling AI/ML API for content plan generation...`);

    const response = await fetch(`${baseURL}/chat/completions`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        model: 'gpt-5-chat-latest', // Beste model voor strategische content planning
        messages: [
          {
            role: 'system',
            content: 'Je bent een expert content strategist die uitgebreide, gepersonaliseerde contentplannen maakt voor bedrijven.',
          },
          {
            role: 'user',
            content: prompt,
          },
        ],
        temperature: 0.8,
        max_tokens: 16000,
        response_format: { type: "json_object" }
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`AI API error: ${response.status} - ${errorText}`);
    }

    const data = await response.json();
    const content = data.choices[0].message.content;

    console.log('AI response received, parsing...');

    // Parse JSON from OpenAI response (with json_object format, it returns direct JSON)
    let contentPlan: ContentPlanDay[];
    try {
      // First try direct parsing
      contentPlan = JSON.parse(content);
      
      // If it's wrapped in a root object, extract the array
      if (!Array.isArray(contentPlan) && typeof contentPlan === 'object') {
        // Look for the array in the response
        const possibleArrayKeys = Object.keys(contentPlan);
        const arrayKey = possibleArrayKeys.find(key => Array.isArray((contentPlan as any)[key]));
        if (arrayKey) {
          contentPlan = (contentPlan as any)[arrayKey];
        } else {
          throw new Error('No array found in JSON response');
        }
      }
    } catch (directParseError) {
      console.log('Direct parse failed, trying markdown extraction...');
      // Fallback: try to extract from markdown code block
      const jsonMatch = content.match(/```json\s*([\s\S]*?)\s*```/);
      if (!jsonMatch) {
        console.error('No JSON found in AI response:', content.substring(0, 500));
        throw new Error('No valid JSON found in AI response');
      }
      try {
        contentPlan = JSON.parse(jsonMatch[1]);
      } catch (parseError) {
        console.error('JSON parse error:', parseError);
        throw new Error(`JSON parsing gefaald: ${parseError instanceof Error ? parseError.message : 'Onbekend'}`);
      }
    }

    // Add dates to each day
    const today = new Date();
    contentPlan.forEach((day, index) => {
      const date = new Date(today);
      date.setDate(date.getDate() + index);
      day.date = date.toISOString().split('T')[0];
      day.day = index + 1;
    });

    console.log(`Content plan generated successfully: ${contentPlan.length} days`);

    return contentPlan;

  } catch (error) {
    console.error('Error generating content plan:', error);
    throw new Error(`Content plan generation failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
}

/**
 * Generate a single day's content based on theme
 */
export async function generateSingleDayContent(
  theme: string,
  websiteScan: WebsiteScan
): Promise<ContentPlanDay> {
  const fullPlan = await generateContentPlan(websiteScan, 1);
  return fullPlan[0];
}
