require('dotenv').config();
const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function testCreditAPI() {
  try {
    const testEmails = ['mikeschonewille@gmail.com', 'cgrotebeverborg@gmail.com'];
    
    for (const email of testEmails) {
      console.log(`\n🔍 Testing: ${email}`);
      
      const client = await prisma.client.findUnique({
        where: { email },
        select: {
          id: true,
          email: true,
          name: true,
          isUnlimited: true,
          subscriptionCredits: true,
          topUpCredits: true,
          totalCreditsUsed: true,
          totalCreditsPurchased: true
        }
      });
      
      if (!client) {
        console.log('❌ Not found');
        continue;
      }
      
      console.log('Database values:');
      console.log('  isUnlimited:', client.isUnlimited);
      console.log('  subscriptionCredits:', client.subscriptionCredits);
      console.log('  topUpCredits:', client.topUpCredits);
      
      // Simulate API response
      const apiResponse = {
        subscriptionCredits: client.subscriptionCredits,
        topUpCredits: client.topUpCredits,
        totalCredits: client.subscriptionCredits + client.topUpCredits,
        isUnlimited: client.isUnlimited,
        totalUsed: client.totalCreditsUsed,
        totalPurchased: client.totalCreditsPurchased
      };
      
      console.log('\nAPI Response would be:');
      console.log(JSON.stringify(apiResponse, null, 2));
    }
    
  } catch (error) {
    console.error('Error:', error);
  } finally {
    await prisma.$disconnect();
  }
}

testCreditAPI();
