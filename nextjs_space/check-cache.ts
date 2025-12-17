/**
 * Check what's in the WordPress Sitemap Cache
 */

import { prisma } from './lib/db';

async function checkCache() {
  console.log('🔍 Checking WordPress Sitemap Cache\n');
  
  // Find gigadier.nl project
  const projects = await prisma.project.findMany({
    where: {
      websiteUrl: {
        contains: 'gigadier.nl'
      }
    },
    select: {
      id: true,
      name: true,
      websiteUrl: true
    }
  });
  
  console.log(`Found ${projects.length} projects with gigadier.nl:\n`);
  
  for (const project of projects) {
    console.log(`📁 Project: ${project.name || 'Unnamed'}`);
    console.log(`   ID: ${project.id}`);
    console.log(`   URL: ${project.websiteUrl}\n`);
    
    // Get cached entries for this project
    const cached = await prisma.wordPressSitemapCache.findMany({
      where: {
        projectId: project.id
      },
      orderBy: {
        lastScanned: 'desc'
      },
      take: 10 // Only show first 10
    });
    
    console.log(`   Cached entries: ${cached.length}`);
    
    if (cached.length > 0) {
      console.log('\n   📝 Sample URLs (first 10):');
      cached.forEach((entry, i) => {
        console.log(`     ${i + 1}. ${entry.title}`);
        console.log(`        URL: ${entry.url}`);
        console.log(`        Last Scanned: ${entry.lastScanned}`);
      });
    }
    
    console.log('\n');
  }
  
  // Check for /blogs URLs
  const blogsUrls = await prisma.wordPressSitemapCache.findMany({
    where: {
      url: {
        contains: '/blogs'
      }
    },
    take: 5
  });
  
  if (blogsUrls.length > 0) {
    console.log(`⚠️  Found ${blogsUrls.length} entries with /blogs in URL:\n`);
    blogsUrls.forEach((entry, i) => {
      console.log(`   ${i + 1}. ${entry.url}`);
    });
  } else {
    console.log('✅ No /blogs URLs found in cache');
  }
  
  await prisma.$disconnect();
}

checkCache().catch(error => {
  console.error('❌ Error:', error);
  process.exit(1);
});
