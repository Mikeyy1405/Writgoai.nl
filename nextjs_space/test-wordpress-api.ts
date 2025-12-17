/**
 * Test script voor WordPress REST API Fetcher
 * 
 * Test of de WordPress REST API werkt voor Gigadier.nl
 */

import { WordPressAPI } from './lib/services/wordpress-api-fetcher';

async function testWordPressAPI() {
  console.log('🧪 Testing WordPress REST API Fetcher\n');
  
  const testSite = 'https://gigadier.nl';
  
  console.log(`📍 Test Site: ${testSite}\n`);
  
  // Test 1: API availability
  console.log('Test 1: Checking API availability...');
  const isAvailable = await WordPressAPI.testAPI(testSite);
  console.log(`✓ API Available: ${isAvailable ? '✅ YES' : '❌ NO'}\n`);
  
  if (!isAvailable) {
    console.error('❌ WordPress REST API is niet beschikbaar.');
    console.error('   Check of de site WordPress gebruikt en of de REST API enabled is.');
    return;
  }
  
  // Test 2: Fetch first page of posts
  console.log('Test 2: Fetching first page of posts...');
  const posts = await WordPressAPI.fetchPosts(testSite, { perPage: 10 });
  console.log(`✓ Posts fetched: ${posts.length} posts\n`);
  
  if (posts.length > 0) {
    console.log('📝 Sample Post:');
    console.log(`   Title: ${posts[0].title}`);
    console.log(`   URL: ${posts[0].url}`);
    console.log(`   Published: ${posts[0].publishedDate.toISOString()}`);
    console.log(`   Excerpt: ${posts[0].excerpt.substring(0, 100)}...\n`);
  }
  
  // Test 3: Fetch all posts (limited to 3 pages for testing)
  console.log('Test 3: Fetching all posts (max 3 pages)...');
  const allPosts = await WordPressAPI.fetchAllPosts(testSite, 3);
  console.log(`✓ Total posts fetched: ${allPosts.length} posts\n`);
  
  // Show URL examples
  if (allPosts.length > 0) {
    console.log('🔗 URL Examples (first 5):');
    allPosts.slice(0, 5).forEach((post, i) => {
      console.log(`   ${i + 1}. ${post.url}`);
    });
    console.log();
  }
  
  // Validation
  console.log('✅ Validation:');
  const hasFakeUrls = allPosts.some(post => post.url.includes('/blogs'));
  console.log(`   Fake /blogs URLs: ${hasFakeUrls ? '❌ YES (BAD)' : '✅ NO (GOOD)'}`);
  const hasRealUrls = allPosts.every(post => post.url.startsWith('https://gigadier.nl/'));
  console.log(`   All URLs start with site URL: ${hasRealUrls ? '✅ YES' : '❌ NO'}`);
  const hasTitles = allPosts.every(post => post.title && post.title.length > 0);
  console.log(`   All posts have titles: ${hasTitles ? '✅ YES' : '❌ NO'}`);
  
  console.log('\n✅ WordPress REST API test completed!');
}

// Run test
testWordPressAPI().catch(error => {
  console.error('❌ Test failed:', error);
  process.exit(1);
});
