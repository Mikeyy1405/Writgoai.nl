
process.env.DATABASE_URL = 'postgresql://role_660998b92:rtnUeIerDQmGCoPTTRSjuAGdgxVifMxH@db-660998b92.db002.hosteddb.reai.io:5432/660998b92?connect_timeout=15';
const { PrismaClient } = require('/home/ubuntu/writgo_planning_app/nextjs_space/node_modules/.prisma/client');

const prisma = new PrismaClient();

async function updateClients() {
  try {
    const result = await prisma.client.updateMany({
      data: {
        freeArticleCredits: 1,
        freeReelCredits: 1,
      }
    });
    console.log('✅ Updated', result.count, 'clients with free credits');
  } catch (error) {
    console.error('Error:', error.message);
  } finally {
    await prisma.$disconnect();
  }
}

updateClients();
