import { prisma } from '../lib/db';

async function main() {
  const clients = await prisma.client.findMany({
    select: {
      id: true,
      name: true,
      email: true,
      subscriptionCredits: true,
      topUpCredits: true,
      isUnlimited: true,
      subscriptionStatus: true,
      _count: {
        select: {
          assignments: true,
          invoices: true,
        }
      }
    }
  });
  console.log('Total clients:', clients.length);
  console.log(JSON.stringify(clients, null, 2));
}

main().catch(console.error).finally(() => prisma.$disconnect());
