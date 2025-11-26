require('dotenv').config();
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

(async () => {
  try {
    const client = await prisma.client.findUnique({
      where: { email: 'mikeschonewille@gmail.com' },
      select: { id: true, email: true }
    });
    
    if (client) {
      console.log('Found client:', client);
      
      const deleted = await prisma.conversation.deleteMany({
        where: { clientId: client.id }
      });
      
      console.log('✅ Deleted old conversations:', deleted.count);
      console.log('Fresh start - klaar voor nieuwe gesprekken!');
    } else {
      console.log('Client not found');
    }
  } catch (error) {
    console.error('Error:', error);
  } finally {
    await prisma.$disconnect();
  }
})();
