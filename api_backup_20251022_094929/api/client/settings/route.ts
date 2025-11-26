
// Client automation settings API

import { NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';
import jwt from 'jsonwebtoken';

const prisma = new PrismaClient();

function getClientFromToken(request: Request) {
  const authHeader = request.headers.get('authorization');
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return null;
  }
  
  const token = authHeader.substring(7);
  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET || 'your-secret-key') as { clientId: string };
    return decoded.clientId;
  } catch {
    return null;
  }
}

// Get settings
export async function GET(request: Request) {
  try {
    const clientId = getClientFromToken(request);
    
    if (!clientId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    
    const client = await prisma.client.findUnique({
      where: { id: clientId },
      select: {
        id: true,
        name: true,
        email: true,
        companyName: true,
        website: true,
        automationActive: true,
        automationStartDate: true,
        targetAudience: true,
        brandVoice: true,
        keywords: true,
        wordpressUrl: true,
        wordpressUsername: true,
        youtubeChannelId: true,
        tiktokAccessToken: true
      }
    });
    
    return NextResponse.json(client);
  } catch (error) {
    console.error('Get settings error:', error);
    return NextResponse.json({ error: 'Failed to get settings' }, { status: 500 });
  }
}

// Update settings
export async function PUT(request: Request) {
  try {
    const clientId = getClientFromToken(request);
    
    if (!clientId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    
    const data = await request.json();
    
    // Update client settings
    const client = await prisma.client.update({
      where: { id: clientId },
      data: {
        automationActive: data.automationActive,
        automationStartDate: data.automationActive ? new Date() : null,
        targetAudience: data.targetAudience,
        brandVoice: data.brandVoice,
        keywords: data.keywords || [],
        wordpressUrl: data.wordpressUrl,
        wordpressUsername: data.wordpressUsername,
        wordpressPassword: data.wordpressPassword,
        youtubeChannelId: data.youtubeChannelId,
        youtubeApiKey: data.youtubeApiKey,
        tiktokAccessToken: data.tiktokAccessToken
      }
    });
    
    return NextResponse.json({
      success: true,
      message: 'Instellingen opgeslagen',
      client
    });
  } catch (error) {
    console.error('Update settings error:', error);
    return NextResponse.json({ error: 'Failed to update settings' }, { status: 500 });
  }
}
