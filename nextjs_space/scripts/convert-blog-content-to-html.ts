
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

/**
 * Converteert plain text blog content naar HTML met proper headings
 */
function convertPlainTextToHTML(plainText: string): string {
  if (!plainText || plainText.trim() === '') {
    return '<p>Geen content beschikbaar</p>';
  }

  // Check if content already has HTML tags
  if (plainText.includes('<h1') || plainText.includes('<h2') || plainText.includes('<p>')) {
    return plainText; // Already HTML
  }

  let html = '';
  const lines = plainText.split('\n').filter(line => line.trim() !== '');
  
  for (let i = 0; i < lines.length; i++) {
    const line = lines[i].trim();
    
    // Skip empty lines
    if (line === '') continue;

    // Check if it's a heading based on context and capitalization
    const isHeading = (
      // First line is likely the title
      (i === 0) ||
      // Lines that are short and start with capital
      (line.length < 100 && /^[A-Z]/.test(line) && !line.endsWith('.')) ||
      // Lines that contain typical heading patterns
      /^(Wat is|Waarom|Hoe|Voordelen van|Nadelen van|Tips voor|Conclusie|Inleiding|De )/i.test(line) ||
      // Lines followed by a paragraph (next line is longer)
      (lines[i + 1] && lines[i + 1].length > line.length * 2)
    );

    if (isHeading) {
      if (i === 0) {
        // First line is H1 (title)
        html += `<h1>${line}</h1>\n`;
      } else if (line.length < 60) {
        // Short headings are H2
        html += `<h2>${line}</h2>\n`;
      } else {
        // Longer headings are H3
        html += `<h3>${line}</h3>\n`;
      }
    } else {
      // Regular paragraph
      html += `<p>${line}</p>\n`;
    }
  }

  return html;
}

/**
 * Main conversion function
 */
async function convertBlogContent() {
  console.log('🔄 Starting blog content conversion...\n');

  try {
    // Fetch all blog posts
    const posts = await prisma.blogPost.findMany({
      select: {
        id: true,
        title: true,
        content: true,
        slug: true,
      },
    });

    console.log(`📚 Found ${posts.length} blog posts\n`);

    let converted = 0;
    let skipped = 0;

    for (const post of posts) {
      // Check if content needs conversion
      const needsConversion = !post.content.includes('<h1') && 
                             !post.content.includes('<h2') && 
                             !post.content.includes('<p>');

      if (needsConversion) {
        console.log(`🔄 Converting: "${post.title}" (${post.slug})`);
        
        const htmlContent = convertPlainTextToHTML(post.content);
        
        await prisma.blogPost.update({
          where: { id: post.id },
          data: { content: htmlContent },
        });

        converted++;
        console.log(`   ✅ Converted successfully\n`);
      } else {
        skipped++;
        console.log(`⏭️  Skipped: "${post.title}" (already has HTML)\n`);
      }
    }

    console.log('\n📊 Conversion Summary:');
    console.log(`   Total posts: ${posts.length}`);
    console.log(`   Converted: ${converted}`);
    console.log(`   Skipped: ${skipped}`);
    console.log('\n✅ Blog content conversion complete!');

  } catch (error) {
    console.error('❌ Error during conversion:', error);
    throw error;
  } finally {
    await prisma.$disconnect();
  }
}

// Run the conversion
convertBlogContent()
  .then(() => {
    console.log('\n🎉 All done!');
    process.exit(0);
  })
  .catch((error) => {
    console.error('\n❌ Conversion failed:', error);
    process.exit(1);
  });
