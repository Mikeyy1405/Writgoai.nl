import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth-options';
import { prisma } from '@/lib/prisma-shim';
import { generate30DayContentPlan } from '@/lib/services/aiml';

/**
 * POST /api/projects/[id]/autopilot/start
 * Start autopilot content generation for a project
 */
export async function POST(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    // Verify authentication
    const session = await getServerSession(authOptions);
    if (!session?.user?.email) {
      return NextResponse.json({ error: 'Niet ingelogd' }, { status: 401 });
    }

    const body = await request.json();
    const projectId = params.id;

    console.log('🔵 Starting autopilot for project:', projectId);

    // Get project
    const project = await prisma.project.findUnique({
      where: { id: projectId }
    });

    if (!project) {
      return NextResponse.json({ error: 'Project niet gevonden' }, { status: 404 });
    }

    // Validate inputs
    const niche = body.niche || project.niche || 'algemeen';
    const targetAudience = body.targetAudience || project.targetAudience || 'algemeen publiek';
    const blogPostsPerWeek = body.blogPostsPerWeek || 4;
    const socialPostsPerDay = body.socialPostsPerDay || 2;
    const contentThemes = body.contentThemes || [];

    console.log('🔵 Configuration:', {
      niche,
      targetAudience,
      blogPostsPerWeek,
      socialPostsPerDay,
      contentThemes
    });

    // Generate 30-day content plan using AIML API
    console.log('🔵 Generating 30-day content plan with AI...');
    const contentPlan = await generate30DayContentPlan({
      niche,
      targetAudience,
      blogPostsPerWeek,
      socialPostsPerDay,
      contentThemes
    });

    console.log('✅ Content plan generated:', {
      blogTopics: contentPlan.blogTopics.length,
      socialTopics: contentPlan.socialTopics.length
    });

    // Create content plan in database
    const startDate = new Date();
    const endDate = new Date();
    endDate.setDate(endDate.getDate() + 30);

    const plan = await prisma.contentPlan.create({
      data: {
        projectId,
        startDate,
        endDate,
        status: 'active',
        blogPostsPerWeek,
        socialPostsPerDay,
        niche,
        targetAudience,
        contentThemes
      }
    });

    console.log('✅ Content plan created in database:', plan.id);

    // Create blog posts with scheduled dates
    const blogPosts = [];
    const daysPerPost = 7 / blogPostsPerWeek;
    
    for (let i = 0; i < contentPlan.blogTopics.length; i++) {
      const topic = contentPlan.blogTopics[i];
      const scheduledDate = new Date(startDate);
      scheduledDate.setDate(scheduledDate.getDate() + Math.floor(i * daysPerPost));
      scheduledDate.setHours(9, 0, 0, 0); // Schedule at 09:00

      // Generate slug from title
      const slug = topic.title
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, '-')
        .replace(/(^-|-$)/g, '');

      try {
        const blogPost = await prisma.blogPost.create({
          data: {
            projectId,
            clientId: project.clientId,
            title: topic.title,
            slug: `${slug}-${Date.now()}`, // Add timestamp to ensure uniqueness
            content: topic.outline, // Will be generated later by cron job
            excerpt: topic.outline,
            focusKeyword: topic.keywords[0] || '',
            keywords: topic.keywords,
            status: 'scheduled',
            scheduledAt: scheduledDate,
            contentPlanId: plan.id
          }
        });
        blogPosts.push(blogPost);
      } catch (error) {
        console.error('❌ Error creating blog post:', error);
        // Continue with other posts even if one fails
      }
    }

    console.log(`✅ Created ${blogPosts.length} scheduled blog posts`);

    // Create social media posts with scheduled dates
    const socialPosts = [];
    const hoursPerPost = 24 / socialPostsPerDay;
    
    for (let i = 0; i < contentPlan.socialTopics.length; i++) {
      const topic = contentPlan.socialTopics[i];
      const dayIndex = Math.floor(i / socialPostsPerDay);
      const postIndexInDay = i % socialPostsPerDay;
      
      const scheduledDate = new Date(startDate);
      scheduledDate.setDate(scheduledDate.getDate() + dayIndex);
      scheduledDate.setHours(10 + (postIndexInDay * hoursPerPost), 0, 0, 0);

      try {
        // Find or create social media strategy
        let strategy = await prisma.socialMediaStrategy.findFirst({
          where: { clientId: project.clientId }
        });

        if (!strategy) {
          strategy = await prisma.socialMediaStrategy.create({
            data: {
              clientId: project.clientId,
              name: `${project.name} - Social Media Strategy`,
              niche,
              targetAudience,
              totalPosts: contentPlan.socialTopics.length,
              platforms: ['instagram', 'facebook', 'linkedin'],
              period: '1-month',
              postingFrequency: { instagram: 7, facebook: 5, linkedin: 3 },
              status: 'generating'
            }
          });
        }

        const socialPost = await prisma.socialMediaPost.create({
          data: {
            strategyId: strategy.id,
            platform: topic.platform,
            content: topic.topic, // Will be generated later by cron job
            status: 'scheduled',
            scheduledAt: scheduledDate,
            contentPlanId: plan.id
          }
        });
        socialPosts.push(socialPost);
      } catch (error) {
        console.error('❌ Error creating social post:', error);
        // Continue with other posts even if one fails
      }
    }

    console.log(`✅ Created ${socialPosts.length} scheduled social media posts`);

    // Create or update autopilot config
    const autopilotConfig = await prisma.autopilotConfig.upsert({
      where: { 
        type_planId: {
          type: 'content',
          planId: plan.id
        }
      },
      create: {
        clientId: project.clientId,
        projectId: projectId,
        type: 'content',
        planId: plan.id,
        contentPlanId: plan.id,
        enabled: true,
        frequency: '3x-week',
        time: '09:00',
        weekdays: [1, 3, 5], // Monday, Wednesday, Friday
        maxPerDay: 1,
        autoPublish: true
      },
      update: {
        enabled: true,
        projectId: projectId,
        contentPlanId: plan.id
      }
    });

    console.log('✅ Autopilot configuration created/updated:', autopilotConfig.id);

    // Log success
    await prisma.autopilotLog.create({
      data: {
        projectId,
        action: 'autopilot_started',
        status: 'success',
        details: {
          planId: plan.id,
          blogPostsCreated: blogPosts.length,
          socialPostsCreated: socialPosts.length
        }
      }
    });

    console.log('✅ Autopilot started successfully');

    return NextResponse.json({
      success: true,
      message: 'Autopilot gestart!',
      data: {
        planId: plan.id,
        startDate: plan.startDate,
        endDate: plan.endDate,
        blogPostsCreated: blogPosts.length,
        socialPostsCreated: socialPosts.length,
        autopilotEnabled: true
      }
    });

  } catch (error: any) {
    console.error('❌ Start autopilot error:', error);
    
    // Log error
    try {
      await prisma.autopilotLog.create({
        data: {
          projectId: params.id,
          action: 'autopilot_start_error',
          status: 'error',
          errorMessage: error.message
        }
      });
    } catch (logError) {
      console.error('❌ Error logging autopilot error:', logError);
    }

    return NextResponse.json({ 
      error: error.message || 'Fout bij starten autopilot',
      details: error.stack
    }, { status: 500 });
  }
}

// Enable dynamic route
export const dynamic = 'force-dynamic';
