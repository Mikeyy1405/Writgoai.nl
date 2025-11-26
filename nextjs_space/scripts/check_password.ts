import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
  // Test password candidates
  const testPasswords = ['password123', 'test123', '123456', 'writgo2024', 'admin123'];
  
  const client = await prisma.client.findUnique({
    where: { email: 'mikeschonewille@gmail.com' }
  });
  
  if (!client) {
    console.log('Client not found');
    return;
  }
  
  console.log(`Testing passwords for ${client.email}...`);
  
  for (const pw of testPasswords) {
    const isValid = await bcrypt.compare(pw, client.password);
    if (isValid) {
      console.log(`✅ Valid password: ${pw}`);
      return;
    }
  }
  
  console.log('❌ None of the test passwords match');
  console.log('Setting password to "test123"...');
  
  const hashedPassword = await bcrypt.hash('test123', 10);
  await prisma.client.update({
    where: { email: client.email },
    data: { password: hashedPassword }
  });
  
  console.log('✅ Password set to "test123"');
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
