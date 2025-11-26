const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function checkDB() {
  try {
    // Get all clients
    const clients = await prisma.client.findMany({
      select: {
        id: true,
        email: true,
        name: true,
        contentPlan: true,
        lastPlanGenerated: true,
        wordpressUrl: true,
        automationActive: true,
      }
    });
    
    console.log('\n========== CLIENTS ===========');
    for (const client of clients) {
      console.log(`\nClient: ${client.name} (${client.email})`);
      console.log(`  ID: ${client.id}`);
      console.log(`  WordPress: ${client.wordpressUrl || 'NIET VERBONDEN'}`);
      console.log(`  Automation: ${client.automationActive ? 'AAN' : 'UIT'}`);
      console.log(`  Content Plan: ${client.contentPlan ? 'JA (' + JSON.parse(JSON.stringify(client.contentPlan)).length + ' dagen)' : 'NEE - LEEG!'}`);
      console.log(`  Last Generated: ${client.lastPlanGenerated || 'Nooit'}`);
    }
    
    // Get all content pieces
    const contentPieces = await prisma.contentPiece.findMany({
      orderBy: { createdAt: 'desc' },
      take: 10,
      select: {
        id: true,
        dayNumber: true,
        theme: true,
        status: true,
        blogTitle: true,
        socialCaption: true,
        reelTitle: true,
        scheduledFor: true,
        client: {
          select: { name: true, email: true }
        }
      }
    });
    
    console.log('\n\n========== CONTENT PIECES (laatste 10) ===========');
    console.log(`Totaal: ${contentPieces.length} stuks\n`);
    for (const piece of contentPieces) {
      console.log(`Dag ${piece.dayNumber}: ${piece.theme}`);
      console.log(`  Client: ${piece.client.name}`);
      console.log(`  Status: ${piece.status}`);
      console.log(`  Blog: ${piece.blogTitle ? '✅ ' + piece.blogTitle : '❌'}`);
      console.log(`  Social: ${piece.socialCaption ? '✅' : '❌'}`);
      console.log(`  Video: ${piece.reelTitle ? '✅ ' + piece.reelTitle : '❌'}`);
      console.log(`  Scheduled: ${piece.scheduledFor}`);
      console.log('');
    }
    
  } catch (error) {
    console.error('Error:', error);
  } finally {
    await prisma.$disconnect();
  }
}

checkDB();
