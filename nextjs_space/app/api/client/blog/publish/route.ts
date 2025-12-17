/**
 * POST /api/client/blog/publish
 * 
 * Publiceert een gegenereerd artikel naar de Writgo.nl publieke blog
 * Gebruikt voor "eat your own dog food" - publiceer content gemaakt met onze eigen tool
 */

import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth-options';
import { prisma } from '@/lib/db';

export async function POST(request: Request) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user?.email) {
      return NextResponse.json(
        { success: false, error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const { articleId, savedContentId } = await request.json();

    if (!articleId && !savedContentId) {
      return NextResponse.json(
        { success: false, error: 'Missing articleId or savedContentId' },
        { status: 400 }
      );
    }

    // Option 1: Article from Topical Authority (PlannedArticle)
    if (articleId) {
      // Haal artikel + content op
      const article = await prisma.plannedArticle.findUnique({
        where: { id: articleId },
        include: {
          subtopic: {
            include: {
              pillarTopic: true
            }
          }
        },
      });

      if (!article) {
        return NextResponse.json(
          { success: false, error: 'Article not found' },
          { status: 404 }
        );
      }

      // Check if already published
      if (article.blogPostId) {
        const existingPost = await prisma.blogPost.findUnique({
          where: { id: article.blogPostId },
        });
        
        if (existingPost) {
          return NextResponse.json({
            success: true,
            alreadyPublished: true,
            blogPost: {
              id: existingPost.id,
              slug: existingPost.slug,
              url: `/blog/${existingPost.slug}`,
            },
          });
        }
      }

      // Haal gegenereerde content op
      const savedContent = await prisma.savedContent.findFirst({
        where: {
          title: article.title,
        },
        orderBy: {
          createdAt: 'desc',
        },
      });

      if (!savedContent || !savedContent.content) {
        return NextResponse.json(
          { success: false, error: 'Content not generated yet. Please generate the article first.' },
          { status: 400 }
        );
      }

      // Genereer slug
      const slug = article.title
        .toLowerCase()
        .normalize('NFD')
        .replace(/[\u0300-\u036f]/g, '')
        .replace(/[^a-z0-9]+/g, '-')
        .replace(/^-|-$/g, '');

      // Check of slug al bestaat
      const existing = await prisma.blogPost.findUnique({
        where: { slug },
      });

      if (existing) {
        return NextResponse.json(
          { success: false, error: 'Blog post with this slug already exists' },
          { status: 400 }
        );
      }

      // Maak blog post
      const blogPost = await prisma.blogPost.create({
        data: {
          slug,
          title: article.title,
          excerpt: savedContent.content.substring(0, 200) + '...',
          content: savedContent.content,
          category: article.subtopic?.pillarTopic?.name || 'Algemeen',
          tags: [article.focusKeyword],
          metaTitle: article.title,
          metaDescription: savedContent.content.substring(0, 160),
          focusKeyword: article.focusKeyword,
          status: 'published',
          publishedAt: new Date(),
          author: 'Writgo AI',
        },
      });

      // Update artikel met blogPostId
      await prisma.plannedArticle.update({
        where: { id: articleId },
        data: { blogPostId: blogPost.id },
      });

      return NextResponse.json({
        success: true,
        message: 'Article published to blog!',
        blogPost: {
          id: blogPost.id,
          slug: blogPost.slug,
          url: `/blog/${blogPost.slug}`,
        },
      });
    }

    // Option 2: Saved Content (direct from content generator)
    if (savedContentId) {
      const savedContent = await prisma.savedContent.findUnique({
        where: { id: savedContentId },
        include: {
          project: true,
        },
      });

      if (!savedContent) {
        return NextResponse.json(
          { success: false, error: 'Content not found' },
          { status: 404 }
        );
      }

      // Genereer slug
      const slug = savedContent.title
        .toLowerCase()
        .normalize('NFD')
        .replace(/[\u0300-\u036f]/g, '')
        .replace(/[^a-z0-9]+/g, '-')
        .replace(/^-|-$/g, '');

      // Check of slug al bestaat
      const existing = await prisma.blogPost.findUnique({
        where: { slug },
      });

      if (existing) {
        return NextResponse.json(
          { success: false, error: 'Blog post with this slug already exists' },
          { status: 400 }
        );
      }

      // Maak blog post
      const blogPost = await prisma.blogPost.create({
        data: {
          slug,
          title: savedContent.title,
          excerpt: savedContent.content.substring(0, 200) + '...',
          content: savedContent.content,
          category: 'Algemeen',
          tags: [],
          metaTitle: savedContent.title,
          metaDescription: savedContent.content.substring(0, 160),
          status: 'published',
          publishedAt: new Date(),
          author: 'Writgo AI',
        },
      });

      return NextResponse.json({
        success: true,
        message: 'Content published to blog!',
        blogPost: {
          id: blogPost.id,
          slug: blogPost.slug,
          url: `/blog/${blogPost.slug}`,
        },
      });
    }

    return NextResponse.json(
      { success: false, error: 'Invalid request' },
      { status: 400 }
    );

  } catch (error: any) {
    console.error('[Blog Publish] Error:', error);
    return NextResponse.json(
      { success: false, error: error.message || 'Failed to publish to blog' },
      { status: 500 }
    );
  }
}
