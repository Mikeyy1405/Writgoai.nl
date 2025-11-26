import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

const main = async () => {
  try {
    const count = await prisma.project.count();
    console.log(`Projects: ${count}`);
    const clients = await prisma.client.count();
    console.log(`Clients: ${clients}`);
  } catch (e) {
    console.error(e);
  } finally {
    await prisma.$disconnect();
  }
};

main();
