
import { config } from 'dotenv';
config(); // Load environment variables

import { prisma } from '../lib/db';
import bcrypt from 'bcryptjs';

async function createSuperuser() {
  try {
    console.log('🔧 Creating superuser account...');
    
    const email = 'info@WritgoAI.nl';
    const password = 'CM120309cm!!';
    const name = 'Writgo Media Admin';
    
    // Check if user already exists
    const existingUser = await prisma.user.findUnique({
      where: { email }
    });
    
    if (existingUser) {
      console.log('⚠️  User already exists. Updating password...');
      
      const hashedPassword = await bcrypt.hash(password, 12);
      
      await prisma.user.update({
        where: { email },
        data: {
          password: hashedPassword,
          name,
          role: 'superadmin' // Special role for full access
        }
      });
      
      console.log('✅ Superuser password updated!');
    } else {
      console.log('📝 Creating new superuser...');
      
      const hashedPassword = await bcrypt.hash(password, 12);
      
      await prisma.user.create({
        data: {
          email,
          password: hashedPassword,
          name,
          role: 'superadmin' // Special role for full access
        }
      });
      
      console.log('✅ Superuser created!');
    }
    
    // Also create or update a Client account for AI Agent access
    console.log('');
    console.log('🤖 Setting up AI Agent access...');
    
    const existingClient = await prisma.client.findUnique({
      where: { email }
    });
    
    if (existingClient) {
      await prisma.client.update({
        where: { email },
        data: {
          name,
          isUnlimited: true, // Unlimited AI credits
          subscriptionStatus: 'active',
          subscriptionPlan: 'superadmin'
        }
      });
      console.log('✅ AI Agent access updated - Unlimited credits enabled!');
    } else {
      const hashedPassword = await bcrypt.hash(password, 12);
      
      await prisma.client.create({
        data: {
          email,
          password: hashedPassword,
          name,
          companyName: 'Writgo Media',
          website: 'https://WritgoAI.nl',
          isUnlimited: true, // Unlimited AI credits
          subscriptionStatus: 'active',
          subscriptionPlan: 'superadmin'
        }
      });
      console.log('✅ AI Agent access created - Unlimited credits enabled!');
    }
    
    console.log('');
    console.log('📧 Email: info@WritgoAI.nl');
    console.log('🔑 Password: CM120309cm!!');
    console.log('👤 Role: superadmin');
    console.log('');
    console.log('✨ This account has:');
    console.log('   - Full access to admin dashboard');
    console.log('   - Access to all client data');
    console.log('   - Access to AI Agent tools');
    console.log('   - Unlimited credits for testing');
    console.log('');
    
  } catch (error) {
    console.error('❌ Error creating superuser:', error);
    throw error;
  } finally {
    await prisma.$disconnect();
  }
}

createSuperuser();
