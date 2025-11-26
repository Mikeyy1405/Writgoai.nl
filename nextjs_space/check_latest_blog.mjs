import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function checkLatestBlog() {
  try {
    const latestBlog = await prisma.blogPost.findFirst({
      orderBy: {
        createdAt: 'desc'
      },
      select: {
        id: true,
        title: true,
        slug: true,
        excerpt: true,
        status: true,
        createdAt: true,
        publishedAt: true
      }
    });
    
    console.log('Latest blog post:');
    console.log(JSON.stringify(latestBlog, null, 2));
  } catch (error) {
    console.error('Error:', error);
  } finally {
    await prisma.$disconnect();
  }
}

checkLatestBlog();
