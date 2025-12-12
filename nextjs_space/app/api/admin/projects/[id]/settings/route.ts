import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth-options';
import { prisma } from '@/lib/db';

// GET - Get project settings
export async function GET(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.email) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const settings = await prisma.projectSettings.findUnique({
      where: { projectId: params.id }
    });

    // Return empty object if no settings exist yet
    return NextResponse.json(settings || {});
  } catch (error: any) {
    console.error('❌ GET project settings error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

// PUT - Update project settings
export async function PUT(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.email) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();

    // Use upsert to create or update settings
    const settings = await prisma.projectSettings.upsert({
      where: { projectId: params.id },
      update: {
        brandVoice: body.brandVoice,
        targetAudience: body.targetAudience,
        contentGuidelines: body.contentGuidelines,
        defaultSeoTitle: body.defaultSeoTitle,
        defaultSeoDescription: body.defaultSeoDescription,
        defaultKeywords: body.defaultKeywords,
        autoIncludeAffiliateLinks: body.autoIncludeAffiliateLinks,
        useKnowledgeBase: body.useKnowledgeBase,
        contentTone: body.contentTone,
        autoPublishBlogs: body.autoPublishBlogs,
        autoPublishSocial: body.autoPublishSocial
      },
      create: {
        projectId: params.id,
        brandVoice: body.brandVoice,
        targetAudience: body.targetAudience,
        contentGuidelines: body.contentGuidelines,
        defaultSeoTitle: body.defaultSeoTitle,
        defaultSeoDescription: body.defaultSeoDescription,
        defaultKeywords: body.defaultKeywords,
        autoIncludeAffiliateLinks: body.autoIncludeAffiliateLinks,
        useKnowledgeBase: body.useKnowledgeBase,
        contentTone: body.contentTone,
        autoPublishBlogs: body.autoPublishBlogs,
        autoPublishSocial: body.autoPublishSocial
      }
    });

    return NextResponse.json(settings);
  } catch (error: any) {
    console.error('❌ PUT project settings error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export const dynamic = 'force-dynamic';
