require('dotenv').config();
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function checkClientData() {
  try {
    const clients = await prisma.client.findMany({
      include: {
        contentPieces: {
          take: 5,
          orderBy: { createdAt: 'desc' }
        }
      }
    });

    console.log('=== CLIENT DATA ===');
    console.log(`Found ${clients.length} clients\n`);

    clients.forEach(client => {
      console.log(`\nClient: ${client.name} (${client.email})`);
      console.log(`  ID: ${client.id}`);
      console.log(`  Automation Active: ${client.automationActive}`);
      console.log(`  Website: ${client.website || 'Not set'}`);
      console.log(`  Target Audience: ${client.targetAudience || 'Not set'}`);
      console.log(`  Keywords: ${client.keywords?.join(', ') || 'Not set'}`);
      
      console.log(`\n  WordPress Connection:`);
      console.log(`    URL: ${client.wordpressUrl || 'Not set'}`);
      console.log(`    Username: ${client.wordpressUsername || 'Not set'}`);
      console.log(`    Sitemap fetched: ${client.wordpressSitemapDate ? 'Yes' : 'No'}`);
      
      console.log(`\n  Content Plan:`);
      if (client.contentPlan) {
        const plan = typeof client.contentPlan === 'string' ? JSON.parse(client.contentPlan) : client.contentPlan;
        console.log(`    Plan exists: Yes`);
        console.log(`    Last generated: ${client.lastPlanGenerated || 'Unknown'}`);
        if (plan.days) {
          console.log(`    Days in plan: ${plan.days.length}`);
          console.log(`    First 3 days:`);
          plan.days.slice(0, 3).forEach((day, i) => {
            console.log(`      Day ${day.dayNumber || i+1}: ${day.theme}`);
          });
        }
      } else {
        console.log(`    No content plan found!`);
      }
      
      console.log(`\n  Generated Content:`);
      console.log(`    Total pieces: ${client.contentPieces?.length || 0}`);
      if (client.contentPieces && client.contentPieces.length > 0) {
        client.contentPieces.forEach(piece => {
          console.log(`      - Day ${piece.dayNumber}: ${piece.theme} (${piece.status})`);
        });
      }
      
      console.log('\n---');
    });

  } catch (error) {
    console.error('Error:', error);
  } finally {
    await prisma.$disconnect();
  }
}

checkClientData();
