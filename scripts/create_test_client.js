
require('/home/ubuntu/writgo_planning_app/nextjs_space/node_modules/dotenv').config({ path: '/home/ubuntu/writgo_planning_app/nextjs_space/.env' });

const { PrismaClient } = require('/home/ubuntu/writgo_planning_app/nextjs_space/node_modules/.prisma/client');
const bcrypt = require('/home/ubuntu/writgo_planning_app/nextjs_space/node_modules/bcryptjs');

const prisma = new PrismaClient();

async function createTestClient() {
  try {
    // Hash het wachtwoord
    const hashedPassword = await bcrypt.hash('test123', 10);
    
    // Maak de test klant aan
    const client = await prisma.client.create({
      data: {
        name: 'Test Bedrijf BV',
        companyName: 'Test Bedrijf BV',
        email: 'test@testbedrijf.nl',
        password: hashedPassword,
        contactEmail: 'test@testbedrijf.nl',
        contactPhone: '+31 6 12345678',
        importanceScore: 5,
        notes: 'Test klant account voor demo doeleinden',
        isActive: true,
      },
    });

    console.log('\n✅ Test klant succesvol aangemaakt!\n');
    console.log('='.repeat(50));
    console.log('📋 LOGIN GEGEVENS:');
    console.log('='.repeat(50));
    console.log(`Bedrijfsnaam: ${client.companyName}`);
    console.log(`Email: ${client.email}`);
    console.log(`Wachtwoord: test123`);
    console.log('='.repeat(50));
    console.log('\n🌐 Login URL:');
    console.log('https://writgoai.abacusai.app/client-login');
    console.log('\n');

  } catch (error) {
    if (error.code === 'P2002') {
      console.error('❌ Error: Deze klant bestaat al in de database.');
      console.log('\n📋 Bestaande login gegevens:');
      console.log('Email: test@testbedrijf.nl');
      console.log('Wachtwoord: test123');
      console.log('Login URL: https://writgoai.abacusai.app/client-login');
    } else {
      console.error('❌ Error bij aanmaken klant:', error);
    }
  } finally {
    await prisma.$disconnect();
  }
}

createTestClient();
