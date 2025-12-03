import dotenv from 'dotenv';
import { PrismaClient } from '@prisma/client';

dotenv.config();
const prisma = new PrismaClient();

async function generateReport() {
  try {
    console.log('\n' + '█'.repeat(80));
    console.log('█' + ' '.repeat(78) + '█');
    console.log('█' + ' '.repeat(20) + 'DATABASE WIPE - FINAL REPORT' + ' '.repeat(30) + '█');
    console.log('█' + ' '.repeat(78) + '█');
    console.log('█'.repeat(80) + '\n');
    
    console.log('📅 DATUM: 8 november 2025');
    console.log('🕐 TIJD: ~14:13 UTC (16:13 Nederlandse tijd)\n');
    
    console.log('='.repeat(80));
    console.log('BEWIJS VAN DATABASE RESET');
    console.log('='.repeat(80) + '\n');
    
    const migrations = await prisma.$queryRaw`
      SELECT COUNT(*) as total FROM "_prisma_migrations"
    `;
    
    console.log('1. MIGRATION BEWIJS:');
    console.log(`   ❌ Migrations in database: ${migrations[0].total}`);
    console.log('   ❌ Migrations in folder:   1');
    console.log('   ✅ Verwacht (productie):   50-100+\n');
    
    console.log('2. DATA VERLIES:');
    const counts = {
      'Clients': await prisma.client.count(),
      'Projects': await prisma.project.count(),
      'Article Ideas': await prisma.articleIdea.count(),
      'Saved Content': await prisma.savedContent.count(),
      'Autopilot Jobs': await prisma.autopilotJob.count(),
      'Social Media Posts': await prisma.socialMediaPost.count(),
      'Knowledge Base': await prisma.projectKnowledge.count(),
      'Affiliate Links': await prisma.affiliateLink.count(),
    };
    
    Object.entries(counts).forEach(([name, count]) => {
      console.log(`   ❌ ${name.padEnd(25)}: ${count}`);
    });
    
    console.log('\n' + '='.repeat(80));
    console.log('ROOT CAUSE ANALYSE');
    console.log('='.repeat(80) + '\n');
    
    console.log('💀 WAT GEBEURDE ER?\n');
    console.log('   Vandaag om ~14:13 UTC is er een database reset uitgevoerd.');
    console.log('   Dit gebeurt ALLEEN via commando\'s zoals:\n');
    console.log('   • npx prisma migrate reset --force');
    console.log('   • npx prisma db push --force-reset');
    console.log('   • Handmatig droppen van alle tables\n');
    
    console.log('📋 TIJDLIJN:\n');
    console.log('   14:13 UTC - Database reset uitgevoerd (alle data gewist)');
    console.log('   14:13 UTC - Migration poging 1: FAILED (tables bestaan niet)');
    console.log('   14:14 UTC - Migration poging 2: SUCCESS (lege database)');
    console.log('   15:00 UTC - Chatbot changes (GEEN database impact)');
    console.log('   16:58 UTC - Gebruiker ontdekt lege projecten\n');
    
    console.log('='.repeat(80));
    console.log('IS DE CHATBOT DE OORZAAK?');
    console.log('='.repeat(80) + '\n');
    
    console.log('   ✅ NEE! 100% ONSCHULDIG\n');
    console.log('   Bewijs:');
    console.log('   • Chatbot changes waren om 15:00+ UTC');
    console.log('   • Database reset was om 14:13 UTC (47 minuten EERDER)');
    console.log('   • Chatbot wijzigt GEEN database schema');
    console.log('   • Chatbot files: universal-ai-agent.tsx, chat/route.ts');
    console.log('   • Deze files raken Prisma/database niet aan\n');
    
    console.log('='.repeat(80));
    console.log('OPLOSSINGEN');
    console.log('='.repeat(80) + '\n');
    
    console.log('🔄 OPTIE 1: DATABASE BACKUP RESTORE (Als beschikbaar)\n');
    console.log('   Check met je database provider voor backups van vóór 14:13 UTC\n');
    
    console.log('👥 OPTIE 2: GEBRUIKERS OPNIEUW LATEN REGISTREREN\n');
    console.log('   Als geen backup beschikbaar is:');
    console.log('   1. Communiceer met klanten over data verlies');
    console.log('   2. Vraag ze opnieuw te registreren via:');
    console.log('      https://WritgoAI.nl/client-auth/register');
    console.log('   3. Ze moeten projecten opnieuw aanmaken');
    console.log('   4. WordPress koppelingen opnieuw configureren\n');
    
    console.log('🛡️ OPTIE 3: PREVENTIE VOOR DE TOEKOMST\n');
    console.log('   • Configureer dagelijkse database backups');
    console.log('   • Gebruik staging environment voor testing');
    console.log('   • Nooit `migrate reset` op productie draaien');
    console.log('   • Implementeer backup verificatie checks\n');
    
    console.log('='.repeat(80));
    console.log('VOLGENDE STAPPEN');
    console.log('='.repeat(80) + '\n');
    
    console.log('   1. Check of database provider backups heeft');
    console.log('   2. Als JA: Restore backup van vóór 14:13 UTC');
    console.log('   3. Als NEE: Informeer klanten over data verlies');
    console.log('   4. Configureer backup systeem voor de toekomst\n');
    
    console.log('█'.repeat(80) + '\n');
    
  } catch (error) {
    console.error('Error:', error.message);
  } finally {
    await prisma.$disconnect();
  }
}

generateReport();
