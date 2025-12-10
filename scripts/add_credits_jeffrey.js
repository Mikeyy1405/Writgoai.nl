const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function addCreditsToJeffrey() {
  try {
    console.log('🔍 Zoeken naar Jeffrey Keijzer...');
    
    // Find user by email
    const user = await prisma.user.findUnique({
      where: { email: 'jeffrey_keijzer@msn.com' }
    });
    
    if (!user) {
      console.log('❌ Gebruiker niet gevonden met email: jeffrey_keijzer@msn.com');
      return;
    }
    
    console.log('✅ Gebruiker gevonden:');
    console.log(`   ID: ${user.id}`);
    console.log(`   Naam: ${user.name}`);
    console.log(`   Email: ${user.email}`);
    console.log(`   Huidige credits: ${user.credits}`);
    
    // Add 10 credits
    const updatedUser = await prisma.user.update({
      where: { id: user.id },
      data: {
        credits: user.credits + 10
      }
    });
    
    console.log(`\n💰 Credits toegevoegd!`);
    console.log(`   Oude credits: ${user.credits}`);
    console.log(`   Nieuwe credits: ${updatedUser.credits}`);
    
    // Create credit transaction record
    await prisma.creditTransaction.create({
      data: {
        userId: user.id,
        amount: 10,
        type: 'MANUAL_ADDITION',
        description: 'Eenmalige credit toevoeging door admin',
        balanceAfter: updatedUser.credits
      }
    });
    
    console.log('✅ Credit transactie geregistreerd');
    
  } catch (error) {
    console.error('❌ Error:', error);
  } finally {
    await prisma.$disconnect();
  }
}

addCreditsToJeffrey();
