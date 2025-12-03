
const { PrismaClient } = require('@prisma/client');
const fs = require('fs');

// Read .env file
const envContent = fs.readFileSync('/home/ubuntu/writgo_planning_app/nextjs_space/.env', 'utf8');
const envVars = {};
envContent.split('\n').forEach(line => {
  const [key, ...valueParts] = line.split('=');
  if (key && valueParts.length > 0) {
    envVars[key.trim()] = valueParts.join('=').trim().replace(/^["']|["']$/g, '');
  }
});

// Set DATABASE_URL
process.env.DATABASE_URL = envVars.DATABASE_URL;

const prisma = new PrismaClient();

async function deleteOldArticles() {
  try {
    console.log('🗑️  Deleting old placeholder articles...\n');

    // Zoek de klant
    const client = await prisma.client.findUnique({
      where: { email: 'mikeschonewille@gmail.com' }
    });

    if (!client) {
      console.log('❌ Client not found');
      return;
    }

    // Verwijder alle content plannen en gerelateerde artikelen
    const contentPlans = await prisma.contentPlan.findMany({
      where: { clientId: client.id },
      include: {
        PlannedArticles: true
      }
    });

    console.log(`Found ${contentPlans.length} content plan(s)`);

    for (const plan of contentPlans) {
      console.log(`\nDeleting plan for ${plan.month}/${plan.year} with ${plan.PlannedArticles.length} articles...`);
      
      // Verwijder eerst de gerelateerde PublishedArticles
      for (const article of plan.PlannedArticles) {
        await prisma.publishedArticle.deleteMany({
          where: { plannedArticleId: article.id }
        });
      }

      // Verwijder de PlannedArticles
      await prisma.plannedArticle.deleteMany({
        where: { contentPlanId: plan.id }
      });

      // Verwijder het ContentPlan
      await prisma.contentPlan.delete({
        where: { id: plan.id }
      });

      console.log(`✅ Deleted plan for ${plan.month}/${plan.year}`);
    }

    console.log('\n✅ All old articles deleted! You can now generate fresh articles with the new writing rules.');
  } catch (error) {
    console.error('❌ Error:', error);
  } finally {
    await prisma.$disconnect();
  }
}

deleteOldArticles();
