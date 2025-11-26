require('dotenv').config();
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function resetOldCredits() {
  console.log('🔄 Resetting old credits field to 0...');
  
  const result = await prisma.client.updateMany({
    where: {
      credits: { gt: 0 }
    },
    data: {
      credits: 0
    }
  });

  console.log(`✅ Reset ${result.count} client records`);
}

resetOldCredits()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
