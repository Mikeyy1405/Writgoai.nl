require('dotenv').config();
const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcryptjs');

const prisma = new PrismaClient();

async function main() {
  const email = 'mikeschonewille@gmail.com';
  const password = 'CM120309cm!!';
  
  try {
    // Check if client exists
    let client = await prisma.client.findUnique({
      where: { email }
    });
    
    if (client) {
      console.log('✅ Client bestaat al:', email);
      console.log('ID:', client.id);
      console.log('Naam:', client.name);
      console.log('Bedrijf:', client.companyName);
      
      // Update password
      const hashedPassword = await bcrypt.hash(password, 10);
      await prisma.client.update({
        where: { email },
        data: { password: hashedPassword }
      });
      console.log('✅ Wachtwoord bijgewerkt');
      
    } else {
      console.log('❌ Client niet gevonden, aanmaken...');
      
      const hashedPassword = await bcrypt.hash(password, 10);
      
      client = await prisma.client.create({
        data: {
          email,
          password: hashedPassword,
          name: 'Mike Schonewille',
          companyName: 'Writgo Media',
          automationActive: false
        }
      });
      
      console.log('✅ Client aangemaakt:', email);
      console.log('ID:', client.id);
    }
    
  } catch (error) {
    console.error('❌ Fout:', error.message);
  } finally {
    await prisma.$disconnect();
  }
}

main();
