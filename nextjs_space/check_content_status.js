require('dotenv').config();
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function checkContentStatus() {
  try {
    const clients = await prisma.client.findMany({
      include: {
        contentPieces: {
          take: 5,
          orderBy: { createdAt: 'desc' }
        }
      }
    });

    console.log('=== CLIENT & CONTENT STATUS ===\n');
    
    for (const client of clients) {
      console.log(`Client: ${client.companyName} (${client.email})`);
      console.log(`Website: ${client.website}`);
      console.log(`Automation Active: ${client.automationActive}`);
      console.log(`Content Plan (JSON): ${client.contentPlan ? 'YES' : 'NO'}`);
      
      if (client.contentPlan) {
        try {
          const plan = JSON.parse(client.contentPlan);
          console.log(`  - Topics: ${plan.topics?.length || 0}`);
          console.log(`  - Strategy: ${plan.strategy ? 'YES' : 'NO'}`);
        } catch (e) {
          console.log('  - Error parsing plan');
        }
      }
      
      console.log(`Content Pieces: ${client.contentPieces.length}`);
      
      if (client.contentPieces.length > 0) {
        client.contentPieces.forEach(piece => {
          console.log(`  - [${piece.contentType}] ${piece.title || 'Untitled'} (${piece.status}) - ${piece.createdAt}`);
        });
      }
      
      console.log('\n---\n');
    }

  } catch (error) {
    console.error('Error:', error);
  } finally {
    await prisma.$disconnect();
  }
}

checkContentStatus();
