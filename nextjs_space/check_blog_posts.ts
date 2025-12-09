import * as dotenv from 'dotenv';

dotenv.config();


async function checkBlogPosts() {
  try {
    const posts = await prisma.blogPost.findMany({
      take: 10,
      orderBy: { createdAt: 'desc' },
      select: {
        id: true,
        title: true,
        slug: true,
        status: true,
        publishedAt: true,
        category: true,
      },
    });
    
    console.log('Total posts:', posts.length);
    console.log('\nBlog posts:');
    posts.forEach(post => {
      console.log(`- ${post.title}`);
      console.log(`  Slug: ${post.slug}`);
      console.log(`  Status: ${post.status}`);
      console.log(`  Published: ${post.publishedAt}`);
      console.log(`  Category: ${post.category}`);
      console.log('');
    });
    
    const publishedCount = await prisma.blogPost.count({
      where: { status: 'published' }
    });
    console.log(`\nTotal published posts: ${publishedCount}`);
    
  } catch (error) {
    console.error('Error:', error);
  } finally {
    await prisma.$disconnect();
  }
}

checkBlogPosts();
