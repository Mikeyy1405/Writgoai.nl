require('dotenv').config();
const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcryptjs');

const prisma = new PrismaClient();

async function resetPassword() {
  try {
    const newPassword = 'WritgoAdmin2024!';
    const hashedPassword = await bcrypt.hash(newPassword, 10);
    
    const updated = await prisma.user.update({
      where: { email: 'info@WritgoAI.nl' },
      data: { password: hashedPassword }
    });
    
    console.log('✅ Admin password updated successfully!');
    console.log('Email:', updated.email);
    console.log('New Password:', newPassword);
  } catch (error) {
    console.error('Error:', error);
  } finally {
    await prisma.$disconnect();
  }
}

resetPassword();
