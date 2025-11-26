import { prisma } from './lib/db';

async function testTable() {
  try {
    const count = await prisma.wooCommerceProduct.count();
    console.log('✅ WooCommerceProduct table exists, count:', count);
  } catch (error: any) {
    console.error('❌ Error accessing WooCommerceProduct table:', error.message);
  } finally {
    await prisma.$disconnect();
  }
}

testTable();
