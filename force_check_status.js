const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function checkStatus() {
  const client = await prisma.client.findUnique({
    where: { email: 'mikeschonewille@gmail.com' },
    select: {
      wordpressUrl: true,
      wordpressUsername: true,
      wordpressPassword: true,
    }
  });
  
  console.log('WordPress Status:');
  console.log('- URL:', client?.wordpressUrl || 'NIET INGESTELD');
  console.log('- Username:', client?.wordpressUsername || 'NIET INGESTELD');
  console.log('- Password:', client?.wordpressPassword ? 'INGESTELD' : 'NIET INGESTELD');
  
  const hasWordPress = !!(client?.wordpressUrl && client?.wordpressUsername && client?.wordpressPassword);
  console.log('\n✅ WordPress Connected:', hasWordPress);
  
  await prisma.$disconnect();
}

checkStatus();
