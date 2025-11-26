
require('dotenv').config();
const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcryptjs');

const prisma = new PrismaClient();

async function createPremiumClient() {
  try {
    const email = 'cgrotebeverborg@gmail.com';
    const password = 'CM120309cm!!';
    const name = 'Chris Grotebeverborg';

    // Check if client already exists
    const existingClient = await prisma.client.findUnique({
      where: { email }
    });

    if (existingClient) {
      console.log('✅ Client bestaat al:', email);
      
      // Update met premium settings
      const updated = await prisma.client.update({
        where: { email },
        data: {
          name,
          password: await bcrypt.hash(password, 10),
          automationActive: true,
        }
      });

      // Create AI settings met premium toegang
      const aiSettings = await prisma.clientAISettings.upsert({
        where: { clientId: updated.id },
        create: {
          clientId: updated.id,
          preferredModel: 'gpt-4o',
          temperature: 0.7,
          nickname: 'Premium Gebruiker',
          customInstructions: 'Premium gebruiker met volledige toegang tot alle AI/ML modellen en functies.',
          enableWebSearch: true,
          enableImageGen: true,
          enableVideoGen: true,
          toneOfVoice: 'professional',
          writingStyle: 'descriptive'
        },
        update: {
          preferredModel: 'gpt-4o',
          enableWebSearch: true,
          enableImageGen: true,
          enableVideoGen: true
        }
      });

      console.log('✅ Account bijgewerkt naar premium status');
      console.log('📧 Email:', email);
      console.log('🔑 Wachtwoord:', password);
      console.log('💎 Status: Premium (volledige toegang)');
      
      return updated;
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(password, 10);

    // Create nieuwe premium client
    const client = await prisma.client.create({
      data: {
        email,
        password: hashedPassword,
        name,
        companyName: 'WritgoAI',
        automationActive: true,
      }
    });

    // Create AI settings met premium toegang
    const aiSettings = await prisma.clientAISettings.create({
      data: {
        clientId: client.id,
        preferredModel: 'gpt-4o',
        temperature: 0.7,
        nickname: 'Premium Gebruiker',
        customInstructions: 'Premium gebruiker met volledige toegang tot alle AI/ML modellen en functies.',
        enableWebSearch: true,
        enableImageGen: true,
        enableVideoGen: true,
        toneOfVoice: 'professional',
        writingStyle: 'descriptive'
      }
    });

    console.log('✅ Premium client aangemaakt!');
    console.log('📧 Email:', email);
    console.log('🔑 Wachtwoord:', password);
    console.log('💎 Status: Premium (volledige toegang)');
    console.log('');
    console.log('🔗 Login op: https://WritgoAI.nl/client-login');

    return client;

  } catch (error) {
    console.error('❌ Fout bij aanmaken client:', error);
    throw error;
  } finally {
    await prisma.$disconnect();
  }
}

createPremiumClient();
