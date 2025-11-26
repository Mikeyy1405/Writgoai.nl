const { PrismaClient } = require('/home/ubuntu/writgo_planning_app/nextjs_space/node_modules/.prisma/client');

const prisma = new PrismaClient();

async function checkTestClient() {
  try {
    // Find test client
    const client = await prisma.client.findFirst({
      where: {
        email: 'mikeschonewille@gmail.com'
      },
      include: {
        ClientSubscription: {
          include: {
            Package: true
          }
        },
        MasterContentPlan: {
          include: {
            MasterArticles: {
              take: 5
            }
          }
        }
      }
    });

    if (!client) {
      console.log('❌ Test client niet gevonden');
      return;
    }

    console.log('\n✅ Test Client gevonden:');
    console.log('Email:', client.email);
    console.log('Naam:', client.name);
    
    if (client.ClientSubscription && client.ClientSubscription.length > 0) {
      const sub = client.ClientSubscription[0];
      console.log('\n📦 Abonnement:');
      console.log('Package:', sub.Package.displayName);
      console.log('Tier:', sub.Package.tier);
      console.log('Artikelen per maand:', sub.Package.articlesPerMonth);
      console.log('Status:', sub.status);
    } else {
      console.log('\n❌ Geen actief abonnement');
    }

    if (client.MasterContentPlan) {
      console.log('\n📚 Master Content Plan:');
      console.log('Totaal artikelen:', client.MasterContentPlan.totalArticles);
      console.log('Artikelen vrijgegeven:', client.MasterContentPlan.articlesReleased);
      console.log('Status:', client.MasterContentPlan.status);
      console.log('Aantal geladen artikelen:', client.MasterContentPlan.MasterArticles.length);
      
      if (client.MasterContentPlan.MasterArticles.length > 0) {
        console.log('\nEerste 3 artikelen:');
        client.MasterContentPlan.MasterArticles.slice(0, 3).forEach((article, idx) => {
          console.log(`${idx + 1}. ${article.title} (${article.isReleased ? 'Vrijgegeven' : 'Nog niet vrijgegeven'})`);
        });
      }
    } else {
      console.log('\n❌ Geen Master Content Plan');
    }

    // Check bestaande taken
    const tasks = await prisma.task.findMany({
      where: {
        clientId: client.id,
        category: 'CONTENT_AUTOMATION'
      },
      orderBy: {
        createdAt: 'desc'
      },
      take: 5
    });

    console.log('\n📋 Bestaande taken:', tasks.length);
    if (tasks.length > 0) {
      tasks.forEach((task, idx) => {
        console.log(`${idx + 1}. ${task.title} - ${task.status}`);
      });
    }

  } catch (error) {
    console.error('Error:', error);
  } finally {
    await prisma.$disconnect();
  }
}

checkTestClient();
