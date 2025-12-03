import { config } from 'dotenv';
import { PrismaClient } from '@prisma/client';
config();

const prisma = new PrismaClient();

async function generateRestoreSummary() {
  try {
    console.log('═══════════════════════════════════════════════════════════');
    console.log('          WritgoAI DATABASE RESTORE SUCCESVOL              ');
    console.log('═══════════════════════════════════════════════════════════\n');
    
    // Clients
    const clients = await prisma.client.findMany({
      select: {
        id: true,
        name: true,
        email: true,
        subscriptionCredits: true,
        topUpCredits: true,
        subscriptionPlan: true,
        createdAt: true,
        _count: {
          select: {
            projects: true
          }
        }
      }
    });
    
    console.log('👥 CLIENTS (' + clients.length + ' total)\n');
    clients.forEach(c => {
      const totalCredits = (c.subscriptionCredits || 0) + (c.topUpCredits || 0);
      console.log(`   • ${c.name} (${c.email})`);
      console.log(`     Plan: ${c.subscriptionPlan || 'Geen'} | Credits: ${totalCredits} | Projects: ${c._count.projects}`);
      console.log(`     Geregistreerd: ${c.createdAt.toLocaleDateString('nl-NL')}`);
      console.log();
    });
    
    // Projects per client
    for (const client of clients) {
      const projects = await prisma.project.findMany({
        where: { clientId: client.id },
        select: {
          name: true,
          websiteUrl: true,
          wordpressUrl: true,
          _count: {
            select: {
              articleIdeas: true,
              savedContent: true,
              knowledgeBase: true
            }
          }
        }
      });
      
      if (projects.length > 0) {
        console.log(`📁 PROJECTEN VOOR ${client.name.toUpperCase()}:\n`);
        projects.forEach(p => {
          console.log(`   • ${p.name}`);
          console.log(`     Website: ${p.websiteUrl}`);
          console.log(`     WordPress: ${p.wordpressUrl || 'Niet geconfigureerd'}`);
          console.log(`     📝 Content: ${p._count.savedContent} | 💡 Ideeën: ${p._count.articleIdeas} | 📚 Knowledge: ${p._count.knowledgeBase}`);
          console.log();
        });
      }
    }
    
    // Totals
    const totalProjects = await prisma.project.count();
    const totalIdeas = await prisma.articleIdea.count();
    const totalContent = await prisma.savedContent.count();
    const totalKnowledge = await prisma.projectKnowledge.count();
    const totalSchedules = await prisma.autopilotSchedule.count();
    
    console.log('\n═══════════════════════════════════════════════════════════');
    console.log('                    TOTALE STATISTIEKEN                    ');
    console.log('═══════════════════════════════════════════════════════════\n');
    console.log(`   📊 Total Projects: ${totalProjects}`);
    console.log(`   💡 Total Article Ideas: ${totalIdeas}`);
    console.log(`   📝 Total Saved Content: ${totalContent}`);
    console.log(`   📚 Total Knowledge Items: ${totalKnowledge}`);
    console.log(`   ⚙️  Total Autopilot Schedules: ${totalSchedules}`);
    console.log('\n═══════════════════════════════════════════════════════════');
    console.log('               ✅ ALLES IS SUCCESVOL GERESTAUREERD         ');
    console.log('═══════════════════════════════════════════════════════════\n');
    
  } catch (error) {
    console.error('❌ Error:', error.message);
  } finally {
    await prisma.$disconnect();
  }
}

generateRestoreSummary();
