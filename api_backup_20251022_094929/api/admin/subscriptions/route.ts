
import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth-options';
import { prisma } from '@/lib/db';

export const dynamic = 'force-dynamic';

// GET all subscription packages
export async function GET(request: NextRequest) {
  try {
    const packages = await prisma.subscriptionPackage.findMany({
      where: { isActive: true },
      orderBy: { order: 'asc' },
    });

    return NextResponse.json(packages);
  } catch (error) {
    console.error('Error fetching subscription packages:', error);
    return NextResponse.json(
      { error: 'Failed to fetch subscription packages' },
      { status: 500 }
    );
  }
}

// POST create subscription package
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session || session.user.role !== 'admin') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { 
      tier,
      serviceType,
      displayName, 
      description, 
      monthlyPrice, 
      articlesPerMonth, 
      reelsFrequency,
      features,
      isPopular,
      order 
    } = body;

    if (!tier || !serviceType || !displayName || !monthlyPrice) {
      return NextResponse.json(
        { error: 'Tier, serviceType, displayName, and price are required' },
        { status: 400 }
      );
    }

    const pkg = await prisma.subscriptionPackage.create({
      data: {
        tier,
        serviceType,
        displayName,
        description,
        monthlyPrice,
        articlesPerMonth: articlesPerMonth || null,
        reelsFrequency: reelsFrequency || null,
        features: features || [],
        isPopular: isPopular || false,
        order: order || 0,
      },
    });

    return NextResponse.json(pkg);
  } catch (error) {
    console.error('Error creating subscription package:', error);
    return NextResponse.json(
      { error: 'Failed to create subscription package' },
      { status: 500 }
    );
  }
}
