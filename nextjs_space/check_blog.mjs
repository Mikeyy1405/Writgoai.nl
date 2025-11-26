import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function checkBlog() {
  try {
    const blog = await prisma.blogPost.findFirst({
      where: {
        slug: 'ai-content-marketing-tips-en-best-practices-voor-succes'
      },
      select: {
        id: true,
        title: true,
        slug: true,
        excerpt: true,
        status: true,
        publishedAt: true,
        readingTimeMinutes: true,
        category: true
      }
    });
    
    if (blog) {
      console.log('✅ Blog found in database:');
      console.log(JSON.stringify(blog, null, 2));
    } else {
      console.log('❌ Blog not found in database');
    }
  } catch (error) {
    console.error('Error:', error.message);
  } finally {
    await prisma.$disconnect();
  }
}

checkBlog();
