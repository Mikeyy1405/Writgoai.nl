const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcryptjs');

const prisma = new PrismaClient();

async function resetPassword() {
  try {
    const email = 'mikeschonewille@gmail.com';
    const newPassword = 'CM120309cm!!';
    
    console.log('🔍 Looking for client:', email);
    
    const client = await prisma.client.findUnique({
      where: { email },
    });
    
    if (!client) {
      console.log('❌ Client not found!');
      return;
    }
    
    console.log('✅ Client found:', {
      id: client.id,
      email: client.email,
      name: client.name,
    });
    
    // Hash the new password
    const hashedPassword = await bcrypt.hash(newPassword, 10);
    
    console.log('🔐 Updating password...');
    
    await prisma.client.update({
      where: { id: client.id },
      data: {
        password: hashedPassword,
      },
    });
    
    console.log('✅ Password successfully updated!');
    console.log('📧 Email:', email);
    console.log('🔑 New Password:', newPassword);
    
  } catch (error) {
    console.error('❌ Error:', error);
  } finally {
    await prisma.$disconnect();
  }
}

resetPassword();
