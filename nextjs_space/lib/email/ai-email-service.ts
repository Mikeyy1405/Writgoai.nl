/**
 * 🤖 AI Email Service - Fase 3
 * AI-powered email features voor het email management systeem
 * 
 * Features:
 * 1. Email samenvatting - Vat lange emails samen in 2-3 zinnen
 * 2. Reply suggesties - Genereer 3 verschillende antwoorden (kort/formeel/vriendelijk)
 * 3. Email generatie - Schrijf volledige email op basis van prompt
 */

import { chatCompletion, TEXT_MODELS } from '../aiml-api';

// ═══════════════════════════════════════════════════════
// 📝 EMAIL SAMENVATTING
// ═══════════════════════════════════════════════════════

export interface EmailSummary {
  summary: string;
  keyPoints: string[];
  actionItems: string[];
  sentiment: 'positive' | 'neutral' | 'negative' | 'urgent';
}

/**
 * Vat een email samen in 2-3 zinnen
 * Focus op belangrijkste punten en actie items
 */
export async function summarizeEmail(emailContent: string, subject?: string): Promise<EmailSummary> {
  try {
    const prompt = `Vat deze email samen in 2-3 zinnen. Focus op de belangrijkste punten en actie items.

${subject ? `Onderwerp: ${subject}\n\n` : ''}Email inhoud:
${emailContent}

Formatteer je antwoord als JSON met deze structuur:
{
  "summary": "Korte samenvatting in 2-3 zinnen",
  "keyPoints": ["punt 1", "punt 2"],
  "actionItems": ["actie 1", "actie 2"],
  "sentiment": "positive|neutral|negative|urgent"
}

BELANGRIJK: Geef ALLEEN valid JSON terug, geen extra tekst of markdown.`;

    const response = await chatCompletion({
      model: TEXT_MODELS.FAST, // Gebruik snel model voor samenvatting
      messages: [
        {
          role: 'system',
          content: 'Je bent een professionele email assistent die emails samenvat. Geef altijd valid JSON terug zonder markdown formatting.',
        },
        {
          role: 'user',
          content: prompt,
        },
      ],
      temperature: 0.3, // Lage temp voor accuracy
      max_tokens: 500,
    });

    const content = response.choices?.[0]?.message?.content;
    
    if (!content) {
      throw new Error('Geen response van AI');
    }

    // Parse JSON - probeer eerst direct, dan met cleanup
    let result: EmailSummary;
    try {
      result = JSON.parse(content);
    } catch {
      // Probeer JSON te extraheren uit markdown code block
      const jsonMatch = content.match(/```(?:json)?\s*(\{[\s\S]*?\})\s*```/);
      if (jsonMatch) {
        result = JSON.parse(jsonMatch[1]);
      } else {
        // Fallback: neem gewoon de content als summary
        result = {
          summary: content.substring(0, 200),
          keyPoints: [],
          actionItems: [],
          sentiment: 'neutral',
        };
      }
    }

    return result;
  } catch (error: any) {
    console.error('❌ Fout bij email samenvatting:', error);
    
    // Fallback: geef basis samenvatting
    return {
      summary: emailContent.substring(0, 200) + (emailContent.length > 200 ? '...' : ''),
      keyPoints: [],
      actionItems: [],
      sentiment: 'neutral',
    };
  }
}

// ═══════════════════════════════════════════════════════
// 💬 REPLY SUGGESTIES
// ═══════════════════════════════════════════════════════

export interface ReplySuggestion {
  type: 'kort' | 'formeel' | 'vriendelijk';
  text: string;
  description: string;
}

/**
 * Genereer 3 verschillende reply suggesties
 * - Kort: to-the-point (max 30 woorden)
 * - Formeel: professioneel en zakelijk (max 50 woorden)
 * - Vriendelijk: persoonlijk en warm (max 50 woorden)
 */
