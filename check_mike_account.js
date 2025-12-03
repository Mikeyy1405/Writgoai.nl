require('dotenv').config();
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function checkMikeAccount() {
  try {
    const client = await prisma.client.findUnique({
      where: { email: 'mikeschonewille@gmail.com' },
      include: {
        ClientSubscription: {
          include: { Package: true }
        },
        AIProfile: true,
        MasterContentPlan: {
          include: {
            MasterArticles: {
              take: 5,
              orderBy: { articleNumber: 'asc' }
            }
          }
        },
        Task: {
          take: 5,
          orderBy: { createdAt: 'desc' }
        }
      }
    });

    if (!client) {
      console.log('❌ Client niet gevonden');
      return;
    }

    console.log('\n📊 MIKE\'S ACCOUNT STATUS:\n');
    console.log('Email:', client.email);
    console.log('Subscription:', client.ClientSubscription?.[0]?.Package?.name || 'Geen');
    console.log('Articles per month:', client.ClientSubscription?.[0]?.Package?.articlesPerMonth || 0);
    
    console.log('\n🤖 AI PROFILE:');
    if (client.AIProfile) {
      console.log('Website:', client.AIProfile.websiteUrl);
      console.log('Company:', client.AIProfile.companyDescription?.substring(0, 100));
      console.log('Scan Status:', client.AIProfile.scanStatus);
    } else {
      console.log('❌ Geen AI Profile');
    }

    console.log('\n📚 MASTER CONTENT PLAN:');
    if (client.MasterContentPlan) {
      console.log('Status:', client.MasterContentPlan.status);
      console.log('Total Articles:', client.MasterContentPlan.totalArticles);
      console.log('Created:', client.MasterContentPlan.createdAt);
      if (client.MasterContentPlan.MasterArticles?.length > 0) {
        console.log('\nEerste 5 artikelen:');
        client.MasterContentPlan.MasterArticles.forEach((article, i) => {
          console.log(`${i + 1}. [${article.priority}] ${article.title}`);
          console.log(`   Keyword: ${article.mainKeyword}`);
          console.log(`   Type: ${article.contentType}`);
        });
      }
    } else {
      console.log('❌ Geen Master Content Plan');
    }

    console.log('\n📝 RECENTE TASKS:');
    if (client.Task && client.Task.length > 0) {
      client.Task.forEach((task, i) => {
        console.log(`${i + 1}. ${task.title}`);
        console.log(`   Status: ${task.status}`);
        console.log(`   Type: ${task.taskType}`);
      });
    } else {
      console.log('❌ Geen tasks');
    }

  } catch (error) {
    console.error('Error:', error);
  } finally {
    await prisma.$disconnect();
  }
}

checkMikeAccount();
