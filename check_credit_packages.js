require('dotenv').config();
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function checkPackages() {
  console.log('\n=== CHECKING CREDIT PACKAGES ===\n');
  
  const packages = await prisma.creditPackage.findMany({
    orderBy: { credits: 'asc' }
  });
  
  if (packages.length === 0) {
    console.log('No credit packages found in database.');
  } else {
    packages.forEach(pkg => {
      console.log(`${pkg.name}:`);
      console.log(`  ID: ${pkg.id}`);
      console.log(`  Credits: ${pkg.credits}`);
      console.log(`  Price: €${pkg.priceEur.toFixed(2)}`);
      console.log(`  Active: ${pkg.active}`);
      console.log(`  Description: ${pkg.description || 'N/A'}`);
      console.log('');
    });
  }
  
  await prisma.$disconnect();
}

checkPackages().catch(console.error);
