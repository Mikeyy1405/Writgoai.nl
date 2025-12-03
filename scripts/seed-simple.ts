
// Seed script voor de nieuwe simpele automatisering app

import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Seeding database...');
  
  // 1. Create admin user
  const hashedAdminPassword = await bcrypt.hash('admin123', 10);
  
  const admin = await prisma.user.upsert({
    where: { email: 'admin@WritgoAI.nl' },
    update: {},
    create: {
      email: 'admin@WritgoAI.nl',
      password: hashedAdminPassword,
      name: 'Admin',
      role: 'admin'
    }
  });
  
  console.log('✅ Admin user created:', admin.email);
  
  // 2. Create test client
  const hashedClientPassword = await bcrypt.hash('test123', 10);
  
  const testClient = await prisma.client.upsert({
    where: { email: 'test@client.nl' },
    update: {},
    create: {
      email: 'test@client.nl',
      password: hashedClientPassword,
      name: 'Test Client',
      companyName: 'Test Bedrijf BV',
      website: 'https://testbedrijf.nl',
      automationActive: false,
      targetAudience: 'Nederlandse ondernemers tussen 25-55 jaar',
      brandVoice: 'Professioneel maar toegankelijk, enthousiast en motiverend',
      keywords: ['online marketing', 'social media', 'content creatie']
    }
  });
  
  console.log('✅ Test client created:', testClient.email);
  
  console.log('\n📋 Login credentials:');
  console.log('-------------------');
  console.log('Admin:');
  console.log('  Email: admin@WritgoAI.nl');
  console.log('  Password: admin123');
  console.log('  URL: /login');
  console.log('\nTest Client:');
  console.log('  Email: test@client.nl');
  console.log('  Password: test123');
  console.log('  URL: /client-login');
  console.log('-------------------\n');
}

main()
  .then(async () => {
    await prisma.$disconnect();
  })
  .catch(async (e) => {
    console.error(e);
    await prisma.$disconnect();
    process.exit(1);
  });
