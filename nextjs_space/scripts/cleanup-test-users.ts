
import { PrismaClient } from '@prisma/client';
import dotenv from 'dotenv';

// Load environment variables
dotenv.config();

const prisma = new PrismaClient();

// Lijst van email patronen die aangeven dat het test users zijn
const TEST_EMAIL_PATTERNS = [
  'test@',
  'demo@',
  'example@',
  '+test',
  '@test.',
  '@example.',
  'testuser',
  'demouser'
];

// Protected emails die NIET verwijderd mogen worden
const PROTECTED_EMAILS = [
  'mikeschonewille@gmail.com',
  'cgrotebeverborg@gmail.com',
  'mike@schonewille.com'
];

async function cleanupTestUsers() {
  console.log('🔍 Zoeken naar test users...\n');
  
  try {
    // Haal alle clients op
    const allClients = await prisma.client.findMany({
      select: {
        id: true,
        email: true,
        name: true,
        createdAt: true,
        _count: {
          select: {
            contentPieces: true,
            projects: true
          }
        }
      }
    });
    
    console.log(`📊 Totaal aantal clients: ${allClients.length}\n`);
    
    // Filter test users
    const testUsers = allClients.filter((client: any) => {
      // Skip protected emails
      if (PROTECTED_EMAILS.includes(client.email.toLowerCase())) {
        return false;
      }
      
      // Check if email matches test patterns
      const email = client.email.toLowerCase();
      return TEST_EMAIL_PATTERNS.some(pattern => email.includes(pattern));
    });
    
    if (testUsers.length === 0) {
      console.log('✅ Geen test users gevonden!\n');
      return;
    }
    
    console.log(`🔎 Gevonden test users (${testUsers.length}):\n`);
    
    testUsers.forEach((user: any, index: number) => {
      console.log(`${index + 1}. ${user.name || 'Geen naam'}`);
      console.log(`   Email: ${user.email}`);
      console.log(`   Content: ${user._count.contentPieces}`);
      console.log(`   Projecten: ${user._count.projects}`);
      console.log(`   Aangemaakt: ${user.createdAt.toLocaleDateString('nl-NL')}\n`);
    });
    
    // Vraag om bevestiging
    console.log('⚠️  WAARSCHUWING: Deze actie kan niet ongedaan worden gemaakt!\n');
    console.log('Om test users te verwijderen, voer dit script opnieuw uit met --confirm flag:\n');
    console.log('yarn tsx scripts/cleanup-test-users.ts --confirm\n');
    
    // Check for confirm flag
    const confirmFlag = process.argv.includes('--confirm');
    
    if (!confirmFlag) {
      console.log('ℹ️  Geen wijzigingen aangebracht (--confirm flag niet gevonden)\n');
      return;
    }
    
    console.log('🗑️  Verwijderen van test users...\n');
    
    let deletedCount = 0;
    
    for (const user of testUsers) {
      try {
        // Delete related data first
        await prisma.contentPiece.deleteMany({
          where: { clientId: user.id }
        });
        
        await prisma.project.deleteMany({
          where: { clientId: user.id }
        });
        
        await prisma.creditTransaction.deleteMany({
          where: { clientId: user.id }
        });
        
        await prisma.conversation.deleteMany({
          where: { clientId: user.id }
        });
        
        await prisma.directMessage.deleteMany({
          where: { clientId: user.id }
        });
        
        await prisma.lateDevAccount.deleteMany({
          where: { clientId: user.id }
        });
        
        await prisma.clientAISettings.deleteMany({
          where: { clientId: user.id }
        });
        
        // Delete the client
        await prisma.client.delete({
          where: { id: user.id }
        });
        
        console.log(`✅ Verwijderd: ${user.email}`);
        deletedCount++;
      } catch (error) {
        console.error(`❌ Fout bij verwijderen van ${user.email}:`, error);
      }
    }
    
    console.log(`\n✨ Cleanup voltooid! ${deletedCount} test users verwijderd.\n`);
    
  } catch (error) {
    console.error('❌ Fout tijdens cleanup:', error);
  } finally {
    await prisma.$disconnect();
  }
}

cleanupTestUsers();
