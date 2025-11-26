require('dotenv').config();
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function addCreditsToJeffrey() {
  try {
    console.log('🔍 Zoeken naar Jeffrey Keijzer...');
    
    // Find client by email
    const client = await prisma.client.findUnique({
      where: { email: 'jeffrey_keijzer@msn.com' }
    });
    
    if (!client) {
      console.log('❌ Client niet gevonden met email: jeffrey_keijzer@msn.com');
      
      // Search for similar email
      const clients = await prisma.client.findMany({
        where: {
          OR: [
            { email: { contains: 'jeffrey', mode: 'insensitive' } },
            { email: { contains: 'keijzer', mode: 'insensitive' } },
            { name: { contains: 'jeffrey', mode: 'insensitive' } },
            { name: { contains: 'keijzer', mode: 'insensitive' } }
          ]
        },
        select: {
          id: true,
          name: true,
          email: true,
          subscriptionCredits: true,
          topUpCredits: true,
          isUnlimited: true
        }
      });
      
      if (clients.length > 0) {
        console.log(`\n💡 Vergelijkbare clients gevonden:\n`);
        clients.forEach((c, i) => {
          console.log(`${i + 1}. ${c.name}`);
          console.log(`   Email: ${c.email}`);
          console.log(`   Subscription Credits: ${c.subscriptionCredits}`);
          console.log(`   Top-up Credits: ${c.topUpCredits}`);
          console.log(`   Unlimited: ${c.isUnlimited}`);
          console.log('');
        });
      }
      
      return;
    }
    
    console.log('✅ Client gevonden:');
    console.log(`   ID: ${client.id}`);
    console.log(`   Naam: ${client.name}`);
    console.log(`   Email: ${client.email}`);
    console.log(`   Subscription Credits: ${client.subscriptionCredits}`);
    console.log(`   Top-up Credits: ${client.topUpCredits}`);
    console.log(`   Unlimited: ${client.isUnlimited}`);
    
    // Add 10 top-up credits
    const updatedClient = await prisma.client.update({
      where: { id: client.id },
      data: {
        topUpCredits: client.topUpCredits + 10,
        totalCreditsPurchased: client.totalCreditsPurchased + 10
      }
    });
    
    console.log(`\n💰 Credits toegevoegd!`);
    console.log(`   Oude top-up credits: ${client.topUpCredits}`);
    console.log(`   Nieuwe top-up credits: ${updatedClient.topUpCredits}`);
    
    // Create credit transaction record
    await prisma.creditTransaction.create({
      data: {
        clientId: client.id,
        amount: 10,
        type: 'MANUAL_ADDITION',
        description: 'Eenmalige credit toevoeging door admin',
        balanceAfter: updatedClient.subscriptionCredits + updatedClient.topUpCredits
      }
    });
    
    console.log('✅ Credit transactie geregistreerd');
    
  } catch (error) {
    console.error('❌ Error:', error);
  } finally {
    await prisma.$disconnect();
  }
}

addCreditsToJeffrey();
