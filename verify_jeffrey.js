require('dotenv').config();
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function verifyJeffrey() {
  try {
    const client = await prisma.client.findUnique({
      where: { email: 'jeffrey_keijzer@msn.com' },
      include: {
        _count: {
          select: {
            projects: true
          }
        }
      }
    });
    
    if (!client) {
      console.log('❌ Client niet gevonden');
      return;
    }
    
    console.log('✅ Jeffrey Keijzer - Creditoverzicht:\n');
    console.log(`📧 Email: ${client.email}`);
    console.log(`👤 Naam: ${client.name}`);
    console.log(`🏢 Bedrijf: ${client.companyName || 'Niet ingevuld'}`);
    console.log(`\n💰 CREDITS:`);
    console.log(`   Subscription Credits: ${client.subscriptionCredits}`);
    console.log(`   Top-up Credits: ${client.topUpCredits}`);
    console.log(`   Totaal beschikbaar: ${client.subscriptionCredits + client.topUpCredits}`);
    console.log(`   Totaal gebruikt: ${client.totalCreditsUsed}`);
    console.log(`   Totaal gekocht: ${client.totalCreditsPurchased}`);
    console.log(`\n📊 ABONNEMENT:`);
    console.log(`   Plan: ${client.subscriptionPlan || 'Geen'}`);
    console.log(`   Status: ${client.subscriptionStatus || 'Geen'}`);
    console.log(`   Unlimited: ${client.isUnlimited ? 'Ja' : 'Nee'}`);
    console.log(`\n📁 Projecten: ${client._count.projects}`);
    
    // Check laatste transacties
    const transactions = await prisma.creditTransaction.findMany({
      where: { clientId: client.id },
      orderBy: { createdAt: 'desc' },
      take: 5
    });
    
    console.log(`\n💳 Laatste ${transactions.length} transacties:`);
    transactions.forEach((t, i) => {
      console.log(`   ${i + 1}. ${t.type}: ${t.amount > 0 ? '+' : ''}${t.amount} credits`);
      console.log(`      ${t.description}`);
      console.log(`      Saldo na: ${t.balanceAfter}`);
      console.log(`      Datum: ${t.createdAt.toLocaleString('nl-NL')}`);
      console.log('');
    });
    
  } catch (error) {
    console.error('❌ Error:', error);
  } finally {
    await prisma.$disconnect();
  }
}

verifyJeffrey();
