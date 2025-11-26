import { PrismaClient } from '@prisma/client';
import * as dotenv from 'dotenv';

dotenv.config();

const prisma = new PrismaClient();

async function checkBlogContent() {
  try {
    const post = await prisma.blogPost.findFirst({
      where: { slug: 'hoe-je-een-blog-niche-valideert-voordat-je-begint' },
      select: {
        title: true,
        excerpt: true,
        content: true,
        authorName: true,
      },
    });
    
    if (post) {
      console.log('Title:', post.title);
      console.log('\nExcerpt:', post.excerpt);
      console.log('\nAuthor:', post.authorName);
      console.log('\nContent preview (first 1000 chars):');
      console.log(post.content.substring(0, 1000));
    } else {
      console.log('Post not found');
    }
    
  } catch (error) {
    console.error('Error:', error);
  } finally {
    await prisma.$disconnect();
  }
}

checkBlogContent();
