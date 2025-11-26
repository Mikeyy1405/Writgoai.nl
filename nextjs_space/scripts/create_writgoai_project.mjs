import { PrismaClient } from '@prisma/client';
import dotenv from 'dotenv';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Load .env file
dotenv.config({ path: join(__dirname, '../.env') });

const prisma = new PrismaClient();

async function createWritgoAIProject() {
  try {
    console.log('🚀 Creating WritgoAI.nl project...');
    
    // Get the admin/owner client
    const adminClient = await prisma.client.findFirst({
      orderBy: {
        createdAt: 'asc'
      }
    });
    
    if (!adminClient) {
      console.log('❌ No clients found in database!');
      process.exit(1);
    }
    
    console.log(`   Using client: ${adminClient.email}`);
    
    // Check if project already exists
    const existing = await prisma.project.findFirst({
      where: {
        websiteUrl: {
          contains: 'WritgoAI.nl'
        }
      }
    });
    
    if (existing) {
      console.log('✅ WritgoAI project already exists!');
      console.log(`   Project ID: ${existing.id}`);
      console.log(`   Name: ${existing.name}`);
      return existing;
    }
    
    // Create the project with correct fields only
    const project = await prisma.project.create({
      data: {
        name: 'WritgoAI Blog',
        websiteUrl: 'https://WritgoAI.nl',
        description: 'Officiële WritgoAI blog voor AI nieuws, content marketing tips, en product updates',
        niche: 'AI & Content Marketing',
        targetAudience: 'Content creators, marketeers, ondernemers, en bloggers',
        businessGoals: 'Delen van AI nieuws, tips & tricks, product reviews, en industry insights',
        contentTopics: 'AI ontwikkelingen, content marketing strategieën, SEO tips, AI tools reviews, ChatGPT updates',
        uniqueSellingPoints: 'Expert AI content, praktische tips, Nederlandse markt focus',
        clientId: adminClient.id,
        isPrimary: false,
        isActive: true,
        // Keywords and content pillars
        keywords: ['AI nieuws', 'content marketing', 'AI tools', 'ChatGPT', 'SEO', 'GPT-4'],
        contentPillars: ['AI & Technologie', 'Content Marketing', 'SEO & Optimalisatie', 'Product Reviews'],
        // Autopilot settings
        autopilotEnabled: true,
        autopilotMode: 'research',
        autopilotFrequency: 'daily',
        autopilotArticlesPerRun: 1,
        autopilotPriority: 'high',
        autopilotContentType: 'seo_optimized',
        autopilotAutoPublish: false,
        autopilotIncludeFAQ: true,
        autopilotIncludeDirectAnswer: true,
        autopilotIncludeYouTube: false,
        autopilotWordCount: 2000
      }
    });
    
    console.log('✅ WritgoAI project created successfully!');
    console.log(`   Project ID: ${project.id}`);
    console.log(`   Name: ${project.name}`);
    console.log(`   URL: ${project.websiteUrl}`);
    console.log(`   Owner: ${adminClient.email}`);
    console.log('');
    console.log('📋 Project configured with:');
    console.log('   - Autopilot: Enabled (daily, research mode)');
    console.log('   - Content type: SEO optimized');
    console.log('   - Word count: 2000');
    console.log('   - FAQ sections: Yes');
    console.log('   - Direct Answer: Yes');
    console.log('   - Articles per run: 1');
    
    return project;
    
  } catch (error) {
    console.error('❌ Error creating project:', error);
    throw error;
  } finally {
    await prisma.$disconnect();
  }
}

createWritgoAIProject();
