
import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth-options';
import { prisma } from '@/lib/db';
import { 

  generateBlogPromoPost, 
  generateProductHighlightPost,
  removeMarkdownForFacebook,
  generateSocialMediaImage
} from '@/lib/social-media-content-generator';

export const dynamic = 'force-dynamic';

/**
 * Automatische Planning Generator
 * Genereert automatisch een volledige week social media posts
 */
export async function POST(request: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.email) {
      return NextResponse.json({ error: 'Niet geautoriseerd' }, { status: 401 });
    }

    const body = await request.json();
    const { projectId, numberOfDays = 7, platforms = ['linkedin', 'facebook'] } = body;

    if (!projectId) {
      return NextResponse.json({ error: 'Project ID is verplicht' }, { status: 400 });
    }

    // Verify project ownership
    const project = await prisma.project.findFirst({
      where: {
        id: projectId,
        client: { email: session.user.email },
      },
      include: {
        socialMediaConfig: true,
      },
    });

    if (!project) {
      return NextResponse.json({ error: 'Project niet gevonden' }, { status: 404 });
    }

    // Get published articles
    const articles = await prisma.savedContent.findMany({
      where: {
        projectId: project.id,
        publishedAt: { not: null },
      },
      orderBy: { updatedAt: 'desc' },
      take: 20,
    });

    if (articles.length === 0) {
      return NextResponse.json({ 
        error: 'Geen gepubliceerde content gevonden. Maak eerst content aan met de Writgo Writer.' 
      }, { status: 400 });
    }

    const generatedPosts: any[] = [];
    const startDate = new Date();
    const postsPerDay = 1; // 1 post per dag

    // Generate posts for each day
    for (let day = 0; day < numberOfDays; day++) {
      const postDate = new Date(startDate);
      postDate.setDate(startDate.getDate() + day);
      
      // Stel optimale tijd in (09:00 voor werkdagen, 11:00 voor weekend)
      const dayOfWeek = postDate.getDay();
      const isWeekend = dayOfWeek === 0 || dayOfWeek === 6;
      postDate.setHours(isWeekend ? 11 : 9, 0, 0, 0);

      for (let i = 0; i < postsPerDay; i++) {
        // Selecteer een artikel (varieer tussen recent en oudere artikelen)
        const articleIndex = (day * postsPerDay + i) % articles.length;
        const selectedArticle = articles[articleIndex];

        try {
          // Genereer content per platform
          for (const platform of platforms) {
            try {
              // Blog promotion
              const generatedPost = await generateBlogPromoPost(
                platform,
                {
                  title: selectedArticle.title,
                  excerpt: selectedArticle.description || selectedArticle.metaDesc || selectedArticle.title,
                  url: selectedArticle.publishedUrl || `${project.websiteUrl}/${selectedArticle.slug || selectedArticle.id}`,
                  keywords: selectedArticle.keywords || [],
                },
                {
                  brandVoice: undefined,
                  targetAudience: undefined,
                  niche: project.niche || project.name,
                  tone: 'professional',
                  includeHashtags: true,
                  includeEmojis: true,
                }
              );
              
              let content = generatedPost.content;
              const contentType = 'blog_promo';

              // Remove markdown for Facebook
              if (platform === 'facebook') {
                content = removeMarkdownForFacebook(content);
              }

              // Create draft post
              if (content) {
                // Generate AI image for this post
                console.log(`🎨 Generating AI image for ${platform} post (day ${day + 1})...`);
                const imageS3Key = await generateSocialMediaImage(content, {
                  niche: project.niche || project.name,
                  brandVoice: undefined,
                });

                const createdPost = await prisma.socialMediaPost.create({
                  data: {
                    projectId: project.id,
                    platforms: [platform],
                    content,
                    mediaUrl: imageS3Key || undefined, // AI-generated image
                    contentType,
                    status: 'draft',
                    scheduledFor: postDate,
                    linkUrl: selectedArticle.publishedUrl || `${project.websiteUrl}/${selectedArticle.slug || selectedArticle.id}`,
                    creditsUsed: 0, // Credits worden pas berekend bij publicatie
                  },
                });

                generatedPosts.push({
                  id: createdPost.id,
                  platform,
                  content: content.substring(0, 100) + '...',
                  scheduledFor: postDate.toISOString(),
                  articleTitle: selectedArticle.title,
                  hasImage: !!imageS3Key,
                });
              }
            } catch (platformError) {
              console.error(`Error generating post for platform ${platform}:`, platformError);
              // Continue met volgende platform
            }
          }
        } catch (error) {
          console.error(`Error generating post for day ${day}:`, error);
          // Continue met volgende post
        }
      }
    }

    return NextResponse.json({
      success: true,
      generated: generatedPosts.length,
      posts: generatedPosts,
      message: `${generatedPosts.length} posts succesvol gegenereerd voor ${numberOfDays} dagen!`,
    });

  } catch (error) {
    console.error('Error generating planning:', error);
    return NextResponse.json(
      { error: 'Fout bij genereren van planning' },
      { status: 500 }
    );
  }
}
