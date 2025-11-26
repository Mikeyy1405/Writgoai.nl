const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcryptjs');

const prisma = new PrismaClient();

async function testLogin() {
  try {
    console.log('🔍 Testing login for mikeschonewille@gmail.com\n');
    
    // Find client
    const client = await prisma.client.findUnique({
      where: { email: 'mikeschonewille@gmail.com' }
    });
    
    if (!client) {
      console.log('❌ Client not found!');
      return;
    }
    
    console.log('✅ Client found:');
    console.log('ID:', client.id);
    console.log('Email:', client.email);
    console.log('Name:', client.name);
    console.log('Has password:', !!client.password);
    console.log('Password hash length:', client.password?.length || 0);
    
    // Test a few common passwords
    const testPasswords = ['password', 'admin123', 'Test123!', 'mikeschonewille'];
    
    console.log('\n🔐 Testing passwords...');
    for (const pwd of testPasswords) {
      try {
        const isValid = await bcrypt.compare(pwd, client.password);
        if (isValid) {
          console.log(`✅ Password "${pwd}" WORKS!`);
        }
      } catch (err) {
        // Silent fail
      }
    }
    
    console.log('\n💡 If no password worked, we need to reset it.');
    
  } catch (error) {
    console.error('Error:', error.message);
  } finally {
    await prisma.$disconnect();
  }
}

testLogin();
