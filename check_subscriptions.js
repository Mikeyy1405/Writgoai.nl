const { PrismaClient } = require('@prisma/client');
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
  
  console.log('\nClients with subscriptions:');
  const withSub = clients.filter(c => c.subscriptionId || c.subscriptionPlan);
  console.log(withSub);
}

main()
  .catch(e => console.error(e))
  .finally(() => prisma.$disconnect());
