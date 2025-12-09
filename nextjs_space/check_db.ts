
import { prisma } from './lib/db';

async function main() {
  try {
    console.log('Checking database tables...\n');
    
    // Check verschillende tabellen
    const [clients, projects, savedContent, articleIdeas, users] = await Promise.all([
      prisma.client.count().catch(() => 0),
      prisma.project.count().catch(() => 0),
      prisma.savedContent.count().catch(() => 0),
      prisma.articleIdea.count().catch(() => 0),
      prisma.user.count().catch(() => 0),
    ]);
    
    console.log('=== TABLE COUNTS ===');
    console.log(`Clients: ${clients}`);
    console.log(`Projects: ${projects}`);
    console.log(`SavedContent: ${savedContent}`);
    console.log(`ArticleIdeas: ${articleIdeas}`);
    console.log(`Users: ${users}`);
    console.log('');
    
    // Als er SavedContent is, toon details
    if (savedContent > 0) {
      console.log('=== SAVED CONTENT DETAILS (RECENT 5) ===');
      const content = await prisma.savedContent.findMany({
        take: 5,
        orderBy: { createdAt: 'desc' },
        select: {
          id: true,
          title: true,
          type: true,
          clientId: true,
          projectId: true,
          createdAt: true,
        }
      });
      
      content.forEach(item => {
        console.log(`\n- ${item.title || '(geen titel)'}`);
        console.log(`  Type: ${item.type}`);
        console.log(`  ClientID: ${item.clientId || 'null'}`);
        console.log(`  ProjectID: ${item.projectId || 'null'}`);
        console.log(`  Created: ${item.createdAt.toISOString()}`);
      });
      console.log('');
    }
    
    // Als er clients zijn, toon details
    if (clients > 0) {
      console.log('\n=== CLIENTS (TOP 3) ===');
      const clientData = await prisma.client.findMany({
        take: 3,
        select: {
          id: true,
          email: true,
          name: true,
          createdAt: true,
        }
      });
      
      clientData.forEach(client => {
        console.log(`\n- ${client.name} (${client.email})`);
        console.log(`  ID: ${client.id}`);
        console.log(`  Created: ${client.createdAt.toISOString()}`);
      });
      console.log('');
    }
    
    // Als er projects zijn, toon details
    if (projects > 0) {
      console.log('\n=== PROJECTS (TOP 5) ===');
      const projectData = await prisma.project.findMany({
        take: 5,
        select: {
          id: true,
          name: true,
          websiteUrl: true,
          clientId: true,
          createdAt: true,
        }
      });
      
      projectData.forEach(project => {
        console.log(`\n- ${project.name}`);
        console.log(`  URL: ${project.websiteUrl || 'n/a'}`);
        console.log(`  ClientID: ${project.clientId}`);
        console.log(`  Created: ${project.createdAt.toISOString()}`);
      });
      console.log('');
    }
    
  } catch (error: any) {
    console.error('Error:', error.message);
    if (error.stack) console.error(error.stack);
  } finally {
    await prisma.$disconnect();
  }
}

main();
