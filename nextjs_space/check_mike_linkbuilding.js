require('dotenv').config();
const { PrismaClient } = require('/home/ubuntu/writgo_planning_app/nextjs_space/node_modules/.prisma/client');

async function checkMikeLinkbuilding() {
  const prisma = new PrismaClient();
  
  try {
    // Check Mike's account
    const mike = await prisma.client.findUnique({
      where: { email: 'mikeschonewille@gmail.com' }
    });
    
    console.log('Mike account:', {
      id: mike?.id,
      email: mike?.email,
      name: mike?.name,
      isUnlimited: mike?.isUnlimited,
      subscriptionPlan: mike?.subscriptionPlan,
      subscriptionCredits: mike?.subscriptionCredits,
      topUpCredits: mike?.topUpCredits,
    });
    
  } catch (error) {
    console.error('Error:', error);
  } finally {
    await prisma.$disconnect();
  }
}

checkMikeLinkbuilding();
