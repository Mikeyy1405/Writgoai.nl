const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function checkPrices() {
  try {
    const packages = await prisma.subscriptionPackage.findMany({
      orderBy: { monthlyPrice: 'asc' }
    });
    
    console.log('\n=== Huidige Subscription Packages ===\n');
    packages.forEach(pkg => {
      console.log(`${pkg.name} (${pkg.id}):`);
      console.log(`  - Maandprijs: €${pkg.monthlyPrice}`);
      console.log(`  - Jaarprijs: €${pkg.yearlyPrice}`);
      console.log(`  - Credits: ${pkg.monthlyCredits} per maand`);
      console.log(`  - Actief: ${pkg.isActive}`);
      console.log('');
    });
  } catch (error) {
    console.error('Error:', error.message);
  } finally {
    await prisma.$disconnect();
  }
}

checkPrices();
