import { NextResponse } from 'next/server';
import { prisma } from '@/lib/db';

export const dynamic = 'force-dynamic';
export const revalidate = 3600; // Revalidate every hour

export async function GET() {
  try {
    // Fetch latest published blog posts
    const posts = await prisma.blogPost.findMany({
      where: {
        status: 'published',
      },
      select: {
        title: true,
        slug: true,
        excerpt: true,
        content: true,
        publishedAt: true,
        updatedAt: true,
        authorName: true,
        category: true,
      },
      orderBy: {
        publishedAt: 'desc',
      },
      take: 50, // Last 50 posts
    });

    // Strip HTML tags from content for description
    const stripHtml = (html: string) => {
      return html.replace(/<[^>]*>/g, '').substring(0, 500);
    };

    // Generate RSS feed XML
    const rss = `<?xml version="1.0" encoding="UTF-8"?>
<rss version="2.0" 
     xmlns:content="http://purl.org/rss/1.0/modules/content/"
     xmlns:dc="http://purl.org/dc/elements/1.1/"
     xmlns:atom="http://www.w3.org/2005/Atom">
  <channel>
    <title>WritgoAI Blog</title>
    <link>https://writgo.nl/blog</link>
    <description>Tips, trends en best practices voor AI-gedreven content marketing</description>
    <language>nl-NL</language>
    <lastBuildDate>${new Date().toUTCString()}</lastBuildDate>
    <atom:link href="https://writgo.nl/blog/feed.xml" rel="self" type="application/rss+xml" />
    
${posts
  .map(
    (post) => `    <item>
      <title><![CDATA[${post.title}]]></title>
      <link>https://writgo.nl/${post.slug}</link>
      <guid isPermaLink="true">https://writgo.nl/${post.slug}</guid>
      <description><![CDATA[${post.excerpt || stripHtml(post.content)}]]></description>
      <content:encoded><![CDATA[${post.content}]]></content:encoded>
      <dc:creator><![CDATA[${post.authorName}]]></dc:creator>
      <category><![CDATA[${post.category}]]></category>
      <pubDate>${new Date(post.publishedAt || post.updatedAt).toUTCString()}</pubDate>
    </item>`
  )
  .join('\n')}
  </channel>
</rss>`;

    return new NextResponse(rss, {
      headers: {
        'Content-Type': 'application/rss+xml; charset=UTF-8',
        'Cache-Control': 'public, s-maxage=3600, stale-while-revalidate=86400',
      },
    });
  } catch (error) {
    console.error('Error generating RSS feed:', error);
    return new NextResponse('Error generating RSS feed', { status: 500 });
  }
}
