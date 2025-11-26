
import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth-options';
import { prisma } from '@/lib/db';

/**
 * POST /api/video-automation/generate-topics
 * Generate video topics using AI
 */
export async function POST(request: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.email) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const client = await prisma.client.findUnique({
      where: { email: session.user.email },
    });

    if (!client) {
      return NextResponse.json({ error: 'Client not found' }, { status: 404 });
    }

    const data = await request.json();
    const { strategyId, count = 10 } = data;

    // Get the video strategy
    const strategy = await prisma.videoSeries.findUnique({
      where: { id: strategyId, clientId: client.id }
    });

    if (!strategy) {
      return NextResponse.json({ error: 'Strategy not found' }, { status: 404 });
    }

    // Call AI to generate topics
    const topics = await generateVideoTopics(
      strategy.niche,
      strategy.description || undefined,
      strategy.language,
      count
    );

    // Calculate scheduling dates
    const now = new Date();
    const scheduledDates = calculateScheduleDates(
      strategy.videosPerWeek,
      strategy.publishingDays,
      strategy.publishingTime,
      count
    );

    // Create GeneratedVideo records
    const createdVideos = [];
    for (let i = 0; i < topics.length; i++) {
      const topic = topics[i];
      const scheduledFor = scheduledDates[i] || null;

      const video = await prisma.generatedVideo.create({
        data: {
          seriesId: strategy.id,
          videoTopic: topic.title,
          description: topic.description,
          status: scheduledFor ? 'SCHEDULED' : 'PENDING',
          voice: strategy.voice,
          captionTheme: strategy.captionTheme,
          imageStyle: strategy.imageStyle || undefined,
          language: strategy.language,
          aspectRatio: strategy.aspectRatio,
          generationType: 'TEXT_TO_VIDEO'
        }
      });

      createdVideos.push(video);
    }

    return NextResponse.json({
      success: true,
      topics: createdVideos,
      count: createdVideos.length
    });
  } catch (error) {
    console.error('Error generating topics:', error);
    return NextResponse.json(
      { error: 'Failed to generate topics' },
      { status: 500 }
    );
  }
}

/**
 * Generate video topics using AI
 */
async function generateVideoTopics(
  niche: string,
  targetAudience: string | undefined,
  language: string,
  count: number
): Promise<Array<{ title: string; description: string }>> {
  try {
    const systemPrompt = `Je bent een expert video content creator. Genereer ${count} unieke en boeiende video onderwerpen voor de niche "${niche}". 
    
${targetAudience ? `Doelgroep: ${targetAudience}` : ''}

Elke video moet:
- Een pakkende, click-worthy titel hebben
- Een korte beschrijving (1-2 zinnen) die de kernboodschap samenvat
- Geschikt zijn voor korte video's (30-90 seconden)
- Viraal potentieel hebben
- Praktische waarde bieden aan de kijker

Geef je antwoord in het ${language} als JSON array met format:
[
  {
    "title": "5 Yoga Oefeningen voor Een Strakke Buik",
    "description": "Leer de 5 meest effectieve yoga oefeningen om je core te versterken en je buikspieren te trainen."
  }
]`;

    const response = await fetch('https://api.abacus.ai/v1/chat/complete', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${process.env.ABACUSAI_API_KEY}`
      },
      body: JSON.stringify({
        model: 'gpt-4o',
        messages: [
          { role: 'system', content: systemPrompt },
          {
            role: 'user',
            content: `Genereer ${count} video onderwerpen voor: ${niche}`
          }
        ],
        temperature: 0.9,
        max_tokens: 2000
      })
    });

    if (!response.ok) {
      throw new Error('AI API request failed');
    }

    const result = await response.json();
    const content = result.choices[0]?.message?.content;

    if (!content) {
      throw new Error('No content generated');
    }

    // Try to parse JSON from the response
    const jsonMatch = content.match(/\[[\s\S]*\]/);
    if (jsonMatch) {
      const topics = JSON.parse(jsonMatch[0]);
      return topics;
    }

    throw new Error('Failed to parse topics from AI response');
  } catch (error) {
    console.error('Error calling AI for topic generation:', error);
    // Fallback to simple topics
    return Array.from({ length: count }, (_, i) => ({
      title: `${niche} Video ${i + 1}`,
      description: `Interessante content over ${niche}`
    }));
  }
}

/**
 * Calculate schedule dates based on videos per week and publishing days
 */
function calculateScheduleDates(
  videosPerWeek: number,
  publishingDays: string[],
  publishingTime: string,
  totalVideos: number
): Array<Date | null> {
  const dates: Array<Date | null> = [];
  
  const now = new Date();
  const [hours, minutes] = publishingTime.split(':').map(Number);
  
  const dayMap: { [key: string]: number } = {
    sunday: 0,
    monday: 1,
    tuesday: 2,
    wednesday: 3,
    thursday: 4,
    friday: 5,
    saturday: 6
  };
  
  const publishDayNumbers = publishingDays
    .map(day => dayMap[day.toLowerCase()])
    .filter(d => d !== undefined)
    .sort();
  
  if (publishDayNumbers.length === 0) {
    // No specific days, schedule evenly
    publishDayNumbers.push(1, 3, 5); // Mon, Wed, Fri by default
  }
  
  let currentDate = new Date(now);
  currentDate.setDate(currentDate.getDate() + 1); // Start tomorrow
  
  for (let i = 0; i < totalVideos; i++) {
    // Find next publishing day
    while (!publishDayNumbers.includes(currentDate.getDay())) {
      currentDate.setDate(currentDate.getDate() + 1);
    }
    
    const scheduledDate = new Date(currentDate);
    scheduledDate.setHours(hours, minutes, 0, 0);
    dates.push(scheduledDate);
    
    // Move to next day for next iteration
    currentDate.setDate(currentDate.getDate() + 1);
  }
  
  return dates;
}
