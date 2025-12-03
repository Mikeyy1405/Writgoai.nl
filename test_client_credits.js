require('dotenv').config();
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function testClientCredits() {
  try {
    console.log('🔍 Checking Client Credits Status...\n');
    
    const clients = await prisma.client.findMany({
      select: {
        id: true,
        email: true,
        name: true,
        subscriptionCredits: true,
        topUpCredits: true,
        isUnlimited: true,
        subscriptionPlan: true,
        subscriptionStatus: true
      }
    });
    
    console.log(`📊 Found ${clients.length} clients:\n`);
    
    clients.forEach(client => {
      const totalCredits = client.subscriptionCredits + client.topUpCredits;
      const status = client.isUnlimited ? '👑 UNLIMITED' : `💰 ${totalCredits.toFixed(1)} credits`;
      const plan = client.subscriptionPlan || 'None';
      const subStatus = client.subscriptionStatus || 'None';
      
      console.log(`👤 ${client.name} (${client.email})`);
      console.log(`   ID: ${client.id}`);
      console.log(`   Status: ${status}`);
      console.log(`   Subscription: ${plan} - ${subStatus}`);
      console.log(`   Credits breakdown:`);
      console.log(`     - Subscription: ${client.subscriptionCredits.toFixed(1)}`);
      console.log(`     - Top-up: ${client.topUpCredits.toFixed(1)}`);
      console.log('');
    });
    
    // Check recente credit transactions
    const recentTx = await prisma.creditTransaction.findMany({
      where: {
        createdAt: {
          gte: new Date(Date.now() - 3 * 60 * 60 * 1000) // laatste 3 uur
        }
      },
      orderBy: { createdAt: 'desc' },
      take: 10,
      include: {
        client: {
          select: {
            email: true,
            name: true
          }
        }
      }
    });
    
    console.log('\n💳 Recent Credit Transactions (last 3 hours):');
    if (recentTx.length === 0) {
      console.log('  ℹ️ No transactions in the last 3 hours\n');
    } else {
      recentTx.forEach(tx => {
        const time = new Date(tx.createdAt).toLocaleTimeString('nl-NL');
        const date = new Date(tx.createdAt).toLocaleDateString('nl-NL');
        const amount = tx.amount >= 0 ? `+${tx.amount}` : tx.amount;
        console.log(`  ${date} ${time}`);
        console.log(`  ${tx.client.name}: ${amount} credits`);
        console.log(`  ${tx.description}`);
        console.log(`  Balance after: ${tx.balanceAfter?.toFixed(1) || 'N/A'}`);
        console.log('');
      });
    }
    
  } catch (error) {
    console.error('❌ Error:', error.message);
    console.error(error.stack);
  } finally {
    await prisma.$disconnect();
  }
}

testClientCredits();
