import dotenv from 'dotenv';
import { PrismaClient } from '@prisma/client';

dotenv.config();
const prisma = new PrismaClient();

async function checkSchema() {
  try {
    console.log('\n========================================');
    console.log('  DATABASE SCHEMA CHECK');
    console.log('========================================\n');
    
    // Check if tables exist
    const tables = await prisma.$queryRaw`
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_schema = 'public' 
      AND table_type = 'BASE TABLE'
      ORDER BY table_name;
    `;
    
    console.log(`Total tables: ${tables.length}\n`);
    console.log('Tables found:');
    tables.forEach((t, i) => {
      console.log(`  ${i + 1}. ${t.table_name}`);
    });
    
    console.log('\n========================================\n');
    
    // Check if SocialMediaConfig table exists and its columns
    const columns = await prisma.$queryRaw`
      SELECT column_name, data_type 
      FROM information_schema.columns 
      WHERE table_name = 'SocialMediaConfig'
      ORDER BY ordinal_position;
    `;
    
    if (columns.length > 0) {
      console.log('SocialMediaConfig columns:');
      columns.forEach(c => {
        console.log(`  - ${c.column_name} (${c.data_type})`);
      });
    } else {
      console.log('⚠️  SocialMediaConfig table not found');
    }
    
    console.log('\n========================================\n');
    
  } catch (error) {
    console.error('Error:', error.message);
  } finally {
    await prisma.$disconnect();
  }
}

checkSchema();
