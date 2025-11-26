import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  const clientsWithZero = await prisma.client.findMany({
    where: {
      topUpCredits: 0,
      subscriptionCredits: 0
    }
  });
  
  console.log(`Found ${clientsWithZero.length} clients with 0 credits`);
  
  for (const client of clientsWithZero) {
    await prisma.client.update({
      where: { id: client.id },
      data: { topUpCredits: 100 }
    });
    
    await prisma.creditTransaction.create({
      data: {
        clientId: client.id,
        amount: 100,
        type: 'bonus',
        description: 'Test credits toegevoegd',
        balanceAfter: 100
      }
    });
    
    console.log(`✅ ${client.email}: 100 credits toegevoegd`);
  }
  
  console.log('\nDone!');
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