export async function generateReplySuggestions(
  emailContent: string,
  subject?: string,
  from?: string
): Promise<ReplySuggestion[]> {
  try {
    const prompt = `Genereer 3 verschillende antwoorden op deze email:

${subject ? `Onderwerp: ${subject}` : ''}
${from ? `Van: ${from}` : ''}

Email:
${emailContent}

Genereer 3 verschillende antwoorden:
1. KORT - To-the-point en beknopt (max 30 woorden)
2. FORMEEL - Professioneel en zakelijk (max 50 woorden)
3. VRIENDELIJK - Persoonlijk en warm (max 50 woorden)

Formatteer als JSON array:
[
  {
    "type": "kort",
    "text": "Korte reply tekst hier",
    "description": "Direct en to-the-point"
  },
  {
    "type": "formeel",
    "text": "Formele reply tekst hier",
    "description": "Professioneel en zakelijk"
  },
  {
    "type": "vriendelijk",
    "text": "Vriendelijke reply tekst hier",
    "description": "Persoonlijk en warm"
  }
]

BELANGRIJK:
- Schrijf in het Nederlands
- Gebruik GEEN opening (Beste, Hallo) of closing (Met vriendelijke groet)
- Geef ALLEEN valid JSON terug, geen markdown
- Blijf binnen de woordlimieten`;

    const response = await chatCompletion({
      model: TEXT_MODELS.CLAUDE_45, // Claude is beste voor creatieve content
      messages: [
        {
          role: 'system',
          content: 'Je bent een professionele email assistent. Schrijf natuurlijke, menselijke replies. Geef altijd valid JSON terug zonder markdown.',
        },
        {
          role: 'user',
          content: prompt,
        },
      ],
      temperature: 0.7, // Iets hoger voor creativiteit
      max_tokens: 800,
    });

    const content = response.choices?.[0]?.message?.content;
    
    if (!content) {
      throw new Error('Geen response van AI');
    }

    // Parse JSON
    let suggestions: ReplySuggestion[];
    try {
      suggestions = JSON.parse(content);
    } catch {
      // Probeer JSON te extraheren uit markdown
      const jsonMatch = content.match(/```(?:json)?\s*(\[[\s\S]*?\])\s*```/);
      if (jsonMatch) {
        suggestions = JSON.parse(jsonMatch[1]);
      } else {
        throw new Error('Kon JSON niet parsen uit AI response');
      }
    }

    // Valideer en return
    if (!Array.isArray(suggestions) || suggestions.length !== 3) {
      throw new Error('Ongeldige reply suggesties format');
    }

    return suggestions;
  } catch (error: any) {
    console.error('❌ Fout bij reply suggesties:', error);
    
    // Fallback: genereer basis suggesties
    return [
      {
        type: 'kort',
        text: 'Bedankt voor je bericht. Ik kom hier op terug.',
        description: 'Direct en to-the-point',
      },
      {
        type: 'formeel',
        text: 'Bedankt voor uw bericht. Ik heb uw email ontvangen en neem zo spoedig mogelijk contact met u op.',
        description: 'Professioneel en zakelijk',
      },
      {
        type: 'vriendelijk',
        text: 'Bedankt voor je bericht! Ik ga hier mee aan de slag en laat je snel weten hoe we verder kunnen.',
        description: 'Persoonlijk en warm',
      },
    ];
  }
}

// ═══════════════════════════════════════════════════════
// ✉️ EMAIL GENERATIE
// ═══════════════════════════════════════════════════════

export interface GeneratedEmail {
  subject: string;
  body: string;
}

/**
 * Genereer volledige email op basis van gebruiker prompt
 * Incl. onderwerp, greeting, body en closing
 */
export async function generateEmail(
  userPrompt: string,
  tone: 'zakelijk' | 'vriendelijk' | 'neutraal' = 'zakelijk'
): Promise<GeneratedEmail> {
  try {
    const toneInstructions = {
      zakelijk: 'professioneel en zakelijk',
      vriendelijk: 'vriendelijk en persoonlijk',
      neutraal: 'neutraal en informatief',
    };

    const prompt = `Schrijf een ${toneInstructions[tone]} email over het volgende onderwerp:

${userPrompt}

Vereisten:
- Schrijf in het Nederlands
- Genereer een passend onderwerp (subject)
- Include een greeting (Beste/Hallo)
- Schrijf een duidelijke en to-the-point body
- Include een closing (Met vriendelijke groet)
- Toon: ${toneInstructions[tone]}
- Max 150 woorden voor de body
- Wees direct en duidelijk

Formatteer als JSON:
{
  "subject": "Email onderwerp hier",
  "body": "Volledige email body hier (incl. greeting en closing)"
}

BELANGRIJK: Geef ALLEEN valid JSON terug, geen markdown.`;

    const response = await chatCompletion({
      model: TEXT_MODELS.CLAUDE_45, // Claude voor beste schrijfkwaliteit
      messages: [
        {
          role: 'system',
          content: 'Je bent een professionele email schrijver. Schrijf natuurlijke, menselijke emails. Geef altijd valid JSON terug zonder markdown.',
        },
        {
          role: 'user',
          content: prompt,
        },
      ],
      temperature: 0.7, // Goede balans creativiteit/betrouwbaarheid
      max_tokens: 600,
    });

    const content = response.choices?.[0]?.message?.content;
    
    if (!content) {
      throw new Error('Geen response van AI');
    }

    // Parse JSON
    let result: GeneratedEmail;
    try {
      result = JSON.parse(content);
    } catch {
      // Probeer JSON te extraheren
      const jsonMatch = content.match(/```(?:json)?\s*(\{[\s\S]*?\})\s*```/);
      if (jsonMatch) {
        result = JSON.parse(jsonMatch[1]);
      } else {
        throw new Error('Kon JSON niet parsen uit AI response');
      }
    }

    // Valideer
    if (!result.subject || !result.body) {
      throw new Error('Ongeldige email format');
    }

    return result;
  } catch (error: any) {
    console.error('❌ Fout bij email generatie:', error);
    
    // Fallback: geef basis email
    return {
      subject: 'Email onderwerp',
      body: `Beste,\n\n${userPrompt}\n\nMet vriendelijke groet`,
    };
  }
}

// ═══════════════════════════════════════════════════════
// 🎯 EXPORT
// ═══════════════════════════════════════════════════════

export default {
  summarizeEmail,
  generateReplySuggestions,
  generateEmail,
};
