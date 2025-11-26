const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  const content = await prisma.contentPiece.findMany({
    orderBy: { createdAt: 'desc' },
    take: 5,
    select: {
      id: true,
      dayNumber: true,
      theme: true,
      reelTitle: true,
      reelVadooId: true,
      reelVideoStatus: true,
      reelVideoUrl: true,
      createdAt: true,
    }
  });
  
  console.log('Recent Content Pieces:');
  console.log(JSON.stringify(content, null, 2));
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
