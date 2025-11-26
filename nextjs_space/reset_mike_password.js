require('dotenv').config();
const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcryptjs');

const prisma = new PrismaClient();

async function resetPassword() {
  const newPassword = 'TestWachtwoord123!';
  const hashedPassword = await bcrypt.hash(newPassword, 10);
  
  await prisma.client.update({
    where: { email: 'mikeschonewille@gmail.com' },
    data: { password: hashedPassword }
  });
  
  console.log('✅ Password reset for mikeschonewille@gmail.com');
  console.log('   New password:', newPassword);
  
  await prisma.$disconnect();
}

resetPassword();
