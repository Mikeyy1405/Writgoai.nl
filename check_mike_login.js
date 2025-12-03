const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function checkMikeAccount() {
  try {
    console.log('🔍 Checking Mike account...\n');
    
    // Check if user exists
    const user = await prisma.user.findUnique({
      where: { email: 'mikeschonewille@gmail.com' }
    });
    
    if (user) {
      console.log('✅ User found in database:');
      console.log('ID:', user.id);
      console.log('Email:', user.email);
      console.log('Name:', user.name);
      console.log('Role:', user.role);
      console.log('Created:', user.createdAt);
      console.log('Has password:', !!user.password);
    } else {
      console.log('❌ User NOT found in database!');
    }
    
    // Check clients with this email
    const client = await prisma.client.findUnique({
      where: { email: 'mikeschonewille@gmail.com' }
    });
    
    if (client) {
      console.log('\n📋 Client account found:');
      console.log('ID:', client.id);
      console.log('Email:', client.email);
      console.log('Name:', client.name);
      console.log('Company:', client.company);
      console.log('Has password:', !!client.password);
    }
    
  } catch (error) {
    console.error('Error:', error.message);
  } finally {
    await prisma.$disconnect();
  }
}

checkMikeAccount();
