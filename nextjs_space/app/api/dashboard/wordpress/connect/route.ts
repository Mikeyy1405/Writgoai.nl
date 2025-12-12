import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth-options';
import { prisma } from '@/lib/prisma-shim';
import { WordPressClient } from '@/lib/content-hub/wordpress-client';

export const dynamic = 'force-dynamic';

export async function POST(request: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.email) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { clientId, siteUrl, username, applicationPassword } = await request.json();
    
    if (!clientId || !siteUrl || !username || !applicationPassword) {
      return NextResponse.json({ 
        error: 'Missing required fields' 
      }, { status: 400 });
    }

    // Clean up siteUrl
    const cleanUrl = siteUrl.trim().replace(/\/$/, '');
    
    // Test WordPress connection first
    const wpClient = new WordPressClient({
      siteUrl: cleanUrl,
      username: username.trim(),
      applicationPassword: applicationPassword.trim()
    });
    
    const testResult = await wpClient.testConnection();
    
    if (!testResult.success) {
      return NextResponse.json({ 
        error: `WordPress connectie mislukt: ${testResult.message}`,
        message: testResult.message
      }, { status: 400 });
    }
    
    // Save to database if test successful
    await prisma.client.update({
      where: { id: clientId },
      data: {
        wordpressUrl: cleanUrl,
        wordpressUsername: username.trim(),
        wordpressPassword: applicationPassword.trim() // TODO: Encrypt in production!
      }
    });
    
    return NextResponse.json({ 
      success: true,
      message: 'WordPress succesvol gekoppeld!',
      siteInfo: testResult.siteInfo
    });
  } catch (error: any) {
    console.error('WordPress connect error:', error);
    return NextResponse.json({ 
      error: error.message || 'Internal server error' 
    }, { status: 500 });
  }
}
