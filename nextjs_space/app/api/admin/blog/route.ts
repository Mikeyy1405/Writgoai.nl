
import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth-options';
import { prisma } from '@/lib/db';
import { supabaseAdmin } from '@/lib/supabase';

// GET - Alle blog posts ophalen (met filters)
export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.email) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Get client to ensure they can only see their own content
    const { data: client } = await supabaseAdmin
      .from('Client')
      .select('id')
      .eq('email', session.user.email)
      .single();

    if (!client) {
      console.error('[Blog API] Client not found for:', session.user.email);
      return NextResponse.json({ error: 'Client not found' }, { status: 404 });
    }

    const { searchParams } = new URL(request.url);
    const status = searchParams.get('status');
    const category = searchParams.get('category');
    const projectId = searchParams.get('projectId');
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '20');

    const where: any = {};
    if (status) where.status = status;
    if (category) where.category = category;
    if (projectId) where.projectId = projectId;
    
    // CRITICAL: Only show posts for projects owned by this client
    // Get all project IDs for this client
    const { data: clientProjects } = await supabaseAdmin
      .from('Project')
      .select('id')
      .eq('clientId', client.id);
    
    const projectIds = clientProjects?.map(p => p.id) || [];
    if (projectIds.length > 0) {
      where.projectId = projectIds; // Filter by client's projects
    } else {
      // No projects = no blog posts
      return NextResponse.json({
        posts: [],
        pagination: { total: 0, page, limit, pages: 0 },
      });
    }

    const [posts, total] = await Promise.all([
      prisma.blogPost.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        skip: (page - 1) * limit,
        take: limit,
        select: {
          id: true,
          title: true,
          slug: true,
          excerpt: true,
          content: true,
          featuredImage: true,
          metaTitle: true,
          metaDescription: true,
          focusKeyword: true,
          category: true,
          tags: true,
          status: true,
          publishedAt: true,
          scheduledFor: true,
          authorId: true,
          authorName: true,
          views: true,
          readingTimeMinutes: true,
          createdAt: true,
          updatedAt: true,
          language: true,
          // Exclude seoScore to prevent database errors if column doesn't exist
          // seoScore: true,
          internalLinks: true,
          externalLinks: true,
          wordCount: true,
          lastAnalyzed: true,
          searchConsoleData: true,
        },
      }),
      prisma.blogPost.count({ where }),
    ]);

    console.log(`[Admin API] Found ${total} blog posts in database (filters: ${JSON.stringify(where)})`);
    console.log(`[Admin API] Returning ${posts.length} posts for page ${page}`);

    return NextResponse.json({
      posts,
      pagination: {
        total,
        page,
        limit,
        pages: Math.ceil(total / limit),
      },
    });
  } catch (error) {
    console.error('Error fetching blog posts:', error);
    return NextResponse.json({ error: 'Server error' }, { status: 500 });
  }
}

// POST - Nieuwe blog post aanmaken
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.email) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Get client to validate ownership
    const { data: client } = await supabaseAdmin
      .from('Client')
      .select('id')
      .eq('email', session.user.email)
      .single();

    if (!client) {
      console.error('[Blog API POST] Client not found for:', session.user.email);
      return NextResponse.json({ error: 'Client not found' }, { status: 404 });
    }

    const body = await request.json();
    const {
      title,
      slug,
      excerpt,
      content,
      featuredImage,
      metaTitle,
      metaDescription,
      focusKeyword,
      category,
      tags,
      status,
      publishedAt,
      scheduledFor,
      authorName,
      readingTimeMinutes,
      projectId,
    } = body;

    // Validatie
    if (!title || !slug || !excerpt || !content) {
      return NextResponse.json(
        { error: 'Title, slug, excerpt en content zijn verplicht' },
        { status: 400 }
      );
    }

    // CRITICAL: If projectId provided, verify it belongs to this client
    if (projectId) {
      const { data: project } = await supabaseAdmin
        .from('Project')
        .select('clientId')
        .eq('id', projectId)
        .single();
      
      if (!project || project.clientId !== client.id) {
        console.error('[Blog API POST] Project ownership validation failed');
        return NextResponse.json({ 
          error: 'Project niet gevonden of geen toegang' 
        }, { status: 403 });
      }
    }

    // Check of slug al bestaat
    const existing = await prisma.blogPost.findUnique({ where: { slug } });
    if (existing) {
      return NextResponse.json({ error: 'Deze slug bestaat al' }, { status: 400 });
    }

    const post = await prisma.blogPost.create({
      data: {
        title,
        slug,
        excerpt,
        content,
        featuredImage,
        metaTitle: metaTitle || title,
        metaDescription: metaDescription || excerpt,
        focusKeyword,
        category: category || 'AI & Content Marketing',
        tags: tags || [],
        status: status || 'draft',
        publishedAt: status === 'published' ? new Date() : publishedAt,
        scheduledFor,
        authorName: authorName || 'WritgoAI Team',
        readingTimeMinutes: readingTimeMinutes || 5,
        projectId: projectId || null,
      },
    });

    return NextResponse.json({ post }, { status: 201 });
  } catch (error) {
    console.error('Error creating blog post:', error);
    return NextResponse.json({ error: 'Server error' }, { status: 500 });
  }
}
