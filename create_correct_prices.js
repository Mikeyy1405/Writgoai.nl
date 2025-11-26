require('dotenv').config();
const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY);

async function createCorrectPrices() {
  console.log('\n=== CREATING CORRECT STRIPE PRICES ===\n');
  
  try {
    // Get existing products
    const products = await stripe.products.list({ limit: 20 });
    
    let starterProduct = products.data.find(p => p.name === 'WritgoAI Starter');
    let proProduct = products.data.find(p => p.name === 'WritgoAI Pro');
    let enterpriseProduct = products.data.find(p => p.name === 'WritgoAI Enterprise');
    
    // Create Starter price (€29)
    if (starterProduct) {
      const starterPrice = await stripe.prices.create({
        product: starterProduct.id,
        unit_amount: 2900, // €29.00
        currency: 'eur',
        recurring: {
          interval: 'month',
        },
      });
      console.log(`✅ Created Starter price: ${starterPrice.id} (€29.00/month)`);
      console.log(`   Add to .env: STRIPE_STARTER_PRICE_ID=${starterPrice.id}`);
    }
    
    // Create Pro price (€79)
    if (proProduct) {
      const proPrice = await stripe.prices.create({
        product: proProduct.id,
        unit_amount: 7900, // €79.00
        currency: 'eur',
        recurring: {
          interval: 'month',
        },
      });
      console.log(`✅ Created Pro price: ${proPrice.id} (€79.00/month)`);
      console.log(`   Add to .env: STRIPE_PRO_PRICE_ID=${proPrice.id}`);
    }
    
    // Create or update Enterprise product and price (€199)
    if (!enterpriseProduct) {
      enterpriseProduct = await stripe.products.create({
        name: 'WritgoAI Enterprise',
        description: 'Voor teams & agencies met 10.000 credits/maand',
      });
      console.log(`✅ Created Enterprise product: ${enterpriseProduct.id}`);
    }
    
    const enterprisePrice = await stripe.prices.create({
      product: enterpriseProduct.id,
      unit_amount: 19900, // €199.00
      currency: 'eur',
      recurring: {
        interval: 'month',
      },
    });
    console.log(`✅ Created Enterprise price: ${enterprisePrice.id} (€199.00/month)`);
    console.log(`   Add to .env: STRIPE_ENTERPRISE_PRICE_ID=${enterprisePrice.id}`);
    
  } catch (error) {
    console.error('Error:', error.message);
  }
}

createCorrectPrices();
