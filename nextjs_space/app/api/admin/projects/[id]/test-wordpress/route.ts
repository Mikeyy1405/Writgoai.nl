export const dynamic = "force-dynamic";

import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth-options';
import { prisma } from '@/lib/db';

// POST - Test WordPress connection for an admin project
export async function POST(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user?.email) {
      return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });
    }

    // Check if user is admin
    const user = await prisma.user.findUnique({
      where: { email: session.user.email }
    });

    if (user?.role !== 'admin') {
      return NextResponse.json({ error: 'Unauthorized - Admin only' }, { status: 403 });
    }

    // Get project
    const project = await prisma.adminProject.findUnique({
      where: { id: params.id }
    });

    if (!project) {
      return NextResponse.json({ error: 'Project not found' }, { status: 404 });
    }

    if (!project.wordpressUrl || !project.wordpressUsername || !project.wordpressPassword) {
      return NextResponse.json({
        success: false,
        error: 'WordPress credentials not configured'
      }, { status: 400 });
    }

    // Test WordPress connection
    const wpUrl = project.wordpressUrl.replace(/\/$/, '');
    const auth = Buffer.from(`${project.wordpressUsername}:${project.wordpressPassword}`).toString('base64');
    
    const response = await fetch(`${wpUrl}/wp-json/wp/v2/users/me`, {
      method: 'GET',
      headers: {
        'Authorization': `Basic ${auth}`,
        'Content-Type': 'application/json',
      },
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('WordPress connection test failed:', response.status, errorText);
      
      return NextResponse.json({
        success: false,
        error: `WordPress connection failed (${response.status}): ${response.statusText}`,
        details: errorText
      }, { status: 200 }); // Return 200 so we can show the error in UI
    }

    const userData = await response.json();
    
    return NextResponse.json({
      success: true,
      message: 'WordPress connection successful',
      user: {
        id: userData.id,
        name: userData.name,
        username: userData.slug,
      }
    });

  } catch (error: any) {
    console.error('Error testing WordPress connection:', error);
    return NextResponse.json({
      success: false,
      error: error.message || 'Failed to test WordPress connection'
    }, { status: 200 }); // Return 200 so we can show the error in UI
  }
}
