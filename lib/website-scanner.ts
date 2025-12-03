
/**
 * Website Scanner - AI-powered analysis of client websites
 * Scans website, analyzes niche, target audience, tone of voice, competitors
 */

interface WebsiteScanResult {
  websiteAnalysis: {
    name: string;
    description: string;
    targetAudience: string;
    problemStatement: string;
    solutionStatement: string;
    uniqueFeatures: string[];
    toneOfVoice: string;
    contentStyle: string[];
  };
  nicheAnalysis: {
    primaryNiche: string;
    subNiches: string[];
    keywords: string[];
    topics: string[];
  };
  competitorAnalysis: {
    competitors: Array<{
      name: string;
      url: string;
      strengths: string[];
    }>;
  };
  contentStrategy: {
    recommendedFrequency: {
      articlesPerWeek: number;
      socialsPerWeek: number;
      tiktoksPerWeek: number;
      youtubeshortsPerWeek: number;
    };
    contentPillars: string[];
    contentTypes: string[];
  };
}

export async function scanWebsite(websiteUrl: string): Promise<WebsiteScanResult> {
  try {
    console.log('Starting website scan for:', websiteUrl);
    
    // Step 1: Fetch website content with timeout and better error handling
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 10000); // 10s timeout
    
    let response;
    try {
      response = await fetch(websiteUrl, {
        headers: {
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
          'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,image/apng,*/*;q=0.8,application/signed-exchange;v=b3;q=0.7',
          'Accept-Language': 'nl-NL,nl;q=0.9,en-US;q=0.8,en;q=0.7',
          'Accept-Encoding': 'gzip, deflate, br',
          'Cache-Control': 'no-cache',
          'Pragma': 'no-cache',
          'Sec-Ch-Ua': '"Not_A Brand";v="8", "Chromium";v="120", "Google Chrome";v="120"',
          'Sec-Ch-Ua-Mobile': '?0',
          'Sec-Ch-Ua-Platform': '"Windows"',
          'Sec-Fetch-Dest': 'document',
          'Sec-Fetch-Mode': 'navigate',
          'Sec-Fetch-Site': 'none',
          'Sec-Fetch-User': '?1',
          'Upgrade-Insecure-Requests': '1',
          'Referer': 'https://www.google.com/',
        },
        redirect: 'follow',
        signal: controller.signal,
      });
      clearTimeout(timeoutId);
    } catch (err: any) {
      clearTimeout(timeoutId);
      console.error('Fetch error:', err);
      
      // Geef duidelijke error messages
      if (err.name === 'AbortError') {
        throw new Error(`Website timeout: ${websiteUrl} reageert niet binnen 10 seconden`);
      }
      throw new Error(`Kon website niet bereiken: ${err.message || 'Onbekende fout'}`);
    }

    console.log('Fetch response status:', response.status);

    if (!response.ok) {
      throw new Error(`Website retourneerde foutcode: ${response.status} ${response.statusText}`);
    }

    const html = await response.text();
    console.log('HTML content length:', html.length);
    
    // Extract text content (simple extraction)
    const textContent = extractTextFromHTML(html);
    const limitedContent = textContent.slice(0, 8000); // Limit to avoid token issues
    
    console.log('Extracted text length:', textContent.length);
    console.log('Limited content preview:', limitedContent.slice(0, 200))

    // Step 2: AI Analysis
    const analysisPrompt = `
Analyseer deze website en geef een complete scan terug in JSON formaat.

Website URL: ${websiteUrl}

Website Content:
${limitedContent}

Opdracht:
Analyseer de website grondig en bepaal:
1. Bedrijfsnaam, beschrijving, doelgroep
2. Probleem dat zij oplossen + hun unieke oplossing
3. Unieke features/voordelen (max 5)
4. Tone of voice en content stijl
5. Primaire niche + sub-niches
6. Top 25 relevante keywords voor deze niche
7. 10 content topics die perfect passen
8. Aanbevolen publicatie frequentie (realistisch)
9. Content pillars (3-5 hoofdthema's)

Geef je antwoord in dit EXACTE JSON formaat:
{
  "websiteAnalysis": {
    "name": "Bedrijfsnaam",
    "description": "Wat doet dit bedrijf (max 200 karakters)",
    "targetAudience": "Wie is de doelgroep",
    "problemStatement": "Welk probleem lossen ze op",
    "solutionStatement": "Hoe lossen ze dat op",
    "uniqueFeatures": ["Feature 1", "Feature 2", "Feature 3"],
    "toneOfVoice": "Beschrijving van tone (bijv. professional, vriendelijk, autoritair)",
    "contentStyle": ["Informatief", "Praktisch", "Educatief"]
  },
  "nicheAnalysis": {
    "primaryNiche": "Hoofdniche",
    "subNiches": ["Sub-niche 1", "Sub-niche 2", "Sub-niche 3"],
    "keywords": ["keyword1", "keyword2", "keyword3"],
    "topics": ["Topic 1", "Topic 2", "Topic 3"]
  },
  "competitorAnalysis": {
    "competitors": [
      {
        "name": "Concurrent naam",
        "url": "https://concurrent.nl",
        "strengths": ["Sterkte 1", "Sterkte 2"]
      }
    ]
  },
  "contentStrategy": {
    "recommendedFrequency": {
      "articlesPerWeek": 2,
      "socialsPerWeek": 3,
      "tiktoksPerWeek": 3,
      "youtubeshortsPerWeek": 3
    },
    "contentPillars": ["Pillar 1", "Pillar 2", "Pillar 3"],
    "contentTypes": ["How-to guides", "Tips & tricks", "Case studies"]
  }
}
`;

    const apiKey = process.env.AIML_API_KEY;
    
    if (!apiKey) {
      throw new Error('AIML_API_KEY niet gevonden in environment variables');
    }
    
    // Use AI/ML API with access to all models
    const baseURL = 'https://api.aimlapi.com/v1';
    
    console.log(`Calling AI/ML API with key:`, apiKey.substring(0, 10) + '...');
    
    const aiResponse = await fetch(`${baseURL}/chat/completions`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        model: 'gpt-4o', // Best available model for deep website analysis
        messages: [
          {
            role: 'system',
            content: 'Je bent een expert digital marketing analist die websites scant en complete content strategieën opstelt. Geef ALTIJD je antwoord in het exacte JSON formaat dat gevraagd wordt.',
          },
          {
            role: 'user',
            content: analysisPrompt,
          },
        ],
        temperature: 0.7,
        max_tokens: 8000,
        response_format: { type: "json_object" }
      }),
    }).catch(err => {
      console.error('AI API fetch error:', err);
      throw new Error(`AI API niet bereikbaar: ${err.message}`);
    });

    console.log('AI API response status:', aiResponse.status);

    if (!aiResponse.ok) {
      const errorText = await aiResponse.text();
      console.error('AI API error response:', errorText);
      throw new Error(`AI API fout: ${aiResponse.status} - ${errorText.slice(0, 200)}`);
    }

    const aiData = await aiResponse.json();
    console.log('AI response received');
    
    const aiContent = aiData.choices?.[0]?.message?.content;
    if (!aiContent) {
      console.error('Invalid AI response structure:', JSON.stringify(aiData).slice(0, 500));
      throw new Error('AI antwoord heeft geen content');
    }

    console.log('AI content preview:', aiContent.slice(0, 300));

    // Parse JSON from AI response
    // OpenAI returns direct JSON when using response_format: json_object
    console.log('Parsing JSON from AI response...');
    let result: WebsiteScanResult;
    try {
      // First try direct parsing
      result = JSON.parse(aiContent);
    } catch (directParseError) {
      console.log('Direct parse failed, trying markdown extraction...');
      // Fallback: try to extract from markdown code block
      const jsonMatch = aiContent.match(/```json\s*([\s\S]*?)\s*```/);
      if (!jsonMatch) {
        console.error('No JSON found in AI response:', aiContent.slice(0, 500));
        throw new Error('Geen JSON gevonden in AI antwoord');
      }
      try {
        result = JSON.parse(jsonMatch[1]);
      } catch (parseError) {
        console.error('JSON parse error:', parseError);
        console.error('Failed to parse:', jsonMatch[1].slice(0, 500));
        throw new Error(`JSON parsing gefaald: ${parseError instanceof Error ? parseError.message : 'Onbekend'}`);
      }
    }
    
    console.log('Website scan completed successfully');
    return result;

  } catch (error) {
    console.error('Error scanning website:', error);
    throw new Error(`Website scan failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
}

function extractTextFromHTML(html: string): string {
  // Remove scripts, styles, and comments
  let text = html
    .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, ' ')
    .replace(/<style\b[^<]*(?:(?!<\/style>)<[^<]*)*<\/style>/gi, ' ')
    .replace(/<!--[\s\S]*?-->/g, ' ')
    .replace(/<[^>]+>/g, ' ') // Remove all HTML tags
    .replace(/\s+/g, ' ') // Normalize whitespace
    .trim();

  return text;
}

export async function searchCompetitors(niche: string, primaryKeywords: string[]): Promise<any[]> {
  // Simplified competitor search using web search
  // In production, you'd use a proper SEO API like SEMrush or Ahrefs
  
  const searchQuery = `${niche} ${primaryKeywords.slice(0, 3).join(' ')} beste websites`;
  
  try {
    // Mock implementation - in production integrate with search API
    return [
      {
        name: 'Competitor 1',
        url: 'https://example1.com',
        strengths: ['Grote social media presence', 'Veel content'],
      },
      {
        name: 'Competitor 2',
        url: 'https://example2.com',
        strengths: ['Goede SEO ranking', 'Video content'],
      },
    ];
  } catch (error) {
    console.error('Error searching competitors:', error);
    return [];
  }
}
