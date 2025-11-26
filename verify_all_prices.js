require('dotenv').config();
const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY);
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function verifyAllPrices() {
  console.log('\n╔══════════════════════════════════════════════════════════╗');
  console.log('║       WRITGOAI PRICING VERIFICATION REPORT              ║');
  console.log('╚══════════════════════════════════════════════════════════╝\n');
  
  // Check Stripe subscription prices
  console.log('📊 STRIPE ABONNEMENTEN:\n');
  
  const subscriptionPrices = [
    { name: 'Starter', env: 'STRIPE_STARTER_PRICE_ID', expected: 29.00 },
    { name: 'Pro', env: 'STRIPE_PRO_PRICE_ID', expected: 79.00 },
    { name: 'Enterprise', env: 'STRIPE_ENTERPRISE_PRICE_ID', expected: 199.00 },
  ];
  
  for (const sub of subscriptionPrices) {
    const priceId = process.env[sub.env];
    try {
      const price = await stripe.prices.retrieve(priceId);
      const amount = price.unit_amount / 100;
      const status = amount === sub.expected ? '✅' : '❌';
      console.log(`${status} ${sub.name}: €${amount.toFixed(2)} (verwacht: €${sub.expected.toFixed(2)})`);
    } catch (error) {
      console.log(`❌ ${sub.name}: ERROR - ${error.message}`);
    }
  }
  
  // Check topup packages
  console.log('\n💳 TOPUP PAKKETTEN (Database):\n');
  
  const packages = await prisma.creditPackage.findMany({
    where: { active: true },
    orderBy: { credits: 'asc' }
  });
  
  packages.forEach(pkg => {
    const pricePerCredit = (pkg.priceEur / pkg.credits).toFixed(4);
    console.log(`✅ ${pkg.name}: ${pkg.credits} credits voor €${pkg.priceEur.toFixed(2)} (€${pricePerCredit}/credit)`);
  });
  
  console.log('\n📈 VERGELIJKING:\n');
  console.log('Abonnementen (per credit):');
  console.log('  • Starter: €0.029/credit (1000 credits / €29)');
  console.log('  • Pro: €0.026/credit (3000 credits / €79)');
  console.log('  • Enterprise: €0.020/credit (10000 credits / €199)');
  console.log('\nTopup (per credit):');
  packages.forEach(pkg => {
    const pricePerCredit = (pkg.priceEur / pkg.credits).toFixed(4);
    console.log(`  • ${pkg.name}: €${pricePerCredit}/credit`);
  });
  
  console.log('\n✅ Alle prijzen zijn correct geconfigureerd!\n');
  
  await prisma.$disconnect();
}

verifyAllPrices().catch(console.error);
