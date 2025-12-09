
import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth-options';
import { chatCompletion } from '@/lib/aiml-api';
import { MODEL_CATEGORIES } from '@/lib/smart-model-router';
import { prisma } from '@/lib/db';


export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.email) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { projectId, count = 20 } = await request.json();

    if (!projectId) {
      return NextResponse.json({ error: 'Project ID is required' }, { status: 400 });
    }

    // Haal client en project op
    const client = await prisma.client.findUnique({
      where: { email: session.user.email },
      select: { id: true }
    });

    if (!client) {
      return NextResponse.json({ error: 'Client not found' }, { status: 404 });
    }

    const project = await prisma.project.findFirst({
      where: {
        id: projectId,
        clientId: client.id
      },
      select: {
        id: true,
        name: true,
        websiteUrl: true,
        description: true,
        niche: true,
        targetAudience: true,
        language: true,
        savedContent: {
          take: 10,
          orderBy: { createdAt: 'desc' },
          select: {
            title: true,
            content: true
          }
        }
      }
    });

    if (!project) {
      return NextResponse.json({ error: 'Project not found' }, { status: 404 });
    }

    // Verzamel context over het project
    const projectContext = `
Website: ${project.name}
URL: ${project.websiteUrl}
Beschrijving: ${project.description || 'Geen beschrijving'}
Niche: ${project.niche || 'Niet gespecificeerd'}
Doelgroep: ${project.targetAudience || 'Niet gespecificeerd'}

Recente content titels:
${project.savedContent.map(c => `- ${c.title}`).join('\n')}
`;

    // Genereer topics met AI
    const prompt = `Je bent een social media contentplanner. Analyseer de volgende website en genereer ${count} concrete content topics die perfect passen bij deze website.

${projectContext}

🎯 SUPER BELANGRIJK - TOPICS MOETEN OVER HET ONDERWERP VAN DE WEBSITE GAAN:
- Elk topic MOET gaan over de niche/onderwerp van deze specifieke website
- Topics moeten gebaseerd zijn op de expertise/kennis die op de website wordt gedeeld
- GEEN generieke social media tips of marketing advice
- GEEN promotionele content over de website zelf
- WEL: Praktische tips, tutorials, uitleg, antwoorden op vragen uit de niche

📚 CATEGORIEËN (verdeel evenredig):
1. tutorial - "Hoe doe je..." stap-voor-stap uitleg
2. tip - Korte, praktische tips uit de niche  
3. uitleg - Leg een concept/techniek uit
4. vraag-antwoord - Beantwoord een veelgestelde vraag
5. praktijkvoorbeeld - Concrete voorbeelden uit de praktijk

✅ GOED (voorbeelden voor een yoga website):
- "Hoe begin je met meditatie: 3 simpele stappen voor beginners"
- "De ademhalingstechniek die stress direct vermindert"
- "Uitleg: Het verschil tussen Hatha en Vinyasa yoga"
- "Vraag: Kan yoga helpen bij rugpijn? Het antwoord + oefeningen"
- "5 yoga poses die je energieniveau verhogen"

❌ FOUT (te generiek of promotioneel):
- "Waarom je onze website moet bezoeken"
- "5 tips voor betere social media posts"
- "Download onze gratis gids"
- "Volg ons voor meer tips"

Geef de topics in JSON formaat:
{
  "topics": [
    {
      "topic": "Concrete topic titel (max 80 karakters)",
      "description": "Korte beschrijving van de inhoud (50-100 woorden)",
      "category": "tutorial|tip|uitleg|vraag-antwoord|praktijkvoorbeeld",
      "keywords": ["keyword1", "keyword2", "keyword3"]
    }
  ]
}

VERPLICHT:
- Minimaal ${count} unieke topics
- Elk topic moet specifiek zijn voor ${project.niche || project.name}
- Verdeel gelijkmatig over de categorieën
- Gebruik geen emoticons in de topic titels
- Keywords moeten relevant zijn voor de niche`;

    const response = await chatCompletion({
      messages: [{ role: 'user', content: prompt }],
      model: MODEL_CATEGORIES.SEO_WRITING.primary,
      temperature: 0.8,
      max_tokens: 4000
    });

    const content = response.choices[0]?.message?.content || '{}';
    const jsonMatch = content.match(/\{[\s\S]*\}/);
    const parsedContent = JSON.parse(jsonMatch ? jsonMatch[0] : content);

    if (!parsedContent.topics || !Array.isArray(parsedContent.topics)) {
      throw new Error('Invalid response format');
    }

    // Sla topics op in database
    const createdTopics = await Promise.all(
      parsedContent.topics.map((topic: any) =>
        prisma.socialMediaTopic.create({
          data: {
            projectId: project.id,
            topic: topic.topic,
            description: topic.description,
            category: topic.category,
            keywords: topic.keywords || [],
            language: project.language
          }
        })
      )
    );

    return NextResponse.json({
      success: true,
      count: createdTopics.length,
      topics: createdTopics
    });

  } catch (error: any) {
    console.error('Error generating topics:', error);
    return NextResponse.json(
      { error: 'Failed to generate topics', details: error.message },
      { status: 500 }
    );
  }
}
