import dotenv from 'dotenv';
import { PrismaClient } from '@prisma/client';

dotenv.config();
const prisma = new PrismaClient();

async function verifyRestore() {
  try {
    console.log('\n' + '='.repeat(70));
    console.log('  DATABASE RESTORE VERIFICATION');
    console.log('='.repeat(70) + '\n');
    
    // Count all entities
    const counts = {
      'Clients': await prisma.client.count(),
      'Projects': await prisma.project.count(),
      'Article Ideas': await prisma.articleIdea.count(),
      'Saved Content': await prisma.savedContent.count(),
      'Autopilot Jobs': await prisma.autopilotJob.count(),
      'Social Media Posts': await prisma.socialMediaPost.count(),
      'Knowledge Base': await prisma.projectKnowledge.count(),
      'Autopilot Schedules': await prisma.autopilotSchedule.count(),
    };
    
    console.log('📊 DATA COUNTS:\n');
    let totalRecords = 0;
    Object.entries(counts).forEach(([name, count]) => {
      const icon = count > 0 ? '✅' : '❌';
      console.log(`   ${icon} ${name.padEnd(25)}: ${count}`);
      totalRecords += count;
    });
    
    console.log(`\n   TOTAL RECORDS: ${totalRecords}\n`);
    
    // Check latest data
    console.log('='.repeat(70));
    console.log('📅 LATEST DATA:\n');
    
    const latestClient = await prisma.client.findFirst({ 
      orderBy: { createdAt: 'desc' },
      select: { email: true, createdAt: true }
    });
    
    if (latestClient) {
      console.log(`   Latest Client: ${latestClient.email}`);
      console.log(`   Created: ${latestClient.createdAt}\n`);
    } else {
      console.log('   ❌ No clients found\n');
    }
    
    const latestProject = await prisma.project.findFirst({ 
      orderBy: { createdAt: 'desc' },
      select: { name: true, websiteUrl: true, createdAt: true }
    });
    
    if (latestProject) {
      console.log(`   Latest Project: ${latestProject.name}`);
      console.log(`   URL: ${latestProject.websiteUrl}`);
      console.log(`   Created: ${latestProject.createdAt}\n`);
    } else {
      console.log('   ❌ No projects found\n');
    }
    
    // Check autopilot data
    const autopilotProjects = await prisma.project.findMany({
      where: {
        autopilotEnabled: true
      },
      select: { name: true }
    });
    
    console.log('='.repeat(70));
    console.log('🤖 AUTOPILOT STATUS:\n');
    
    if (autopilotProjects.length > 0) {
      console.log(`   ✅ ${autopilotProjects.length} projects met Autopilot:\n`);
      autopilotProjects.forEach(p => {
        console.log(`      • ${p.name}`);
      });
      console.log('');
    } else {
      console.log('   ℹ️  Geen autopilot projecten gevonden\n');
    }
    
    // Final verdict
    console.log('='.repeat(70));
    console.log('🎯 VERDICT:\n');
    
    if (totalRecords === 0) {
      console.log('   ❌ DATABASE IS NOG STEEDS LEEG');
      console.log('\n   Mogelijke oorzaken:');
      console.log('   1. Restore is nog niet uitgevoerd');
      console.log('   2. Verkeerde backup geselecteerd');
      console.log('   3. Restore faalde zonder error message');
      console.log('\n   Actie:');
      console.log('   • Check Abacus.AI dashboard voor restore status');
      console.log('   • Probeer oudere backup als beschikbaar');
      console.log('   • Contact support@abacus.ai\n');
    } else if (counts.Clients > 0 && counts.Projects > 0) {
      console.log('   ✅ RESTORE SUCCESVOL!');
      console.log(`\n   ${counts.Clients} clients en ${counts.Projects} projecten hersteld`);
      console.log('   Klanten kunnen nu weer inloggen');
      console.log('   Autopilot kan weer draaien\n');
      
      console.log('   Volgende stappen:');
      console.log('   1. Test login functionaliteit');
      console.log('   2. Verifieer autopilot page werkt');
      console.log('   3. Inform klanten over herstel');
      console.log('   4. Check WordPress koppelingen\n');
    } else {
      console.log('   ⚠️  PARTIAL RESTORE');
      console.log('\n   Sommige data ontbreekt nog');
      console.log('   Check of restore volledig is afgerond\n');
    }
    
    console.log('='.repeat(70) + '\n');
    
  } catch (error) {
    console.error('❌ Error:', error.message);
  } finally {
    await prisma.$disconnect();
  }
}

verifyRestore();
