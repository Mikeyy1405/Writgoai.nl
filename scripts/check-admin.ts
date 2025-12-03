import { prisma } from '../lib/db';

async function main() {
  // Check users table
  const users = await prisma.user.findMany({
    select: {
      id: true,
      name: true,
      email: true,
      role: true,
    }
  });
  console.log('Users:', JSON.stringify(users, null, 2));
}

main().catch(console.error).finally(() => prisma.$disconnect());
