require('dotenv').config();
const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY);

async function checkPrices() {
  console.log('\n=== CHECKING STRIPE PRICES ===\n');
  
  const priceIds = [
    { name: 'STRIPE_STARTER_PRICE_ID', id: process.env.STRIPE_STARTER_PRICE_ID },
    { name: 'STRIPE_PRO_PRICE_ID', id: process.env.STRIPE_PRO_PRICE_ID },
    { name: 'STRIPE_BUSINESS_PRICE_ID', id: process.env.STRIPE_BUSINESS_PRICE_ID },
    { name: 'STRIPE_BASIS_PRICE_ID', id: process.env.STRIPE_BASIS_PRICE_ID },
    { name: 'STRIPE_PROFESSIONAL_PRICE_ID', id: process.env.STRIPE_PROFESSIONAL_PRICE_ID },
    { name: 'STRIPE_ENTERPRISE_PRICE_ID', id: process.env.STRIPE_ENTERPRISE_PRICE_ID },
  ];
  
  for (const priceInfo of priceIds) {
    if (!priceInfo.id) {
      console.log(`${priceInfo.name}: NOT SET`);
      continue;
    }
    
    try {
      const price = await stripe.prices.retrieve(priceInfo.id);
      const product = await stripe.products.retrieve(price.product);
      
      console.log(`${priceInfo.name}:`);
      console.log(`  Price ID: ${price.id}`);
      console.log(`  Product: ${product.name}`);
      console.log(`  Amount: €${(price.unit_amount / 100).toFixed(2)}`);
      console.log(`  Interval: ${price.recurring?.interval || 'one-time'}`);
      console.log(`  Active: ${price.active}`);
      console.log('');
    } catch (error) {
      console.log(`${priceInfo.name}: ERROR - ${error.message}`);
      console.log('');
    }
  }
}

checkPrices().catch(console.error);
