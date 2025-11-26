import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  // Add credits to all clients with less than 50 credits
  const clients = await prisma.client.findMany({
    where: {
      OR: [
        {
          AND: [
            { topUpCredits: { lt: 50 } },
            { subscriptionCredits: { lt: 50 } }
          ]
        }
      ]
    }
  });
  
  console.log(`Found ${clients.length} clients with low credits`);
  
  for (const client of clients) {
    const currentTotal = client.topUpCredits + client.subscriptionCredits;
    const toAdd = 200;
    
    await prisma.client.update({
      where: { id: client.id },
      data: { topUpCredits: { increment: toAdd } }
    });
    
    await prisma.creditTransaction.create({
      data: {
        clientId: client.id,
        amount: toAdd,
        type: 'bonus',
        description: 'Test credits voor image generation',
        balanceAfter: currentTotal + toAdd
      }
    });
    
    console.log(`✅ ${toAdd} credits toegevoegd aan ${client.email} (was ${currentTotal}, nu ${currentTotal + toAdd})`);
  }
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
