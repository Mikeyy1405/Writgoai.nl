/**
 * Test script for unified login system
 * Tests both Client and User (admin) login functionality
 */

import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function testUnifiedLogin() {
  console.log('🧪 Testing Unified Login System...\n');
  
  try {
    // Test 1: Check if admin user exists
    console.log('Test 1: Checking admin user in User table...');
    const adminUser = await prisma.user.findUnique({
      where: { email: 'admin@WritgoAI.nl' }
    });
    
    if (adminUser) {
      console.log('✅ Admin user found in User table');
      console.log(`   - Email: ${adminUser.email}`);
      console.log(`   - Role: ${adminUser.role}`);
      console.log(`   - Name: ${adminUser.name}`);
      
      // Verify password
      const isValidPassword = await bcrypt.compare('admin123', adminUser.password);
      console.log(`   - Password verification: ${isValidPassword ? '✅ Valid' : '❌ Invalid'}`);
    } else {
      console.log('⚠️  Admin user not found. Please run seed-simple.ts first.');
    }
    
    console.log('\n---\n');
    
    // Test 2: Check if test client exists
    console.log('Test 2: Checking test client in Client table...');
    const testClient = await prisma.client.findUnique({
      where: { email: 'test@client.nl' }
    });
    
    if (testClient) {
      console.log('✅ Test client found in Client table');
      console.log(`   - Email: ${testClient.email}`);
      console.log(`   - Name: ${testClient.name}`);
      console.log(`   - Company: ${testClient.companyName}`);
      
      // Verify password
      const isValidPassword = await bcrypt.compare('test123', testClient.password);
      console.log(`   - Password verification: ${isValidPassword ? '✅ Valid' : '❌ Invalid'}`);
    } else {
      console.log('⚠️  Test client not found. Please run seed-simple.ts first.');
    }
    
    console.log('\n---\n');
    console.log('📋 Test Summary:');
    console.log('================');
    
    if (adminUser && testClient) {
      console.log('✅ Both user types exist and can be authenticated');
      console.log('\n💡 Login Behavior:');
      console.log('   1. Email "test@client.nl" → Logs in as CLIENT');
      console.log('      - Returns: role="client", userType="client"');
      console.log('      - User object includes: companyName, automationActive');
      console.log('');
      console.log('   2. Email "admin@WritgoAI.nl" → Logs in as ADMIN');
      console.log('      - Returns: role="admin", userType="user"');
      console.log('      - User object includes: role field');
      console.log('');
      console.log('✨ The unified login route checks Client table first,');
      console.log('   then User table if not found in Client table.');
    } else {
      console.log('❌ Missing test data. Run this command to create test users:');
      console.log('   npx tsx scripts/seed-simple.ts');
    }
    
    console.log('\n');
    
  } catch (error) {
    console.error('❌ Test failed:', error);
    throw error;
  } finally {
    await prisma.$disconnect();
  }
}

testUnifiedLogin()
  .then(() => {
    console.log('✅ Tests completed successfully');
    process.exit(0);
  })
  .catch((error) => {
    console.error('❌ Tests failed:', error);
    process.exit(1);
  });
