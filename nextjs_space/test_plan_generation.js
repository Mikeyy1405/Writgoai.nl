require('dotenv').config();
const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function testPlanGeneration() {
  try {
    // Get the client
    const client = await prisma.client.findUnique({
      where: { email: 'mikeschonewille@gmail.com' }
    });
    
    if (!client) {
      console.log('❌ Client niet gevonden');
      return;
    }
    
    console.log('✅ Client gevonden:', client.email);
    console.log('Sitemap aanwezig:', !!client.wordpressSitemap);
    
    if (!client.wordpressSitemap) {
      console.log('❌ Geen sitemap data, kan geen plan genereren');
      return;
    }
    
    console.log('\n📝 Simulating plan generation...');
    console.log('Sitemap data size:', JSON.stringify(client.wordpressSitemap).length, 'chars');
    
    // Create a simple test plan
    const testPlan = [
      {
        day: 1,
        date: new Date().toISOString().split('T')[0],
        theme: 'Test Theme',
        blog: { title: 'Test Blog', seoKeywords: ['test'] },
        social: { caption: 'Test social post', platform: 'instagram' },
        tiktok: { hook: 'Test hook', script: 'Test script' },
        youtube: { title: 'Test video', description: 'Test desc', script: 'Test script' }
      }
    ];
    
    console.log('\n💾 Attempting to save test plan to database...');
    
    const updated = await prisma.client.update({
      where: { id: client.id },
      data: {
        contentPlan: testPlan,
        lastPlanGenerated: new Date()
      }
    });
    
    console.log('✅ Plan saved successfully!');
    console.log('Last plan generated:', updated.lastPlanGenerated);
    console.log('Plan length:', Array.isArray(updated.contentPlan) ? updated.contentPlan.length : 0, 'days');
    
    // Verify it's saved
    const verify = await prisma.client.findUnique({
      where: { id: client.id },
      select: { contentPlan: true, lastPlanGenerated: true }
    });
    
    console.log('\n✅ Verification:');
    console.log('Plan in DB:', !!verify.contentPlan);
    console.log('Plan is array:', Array.isArray(verify.contentPlan));
    console.log('Plan length:', Array.isArray(verify.contentPlan) ? verify.contentPlan.length : 0);
    
  } catch (error) {
    console.error('❌ Error:', error.message);
  } finally {
    await prisma.$disconnect();
  }
}

testPlanGeneration();
