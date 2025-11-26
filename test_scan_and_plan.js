const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function testContentPlan() {
  try {
    const client = await prisma.client.findUnique({
      where: { email: 'mikeschonewille@gmail.com' }
    });
    
    if (!client) {
      console.log('Client niet gevonden');
      return;
    }

    console.log('Client info:');
    console.log('- ID:', client.id);
    console.log('- WordPress URL:', client.wordpressUrl || 'Niet ingesteld');
    console.log('- WordPress Username:', client.wordpressUsername || 'Niet ingesteld');
    console.log('- Target Audience:', client.targetAudience || 'Niet ingesteld');
    console.log('- Keywords:', client.keywords?.length || 0, 'keywords');
    console.log('- Content Plan:', client.contentPlan ? 'JA' : 'NEE');
    
    if (client.contentPlan) {
      const plan = Array.isArray(client.contentPlan) ? client.contentPlan : [];
      console.log('- Plan length:', plan.length, 'dagen');
    }
    
    // Check if WordPress is connected
    if (client.wordpressUrl && client.wordpressUsername) {
      console.log('\n✅ WordPress is verbonden');
      console.log('📝 Je kunt nu een scan uitvoeren om een content plan te maken');
    } else {
      console.log('\n❌ WordPress is niet verbonden');
      console.log('📝 Verbind eerst WordPress om een content plan te kunnen maken');
    }
  } catch (error) {
    console.error('Error:', error);
  } finally {
    await prisma.$disconnect();
  }
}

testContentPlan();
