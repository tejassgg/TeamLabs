const mongoose = require('mongoose');
const dotenv = require('dotenv');
const CommonType = require('../models/CommonType');

dotenv.config();
mongoose.connect(process.env.MONGO_URI, { useNewUrlParser: true, useUnifiedTopology: true });

const SubscriptionFeatures = [
  // Monthly Plan Features
  { Value: 'Unlimited Projects', Code: 1, MasterType: 'SubscriptionFeatures', Description: 'monthly' },
  { Value: 'Unlimited User Stories', Code: 2, MasterType: 'SubscriptionFeatures', Description: 'monthly' },
  { Value: 'Unlimited Tasks', Code: 3, MasterType: 'SubscriptionFeatures', Description: 'monthly' },
  { Value: 'Advanced Analytics', Code: 4, MasterType: 'SubscriptionFeatures', Description: 'monthly' },
  { Value: 'Priority Support', Code: 5, MasterType: 'SubscriptionFeatures', Description: 'monthly' },
  { Value: 'All Members Premium', Code: 6, MasterType: 'SubscriptionFeatures', Description: 'monthly' },
  
  // Annual Plan Features (same as monthly + additional benefits)
  { Value: 'Unlimited Projects', Code: 7, MasterType: 'SubscriptionFeatures', Description: 'annual' },
  { Value: 'Unlimited User Stories', Code: 8, MasterType: 'SubscriptionFeatures', Description: 'annual' },
  { Value: 'Unlimited Tasks', Code: 9, MasterType: 'SubscriptionFeatures', Description: 'annual' },
  { Value: 'Advanced Analytics', Code: 10, MasterType: 'SubscriptionFeatures', Description: 'annual' },
  { Value: 'Priority Support', Code: 11, MasterType: 'SubscriptionFeatures', Description: 'annual' },
  { Value: 'All Members Premium', Code: 12, MasterType: 'SubscriptionFeatures', Description: 'annual' },
  { Value: '40% Annual Discount', Code: 13, MasterType: 'SubscriptionFeatures', Description: 'annual' },
  
  // Free Plan Features
  { Value: '3 Projects', Code: 14, MasterType: 'SubscriptionFeatures', Description: 'free' },
  { Value: '3 User Stories', Code: 15, MasterType: 'SubscriptionFeatures', Description: 'free' },
  { Value: '20 Tasks per Story', Code: 16, MasterType: 'SubscriptionFeatures', Description: 'free' },
  { Value: 'Basic Support', Code: 17, MasterType: 'SubscriptionFeatures', Description: 'free' }
];

// Subscription Prices
// Stored in CommonType with MasterType: 'SubscriptionPrice'
// Value is the numeric price as string to conform with schema; Description clarifies context
const SubscriptionPrices = [
  // Free plan
  { Value: '0', Code: 100, MasterType: 'SubscriptionPrice', Description: 'free_monthly' },

  // Premium Monthly
  { Value: '79', Code: 101, MasterType: 'SubscriptionPrice', Description: 'premium_monthly' },

  // Premium Annual (monthly equivalent and yearly total)
  { Value: '47.4', Code: 102, MasterType: 'SubscriptionPrice', Description: 'premium_annual_monthly_equivalent' },
  { Value: '569', Code: 103, MasterType: 'SubscriptionPrice', Description: 'premium_annual_yearly_total' }
];

(async () => {
  try {
    // Clear and seed features
    await CommonType.deleteMany({ MasterType: 'SubscriptionFeatures' });
    await CommonType.insertMany(SubscriptionFeatures);

    // Clear and seed prices
    await CommonType.deleteMany({ MasterType: 'SubscriptionPrice' });
    await CommonType.insertMany(SubscriptionPrices);
    console.log('✅ Seeded Subscription Features successfully!');
    console.log(`📊 Total features seeded: ${SubscriptionFeatures.length}`);
    console.log('📋 Features by plan:');
    console.log(`   - Free: ${SubscriptionFeatures.filter(f => f.Description === 'free').length} features`);
    console.log(`   - Monthly: ${SubscriptionFeatures.filter(f => f.Description === 'monthly').length} features`);
    console.log(`   - Annual: ${SubscriptionFeatures.filter(f => f.Description === 'annual').length} features`);

    console.log('✅ Seeded Subscription Prices successfully!');
    console.log(`💲 Prices seeded: ${SubscriptionPrices.length}`);
    const getPrice = (desc) => SubscriptionPrices.find(p => p.Description === desc)?.Value;
    console.log(`   - Free: $${getPrice('free_monthly')}/month`);
    console.log(`   - Premium Monthly: $${getPrice('premium_monthly')}/month`);
    console.log(`   - Premium Annual: $${getPrice('premium_annual_monthly_equivalent')}/month (=$${getPrice('premium_annual_yearly_total')}/year)`);
  } catch (error) {
    console.error('❌ Error seeding subscription features:', error);
  } finally {
    mongoose.disconnect();
  }
})(); 