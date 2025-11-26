import { PrismaClient } from '@prisma/client';
import * as dotenv from 'dotenv';

// Load environment variables
dotenv.config();

const prisma = new PrismaClient();

async function updateImageModels() {
  try {
    console.log('🔄 Updating all projects to use Flux Pro...');
    
    const result = await prisma.project.updateMany({
      where: {
        OR: [
          { imageModel: 'stable-diffusion-3' },
          { imageModel: 'stable-diffusion-35' },
        ]
      },
      data: {
        imageModel: 'flux-pro',
      },
    });
    
    console.log(`✅ Successfully updated ${result.count} projects to Flux Pro`);
    
    // Toon overzicht van alle projecten
    const allProjects = await prisma.project.findMany({
      select: {
        id: true,
        name: true,
        imageModel: true,
      },
    });
    
    console.log('\n📊 Current project image models:');
    allProjects.forEach(project => {
      console.log(`  - ${project.name}: ${project.imageModel}`);
    });
    
  } catch (error) {
    console.error('❌ Error updating projects:', error);
  } finally {
    await prisma.$disconnect();
  }
}

updateImageModels();
