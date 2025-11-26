require('dotenv').config();
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function checkUnlimited() {
  try {
    const clients = await prisma.client.findMany({
      where: {
        email: {
          in: ['mikeschonewille@gmail.com', 'cgrotebeverborg@gmail.com']
        }
      },
      select: {
        email: true,
        name: true,
        isUnlimited: true,
        subscriptionCredits: true,
        topUpCredits: true
      }
    });

    console.log('✅ Unlimited Users:');
    clients.forEach(client => {
      console.log(`\n${client.name || client.email}`);
      console.log(`  Email: ${client.email}`);
      console.log(`  Unlimited: ${client.isUnlimited ? '✓ YES' : '✗ NO'}`);
      console.log(`  Subscription Credits: ${client.subscriptionCredits}`);
      console.log(`  Top-up Credits: ${client.topUpCredits}`);
    });
  } catch (error) {
    console.error('❌ Error:', error);
  } finally {
    await prisma.$disconnect();
  }
}

checkUnlimited();
