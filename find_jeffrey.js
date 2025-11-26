require('dotenv').config();
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function findJeffrey() {
  try {
    console.log('🔍 Zoeken naar Jeffrey...');
    
    // Search by name containing "jeffrey" or "keijzer"
    const users = await prisma.user.findMany({
      where: {
        OR: [
          { name: { contains: 'jeffrey', mode: 'insensitive' } },
          { name: { contains: 'keijzer', mode: 'insensitive' } },
          { email: { contains: 'jeffrey', mode: 'insensitive' } },
          { email: { contains: 'keijzer', mode: 'insensitive' } }
        ]
      },
      select: {
        id: true,
        name: true,
        email: true,
        credits: true,
        role: true,
        createdAt: true
      }
    });
    
    if (users.length === 0) {
      console.log('❌ Geen gebruikers gevonden met "jeffrey" of "keijzer" in naam of email');
      
      // Show all users to help find the right one
      console.log('\n📋 Alle gebruikers in het systeem:');
      const allUsers = await prisma.user.findMany({
        select: {
          id: true,
          name: true,
          email: true,
          credits: true,
          role: true
        },
        orderBy: { createdAt: 'desc' },
        take: 20
      });
      
      allUsers.forEach((user, index) => {
        console.log(`\n${index + 1}. ${user.name}`);
        console.log(`   Email: ${user.email}`);
        console.log(`   Credits: ${user.credits}`);
        console.log(`   Role: ${user.role}`);
      });
    } else {
      console.log(`\n✅ ${users.length} gebruiker(s) gevonden:\n`);
      
      users.forEach((user, index) => {
        console.log(`${index + 1}. ${user.name}`);
        console.log(`   Email: ${user.email}`);
        console.log(`   Credits: ${user.credits}`);
        console.log(`   Role: ${user.role}`);
        console.log(`   ID: ${user.id}`);
        console.log('');
      });
    }
    
  } catch (error) {
    console.error('❌ Error:', error);
  } finally {
    await prisma.$disconnect();
  }
}

findJeffrey();
