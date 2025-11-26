import { chatCompletion } from '@/lib/aiml-api';

export interface SocialMediaPost {
  platform: string;
  text: string;
  hashtags: string[];
  imagePrompt: string;
}

/**
 * Genereert social media posts gebaseerd op blog content
 */
export async function generateSocialMediaPost(
  title: string,
  content: string,
  keywords: string[] = []
): Promise<SocialMediaPost> {
  console.log('📱 Generating social media post...');
  
  // Maak een samenvatting van de blog content (maximaal 500 tekens voor context)
  const contentSummary = content
    .replace(/<[^>]*>/g, '') // Verwijder HTML tags
    .substring(0, 500);
  
  const prompt = `Je bent een expert die waardevolle kennis deelt via social media. Maak een educatieve post gebaseerd op deze blog content.

BLOG TITEL: ${title}

BLOG CONTENT:
${contentSummary}

KEYWORDS: ${keywords.join(', ')}

TAAK: Schrijf een social media post (max 150 woorden) die de kernkennis uit deze blog deelt.

DIT IS GEEN MARKETING POST. Schrijf alsof je een vriend helpt met nuttig advies.

VOORBEELD GOEDE POSTS:
- "Bij het kiezen van een yoga mat is dikte belangrijk. Voor beginners adviseren we 6mm voor extra comfort. Gevorderde yogis kiezen vaak 4mm voor betere stabiliteit. Let ook op materiaal: kurk biedt natuurlijke grip, TPE is milieuvriendelijk."

- "Een veel gestelde vraag: wanneer mag je baby's eerste hapje geven? Rond 6 maanden zijn de meeste baby's klaar. Je ziet dit aan deze signalen: zelfstandig rechtop zitten, interesse tonen in eten, tongreflex is weg. Begin met gladde puree."

SCHRIJFSTIJL:
- Begin direct met nuttige informatie
- Geef concrete, praktische tips  
- Geen "ontdek", "leer meer", "klik hier"
- Geen call-to-action
- Gewoon nuttige kennis delen
- Max 1-2 emoji's

AFBEELDING: Beschrijf de ECHTE situatie/object die past bij dit onderwerp. 
- Voor yoga: echte yoga pose, niet iemand die op laptop kijkt
- Voor baby: baby met ouder aan tafel, niet generic kinderfoto
- Voor planten: close-up van plant, niet persoon met plantje
- Voor AI/tech: werk-situatie, visualisatie, of concept - GEEN schermen/laptops

ANTWOORD IN JSON:
{
  "text": "De educatieve post tekst...",
  "hashtags": ["relevant1", "relevant2", "niche3", "popular4", "specific5"],
  "imagePrompt": "Detailed description of the REAL situation/object (no devices, screens, or mockups)"
}

Geef ALLEEN de JSON terug.`;

  try {
    const response = await chatCompletion({
      messages: [
        {
          role: 'user',
          content: prompt
        }
      ],
      model: 'claude-sonnet-4-20250514',
      temperature: 0.7,
      max_tokens: 800
    });

    // Extract content from AIML API response structure
    const content = response?.choices?.[0]?.message?.content;
    
    if (!content) {
      throw new Error('No content in API response');
    }

    const result = content.trim();
    
    // Parse JSON response
    let jsonMatch = result.match(/\{[\s\S]*\}/);
    if (!jsonMatch) {
      throw new Error('No JSON found in response');
    }

    const data = JSON.parse(jsonMatch[0]);
    
    console.log('✅ Social media post generated');
    return {
      platform: 'multi', // Geschikt voor Instagram, Facebook, LinkedIn
      text: data.text || '',
      hashtags: data.hashtags || [],
      imagePrompt: data.imagePrompt || `Professional photo of the real subject: ${title}. Show the actual thing/situation/person. NO computers, laptops, phones, or screens. Natural lighting, correct anatomy if people shown (5 fingers, normal proportions). Photorealistic, editorial quality.`
    };

  } catch (error) {
    console.error('❌ Error generating social media post:', error);
    
    // Fallback social media post (simple, informative)
    return {
      platform: 'multi',
      text: `Interessant onderwerp: ${title}. ${contentSummary.substring(0, 100)}...`,
      hashtags: keywords.slice(0, 5).map(k => `#${k.replace(/\s+/g, '')}`),
      imagePrompt: `Professional photograph of the real subject: ${title}. Show the actual thing/situation/person. FORBIDDEN: computers, laptops, phones, screens, monitors. REQUIRED: correct anatomy if people (5 fingers per hand, normal proportions), natural lighting, photorealistic editorial quality.`
    };
  }
}
