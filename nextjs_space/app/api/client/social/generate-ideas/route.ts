export const dynamic = "force-dynamic";

import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { chatCompletion, selectOptimalModelForTask } from '@/lib/aiml-api';
import { prisma } from '@/lib/db';
import { CREDIT_COSTS, checkCreditsWithAdminBypass, UNLIMITED_CREDITS } from '@/lib/credits';

interface ContentIdea {
  id: string;
  title: string;
  description: string;
  suggestedPlatforms: string[];
  category: 'trending' | 'seasonal' | 'evergreen' | 'engagement';
  urgency: 'high' | 'medium' | 'low';
  estimatedEngagement: number;
}

export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession();
    if (!session?.user?.email) {
      return NextResponse.json({ error: 'Niet geautoriseerd' }, { status: 401 });
    }

    const body = await req.json();
    const { projectId, count = 10, categories } = body;

    if (!projectId) {
      return NextResponse.json({ error: 'Project ID is verplicht' }, { status: 400 });
    }

    console.log('💡 Generating content ideas:', { projectId, count });

    // Check credits with admin bypass
    const requiredCredits = CREDIT_COSTS.SOCIAL_MEDIA_IDEAS;
    const creditCheck = await checkCreditsWithAdminBypass(session.user.email, requiredCredits);
    
    if (!creditCheck.allowed) {
      return NextResponse.json(
        { error: creditCheck.reason || `Onvoldoende credits. Je hebt minimaal ${requiredCredits} credits nodig voor content ideeën.` },
        { status: creditCheck.statusCode || 402 }
      );
    }

    // Get user for credit deduction (only needed if not unlimited)
    const user = await prisma.client.findUnique({
      where: { email: session.user.email },
      select: { 
        id: true, 
        subscriptionCredits: true,
        topUpCredits: true,
        isUnlimited: true
      },
    });

    // Get project info for context
    const project = await prisma.project.findUnique({
      where: { id: projectId },
      select: {
        name: true,
        websiteUrl: true,
        targetAudience: true,
        niche: true,
        description: true,
      }
    });

    if (!project) {
      return NextResponse.json({ error: 'Project niet gevonden' }, { status: 404 });
    }

    // Generate content ideas using AI
    const modelStrategy = selectOptimalModelForTask('creative_writing', 'complex', 'balanced');
    const model = modelStrategy.primary.model;
    
    const currentMonth = new Date().toLocaleString('nl-NL', { month: 'long', year: 'numeric' });
    const currentSeason = getCurrentSeason();

    const prompt = `Je bent een expert social media content strategist. Genereer ${count} content ideeën voor social media posts.

PROJECT INFORMATIE:
- Project: ${project.name}
- Website: ${project.websiteUrl || 'Niet beschikbaar'}
- Niche/Branche: ${project.niche || 'Algemeen'}
- Doelgroep: ${project.targetAudience || 'Breed publiek'}
- Omschrijving: ${project.description || 'Geen beschrijving'}

HUIDIGE CONTEXT:
- Maand: ${currentMonth}
- Seizoen: ${currentSeason}

INSTRUCTIES:
1. Genereer diverse content ideeën die relevant zijn voor dit project
2. Mix verschillende categorieën:
   - Trending: Actuele onderwerpen en trends in de niche
   - Seasonal: Seizoensgebonden content (${currentSeason})
   - Evergreen: Tijdloze, altijd relevante content
   - Engagement: Content die engagement stimuleert (polls, vragen, tips)

3. Voor elk idee geef je:
   - Een pakkende titel (max 60 tekens)
   - Korte beschrijving wat het idee inhoudt (max 120 tekens)
   - Welke platforms het beste zijn (kies uit: linkedin, facebook, instagram, twitter, youtube, tiktok)
   - Category (trending/seasonal/evergreen/engagement)
   - Urgency (high voor trending topics, medium voor seasonal, low voor evergreen)
   - Estimated engagement score (0-100)

PLATFORM KENMERKEN:
- LinkedIn: Professioneel, zakelijk, B2B content, thought leadership
- Instagram: Visueel, lifestyle, inspiratie, achter-de-schermen
- Facebook: Community, events, longer form content, discussies
- Twitter/X: News, quick tips, trending topics, meningen
- TikTok: Trendy, educatief + entertainment, korte video's
- YouTube: Diepgaand, tutorials, lange video's

Genereer ALLEEN de JSON zonder extra tekst:

{
  "ideas": [
    {
      "title": "...",
      "description": "...",
      "suggestedPlatforms": ["linkedin", "facebook"],
      "category": "trending",
      "urgency": "high",
      "estimatedEngagement": 85
    }
  ]
}`;

    console.log('🤖 Sending request to AI...');
    
    const response = await chatCompletion({
      model,
      messages: [
        {
          role: 'user',
          content: prompt
        }
      ],
      temperature: 0.8,
      max_tokens: 3000,
    });

    const aiResponse = response.choices[0]?.message?.content || '';
    console.log('📥 AI Response received, length:', aiResponse.length);

    // Parse the response
    let parsedIdeas: ContentIdea[] = [];
    
    try {
      // Try to extract JSON from the response
      const jsonMatch = aiResponse.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        const jsonData = JSON.parse(jsonMatch[0]);
        parsedIdeas = jsonData.ideas.map((idea: any, index: number) => ({
          id: `idea-${Date.now()}-${index}`,
          ...idea
        }));
      } else {
        throw new Error('No JSON found in response');
      }
    } catch (parseError) {
      console.error('Failed to parse AI response:', parseError);
      console.error('Raw response:', aiResponse);
      
      // Fallback: Create some default ideas
      parsedIdeas = createFallbackIdeas(project, count);
    }

    // Ensure we have the requested number of ideas
    if (parsedIdeas.length < count) {
      const remaining = count - parsedIdeas.length;
      parsedIdeas = [...parsedIdeas, ...createFallbackIdeas(project, remaining)];
    }

    // Take only the requested count
    parsedIdeas = parsedIdeas.slice(0, count);

    // Deduct credits if not unlimited (admins and unlimited users skip this)
    if (!creditCheck.isUnlimited && user) {
      let subscriptionDeduction = Math.min(user.subscriptionCredits, requiredCredits);
      let topUpDeduction = requiredCredits - subscriptionDeduction;

      await prisma.client.update({
        where: { id: user.id },
        data: {
          subscriptionCredits: { decrement: subscriptionDeduction },
          topUpCredits: { decrement: Math.max(0, topUpDeduction) }
        }
      });

      console.log(`💳 Credits deducted: ${requiredCredits} (${subscriptionDeduction} subscription + ${topUpDeduction} top-up)`);
    } else {
      console.log(`💳 Credits NOT deducted (unlimited/admin user)`);
    }

    console.log(`✅ Generated ${parsedIdeas.length} content ideas`);

    return NextResponse.json({
      success: true,
      ideas: parsedIdeas,
      creditsUsed: creditCheck.isUnlimited ? 0 : requiredCredits,
      remainingCredits: creditCheck.isUnlimited ? UNLIMITED_CREDITS : (user ? (user.subscriptionCredits + user.topUpCredits - requiredCredits) : 0)
    });

  } catch (error: any) {
    console.error('❌ Error generating content ideas:', error);
    return NextResponse.json(
      { error: error.message || 'Er ging iets mis bij het genereren van content ideeën' },
      { status: 500 }
    );
  }
}

