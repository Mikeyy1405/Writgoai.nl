const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function checkProjectLanguages() {
  try {
    // Find the client by email
    const client = await prisma.client.findUnique({
      where: { email: 'info@WritgoAI.nl' },
      include: {
        projects: {
          select: {
            id: true,
            name: true,
            language: true,
          }
        }
      }
    });

    if (!client) {
      console.log('Client not found');
      return;
    }

    console.log(`\nProjects for ${client.email}:`);
    console.log('===============================');
    
    client.projects.forEach(project => {
      console.log(`\nProject: ${project.name}`);
      console.log(`ID: ${project.id}`);
      console.log(`Language: ${project.language}`);
    });

    console.log(`\n\nTotal projects: ${client.projects.length}`);
    
    // Count by language
    const languageCounts = client.projects.reduce((acc, p) => {
      acc[p.language] = (acc[p.language] || 0) + 1;
      return acc;
    }, {});
    
    console.log('\nLanguage distribution:');
    Object.entries(languageCounts).forEach(([lang, count]) => {
      console.log(`${lang}: ${count} projects`);
    });

  } catch (error) {
    console.error('Error:', error);
  } finally {
    await prisma.$disconnect();
  }
}

checkProjectLanguages();
