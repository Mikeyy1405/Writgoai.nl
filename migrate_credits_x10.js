
require('dotenv').config();
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function migrateCredits() {
  console.log('🚀 Starting credits × 10 migration...\n');

  try {
    // Get all clients
    const clients = await prisma.client.findMany({
      select: {
        id: true,
        email: true,
        name: true,
        subscriptionCredits: true,
        topUpCredits: true,
        totalCreditsUsed: true,
      }
    });

    console.log(`📊 Found ${clients.length} clients to migrate\n`);

    let successCount = 0;
    let errorCount = 0;

    for (const client of clients) {
      try {
        const oldSubCredits = client.subscriptionCredits;
        const oldTopUpCredits = client.topUpCredits;
        const oldTotalUsed = client.totalCreditsUsed;

        // Multiply by 10
        const newSubCredits = oldSubCredits * 10;
        const newTopUpCredits = oldTopUpCredits * 10;
        const newTotalUsed = oldTotalUsed * 10;

        // Update client
        await prisma.client.update({
          where: { id: client.id },
          data: {
            subscriptionCredits: newSubCredits,
            topUpCredits: newTopUpCredits,
            totalCreditsUsed: newTotalUsed,
          }
        });

        console.log(`✅ ${client.email || client.name}:`);
        console.log(`   Subscription: ${oldSubCredits} → ${newSubCredits}`);
        console.log(`   Top-up: ${oldTopUpCredits} → ${newTopUpCredits}`);
        console.log(`   Total Used: ${oldTotalUsed} → ${newTotalUsed}\n`);

        successCount++;
      } catch (error) {
        console.error(`❌ Error migrating ${client.email}:`, error.message);
        errorCount++;
      }
    }

    console.log('\n' + '='.repeat(50));
    console.log(`✅ Migration Complete!`);
    console.log(`   Success: ${successCount} clients`);
    console.log(`   Errors: ${errorCount} clients`);
    console.log('='.repeat(50));

  } catch (error) {
    console.error('❌ Migration failed:', error);
  } finally {
    await prisma.$disconnect();
  }
}

migrateCredits();
