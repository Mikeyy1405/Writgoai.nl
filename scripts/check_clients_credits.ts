import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  const clients = await prisma.client.findMany({
    select: {
      id: true,
      email: true,
      name: true,
      subscriptionCredits: true,
      topUpCredits: true,
      isUnlimited: true
    }
  });
  
  console.log('=== ALL CLIENTS ===');
  clients.forEach(client => {
    const totalCredits = client.subscriptionCredits + client.topUpCredits;
    console.log(`${client.email} (${client.name}): ${totalCredits} credits (${client.subscriptionCredits} sub + ${client.topUpCredits} top-up)${client.isUnlimited ? ' [UNLIMITED]' : ''}`);
  });
  
  console.log(`\nTotal clients: ${clients.length}`);
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
