const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function checkRecentClients() {
  console.log('🔍 Checking recent clients and subscriptions...\n');
  
  // Get all clients from last 7 days
  const sevenDaysAgo = new Date();
  sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
  
  const recentClients = await prisma.client.findMany({
    where: {
      createdAt: {
        gte: sevenDaysAgo
      }
    },
    orderBy: {
      createdAt: 'desc'
    },
    select: {
      id: true,
      email: true,
      name: true,
      createdAt: true,
      subscriptionId: true,
      subscriptionPlan: true,
      subscriptionStatus: true,
      subscriptionCredits: true,
      topUpCredits: true,
      monthlyCredits: true,
    }
  });
  
  console.log(`Found ${recentClients.length} clients from last 7 days:\n`);
  
  recentClients.forEach((client, index) => {
    console.log(`${index + 1}. ${client.name} (${client.email})`);
    console.log(`   Created: ${client.createdAt.toLocaleString('nl-NL')}`);
    console.log(`   Subscription ID: ${client.subscriptionId || '❌ GEEN'}`);
    console.log(`   Plan: ${client.subscriptionPlan || '❌ GEEN'}`);
    console.log(`   Status: ${client.subscriptionStatus || '❌ GEEN'}`);
    console.log(`   Monthly Credits: ${client.monthlyCredits || 0}`);
    console.log(`   Subscription Credits: ${client.subscriptionCredits || 0}`);
    console.log(`   TopUp Credits: ${client.topUpCredits || 0}`);
    console.log('');
  });
  
  // Check for clients with credits but no subscription
  const clientsWithoutSub = recentClients.filter(c => 
    !c.subscriptionId && (c.topUpCredits > 1000 || c.monthlyCredits > 0)
  );
  
  if (clientsWithoutSub.length > 0) {
    console.log('\n⚠️  PROBLEEM GEVONDEN:');
    console.log(`${clientsWithoutSub.length} clients hebben credits maar GEEN subscription ID:\n`);
    clientsWithoutSub.forEach(c => {
      console.log(`- ${c.name} (${c.email})`);
      console.log(`  Monthly: ${c.monthlyCredits}, TopUp: ${c.topUpCredits}`);
    });
  }
  
  await prisma.$disconnect();
}

checkRecentClients().catch(console.error);
