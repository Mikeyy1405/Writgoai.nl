import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function checkBlogContent() {
  try {
    const blog = await prisma.blogPost.findFirst({
      where: {
        slug: 'de-nieuwste-ai-ontwikkelingen-van-deze-week-wat-content-creators-en-marketeers-moeten-weten'
      },
      select: {
        id: true,
        title: true,
        content: true,
        status: true,
        readingTime: true
      }
    });
    
    if (blog) {
      const wordCount = blog.content.split(/\s+/).length;
      console.log('Blog ID:', blog.id);
      console.log('Title:', blog.title);
      console.log('Status:', blog.status);
      console.log('Reading Time:', blog.readingTime);
      console.log('Word Count:', wordCount);
      console.log('Content length:', blog.content.length, 'characters');
    } else {
      console.log('Blog not found');
    }
  } catch (error) {
    console.error('Error:', error);
  } finally {
    await prisma.$disconnect();
  }
}

checkBlogContent();
