import { PrismaClient } from '@prisma/client';
import dotenv from 'dotenv';

dotenv.config();

const prisma = new PrismaClient();

async function main() {
  console.log('🔍 Controleren content in Content Library...\n');
  
  // Haal alle SavedContent op
  const content = await prisma.savedContent.findMany({
    include: {
      client: {
        select: {
          email: true,
          name: true,
        },
      },
    },
    orderBy: { createdAt: 'desc' },
    take: 10,
  });

  console.log(`📚 Totaal aantal content items: ${content.length}\n`);

  if (content.length === 0) {
    console.log('⚠️  Geen content gevonden in de bibliotheek!\n');
    console.log('Dit betekent dat:');
    console.log('1. Er nog geen content is gegenereerd, OF');
    console.log('2. De auto-save functie faalt\n');
  } else {
    console.log('✅ Recent opgeslagen content:\n');
    
    content.forEach((item, index) => {
      console.log(`${index + 1}. "${item.title}"`);
      console.log(`   Type: ${item.type}`);
      console.log(`   Client: ${item.client.email}`);
      console.log(`   Opgeslagen: ${item.createdAt.toLocaleString('nl-NL')}`);
      console.log(`   Content lengte: ${item.content.length} karakters`);
      console.log('');
    });
  }

  await prisma.$disconnect();
}

main().catch(console.error);
