import { NextRequest, NextResponse } from 'next/server';
import { getAuthenticatedClient, isAuthError } from '@/lib/auth-helpers';
import { prisma } from '@/lib/db';

export const dynamic = 'force-dynamic';
export const maxDuration = 60; // 60 seconds timeout

// AI Scan - Automatically analyze website and fill profile
export async function POST(request: NextRequest) {
  let fetchError: string | null = null;
  
  try {
    const auth = await getAuthenticatedClient();
    
    if (isAuthError(auth)) {
      return NextResponse.json(
        { error: auth.error }, 
        { status: auth.status }
      );
    }

    // Use client.id (from Client table), NOT session.user.id
    const clientId = auth.client.id;

    const { websiteUrl } = await request.json();

    if (!websiteUrl) {
      return NextResponse.json(
        { error: 'Website URL is required' },
        { status: 400 }
      );
    }

    // Fetch the website content
    let websiteContent = '';
    try {
      console.log('[AI Scan] Fetching website:', websiteUrl);
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 15000); // 15 second timeout
      
      const response = await fetch(websiteUrl, {
        headers: {
          'User-Agent': 'Mozilla/5.0 (compatible; WritgoAI/1.0)',
        },
        signal: controller.signal,
      });
      
      clearTimeout(timeoutId);
      console.log('[AI Scan] Fetch response status:', response.status);
      
      if (response.ok) {
        websiteContent = await response.text();
        console.log('[AI Scan] Fetched content length:', websiteContent.length);
        // Extract text from HTML (simple extraction)
        websiteContent = websiteContent
          .replace(/<script[^>]*>.*?<\/script>/gis, '')
          .replace(/<style[^>]*>.*?<\/style>/gis, '')
          .replace(/<[^>]+>/g, ' ')
          .replace(/\s+/g, ' ')
          .trim()
          .substring(0, 10000); // Limit to first 10k chars
      } else {
        fetchError = `HTTP ${response.status}: ${response.statusText}`;
        console.error('[AI Scan] Failed to fetch website:', fetchError);
      }
    } catch (error) {
      fetchError = error instanceof Error ? error.message : 'Unknown fetch error';
      console.error('[AI Scan] Error fetching website:', error);
    }

    // Use AI to analyze the website with complete freedom
    const analysisPrompt = `
Je bent een expert in bedrijfsanalyse, marketing en content strategie. Analyseer de volgende website VOLLEDIG en verzamel ALLE relevante informatie die nuttig is voor contentcreatie.

Website URL: ${websiteUrl}
${websiteContent ? `Website Content (eerste 10.000 karakters):\n${websiteContent}` : `OPMERKING: Website content kon niet worden opgehaald${fetchError ? ` (Reden: ${fetchError})` : ''}. Doe je best om een analyse te maken op basis van de URL alleen, en geef algemene, nuttige aanbevelingen.`}

Maak een UITGEBREIDE en VRIJE analyse van deze website. Verzamel zo veel mogelijk informatie over:

1. **Bedrijf & Merk**
   - Bedrijfsnaam en wat ze doen
   - Missie, visie en kernwaarden
   - Unieke selling points
   - Merkpersoonlijkheid
   - Merkkleur(en)

2. **Doelgroep & Markt**
   - Wie zijn hun klanten? (demographics, psychographics)
   - Welke problemen hebben ze?
   - Welke oplossingen biedt het bedrijf?
   - Marktpositie en concurrentievoordeel

3. **Content & Communicatie**
   - Tone of voice (formeel/informeel, je/u, etc.)
   - Schrijfstijl en taalgebruik
   - Belangrijke thema's en onderwerpen
   - Veelgebruikte termen en keywords
   - Content structuur

4. **Producten & Diensten**
   - Wat bieden ze aan?
   - Voor wie is elk product/dienst?
   - Prijsmodel (indien zichtbaar)
   - USPs per product/dienst

5. **Technisch & SEO**
   - Blog aanwezig? (ja/nee en URL)
   - Belangrijke pagina's
   - Call-to-actions
   - Social media links
   - Contact informatie

6. **Content Strategie Aanbevelingen**
   - Welke content topics passen bij dit bedrijf?
   - Welke vragen hebben hun klanten waarschijnlijk?
   - Welke content formats werken het beste?
   - SEO opportunities

Genereer een JSON object met alle gevonden informatie. Gebruik de volgende structuur maar VOEG VRIJ EXTRA VELDEN TOE waar nodig:

{
  "companyInfo": {
    "name": "",
    "tagline": "",
    "description": "",
    "mission": "",
    "values": [],
    "brandColors": [],
    "logo": ""
  },
  "targetAudience": {
    "primaryAudience": "",
    "demographics": "",
    "painPoints": [],
    "desires": [],
    "customerJourney": ""
  },
  "productServices": [
    {
      "name": "",
      "description": "",
      "targetGroup": "",
      "usps": []
    }
  ],
  "contentStyle": {
    "toneOfVoice": "",
    "formalityLevel": "",
    "perspective": "",
    "writingStyle": "",
    "avoidWords": [],
    "preferredWords": [],
    "emojiUsage": ""
  },
  "seoKeywords": [],
  "contentTopics": [],
  "competitors": [],
  "socialMedia": {
    "platforms": [],
    "urls": []
  },
  "technicalInfo": {
    "hasBlog": false,
    "blogUrl": "",
    "mainPages": [],
    "ctaButtons": []
  },
  "recommendations": {
    "contentIdeas": [],
    "seoOpportunities": [],
    "targetKeywords": []
  },
  "additionalNotes": ""
}

BELANGRIJK:
- Wees zo specifiek en gedetailleerd mogelijk
- Als informatie niet beschikbaar is op de website, laat het veld leeg of gebruik "Niet gevonden"
- Gebruik Nederlandse taal
- Geef ALLEEN het JSON object terug, geen extra tekst voor of na
- Wees creatief en voeg extra nuttige informatie toe die je vindt
`;

    // Call OpenAI API (using ABACUSAI_API_KEY as OpenAI client)
    const openaiApiKey = process.env.ABACUSAI_API_KEY;
    if (!openaiApiKey) {
      console.error('[AI Scan] ABACUSAI_API_KEY not configured');
      throw new Error('OpenAI API key not configured');
    }

    console.log('[AI Scan] Calling AI API...');
    let openaiResponse;
    try {
      openaiResponse = await fetch('https://apps.abacus.ai/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${openaiApiKey}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          model: 'gpt-4.1-mini',
          messages: [
            { role: 'system', content: 'Je bent een expert bedrijfsanalist die websites analyseert.' },
            { role: 'user', content: analysisPrompt }
          ],
          temperature: 0.7,
          max_tokens: 3000,
        }),
      });
    } catch (error) {
      console.error('[AI Scan] Error calling AI API:', error);
      throw new Error(`AI API call failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }

    if (!openaiResponse.ok) {
      const errorText = await openaiResponse.text().catch(() => 'Could not read error');
      console.error('[AI Scan] AI API error response:', errorText);
      throw new Error(`AI analysis failed (${openaiResponse.status}): ${errorText}`);
    }

    const openaiData = await openaiResponse.json();
    console.log('[AI Scan] AI API response received');
    const aiContent = openaiData.choices[0]?.message?.content || '{}';
    
    // Parse AI response
    let analysisData;
    try {
      // Extract JSON from response (in case there's extra text)
      const jsonMatch = aiContent.match(/\{[\s\S]*\}/);
      analysisData = JSON.parse(jsonMatch ? jsonMatch[0] : aiContent);
      console.log('[AI Scan] Successfully parsed AI response');
    } catch (error) {
      console.error('[AI Scan] Error parsing AI response:', error);
      console.error('[AI Scan] AI response content:', aiContent.substring(0, 500));
      throw new Error('Failed to parse AI analysis');
    }

    // Update or create AI profile with comprehensive scan data
    const existingProfile = await prisma.clientAISettings.findUnique({
      where: { clientId },
    });

    // Extract key fields from the comprehensive analysis
    const companyInfo = analysisData.companyInfo || {};
    const contentStyle = analysisData.contentStyle || {};
    const technicalInfo = analysisData.technicalInfo || {};
    
    const profileData = {
      websiteName: companyInfo.name || '',
      websiteUrl: websiteUrl,
      blogUrl: technicalInfo.blogUrl || '',
      companyDescription: companyInfo.description || '',
      targetAudience: analysisData.targetAudience?.primaryAudience || '',
      problemStatement: (analysisData.targetAudience?.painPoints || []).join(', '),
      solutionStatement: companyInfo.tagline || '',
      uniqueFeatures: companyInfo.values || [],
      toneOfVoice: contentStyle.toneOfVoice || '',
      brandAccentColor: (companyInfo.brandColors || [])[0] || '',
      contentStyle: [contentStyle.writingStyle || 'Professional'],
      contentLanguage: 'Dutch',
      lastAIScanAt: new Date(),
      aiScanCompleted: true,
      aiScanResults: JSON.stringify(analysisData, null, 2), // Store complete analysis as JSON
    };

    if (existingProfile) {
      await prisma.clientAISettings.update({
        where: { clientId },
        data: profileData,
      });
    } else {
      await prisma.clientAISettings.create({
        data: {
          clientId,
          ...profileData,
        },
      });
    }

    return NextResponse.json({
      success: true,
      data: analysisData,
      message: 'Website succesvol geanalyseerd! Alle informatie is opgeslagen.',
    });
  } catch (error) {
    console.error('[AI Scan] Error in AI scan:', error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    console.error('[AI Scan] Error details:', errorMessage);
    return NextResponse.json(
      { 
        error: 'Failed to scan website', 
        details: errorMessage,
        fetchError: fetchError || undefined
      },
      { status: 500 }
    );
  }
}
