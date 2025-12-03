import { PrismaClient } from '@prisma/client';
import * as dotenv from 'dotenv';

dotenv.config();

const prisma = new PrismaClient();

async function checkAutopilot() {
  try {
    const now = new Date();
    console.log('Current time (UTC):', now.toISOString());
    console.log('Current time (NL):', now.toLocaleString('nl-NL', { timeZone: 'Europe/Amsterdam' }));
    console.log('\n---\n');
    
    const projects = await prisma.project.findMany({
      where: {
        autopilotEnabled: true
      },
      select: {
        id: true,
        name: true,
        autopilotEnabled: true,
        autopilotLastRun: true,
        autopilotNextRun: true,
        autopilotFrequency: true,
        autopilotArticlesPerRun: true,
        autopilotMode: true,
        _count: {
          select: {
            articleIdeas: {
              where: {
                status: 'idea',
                hasContent: false
              }
            }
          }
        }
      }
    });
    
    console.log(`Found ${projects.length} projects with autopilot enabled:\n`);
    
    for (const project of projects) {
      console.log(`Project: ${project.name}`);
      console.log(`  ID: ${project.id}`);
      console.log(`  Frequency: ${project.autopilotFrequency}`);
      console.log(`  Articles per run: ${project.autopilotArticlesPerRun}`);
      console.log(`  Mode: ${project.autopilotMode}`);
      console.log(`  Last run: ${project.autopilotLastRun ? project.autopilotLastRun.toISOString() : 'Never'}`);
      console.log(`  Next run: ${project.autopilotNextRun ? project.autopilotNextRun.toISOString() : 'Not set'}`);
      console.log(`  Available article ideas: ${project._count.articleIdeas}`);
      
      if (project.autopilotNextRun) {
        const shouldRun = project.autopilotNextRun <= now;
        console.log(`  Should run now: ${shouldRun ? 'YES' : 'NO'}`);
        if (!shouldRun) {
          const hoursUntil = (project.autopilotNextRun.getTime() - now.getTime()) / (1000 * 60 * 60);
          console.log(`  Hours until next run: ${hoursUntil.toFixed(2)}`);
        }
      } else {
        console.log(`  Should run now: YES (nextRun not set)`);
      }
      
      console.log('');
    }
    
  } catch (error) {
    console.error('Error:', error);
  } finally {
    await prisma.$disconnect();
  }
}

checkAutopilot();
