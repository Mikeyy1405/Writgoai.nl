
/**
 * Seed subscription plans
 */

import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Seeding subscription plans...');

  // Maak subscription plannen aan - Nieuwe pricing (1000 credits = 20 blogs)
  const plans = [
    {
      name: 'starter',
      displayName: 'Starter Plan',
      monthlyCredits: 1500,
      priceEur: 24.99,
      popular: false,
      description: 'Perfect voor beginners',
      features: [
        '1500 credits per maand (≈ 30 blogs)',
        'Alle AI modellen',
        'Web research & SEO',
        'WordPress integratie',
        'Top-up mogelijk',
        'Email support'
      ]
    },
    {
      name: 'pro',
      displayName: 'Pro Plan',
      monthlyCredits: 3000,
      priceEur: 99.99,
      popular: true,
      description: 'Voor professionals',
      features: [
        '3000 credits per maand (≈ 60 blogs)',
        'Alle AI modellen',
        'Priority support (< 2 uur)',
        'Slimmere AI-modellen',
        'Automatisch posts plaatsen',
        'Top-up mogelijk',
        'Web research',
        'Video generatie',
        'Late.dev koppeling',
        'YouTube & TikTok publiceren'
      ]
    },
    {
      name: 'business',
      displayName: 'Business Plan',
      monthlyCredits: 8000,
      priceEur: 299.99,
      popular: false,
      description: 'Voor teams en bedrijven',
      features: [
        '8000 credits per maand (≈ 160 blogs)',
        'Alle AI modellen',
        '24/7 dedicated support',
        'Team management (5+ users)',
        'Koppelingen op maat',
        'Onder je eigen merknaam',
        'Service-garantie',
        'Top-up mogelijk',
        'Web research',
        'Video generatie',
        'Social media posting',
        'WordPress integratie',
        'Dagelijkse automatisering',
        'Maandelijks strategiegesprek'
      ]
    }
  ];

  for (const plan of plans) {
    await prisma.subscriptionPlan.upsert({
      where: { name: plan.name },
      update: plan,
      create: plan
    });
    console.log(`✅ Created/updated subscription plan: ${plan.displayName}`);
  }

  console.log('✨ Subscription plans seeded successfully!');
}

main()
  .catch((e) => {
    console.error('❌ Seeding failed:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
