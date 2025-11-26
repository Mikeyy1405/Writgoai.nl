import { PrismaClient } from '@prisma/client';
import dotenv from 'dotenv';

dotenv.config();

const prisma = new PrismaClient();

async function checkMigrations() {
  try {
    const result = await prisma.$queryRaw`
      SELECT migration_name, finished_at 
      FROM "_prisma_migrations" 
      ORDER BY finished_at DESC 
      LIMIT 5
    `;
    
    console.log('📜 Laatste 5 migraties:');
    console.log(result);
    
  } catch (error) {
    console.error('❌ Fout bij ophalen migraties:', error.message);
  } finally {
    await prisma.$disconnect();
  }
}

checkMigrations();
