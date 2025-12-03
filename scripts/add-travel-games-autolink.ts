
/**
 * Script om automatisch de 15 reisspellen als auto-link producten toe te voegen
 * 
 * Gebruik: npx tsx scripts/add-travel-games-autolink.ts <PROJECT_ID>
 */

import { PrismaClient } from '@prisma/client';
import { bulkAddAutoLinkProducts } from '../lib/auto-link-products';

const prisma = new PrismaClient();

const TRAVEL_GAMES = [
  {
    productName: 'Qwirkle Reiseditie',
    searchTerm: 'Qwirkle Reiseditie',
    linkType: 'inline' as const,
  },
  {
    productName: 'Rummikub Reiseditie',
    searchTerm: 'Rummikub Original Reiseditie',
    linkType: 'inline' as const,
  },
  {
    productName: 'Hive Pocket',
    searchTerm: 'Hive Pocket bordspel',
    linkType: 'inline' as const,
  },
  {
    productName: 'The Mind',
    searchTerm: 'The Mind kaartspel',
    linkType: 'inline' as const,
  },
  {
    productName: 'Regenwormen',
    searchTerm: 'Regenwormen dobbelspel',
    linkType: 'inline' as const,
  },
  {
    productName: 'Keer op Keer',
    searchTerm: 'Keer op Keer dobbelspel',
    linkType: 'inline' as const,
  },
  {
    productName: 'Sushi Go',
    searchTerm: 'Sushi Go kaartspel',
    linkType: 'inline' as const,
  },
  {
    productName: 'Codenames Duet',
    searchTerm: 'Codenames Duet',
    linkType: 'inline' as const,
  },
  {
    productName: 'Exploding Kittens',
    searchTerm: 'Exploding Kittens kaartspel',
    linkType: 'inline' as const,
  },
  {
    productName: 'Jaipur',
    searchTerm: 'Jaipur bordspel',
    linkType: 'inline' as const,
  },
  {
    productName: 'Patchwork',
    searchTerm: 'Patchwork bordspel',
    linkType: 'inline' as const,
  },
  {
    productName: 'Love Letter',
    searchTerm: 'Love Letter kaartspel',
    linkType: 'inline' as const,
  },
  {
    productName: 'Bandido',
    searchTerm: 'Bandido kaartspel',
    linkType: 'inline' as const,
  },
  {
    productName: 'Uno Flip',
    searchTerm: 'Uno Flip kaartspel',
    linkType: 'inline' as const,
  },
  {
    productName: 'Vier op een Rij',
    searchTerm: 'Vier op een Rij magnetisch reis',
    linkType: 'inline' as const,
  },
];

async function main() {
  const projectId = process.argv[2];

  if (!projectId) {
    console.error('❌ Project ID is vereist!');
    console.log('\n📖 Gebruik: npx tsx scripts/add-travel-games-autolink.ts <PROJECT_ID>');
    console.log('\n💡 Je kunt je project ID vinden in de WritgoAI app URL');
    process.exit(1);
  }

  console.log(`🎲 Auto-Link Reisspellen Toevoegen aan Project ${projectId}\n`);

  // Check if project exists
  const project = await prisma.project.findUnique({
    where: { id: projectId },
    select: {
      id: true,
      name: true,
      bolcomEnabled: true,
      bolcomClientId: true,
      clientId: true,
    },
  });

  if (!project) {
    console.error(`❌ Project met ID "${projectId}" niet gevonden!`);
    process.exit(1);
  }

  console.log(`📁 Project: ${project.name}`);
  console.log(`🔐 Client ID: ${project.clientId}`);
  console.log(`🛒 Bol.com enabled: ${project.bolcomEnabled ? 'Ja ✅' : 'Nee ❌'}`);

  if (!project.bolcomEnabled || !project.bolcomClientId) {
    console.log('\n⚠️  WAARSCHUWING: Dit project heeft geen Bol.com credentials ingesteld!');
    console.log('   De auto-links zullen pas werken nadat Bol.com credentials zijn toegevoegd.');
  }

  console.log(`\n➕ Toevoegen van ${TRAVEL_GAMES.length} reisspellen...\n`);

  // Add products
  const count = await bulkAddAutoLinkProducts(projectId, TRAVEL_GAMES);

  console.log(`\n✅ ${count} van ${TRAVEL_GAMES.length} producten succesvol toegevoegd!`);
  
  if (count < TRAVEL_GAMES.length) {
    console.log(`ℹ️  ${TRAVEL_GAMES.length - count} producten waren al toegevoegd (duplicates geskipped)`);
  }

  console.log('\n📋 Toegevoegde producten:');
  TRAVEL_GAMES.forEach((game, i) => {
    console.log(`   ${i + 1}. ${game.productName} → "${game.searchTerm}"`);
  });

  console.log('\n🎉 Klaar! Deze producten worden nu automatisch gelinkt in alle nieuwe content.');
  console.log('\n💡 TIP: Test dit door een blog te genereren die één van deze spellen noemt!');
}

main()
  .catch((error) => {
    console.error('\n❌ Fout:', error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
