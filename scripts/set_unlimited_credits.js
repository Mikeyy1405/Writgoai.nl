require('dotenv').config();
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function setUnlimitedCredits() {
  try {
    const admin = await prisma.client.findUnique({
      where: { email: 'info@WritgoAI.nl' }
    });

    if (!admin) {
      console.error('Admin client info@WritgoAI.nl not found');
      return;
    }

    await prisma.client.update({
      where: { email: 'info@WritgoAI.nl' },
      data: { 
        subscriptionCredits: 999999,
        topUpCredits: 999999,
        isUnlimited: true 
      }
    });

    console.log('✅ Unlimited credits set for info@WritgoAI.nl');
    console.log('Subscription Credits: 999999');
    console.log('Top-up Credits: 999999');
    console.log('Unlimited flag: true');
  } catch (error) {
    console.error('Error setting unlimited credits:', error);
  } finally {
    await prisma.$disconnect();
  }
}

setUnlimitedCredits();
