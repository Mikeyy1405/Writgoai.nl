import { config } from 'dotenv';
import { PrismaClient } from '@prisma/client';
config();

const prisma = new PrismaClient();

async function checkClients() {
  try {
    const clients = await prisma.client.findMany({
      where: {
        email: {
          in: ['info@WritgoAI.nl', 'mikeschonewille@gmail.com']
        }
      },
      select: {
        id: true,
        email: true,
        name: true,
        password: true,
        createdAt: true
      }
    });
    
    console.log('📋 Client accounts:\n');
    clients.forEach(c => {
      console.log(`Email: ${c.email}`);
      console.log(`Name: ${c.name}`);
      console.log(`Password Hash: ${c.password ? c.password.substring(0, 20) + '...' : 'NULL'}`);
      console.log(`Created: ${c.createdAt}`);
      console.log();
    });
    
  } catch (error) {
    console.error('Error:', error.message);
  } finally {
    await prisma.$disconnect();
  }
}

checkClients();
