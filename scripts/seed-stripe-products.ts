import { getUncachableStripeClient } from '../server/stripeClient';

async function seedProducts() {
  console.log('Creating Hubisck Pro product and prices...');
  
  const stripe = await getUncachableStripeClient();

  const existingProducts = await stripe.products.search({ 
    query: "name:'Hubisck Pro'" 
  });
  
  if (existingProducts.data.length > 0) {
    console.log('Hubisck Pro product already exists:', existingProducts.data[0].id);
    
    const existingPrices = await stripe.prices.list({ 
      product: existingProducts.data[0].id,
      active: true 
    });
    
    console.log('Existing prices:');
    existingPrices.data.forEach(price => {
      console.log(`  - ${price.currency.toUpperCase()}: ${price.unit_amount! / 100} (${price.id})`);
    });
    
    return;
  }

  const product = await stripe.products.create({
    name: 'Hubisck Pro',
    description: 'Unlock all features: unlimited links, custom themes, analytics, Google Ads remarketing, and priority support.',
    metadata: {
      tier: 'pro',
      features: 'unlimited_links,custom_themes,analytics,remarketing,priority_support'
    }
  });
  
  console.log('Created product:', product.id);

  const brlPrice = await stripe.prices.create({
    product: product.id,
    unit_amount: 1999,
    currency: 'brl',
    recurring: { interval: 'month' },
    metadata: { display_name: 'R$ 19,99/mês' }
  });
  console.log('Created BRL price:', brlPrice.id);

  const eurPrice = await stripe.prices.create({
    product: product.id,
    unit_amount: 1999,
    currency: 'eur',
    recurring: { interval: 'month' },
    metadata: { display_name: '€19.99/month' }
  });
  console.log('Created EUR price:', eurPrice.id);

  const usdPrice = await stripe.prices.create({
    product: product.id,
    unit_amount: 1999,
    currency: 'usd',
    recurring: { interval: 'month' },
    metadata: { display_name: '$19.99/month' }
  });
  console.log('Created USD price:', usdPrice.id);

  console.log('\nAll prices created successfully!');
  console.log('Product ID:', product.id);
  console.log('Price IDs:');
  console.log('  BRL:', brlPrice.id);
  console.log('  EUR:', eurPrice.id);
  console.log('  USD:', usdPrice.id);
}

seedProducts().catch(console.error);
