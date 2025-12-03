
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  // Find test client
  const client = await prisma.client.findUnique({
    where: { email: 'test@testbedrijf.nl' }
  });

  if (!client) {
    console.log('Test client not found');
    return;
  }

  // Find Premium package
  const premiumPackage = await prisma.subscriptionPackage.findUnique({
    where: { name: 'PREMIUM' }
  });

  if (!premiumPackage) {
    console.log('Premium package not found');
    return;
  }

  // Check if subscription already exists
  const existingSubscription = await prisma.clientSubscription.findUnique({
    where: { clientId: client.id }
  });

  if (existingSubscription) {
    console.log('Subscription already exists for this client');
    return;
  }

  // Calculate next billing date
  const nextBillingDate = new Date();
  nextBillingDate.setDate(nextBillingDate.getDate() + 30);

  // Create subscription
  await prisma.clientSubscription.create({
    data: {
      clientId: client.id,
      packageId: premiumPackage.id,
      status: 'ACTIVE',
      startDate: new Date(),
      nextBillingDate: nextBillingDate,
      articlesUsed: 0,
      reelsUsed: 0
    }
  });

  console.log('✅ Premium subscription assigned to test client');
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
