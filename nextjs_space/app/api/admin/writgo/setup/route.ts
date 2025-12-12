export const dynamic = "force-dynamic";

import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth-options';
import { prisma } from '@/lib/prisma-shim';
import bcrypt from 'bcryptjs';

/**
 * POST /api/admin/writgo/setup
 * 
 * Set up Writgo.nl as an internal client for marketing automation
 * This creates a client account with the same functionality that external clients get
 */
export async function POST(request: Request) {
  console.log('[Writgo Setup API] POST request received');
  
  try {
    const session = await getServerSession(authOptions);
    
    if (!session || !session.user) {
      console.log('[Writgo Setup API] Unauthorized access attempt');
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    
    // Only allow admin access
    if (session.user.email !== 'info@writgo.nl') {
      console.log('[Writgo Setup API] Forbidden: Not admin');
      return NextResponse.json({ error: 'Forbidden: Admin access required' }, { status: 403 });
    }
    
    // Check if Writgo.nl internal client already exists
    const existingClient = await prisma.client.findFirst({
      where: {
        email: 'marketing@writgo.nl'
      }
    });
    
    if (existingClient) {
      console.log('[Writgo Setup API] Client already exists:', existingClient.id);
      return NextResponse.json({ 
        error: 'Writgo.nl is al opgezet als interne klant',
        clientId: existingClient.id
      }, { status: 400 });
    }
    
    console.log('[Writgo Setup API] Creating Writgo.nl internal client...');
    
    // Generate a secure random password
    const password = Math.random().toString(36).slice(-12) + Math.random().toString(36).slice(-12);
    const hashedPassword = await bcrypt.hash(password, 10);
    
    // Create the internal client for Writgo.nl
    const client = await prisma.client.create({
      data: {
        name: 'Writgo.nl',
        email: 'marketing@writgo.nl',
        password: hashedPassword,
        companyName: 'Writgo.nl',
        website: 'https://writgo.nl',
        subscriptionCredits: 0,
        topUpCredits: 0,
        subscriptionPlan: 'internal',
        isUnlimited: true, // Internal client gets unlimited access
        automationActive: false // Can be enabled later
      }
    });
    
    console.log('[Writgo Setup API] Client created successfully:', client.id);
    
    // Auto-create default project for Writgo.nl
    console.log('[Writgo Setup API] Creating default project...');
    const defaultProject = await prisma.project.create({
      data: {
        clientId: client.id,
        name: 'Writgo.nl Marketing',
        websiteUrl: 'https://writgo.nl',
        description: 'Internal marketing automation for Writgo.nl',
        isPrimary: true,
        isActive: true,
        targetAudience: 'Lokale dienstverleners in Nederland',
        brandVoice: 'Professioneel, toegankelijk en resultaatgericht',
        niche: 'AI-gedreven content marketing',
        keywords: ['AI content', 'marketing automation', 'SEO', 'social media'],
        contentPillars: [
          'AI & Automation',
          'Content Marketing Tips',
          'Lokale Marketing Strategieën',
          'SEO Best Practices'
        ],
        writingStyle: 'Professioneel maar toegankelijk, focus op praktische waarde',
        customInstructions: 'Schrijf voor lokale ondernemers die weinig tijd hebben. Gebruik Nederlandse voorbeelden en focus op ROI.'
      }
    });
    
    console.log(`[Writgo Setup API] SUCCESS - Client: ${client.email}, Project: ${defaultProject.id}`);
    
    return NextResponse.json({ 
      success: true,
      message: 'Writgo.nl succesvol opgezet als interne klant',
      clientId: client.id,
      projectId: defaultProject.id,
      email: 'marketing@writgo.nl',
      note: 'Je kunt nu inloggen met dit account op /client-login om je eigen marketing te automatiseren'
    }, { status: 201 });
  } catch (error: any) {
    console.error('[Writgo Setup API] ERROR:', {
      message: error.message,
      stack: error.stack,
      name: error.name
    });
    return NextResponse.json({ 
      error: error.message || 'Fout bij opzetten Writgo.nl',
      details: process.env.NODE_ENV === 'development' ? error.stack : undefined
    }, { status: 500 });
  }
}
