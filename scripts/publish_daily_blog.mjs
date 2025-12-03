
import { PrismaClient } from '@prisma/client';
import { readFileSync } from 'fs';

const prisma = new PrismaClient();

async function publishBlog() {
  try {
    const blogData = JSON.parse(readFileSync('/home/ubuntu/daily_blogs/temp_blog_20251128_080142.json', 'utf-8'));
    
    // Check if slug already exists
    const existing = await prisma.blogPost.findUnique({
      where: { slug: blogData.slug }
    });
    
    if (existing) {
      console.log('⚠️  Blog with this slug already exists, updating...');
      const updated = await prisma.blogPost.update({
        where: { slug: blogData.slug },
        data: blogData
      });
      console.log('✅ Blog updated successfully:', updated.id);
    } else {
      const created = await prisma.blogPost.create({
        data: blogData
      });
      console.log('✅ Blog published successfully:', created.id);
    }
    
    process.exit(0);
  } catch (error) {
    console.error('❌ Error publishing blog:', error);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

publishBlog();
