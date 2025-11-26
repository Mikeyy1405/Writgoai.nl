const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function checkArticleIdeas() {
  try {
    const count = await prisma.articleIdea.count();
    console.log(`Totaal aantal article ideas: ${count}`);
    
    if (count > 0) {
      const ideas = await prisma.articleIdea.findMany({
        take: 5,
        orderBy: { createdAt: 'desc' },
        select: {
          id: true,
          title: true,
          status: true,
          createdAt: true,
          clientId: true,
        }
      });
      
      console.log('\nRecentste 5 article ideas:');
      ideas.forEach((idea, i) => {
        console.log(`${i+1}. ${idea.title} - Status: ${idea.status} - Created: ${idea.createdAt.toLocaleDateString()}`);
      });
    } else {
      console.log('\nGeen article ideas gevonden in de database.');
    }
    
  } catch (error) {
    console.error('Error:', error);
  } finally {
    await prisma.$disconnect();
  }
}

checkArticleIdeas();
