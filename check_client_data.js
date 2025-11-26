const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function checkClientData() {
  try {
    // Check all clients
    const clients = await prisma.client.findMany({
      include: {
        contentPlan: true,
        profile: true,
        articles: {
          take: 5,
          orderBy: { createdAt: 'desc' }
        }
      }
    });

    console.log('=== CLIENT DATA ===');
    console.log(`Found ${clients.length} clients\n`);

    clients.forEach(client => {
      console.log(`Client: ${client.name} (${client.email})`);
      console.log(`  ID: ${client.id}`);
      console.log(`  Automation Active: ${client.automationActive}`);
      console.log(`  Content Plan Items: ${client.contentPlan?.length || 0}`);
      console.log(`  Articles: ${client.articles?.length || 0}`);
      console.log(`  Profile exists: ${client.profile ? 'Yes' : 'No'}`);
      
      if (client.profile) {
        console.log(`  Website: ${client.profile.website || 'Not set'}`);
        console.log(`  Target Audience: ${client.profile.targetAudience || 'Not set'}`);
        console.log(`  Topics: ${client.profile.topics || 'Not set'}`);
      }
      
      if (client.contentPlan && client.contentPlan.length > 0) {
        console.log('\n  Content Plan:');
        client.contentPlan.slice(0, 3).forEach(item => {
          console.log(`    - ${item.title} (${item.contentType}) - Status: ${item.status}`);
        });
      }
      
      console.log('\n---\n');
    });

  } catch (error) {
    console.error('Error:', error);
  } finally {
    await prisma.$disconnect();
  }
}

checkClientData();
