
require('/home/ubuntu/writgo_planning_app/nextjs_space/node_modules/dotenv').config({ path: '/home/ubuntu/writgo_planning_app/nextjs_space/.env' });
const { PrismaClient } = require('/home/ubuntu/writgo_planning_app/nextjs_space/node_modules/.prisma/client');
const bcrypt = require('/home/ubuntu/writgo_planning_app/nextjs_space/node_modules/bcryptjs');

const prisma = new PrismaClient();

async function createProAccount() {
  try {
    console.log('🚀 Creating Pro account for mikeschonewille@gmail.com...');

    // Check if user already exists
    const existing = await prisma.client.findUnique({
      where: { email: 'mikeschonewille@gmail.com' },
    });

    if (existing) {
      console.log('⚠️  User already exists. Updating to Pro...');
      
      // Find Pro package (full service)
      const proPackage = await prisma.subscriptionPackage.findFirst({
        where: {
          tier: 'Pro',
          serviceType: 'full',
          isActive: true,
        },
      });

      if (!proPackage) {
        throw new Error('Pro package not found');
      }

      // Update or create subscription
      const subscription = await prisma.clientSubscription.upsert({
        where: { clientId: existing.id },
        update: {
          packageId: proPackage.id,
          status: 'ACTIVE',
          startDate: new Date(),
          nextBillingDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), // 30 days
          articlesUsed: 0,
          reelsUsed: 0,
        },
        create: {
          clientId: existing.id,
          packageId: proPackage.id,
          status: 'ACTIVE',
          startDate: new Date(),
          nextBillingDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
          articlesUsed: 0,
          reelsUsed: 0,
        },
      });

      console.log('✅ Updated existing user to Pro subscription');
      console.log('\n📧 Email: mikeschonewille@gmail.com');
      console.log('🔑 Password: (unchanged)');
      console.log('💳 Subscription: PRO');
      console.log(`📅 Valid until: ${subscription.nextBillingDate}`);
      
      return;
    }

    // Create new user
    const hashedPassword = await bcrypt.hash('test123', 10);

    const client = await prisma.client.create({
      data: {
        name: 'Mike Schonewille',
        email: 'mikeschonewille@gmail.com',
        password: hashedPassword,
        phone: '+31612345678',
        companyName: 'Test Company',
        website: 'https://example.com',
        isActive: true,
        freeArticleCredits: 0, // No free credits for Pro
        freeReelCredits: 0,
      },
    });

    console.log('✅ Client created:', client.id);

    // Find Pro package (full service)
    const proPackage = await prisma.subscriptionPackage.findFirst({
      where: {
        tier: 'Pro',
        serviceType: 'full',
        isActive: true,
      },
    });

    if (!proPackage) {
      throw new Error('Pro package not found. Please ensure packages are seeded.');
    }

    // Create Pro subscription
    const subscription = await prisma.clientSubscription.create({
      data: {
        clientId: client.id,
        packageId: proPackage.id,
        status: 'ACTIVE',
        startDate: new Date(),
        nextBillingDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), // 30 days from now
        articlesUsed: 0,
        reelsUsed: 0,
      },
    });

    console.log('✅ Pro subscription created');

    // Create AI Profile
    const aiProfile = await prisma.clientAIProfile.create({
      data: {
        clientId: client.id,
        websiteName: 'Test Company',
        websiteUrl: 'https://example.com',
        companyDescription: 'Test bedrijf voor demo doeleinden',
        targetAudience: 'Ondernemers en ZZP\'ers',
        problemStatement: 'Geen tijd voor content marketing',
        solutionStatement: 'Geautomatiseerde content creatie met AI',
        uniqueFeatures: ['AI Content', 'Automatische Planning', 'SEO Optimalisatie'],
        contentStyle: ['Professional', 'Informative'],
        contentLanguage: 'Dutch',
        toneOfVoice: 'Professioneel maar toegankelijk',
        imageSize: '1536x1024',
        imageStyle: 'Modern Gradient Illustration',
        brandAccentColor: '#FF6B35',
        autopilotEnabled: false,
        publishingDays: ['Mon', 'Wed', 'Fri'],
        publishingTime: '09:00',
        postsPerDay: 1,
        aiScanCompleted: true,
        lastAIScanAt: new Date(),
      },
    });

    console.log('✅ AI Profile created');

    console.log('\n🎉 Pro testaccount succesvol aangemaakt!');
    console.log('\n📧 Email: mikeschonewille@gmail.com');
    console.log('🔑 Password: test123');
    console.log('💳 Subscription: PRO');
    console.log(`🎯 Package: ${proPackage.displayName}`);
    console.log(`💰 Price: €${proPackage.monthlyPrice}/month`);
    console.log(`📅 Valid until: ${subscription.nextBillingDate}`);
    console.log('\n🌐 Login at: https://writgoai.abacusai.app/client-login');
    
  } catch (error) {
    console.error('❌ Error creating Pro account:', error);
    throw error;
  } finally {
    await prisma.$disconnect();
  }
}

createProAccount();
