require('dotenv').config();
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function checkPlan() {
  const client = await prisma.client.findFirst({
    where: {
      email: 'mikeschonewille@gmail.com'
    }
  });
  
  if (!client) {
    console.log('No client found');
    return;
  }
  
  console.log('Client ID:', client.id);
  console.log('Content Plan:', client.contentPlan ? 'EXISTS' : 'NULL');
  
  if (client.contentPlan) {
    console.log('\nRaw content plan:');
    console.log(typeof client.contentPlan);
    console.log(JSON.stringify(client.contentPlan, null, 2));
  }
  
  await prisma.$disconnect();
}

checkPlan();
