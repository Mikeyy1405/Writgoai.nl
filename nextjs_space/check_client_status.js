const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function checkClients() {
  try {
    // Check alle clients met hun credits
    const clients = await prisma.client.findMany({
      select: {
        id: true,
        email: true,
        firstName: true,
        credits: true,
        subscriptionStatus: true,
        subscriptionTier: true,
      }
    });
    
    console.log('\n📊 CLIENT STATUS:\n');
    clients.forEach(client => {
      console.log(`
👤 ${client.firstName || 'Client'} (${client.email})
   ID: ${client.id}
   Credits: ${client.credits}
   Subscription: ${client.subscriptionStatus || 'none'} (${client.subscriptionTier || 'none'})
`);
    });
    
    // Check recente transacties
    console.log('\n💳 RECENTE CREDIT TRANSACTIES:\n');
    const recentTransactions = await prisma.creditTransaction.findMany({
      take: 10,
      orderBy: { createdAt: 'desc' },
      include: {
        client: {
          select: {
            email: true,
            firstName: true
          }
        }
      }
    });
    
    recentTransactions.forEach(tx => {
      console.log(`
${new Date(tx.createdAt).toLocaleString('nl-NL')}
Client: ${tx.client.firstName} (${tx.client.email})
Amount: ${tx.amount} credits
Type: ${tx.type}
Description: ${tx.description || 'N/A'}
`);
    });
  } catch (error) {
    console.error('❌ Error:', error.message);
  } finally {
    await prisma.$disconnect();
  }
}

checkClients();
