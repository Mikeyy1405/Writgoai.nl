
// Script om nieuwe Stripe producten en prijzen aan te maken

const Stripe = require('stripe');
require('dotenv').config({ path: './.env' });

if (!process.env.STRIPE_SECRET_KEY) {
  console.error('❌ STRIPE_SECRET_KEY niet gevonden in .env file');
  process.exit(1);
}

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);

async function createProducts() {
  console.log('🚀 WritgoAI - Nieuwe Pricing Tiers Aanmaken\n');

  const tiers = [
    {
      name: 'Basis',
      price: 4900, // €49.00 in cents
      credits: 2000,
      description: 'Perfect voor starters - 2000 credits/maand, alle tools toegankelijk',
      features: [
        'Alle AI modellen (GPT-4, Claude, Gemini, etc)',
        '2000 credits per maand',
        'Alle tools: Blog, Video, Social Media, Code',
        'Content Library',
        'Keyword Research',
        'Email support'
      ]
    },
    {
      name: 'Professional',
      price: 9900, // €99.00 in cents
      credits: 6000,
      description: 'Voor professionals - 6000 credits/maand, priority support',
      features: [
        'Alles van Basis',
        '6000 credits per maand',
        'Priority support (< 2 uur)',
        'Advanced AI modellen',
        'Bulk content generatie',
        'Social media automation',
        'Analytics dashboard'
      ]
    },
    {
      name: 'Business',
      price: 19900, // €199.00 in cents
      credits: 15000,
      description: 'Voor teams & agencies - 15000 credits/maand, multi-user',
      features: [
        'Alles van Professional',
        '15000 credits per maand',
        'Multi-user accounts (tot 5 gebruikers)',
        'White-label optie',
        'Dedicated account manager',
        'Custom integraties',
        'Priority support'
      ]
    },
    {
      name: 'Enterprise',
      price: 39900, // €399.00 in cents
      credits: 40000,
      description: 'Voor grote organisaties - 40000 credits/maand, dedicated support',
      features: [
        'Alles van Business',
        '40000 credits per maand',
        'Onbeperkte gebruikers',
        'Volledige white-label',
        'Custom development',
        '24/7 dedicated support',
        'Maandelijks strategiegesprek'
      ]
    }
  ];

  const results = [];

  for (const tier of tiers) {
    try {
      console.log(`\n📦 Aanmaken: ${tier.name} (€${tier.price / 100}/maand - ${tier.credits} credits)...`);

      // Maak product aan
      const product = await stripe.products.create({
        name: `WritgoAI ${tier.name}`,
        description: tier.description,
        metadata: {
          credits: tier.credits.toString(),
          tier: tier.name.toLowerCase(),
          features: JSON.stringify(tier.features)
        }
      });

      console.log(`   ✅ Product aangemaakt: ${product.id}`);

      // Maak prijs aan
      const price = await stripe.prices.create({
        product: product.id,
        unit_amount: tier.price,
        currency: 'eur',
        recurring: {
          interval: 'month'
        },
        metadata: {
          credits: tier.credits.toString(),
          tier: tier.name.toLowerCase()
        }
      });

      console.log(`   ✅ Prijs aangemaakt: ${price.id}`);

      results.push({
        tier: tier.name,
        productId: product.id,
        priceId: price.id,
        price: `€${tier.price / 100}`,
        credits: tier.credits
      });

    } catch (error) {
      console.error(`   ❌ Fout bij ${tier.name}:`, error.message);
    }
  }

  console.log('\n\n📋 RESULTATEN:\n');
  console.log('════════════════════════════════════════════════════════════');
  
  results.forEach(r => {
    console.log(`\n${r.tier}:`);
    console.log(`  Product ID: ${r.productId}`);
    console.log(`  Price ID:   ${r.priceId}`);
    console.log(`  Prijs:      ${r.price}/maand`);
    console.log(`  Credits:    ${r.credits}/maand`);
  });

  console.log('\n\n📝 Voeg deze toe aan je .env file:\n');
  console.log('════════════════════════════════════════════════════════════');
  
  results.forEach(r => {
    const envKey = `STRIPE_${r.tier.toUpperCase()}_PRICE_ID`;
    const envKeyPublic = `NEXT_PUBLIC_STRIPE_${r.tier.toUpperCase()}_PRICE_ID`;
    console.log(`${envKey}=${r.priceId}`);
    console.log(`${envKeyPublic}=${r.priceId}`);
  });

  console.log('\n✅ Klaar!\n');
}

createProducts().catch(console.error);
