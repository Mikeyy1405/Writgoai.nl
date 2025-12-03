import { PrismaClient } from '@prisma/client';
import dotenv from 'dotenv';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Load .env file
dotenv.config({ path: join(__dirname, '../.env') });

const prisma = new PrismaClient();

async function enableWritgoAIBlogPublish() {
  try {
    console.log('🚀 Enabling WritgoAI Blog publish for WritgoAI project...');
    
    // Find the WritgoAI Blog project
    const project = await prisma.project.findFirst({
      where: {
        websiteUrl: {
          contains: 'WritgoAI.nl'
        }
      }
    });
    
    if (!project) {
      console.log('❌ WritgoAI project not found!');
      process.exit(1);
    }
    
    console.log(`   Found project: ${project.name} (${project.id})`);
    
    // Update the project to enable blog publishing
    const updatedProject = await prisma.project.update({
      where: { id: project.id },
      data: {
        autopilotPublishToWritgoaiBlog: true
      }
    });
    
    console.log('✅ WritgoAI Blog publish enabled!');
    console.log(`   Project: ${updatedProject.name}`);
    console.log(`   URL: ${updatedProject.websiteUrl}`);
    console.log(`   autopilotPublishToWritgoaiBlog: ${updatedProject.autopilotPublishToWritgoaiBlog}`);
    console.log('');
    console.log('📋 Next steps:');
    console.log('   1. Open Autopilot page');
    console.log('   2. Select "WritgoAI Blog" project');
    console.log('   3. Add some article ideas');
    console.log('   4. Run "Nu uitvoeren"');
    console.log('   5. Check https://WritgoAI.nl/blog for published articles!');
    
    return updatedProject;
    
  } catch (error) {
    console.error('❌ Error enabling blog publish:', error);
    throw error;
  } finally {
    await prisma.$disconnect();
  }
}

enableWritgoAIBlogPublish();
