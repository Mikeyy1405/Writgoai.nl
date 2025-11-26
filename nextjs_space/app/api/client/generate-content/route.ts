

export const dynamic = "force-dynamic";
/**
 * AI Agent Content Generator
 * Volledige content generatie met de AI agent
 */

import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth-options';
import { 
  generateBlog, 
  generateSocialMedia, 
  generateVideoScript,
  planContent,
  webResearch 
} from '@/lib/aiml-agent';
import { prisma } from '@/lib/db';

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { 
      topic, 
      contentTypes, // ['blog', 'social', 'video']
      platforms, // ['instagram', 'tiktok', 'youtube']
      doResearch = false 
    } = await request.json();

    if (!topic) {
      return NextResponse.json({ error: 'Topic is verplicht' }, { status: 400 });
    }

    // Haal client info op
    let clientContext = {};
    let clientId = null;
    
    if (session.user.role === 'CLIENT') {
      const client = await prisma.client.findUnique({
        where: { email: session.user.email! },
        select: {
          id: true,
          companyName: true,
          website: true,
          targetAudience: true,
          brandVoice: true,
          keywords: true,
        },
      });

      if (client) {
        clientId = client.id;
        clientContext = {
          clientId: client.id,
          brandInfo: `
Bedrijf: ${client.companyName || 'Niet gespecificeerd'}
Website: ${client.website || 'Niet gespecificeerd'}
Doelgroep: ${client.targetAudience || 'Niet gespecificeerd'}
Brand voice: ${client.brandVoice || 'Professioneel'}
Keywords: ${client.keywords?.join(', ') || 'Geen'}
          `.trim(),
        };
      }
    }

    const results: any = {
      topic,
      timestamp: new Date().toISOString(),
    };

    // Stap 1: Web research (optioneel)
    if (doResearch) {
      console.log('Doing web research...');
      const research = await webResearch(topic, (clientContext as any).brandInfo);
      results.research = research;
    }

    // Stap 2: Content planning
    console.log('Planning content...');
    const contentType = contentTypes?.includes('blog') ? 'blog' : 
                       contentTypes?.includes('social') ? 'social' : 
                       contentTypes?.includes('video') ? 'video' : 'all';
    
    const plan = await planContent(topic, contentType, (clientContext as any).brandInfo);
    results.plan = plan;

    // Stap 3: Genereer blog (als gevraagd)
    if (contentTypes?.includes('blog')) {
      console.log('Generating blog...');
      const keywords = plan.keywords || [topic];
      const blog = await generateBlog(
        topic,
        keywords,
        (clientContext as any).toneOfVoice || 'professioneel',
        (clientContext as any).brandInfo
      );
      results.blog = {
        content: blog,
        title: plan.blog?.titel || topic,
      };

      // Sla blog op in database als er een clientId is
      if (clientId) {
        await prisma.contentPiece.create({
          data: {
            clientId,
            dayNumber: 1,
            theme: topic,
            scheduledFor: new Date(),
            blogTitle: plan.blog?.titel || topic,
            blogContent: blog,
            blogKeywords: plan.keywords || [topic],
          },
        });
      }
    }

    // Stap 4: Genereer social media (als gevraagd)
    if (contentTypes?.includes('social') && platforms?.length > 0) {
      console.log('Generating social media...');
      results.social = {};
      
      for (const platform of platforms) {
        const social = await generateSocialMedia(
          topic,
          platform,
          (clientContext as any).brandInfo
        );
        results.social[platform] = social;

        // Sla op in database
        if (clientId) {
          await prisma.contentPiece.create({
            data: {
              clientId,
              dayNumber: 1,
              theme: topic,
              scheduledFor: new Date(),
              socialCaption: social.caption,
              socialHashtags: social.hashtags || [],
              socialPlatforms: [platform],
            },
          });
        }
      }
    }

    // Stap 5: Genereer video script (als gevraagd)
    if (contentTypes?.includes('video')) {
      console.log('Generating video script...');
      const videoScript = await generateVideoScript(
        topic,
        60,
        'educational',
        (clientContext as any).brandInfo
      );
      results.video = videoScript;

      // Video scripts worden opgeslagen in blogContent met speciale markering
      if (clientId) {
        await prisma.contentPiece.create({
          data: {
            clientId,
            dayNumber: 1,
            theme: topic,
            scheduledFor: new Date(),
            blogTitle: `[VIDEO] ${videoScript.title}`,
            blogContent: `
<h2>Hook</h2>
<p>${videoScript.hook}</p>

<h2>Script</h2>
${videoScript.script.map((s, i) => `<p><strong>Scene ${i + 1}:</strong> ${s}</p>`).join('\n')}

<h2>Call to Action</h2>
<p>${videoScript.cta}</p>
            `.trim(),
            blogKeywords: [topic, 'video', 'script'],
          },
        });
      }
    }

    return NextResponse.json({
      success: true,
      results,
    });
  } catch (error: any) {
    console.error('Content generatie fout:', error);
    return NextResponse.json(
      { error: error.message || 'Er ging iets mis bij het genereren van content' },
      { status: 500 }
    );
  }
}
