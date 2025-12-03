require('dotenv').config();
const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function check() {
  const client = await prisma.client.findUnique({
    where: { email: 'mikeschonewille@gmail.com' },
    select: { email: true, password: true }
  });
  
  console.log('Email:', client.email);
  console.log('Password set:', client.password ? '[REDACTED]' : 'NO PASSWORD');
  
  await prisma.$disconnect();
}

check();