function getCurrentSeason(): string {
  const month = new Date().getMonth();
  if (month >= 2 && month <= 4) return 'Lente';
  if (month >= 5 && month <= 7) return 'Zomer';
  if (month >= 8 && month <= 10) return 'Herfst';
  return 'Winter';
}

function createFallbackIdeas(project: any, count: number): ContentIdea[] {
  const fallbackIdeas = [
    {
      id: `fallback-1`,
      title: '5 Tips voor meer succes',
      description: 'Praktische tips die je direct kunt toepassen in je dagelijkse werk',
      suggestedPlatforms: ['linkedin', 'facebook'],
      category: 'evergreen' as const,
      urgency: 'low' as const,
      estimatedEngagement: 70
    },
    {
      id: `fallback-2`,
      title: 'Achter de schermen',
      description: 'Een kijkje achter de schermen van ons dagelijkse werk',
      suggestedPlatforms: ['instagram', 'facebook'],
      category: 'engagement' as const,
      urgency: 'medium' as const,
      estimatedEngagement: 75
    },
    {
      id: `fallback-3`,
      title: 'Trending: Wat is jouw mening?',
      description: 'Actueel onderwerp in de branche - laten we discussiëren!',
      suggestedPlatforms: ['twitter', 'linkedin'],
      category: 'trending' as const,
      urgency: 'high' as const,
      estimatedEngagement: 85
    },
    {
      id: `fallback-4`,
      title: 'Deze maand special',
      description: 'Seizoensgebonden content speciaal voor deze periode',
      suggestedPlatforms: ['facebook', 'instagram'],
      category: 'seasonal' as const,
      urgency: 'medium' as const,
      estimatedEngagement: 80
    },
    {
      id: `fallback-5`,
      title: 'Tutorial: Leer iets nieuws',
      description: 'Stap-voor-stap uitleg van een nuttig proces',
      suggestedPlatforms: ['youtube', 'tiktok'],
      category: 'evergreen' as const,
      urgency: 'low' as const,
      estimatedEngagement: 65
    },
  ];

  return fallbackIdeas
    .map((idea, index) => ({
      ...idea,
      id: `fallback-${Date.now()}-${index}`
    }))
    .slice(0, count);
}
