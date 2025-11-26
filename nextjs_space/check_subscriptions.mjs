import { PrismaClient } from '@prisma/client';
import 'dotenv/config';

const prisma = new PrismaClient();

async function main() {
  const clients = await prisma.client.findMany({
    select: {
      id: true,
      name: true,
      email: true,
      subscriptionStatus: true,
      subscriptionPlan: true,
      subscriptionId: true
    }
  });
  
  console.log('Total clients:', clients.length);
  console.log('\nSubscription Status counts:');
  const statusCounts = {};
  clients.forEach(c => {
    const status = c.subscriptionStatus || 'null';
    statusCounts[status] = (statusCounts[status] || 0) + 1;
  });
  console.log(statusCounts);
  
  console.log('\nClients with subscriptionStatus:');
  const withStatus = clients.filter(c => c.subscriptionStatus);
  console.log(withStatus.map(c => ({
    name: c.name,
    email: c.email,
    status: c.subscriptionStatus,
    plan: c.subscriptionPlan
  })));
}

main()
  .catch(e => console.error(e))
  .finally(() => prisma.$disconnect());
