
/**
 * Seed Credit Packages en maak speciale accounts unlimited
 */

import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Seeding credit packages...');

  // Verwijder oude packages
  await prisma.creditPackage.deleteMany();

  // Maak nieuwe credit packages
  const packages = [
    {
      name: 'Starter',
      credits: 100,
      priceEur: 5.00,
      discount: 0,
      popular: false,
      description: 'Perfect om te beginnen',
      features: [
        '~1000 AI berichten',
        'Alle AI modellen',
        'Web research',
        'Afbeeldingen genereren'
      ]
    },
    {
      name: 'Professional',
      credits: 500,
      priceEur: 20.00,
      discount: 20,
      popular: true,
      description: 'Voor regelmatig gebruik',
      features: [
        '~5000 AI berichten',
        'Alle AI modellen',
        'Web research',
        'Afbeeldingen genereren',
        'Video generatie',
        '20% korting'
      ]
    },
    {
      name: 'Business',
      credits: 1500,
      priceEur: 50.00,
      discount: 33,
      popular: false,
      description: 'Voor intensief gebruik',
      features: [
        '~15000 AI berichten',
        'Alle AI modellen',
        'Web research',
        'Afbeeldingen genereren',
        'Video generatie',
        '33% korting'
      ]
    }
  ];

  for (const pkg of packages) {
    await prisma.creditPackage.create({
      data: pkg
    });
    console.log(`✅ Created package: ${pkg.name}`);
  }

  console.log('');
  console.log('👑 Setting unlimited credits for special accounts...');

  // Maak mikeschonewille unlimited
  const mike = await prisma.client.findUnique({
    where: { email: 'mikeschonewille@gmail.com' }
  });

  if (mike) {
    await prisma.client.update({
      where: { id: mike.id },
      data: {
        isUnlimited: true,
        topUpCredits: 999999
      }
    });
    console.log('✅ Mike Schonewille heeft nu onbeperkte credits');
  }

  // Maak cgrotebeverborg unlimited
  const cgrotebeverborg = await prisma.client.findUnique({
    where: { email: 'cgrotebeverborg@gmail.com' }
  });

  if (cgrotebeverborg) {
    await prisma.client.update({
      where: { id: cgrotebeverborg.id },
      data: {
        isUnlimited: true,
        topUpCredits: 999999
      }
    });
    console.log('✅ cgrotebeverborg heeft nu onbeperkte credits');
  } else {
    console.log('⚠️  cgrotebeverborg account niet gevonden - maak deze aan via registratie');
  }

  // Geef alle bestaande clients 10 gratis credits om te beginnen
  const existingClients = await prisma.client.findMany({
    where: {
      subscriptionCredits: 0,
      topUpCredits: 0,
      isUnlimited: false
    }
  });

  for (const client of existingClients) {
    await prisma.client.update({
      where: { id: client.id },
      data: { topUpCredits: 10 }
    });

    // Log de gratis credits
    await prisma.creditTransaction.create({
      data: {
        clientId: client.id,
        amount: 10,
        type: 'bonus',
        description: 'Welkomst bonus',
        balanceAfter: 10
      }
    });
  }

  console.log(`✅ ${existingClients.length} bestaande clients kregen 10 gratis credits`);

  console.log('');
  console.log('✨ Credit system seeding complete!');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
