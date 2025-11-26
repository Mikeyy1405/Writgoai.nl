import { PrismaClient } from '@prisma/client';
import dotenv from 'dotenv';

dotenv.config();

const prisma = new PrismaClient();

async function checkArticle() {
  try {
    // Find the article by URL
    const savedContent = await prisma.savedContent.findFirst({
      where: {
        publishedUrl: 'https://yogastartgids.nl/korte-yoga-oefeningen/'
      },
      include: {
        articleIdea: true
      }
    });

    if (savedContent) {
      console.log('=== ARTICLE FOUND ===');
      console.log('Title:', savedContent.title);
      console.log('Word Count:', savedContent.wordCount);
      console.log('Content Length:', savedContent.content?.length || 0);
      console.log('ContentHtml Length:', savedContent.contentHtml?.length || 0);
      console.log('Generator Type:', savedContent.generatorType);
      console.log('Created At:', savedContent.createdAt);
      console.log('Published At:', savedContent.publishedAt);
      
      // Check if content is complete
      const content = savedContent.contentHtml || savedContent.content;
      const hasRoutine3 = content?.includes('Routine 3') || content?.includes('routine 3');
      const hasRoutine4 = content?.includes('Routine 4') || content?.includes('routine 4');
      const hasRoutine5 = content?.includes('Routine 5') || content?.includes('routine 5');
      
      console.log('\n=== CONTENT CHECK ===');
      console.log('Has Routine 3:', hasRoutine3);
      console.log('Has Routine 4:', hasRoutine4);
      console.log('Has Routine 5:', hasRoutine5);
      
      // Show last 1000 chars
      console.log('\n=== LAST 1000 CHARACTERS ===');
      console.log(content?.substring(content.length - 1000));
      
      // Check for AutopilotJob
      if (savedContent.articleIdea) {
        const autopilotJob = await prisma.autopilotJob.findFirst({
          where: {
            articleId: savedContent.articleIdea.id
          },
          orderBy: {
            startedAt: 'desc'
          }
        });
        
        if (autopilotJob) {
          console.log('\n=== AUTOPILOT JOB ===');
          console.log('Status:', autopilotJob.status);
          console.log('Progress:', autopilotJob.progress);
          console.log('Current Step:', autopilotJob.currentStep);
          console.log('Error:', autopilotJob.error || 'None');
          console.log('Started At:', autopilotJob.startedAt);
          console.log('Completed At:', autopilotJob.completedAt);
        }
      }
    } else {
      console.log('Article not found in database');
      
      // Try to find recent articles about yoga
      console.log('\n=== RECENT YOGA ARTICLES ===');
      const recentArticles = await prisma.savedContent.findMany({
        where: {
          title: {
            contains: 'yoga',
            mode: 'insensitive'
          }
        },
        orderBy: {
          createdAt: 'desc'
        },
        take: 5,
        select: {
          id: true,
          title: true,
          wordCount: true,
          publishedUrl: true,
          createdAt: true
        }
      });
      
      recentArticles.forEach(article => {
        console.log(`- ${article.title} (${article.wordCount} words) - ${article.publishedUrl || 'Not published'}`);
      });
    }
  } catch (error) {
    console.error('Error:', error.message);
  } finally {
    await prisma.$disconnect();
  }
}

checkArticle();
