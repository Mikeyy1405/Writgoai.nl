import { config } from 'dotenv';
config();

console.log('Testing Projects API endpoint simulation...\n');

// Simulate the API endpoint logic
import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();

async function testProjectsAPI() {
  try {
    // Simulate fetching projects for a specific client
    const testClientEmail = 'info@WritgoAI.nl';
    
    // Find the client first
    const client = await prisma.client.findUnique({
      where: { email: testClientEmail }
    });
    
    if (!client) {
      console.log('❌ Client not found:', testClientEmail);
      return;
    }
    
    console.log('✅ Client found:', client.name, `(${client.email})`);
    console.log(`   Client ID: ${client.id}\n`);
    
    // Fetch projects for this client (like the API does)
    const projects = await prisma.project.findMany({
      where: {
        clientId: client.id
      },
      include: {
        _count: {
          select: {
            savedContent: true,
            knowledgeBase: true,
            articleIdeas: true
          }
        }
      },
      orderBy: {
        createdAt: 'desc'
      }
    });
    
    console.log(`📊 Found ${projects.length} projects for this client:\n`);
    
    projects.forEach((p, i) => {
      console.log(`${i + 1}. ${p.name}`);
      console.log(`   URL: ${p.websiteUrl}`);
      console.log(`   Content: ${p._count.savedContent} | Knowledge: ${p._count.knowledgeBase} | Ideas: ${p._count.articleIdeas}`);
      console.log(`   Primary: ${p.isPrimary ? 'Yes' : 'No'}`);
      console.log(`   WordPress: ${p.wordpressUrl || 'Not configured'}`);
      console.log();
    });
    
  } catch (error) {
    console.error('❌ Error:', error.message);
  } finally {
    await prisma.$disconnect();
  }
}

testProjectsAPI();
