import { config } from 'dotenv';
config();

import { generateTopicalMap } from '@/lib/topical-map-generator';

async function testTopicalMapGenerator() {
  console.log('🧪 Testing Topical Map Generator...\n');
  
  try {
    console.log('📝 Generating test topical map...');
    
    const result = await generateTopicalMap({
      mainTopic: 'Test Product',
      language: 'NL',
      depth: 2,
      targetArticles: 50,
      includeCommercial: true,
      commercialRatio: 0.4
    });
    
    console.log('\n✅ Topical Map Generated Successfully!');
    console.log('Total Articles:', result.totalArticles);
    console.log('Categories:', result.categories.length);
    console.log('SEO Score:', result.seoOpportunityScore);
    console.log('\nFirst category:', result.categories[0]?.name);
    
  } catch (error: any) {
    console.error('\n❌ Error:', error.message);
    console.error('Full error:', error);
  }
}

testTopicalMapGenerator();
