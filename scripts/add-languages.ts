
/**
 * Script om nieuwe talen toe te voegen aan de database
 * Voert direct SQL uit om enum values toe te voegen
 */

import 'dotenv/config';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function addLanguages() {
  try {
    console.log('🌍 Adding new languages to database...');
    
    // PostgreSQL staat toe om enum values toe te voegen met ALTER TYPE
    // Deze queries zijn idempotent (IF NOT EXISTS equivalent)
    
    try {
      await prisma.$executeRawUnsafe(`ALTER TYPE "Language" ADD VALUE IF NOT EXISTS 'PL'`);
      console.log('✅ Added Polish (PL)');
    } catch (error: any) {
      if (error.message.includes('already exists')) {
        console.log('⏭️  Polish (PL) already exists');
      } else {
        throw error;
      }
    }
    
    try {
      await prisma.$executeRawUnsafe(`ALTER TYPE "Language" ADD VALUE IF NOT EXISTS 'SV'`);
      console.log('✅ Added Swedish (SV)');
    } catch (error: any) {
      if (error.message.includes('already exists')) {
        console.log('⏭️  Swedish (SV) already exists');
      } else {
        throw error;
      }
    }
    
    try {
      await prisma.$executeRawUnsafe(`ALTER TYPE "Language" ADD VALUE IF NOT EXISTS 'DA'`);
      console.log('✅ Added Danish (DA)');
    } catch (error: any) {
      if (error.message.includes('already exists')) {
        console.log('⏭️  Danish (DA) already exists');
      } else {
        throw error;
      }
    }
    
    console.log('\n✅ Language setup complete!');
    console.log('Supported languages: NL, EN, DE, ES, FR, IT, PT, PL, SV, DA');
    
  } catch (error) {
    console.error('❌ Error adding languages:', error);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

addLanguages();
