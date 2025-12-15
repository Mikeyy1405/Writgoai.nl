import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth-options';
import { prisma } from '@/lib/db';
import { trackUsage } from '@/lib/usage-tracking';
import fs from 'fs';
import path from 'path';

export const dynamic = 'force-dynamic';

const SECRETS_PATH = '/home/ubuntu/.config/abacusai_auth_secrets.json';

function getApiKey(): string | null {
  try {
    const secretsContent = fs.readFileSync(SECRETS_PATH, 'utf-8');
    const secrets = JSON.parse(secretsContent);
    return secrets?.['aiml api']?.secrets?.api_key?.value ||
           secrets?.['openai']?.secrets?.api_key?.value ||
           null;
  } catch {
    return null;
  }
}

async function callLLM(prompt: string): Promise<string> {
  const apiKey = getApiKey();
  if (!apiKey) throw new Error('No API key available');

  const response = await fetch('https://api.aimlapi.com/v1/chat/completions', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${apiKey}`,
    },
    body: JSON.stringify({
      model: 'claude-3-7-sonnet',
      messages: [{ role: 'user', content: prompt }],
      max_tokens: 8000,
      temperature: 0.7,
    }),
  });

  if (!response.ok) {
    throw new Error(`API error: ${response.status}`);
  }

  const data = await response.json();
  return data.choices?.[0]?.message?.content || '';
}

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.email) {
      return NextResponse.json({ error: 'Niet ingelogd' }, { status: 401 });
    }

    const client = await prisma.client.findUnique({
      where: { email: session.user.email },
      include: {
        projects: {
          where: { isActive: true },
          orderBy: { isPrimary: 'desc' },
          take: 1,
        },
      },
    });

    if (!client) {
      return NextResponse.json({ error: 'Client niet gevonden' }, { status: 404 });
    }

    const body = await request.json();
    const {
      mainKeyword,
      niche,
      targetAudience,
      language = 'nl',
      includeQuestions = true,
      includeLongTail = true,
      includeCompetitor = true,
      maxResults = 50,
    } = body;

    if (!mainKeyword) {
      return NextResponse.json({ error: 'Hoofd zoekwoord is verplicht' }, { status: 400 });
    }

    const project = client.projects[0];

    // Build comprehensive prompt
    const prompt = `Je bent een SEO expert en keyword research specialist voor de Nederlandse markt.

Analyseer het volgende zoekwoord en genereer een uitgebreid keyword research rapport:

**Hoofd Zoekwoord:** ${mainKeyword}
${niche ? `**Niche/Branche:** ${niche}` : ''}
${targetAudience ? `**Doelgroep:** ${targetAudience}` : ''}
**Taal:** ${language === 'nl' ? 'Nederlands' : language === 'en' ? 'Engels' : language}

**Genereer het volgende in JSON formaat:**

1. **mainKeyword**: Het hoofd zoekwoord met geschatte metrics
2. **relatedKeywords**: ${Math.floor(maxResults * 0.4)} gerelateerde zoekwoorden
${includeLongTail ? `3. **longTailKeywords**: ${Math.floor(maxResults * 0.3)} long-tail variaties (3+ woorden)` : ''}
${includeQuestions ? `4. **questionKeywords**: ${Math.floor(maxResults * 0.2)} vraag-gebaseerde zoekwoorden (wie, wat, waar, hoe, waarom)` : ''}
${includeCompetitor ? `5. **competitorInsights**: Analyse van concurrentie en kansen` : ''}
6. **contentSuggestions**: 5 content ideeën op basis van de keywords
7. **searchIntent**: Analyse van zoekintentie (informational, transactional, navigational, commercial)

**Voor elk zoekwoord, geef:**
- keyword: het zoekwoord
- searchVolume: geschat maandelijks zoekvolume ("high", "medium", "low", of nummer schatting)
- difficulty: SEO moeilijkheidsgraad (1-100)
- intent: zoekintentie
- cpc: geschatte CPC ("low", "medium", "high")
- trend: "rising", "stable", "declining"

**Output alleen valide JSON in dit exacte formaat:**
{
  "mainKeyword": {
    "keyword": "${mainKeyword}",
    "searchVolume": "medium",
    "difficulty": 45,
    "intent": "informational",
    "cpc": "medium",
    "trend": "stable"
  },
  "relatedKeywords": [
    { "keyword": "...", "searchVolume": "...", "difficulty": 0, "intent": "...", "cpc": "...", "trend": "..." }
  ],
  "longTailKeywords": [...],
  "questionKeywords": [...],
  "competitorInsights": {
    "topCompetitors": ["site1.nl", "site2.nl"],
    "contentGaps": ["onderwerp 1", "onderwerp 2"],
    "opportunities": ["kans 1", "kans 2"]
  },
  "contentSuggestions": [
    { "title": "...", "type": "blog|pillar|faq", "targetKeywords": ["..."] }
  ],
  "searchIntent": {
    "primary": "informational",
    "breakdown": { "informational": 60, "transactional": 20, "commercial": 15, "navigational": 5 }
  },
  "summary": {
    "totalKeywords": 0,
    "avgDifficulty": 0,
    "bestOpportunities": ["keyword1", "keyword2"]
  }
}

Genereer realistische en bruikbare data gebaseerd op je kennis van de Nederlandse markt en SEO.
Output ALLEEN de JSON, geen andere tekst.`;

    const response = await callLLM(prompt);
    
    // Parse JSON from response
    let keywordData;
    try {
      // Extract JSON from response
      const jsonMatch = response.match(/\{[\s\S]*\}/);
      if (!jsonMatch) throw new Error('No JSON found');
      keywordData = JSON.parse(jsonMatch[0]);
    } catch (parseError) {
      console.error('Failed to parse keyword research response:', parseError);
      return NextResponse.json(
        { error: 'Kon keyword data niet verwerken. Probeer opnieuw.' },
        { status: 500 }
      );
    }

    // Calculate totals
    const totalKeywords = 
      1 + // main keyword
      (keywordData.relatedKeywords?.length || 0) +
      (keywordData.longTailKeywords?.length || 0) +
      (keywordData.questionKeywords?.length || 0);

    // Track usage (non-blocking, never fails the request)
    trackUsage({
      clientId: client.id,
      projectId: project?.id,
      tool: 'keyword_research',
      action: 'research',
      details: {
        mainKeyword,
        niche,
        language,
        keywordCount: totalKeywords,
      },
    });

    // Add metadata
    keywordData.metadata = {
      generatedAt: new Date().toISOString(),
      mainKeyword,
      niche,
      language,
      totalKeywords,
    };

    return NextResponse.json(keywordData);
  } catch (error: any) {
    console.error('Keyword research error:', error);
    return NextResponse.json(
      { error: error.message || 'Keyword research mislukt' },
      { status: 500 }
    );
  }
}
