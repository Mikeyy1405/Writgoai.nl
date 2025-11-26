require('dotenv').config();
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  const clients = await prisma.client.findMany({
    select: {
      email: true,
      companyName: true,
    }
  });
  
  console.log('Available clients:');
  clients.forEach(client => {
    console.log(`  - ${client.email} (${client.companyName})`);
  });
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
