require('dotenv').config();
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function migrateCredits() {
  console.log('🔄 Starting credit migration...');
  
  // Haal alle clients op met hun oude credits
  const clients = await prisma.client.findMany({
    where: {
      credits: { gt: 0 }
    },
    select: {
      id: true,
      email: true,
      credits: true,
      subscriptionPlan: true,
      subscriptionStatus: true
    }
  });

  console.log(`Found ${clients.length} clients with credits to migrate`);

  for (const client of clients) {
    // Als de client een actief abonnement heeft, zet credits als subscriptionCredits
    // Anders als top-up credits
    const hasActiveSubscription = 
      client.subscriptionStatus === 'active' && client.subscriptionPlan;

    const updateData = hasActiveSubscription 
      ? { subscriptionCredits: client.credits }
      : { topUpCredits: client.credits };

    await prisma.client.update({
      where: { id: client.id },
      data: updateData
    });

    console.log(
      `✓ Migrated ${client.credits} credits for ${client.email} to ${
        hasActiveSubscription ? 'subscription' : 'top-up'
      } credits`
    );
  }

  console.log('✅ Credit migration completed!');
}

migrateCredits()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
