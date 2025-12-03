require('dotenv').config();
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function deleteFailed() {
  const deleted = await prisma.contentPiece.deleteMany({
    where: {
      status: 'failed'
    }
  });
  
  console.log(`Deleted ${deleted.count} failed content pieces`);
  
  await prisma.$disconnect();
}

deleteFailed();
