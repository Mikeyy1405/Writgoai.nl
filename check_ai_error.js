require('dotenv').config();
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function checkAIError() {
  try {
    console.log('🔍 Checking WritgoAI Status...\n');
    
    // Check environment
    console.log('📋 Environment Variables:');
    console.log('  AIML_API_KEY:', process.env.AIML_API_KEY ? '✅ Set' : '❌ Missing');
    console.log('  DATABASE_URL:', process.env.DATABASE_URL ? '✅ Set' : '❌ Missing');
    console.log('  NEXTAUTH_SECRET:', process.env.NEXTAUTH_SECRET ? '✅ Set' : '❌ Missing');
    
    // Check database connection
    console.log('\n💾 Database Connection:');
    try {
      await prisma.$connect();
      console.log('  ✅ Database connected');
      
      // Check clients
      const clientCount = await prisma.client.count();
      console.log(`  📊 Total clients: ${clientCount}`);
      
      // Check clients with unlimited credits
      const unlimitedClients = await prisma.client.findMany({
        where: {
          OR: [
            { credits: { gte: 1000000 } },
            { subscriptionTier: 'UNLIMITED' }
          ]
        },
        select: {
          email: true,
          firstName: true,
          credits: true,
          subscriptionTier: true,
          subscriptionStatus: true
        }
      });
      
      console.log('\n👑 Clients with Unlimited/High Credits:');
      unlimitedClients.forEach(client => {
        console.log(`  - ${client.firstName} (${client.email})`);
        console.log(`    Credits: ${client.credits.toLocaleString()}`);
        console.log(`    Tier: ${client.subscriptionTier || 'None'}`);
        console.log(`    Status: ${client.subscriptionStatus || 'None'}`);
      });
      
      // Check recente errors
      const recentTransactions = await prisma.creditTransaction.findMany({
        where: {
          createdAt: {
            gte: new Date(Date.now() - 24 * 60 * 60 * 1000) // laatste 24 uur
          }
        },
        orderBy: { createdAt: 'desc' },
        take: 5,
        include: {
          client: {
            select: {
              email: true,
              firstName: true
            }
          }
        }
      });
      
      console.log('\n💳 Recent Credit Transactions (last 24h):');
      if (recentTransactions.length === 0) {
        console.log('  ℹ️ No transactions in the last 24 hours');
      } else {
        recentTransactions.forEach(tx => {
          const time = new Date(tx.createdAt).toLocaleTimeString('nl-NL');
          const date = new Date(tx.createdAt).toLocaleDateString('nl-NL');
          console.log(`  ${date} ${time} - ${tx.client.firstName}: ${tx.amount} credits - ${tx.description}`);
        });
      }
      
    } catch (dbError) {
      console.log('  ❌ Database error:', dbError.message);
    }
    
    // Test AIML API
    console.log('\n🤖 Testing AIML API...');
    try {
      const response = await fetch('https://api.aimlapi.com/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${process.env.AIML_API_KEY}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          model: 'gpt-4o-mini',
          messages: [{ role: 'user', content: 'Test' }],
          max_tokens: 10
        })
      });
      
      if (response.ok) {
        console.log('  ✅ AIML API connection successful');
        const data = await response.json();
        console.log('  📝 Response:', data.choices?.[0]?.message?.content || 'OK');
      } else {
        const errorText = await response.text();
        console.log('  ❌ AIML API error:', response.status, errorText);
      }
    } catch (apiError) {
      console.log('  ❌ AIML API connection failed:', apiError.message);
    }
    
  } catch (error) {
    console.error('\n❌ Fatal error:', error.message);
    console.error(error.stack);
  } finally {
    await prisma.$disconnect();
  }
}

checkAIError();
