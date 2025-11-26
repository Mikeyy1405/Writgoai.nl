require('dotenv').config();
const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function setUnlimitedUsers() {
  try {
    // Set unlimited for mikeschonewille@gmail.com
    const mike = await prisma.client.update({
      where: { email: 'mikeschonewille@gmail.com' },
      data: { 
        isUnlimited: true,
        subscriptionCredits: 999999,
        topUpCredits: 999999
      },
    });
    console.log('✅ Set unlimited for mikeschonewille@gmail.com:', mike.email, '- isUnlimited:', mike.isUnlimited);

    // Set unlimited for cgrotebeverborg@gmail.com
    const chris = await prisma.client.update({
      where: { email: 'cgrotebeverborg@gmail.com' },
      data: { 
        isUnlimited: true,
        subscriptionCredits: 999999,
        topUpCredits: 999999
      },
    });
    console.log('✅ Set unlimited for cgrotebeverborg@gmail.com:', chris.email, '- isUnlimited:', chris.isUnlimited);

    console.log('\n🎉 Both users now have unlimited credits!');
  } catch (error) {
    console.error('❌ Error setting unlimited users:', error);
  } finally {
    await prisma.$disconnect();
  }
}

setUnlimitedUsers();
