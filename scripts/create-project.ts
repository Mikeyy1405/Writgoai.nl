import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  const clients = await prisma.client.findMany({
    take: 5,
    select: {
      id: true,
      name: true,
      email: true,
    },
  });

  console.log('Clients:', JSON.stringify(clients, null, 2));

  if (clients.length > 0) {
    const client = clients[0];
    console.log('\n✅ Using client:', client.email);
    
    // Check if project already exists
    const existingProject = await prisma.project.findFirst({
      where: { clientId: client.id },
    });

    if (existingProject) {
      console.log('✅ Project already exists:', existingProject.id, existingProject.name);
      return;
    }
    
    // Create a test project for this client
    const project = await prisma.project.create({
      data: {
        name: 'Yoga Website',
        websiteUrl: 'https://yoga-example.nl',
        description: 'Een yoga website voor beginners',
        niche: 'Yoga & Wellness',
        targetAudience: 'Beginners in yoga die stressverlichting zoeken',
        clientId: client.id,
      },
    });

    console.log('✅ Project created:', project.id, project.name);
  } else {
    console.log('❌ No clients found');
  }
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
