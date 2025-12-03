import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
  const hashedPassword = await bcrypt.hash('test123', 10);
  
  // Upsert test@client.nl
  const testClient = await prisma.client.upsert({
    where: { email: 'test@client.nl' },
    update: {
      password: hashedPassword
    },
    create: {
      email: 'test@client.nl',
      password: hashedPassword,
      name: 'Test Client',
      companyName: 'Test Bedrijf BV',
      website: 'https://testbedrijf.nl',
      automationActive: false,
      topUpCredits: 1000,
      subscriptionCredits: 0
    }
  });
  
  console.log(`✅ Test account ready: ${testClient.email} / test123`);
  console.log(`   Credits: ${testClient.subscriptionCredits + testClient.topUpCredits}`);
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
