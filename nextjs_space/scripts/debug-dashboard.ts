/**
 * Debug script voor dashboard problemen
 * 
 * Run met: npx ts-node -r tsconfig-paths/register scripts/debug-dashboard.ts
 */

import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function debugDashboard() {
  console.log('🔍 Debugging Dashboard Data...\n');

  try {
    // 1. Check Client (info@writgo.nl)
    console.log('1️⃣  Checking Client...');
    const client = await prisma.client.findUnique({
      where: { email: 'info@writgo.nl' },
      include: {
        projects: {
          include: {
            _count: {
              select: {
                savedContent: true,
              },
            },
          },
        },
        savedContent: true,
      },
    });

    if (!client) {
      console.error('❌ Client not found: info@writgo.nl');
      return;
    }

    console.log('✅ Client found:', {
      id: client.id,
      email: client.email,
      name: client.name,
      createdAt: client.createdAt,
    });

    // 2. Check GSC Connection
    console.log('\n2️⃣  Checking Google Search Console...');
    if (client.googleSearchConsoleToken) {
      console.log('✅ GSC Token: Present');
      console.log('✅ GSC Refresh Token:', client.googleSearchConsoleRefreshToken ? 'Present' : 'Missing');
      
      if (client.googleSearchConsoleSites) {
        try {
          const sites = JSON.parse(client.googleSearchConsoleSites as string);
          console.log('✅ GSC Sites:', sites);
        } catch (e) {
          console.error('❌ Failed to parse GSC sites');
        }
      } else {
        console.log('⚠️  GSC Sites: Not set');
      }
    } else {
      console.log('❌ GSC Token: Missing (not connected)');
    }

    // 3. Check Projects
    console.log('\n3️⃣  Checking Projects...');
    const allProjects = await prisma.project.findMany({
      where: { clientId: client.id },
      include: {
        _count: {
          select: {
            savedContent: true,
          },
        },
      },
    });

    console.log(`Total projects: ${allProjects.length}`);
    
    const activeProjects = allProjects.filter(p => p.isActive);
    console.log(`Active projects: ${activeProjects.length}`);

    if (allProjects.length > 0) {
      console.log('\n📁 Projects:');
      allProjects.forEach((project, index) => {
        console.log(`\n  ${index + 1}. ${project.name}`);
        console.log(`     ID: ${project.id}`);
        console.log(`     Website URL: ${project.websiteUrl || 'Not set'}`);
        console.log(`     Active: ${project.isActive ? '✅' : '❌'}`);
        console.log(`     Content count: ${project._count.savedContent}`);
        console.log(`     Created: ${project.createdAt}`);
      });
    } else {
      console.log('❌ No projects found');
    }

    // 4. Check SavedContent
    console.log('\n4️⃣  Checking Saved Content...');
    const savedContent = await prisma.savedContent.findMany({
      where: { clientId: client.id },
      orderBy: { createdAt: 'desc' },
      take: 10,
    });

    console.log(`Total saved content: ${savedContent.length}`);

    const publishedContent = savedContent.filter(c => c.publishedAt);
    console.log(`Published content: ${publishedContent.length}`);

    if (savedContent.length > 0) {
      console.log('\n📝 Recent Content:');
      savedContent.slice(0, 5).forEach((content, index) => {
        console.log(`\n  ${index + 1}. ${content.title}`);
        console.log(`     ID: ${content.id}`);
        console.log(`     Type: ${content.type || 'Unknown'}`);
        console.log(`     Project ID: ${content.projectId || 'Not linked'}`);
        console.log(`     Published: ${content.publishedAt ? '✅ ' + content.publishedAt : '❌ Draft'}`);
        console.log(`     Created: ${content.createdAt}`);
      });
    } else {
      console.log('❌ No saved content found');
    }

    // 5. Stats voor deze maand
    console.log('\n5️⃣  This Month Stats...');
    const startOfMonth = new Date();
    startOfMonth.setDate(1);
    startOfMonth.setHours(0, 0, 0, 0);

    const contentThisMonth = await prisma.savedContent.count({
      where: {
        clientId: client.id,
        createdAt: { gte: startOfMonth },
      },
    });

    const publishedThisMonth = await prisma.savedContent.count({
      where: {
        clientId: client.id,
        createdAt: { gte: startOfMonth },
        publishedAt: { not: null },
      },
    });

    console.log(`Content created this month: ${contentThisMonth}`);
    console.log(`Content published this month: ${publishedThisMonth}`);

    // 6. Dashboard Stats Summary
    console.log('\n6️⃣  Dashboard Stats Summary...');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log(`📊 Actieve Projecten: ${activeProjects.length}`);
    console.log(`📝 Content deze maand: ${contentThisMonth}`);
    console.log(`✅ Gepubliceerd: ${publishedContent.length}`);
    console.log(`🔍 GSC Connected: ${client.googleSearchConsoleToken ? 'Yes' : 'No'}`);
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');

    // 7. Probleem diagnose
    console.log('\n7️⃣  Diagnose...');
    if (activeProjects.length === 0) {
      console.log('⚠️  PROBLEEM: Geen actieve projecten gevonden!');
      if (allProjects.length > 0) {
        console.log('💡 OPLOSSING: Er zijn wel projecten, maar ze zijn inactief.');
        console.log('   Run deze query om ze actief te maken:');
        console.log(`   UPDATE "Project" SET "isActive" = true WHERE "clientId" = '${client.id}';`);
      } else {
        console.log('💡 OPLOSSING: Er zijn geen projecten. Maak een nieuw project aan via /projects');
      }
    } else {
      console.log('✅ Er zijn actieve projecten');
    }

    if (!client.googleSearchConsoleToken) {
      console.log('⚠️  PROBLEEM: Google Search Console niet verbonden!');
      console.log('💡 OPLOSSING: Ga naar /settings en klik "Verbind met Google Search Console"');
      console.log('   Zorg dat de OAuth configuratie correct is (zie GOOGLE_OAUTH_SETUP.md)');
    } else {
      console.log('✅ Google Search Console is verbonden');
    }

  } catch (error) {
    console.error('❌ Error:', error);
  } finally {
    await prisma.$disconnect();
  }
}

// Run the debug
debugDashboard()
  .then(() => {
    console.log('\n✅ Debug complete!');
    process.exit(0);
  })
  .catch((error) => {
    console.error('❌ Fatal error:', error);
    process.exit(1);
  });
