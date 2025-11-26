require('dotenv').config();
const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function checkPassword() {
  const client = await prisma.client.findUnique({
    where: { email: 'mikeschonewille@gmail.com' },
    select: { email: true, passwordHash: true }
  });
  
  console.log('Email:', client.email);
  console.log('Has password hash:', !!client.passwordHash);
  
  await prisma.$disconnect();
}

checkPassword();
