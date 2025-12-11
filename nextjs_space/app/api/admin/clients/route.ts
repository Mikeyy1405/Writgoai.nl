

export const dynamic = "force-dynamic";
// Admin API voor het ophalen van alle klanten

import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth-options';
import { prisma } from '@/lib/db';
import bcrypt from 'bcryptjs';

export async function GET(request: Request) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session || !session.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    
    // Check for recent signups query parameter
    const { searchParams } = new URL(request.url);
    const recentOnly = searchParams.get('recent') === 'true';
    
    if (recentOnly) {
      // Get clients registered in the last 30 days
      const thirtyDaysAgo = new Date();
      thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
      
      const recentClients = await prisma.client.findMany({
        where: {
          createdAt: {
            gte: thirtyDaysAgo
          }
        },
        orderBy: { createdAt: 'desc' },
        include: {
          _count: {
            select: { contentPieces: true }
          },
          projects: {
            where: { isPrimary: true },
            take: 1
          }
        }
      });
      
      // Enrich clients with WordPress URL from default project
      const enrichedRecentClients = recentClients.map(client => {
        const defaultProject = (client as any).projects?.[0];
        return {
          ...client,
          websiteUrl: defaultProject?.websiteUrl || client.website,
          projectId: defaultProject?.id,
          projects: undefined // Remove projects array from response
        };
      });
      
      return NextResponse.json({ clients: enrichedRecentClients });
    }
    
    const clients = await prisma.client.findMany({
      orderBy: { createdAt: 'desc' },
      include: {
        _count: {
          select: { contentPieces: true }
        },
        projects: {
          where: { isPrimary: true },
          take: 1
        }
      }
    });
    
    // Enrich clients with WordPress URL from default project
    const enrichedClients = clients.map(client => {
      const defaultProject = (client as any).projects?.[0];
      return {
        ...client,
        websiteUrl: defaultProject?.websiteUrl || client.website,
        projectId: defaultProject?.id,
        projects: undefined // Remove projects array from response
      };
    });
    
    return NextResponse.json({ clients: enrichedClients });
  } catch (error) {
    console.error('Failed to fetch clients:', error);
    return NextResponse.json({ error: 'Failed to fetch clients' }, { status: 500 });
  }
}

// POST - Create new client
export async function POST(request: Request) {
  console.log('[Client Creation API] POST request received');
  
  try {
    const session = await getServerSession(authOptions);
    
    if (!session || !session.user) {
      console.log('[Client Creation API] Unauthorized access attempt');
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    
    const body = await request.json();
    console.log('[Client Creation API] Request body:', {
      ...body,
      password: body.password ? '[REDACTED]' : undefined
    });
    
    const { 
      name, 
      email, 
      password,
      companyName,
      website,
      subscriptionCredits,
      topUpCredits,
      subscriptionPlan,
      isUnlimited
    } = body;
    
    // Validation
    if (!name || !email || !password) {
      console.log('[Client Creation API] Validation failed: missing required fields');
      return NextResponse.json({ 
        error: 'Naam, email en wachtwoord zijn verplicht' 
      }, { status: 400 });
    }
    
    if (password.length < 6) {
      console.log('[Client Creation API] Validation failed: password too short');
      return NextResponse.json({ 
        error: 'Wachtwoord moet minimaal 6 tekens zijn' 
      }, { status: 400 });
    }
    
    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      console.log('[Client Creation API] Validation failed: invalid email format');
      return NextResponse.json({ 
        error: 'Ongeldig email formaat' 
      }, { status: 400 });
    }
    
    // Check if email already exists
    const existingClient = await prisma.client.findUnique({
      where: { email }
    });
    
    if (existingClient) {
      console.log('[Client Creation API] Email already exists:', email);
      return NextResponse.json({ 
        error: 'Een klant met dit email bestaat al' 
      }, { status: 400 });
    }
    
    console.log('[Client Creation API] Hashing password...');
    // Hash password
    const hashedPassword = await bcrypt.hash(password, 10);
    
    console.log('[Client Creation API] Creating client...');
    // Create client
    const client = await prisma.client.create({
      data: {
        name,
        email,
        password: hashedPassword,
        companyName: companyName || null,
        website: website || null,
        subscriptionCredits: subscriptionCredits ? parseFloat(subscriptionCredits) : 0,
        topUpCredits: topUpCredits ? parseFloat(topUpCredits) : 0,
        subscriptionPlan: subscriptionPlan || null,
        isUnlimited: isUnlimited || false,
        automationActive: false
      }
    });
    
    console.log('[Client Creation API] Client created successfully:', client.id);
    
    // Auto-create default project for client
    // This project will be used for all content, WordPress, and platform integrations
    // The client never sees "projects" in the UI, but the backend uses this for content management
    console.log('[Client Creation API] Creating default project...');
    const defaultProject = await prisma.project.create({
      data: {
        clientId: client.id,
        name: companyName || name, // Use company name as project name
        websiteUrl: website || 'https://example.com', // Default URL if not provided
        description: `Standaard project voor ${companyName || name}`,
        isPrimary: true, // Mark as primary/default project
        isActive: true,
        targetAudience: null,
        brandVoice: null,
        niche: null,
        keywords: [],
        contentPillars: [],
        writingStyle: null,
        customInstructions: null
      }
    });
    
    console.log(`[Client Creation API] SUCCESS - Client: ${client.email}, Project: ${defaultProject.id}`);
    
    // Don't send password hash to frontend
    const { password: _, ...clientWithoutPassword } = client;
    
    return NextResponse.json({ 
      success: true,
      message: 'Klant succesvol aangemaakt met standaard project',
      client: clientWithoutPassword,
      projectId: defaultProject.id // Include project ID for reference
    }, { status: 201 });
  } catch (error: any) {
    console.error('[Client Creation API] ERROR:', {
      message: error.message,
      stack: error.stack,
      name: error.name
    });
    return NextResponse.json({ 
      error: error.message || 'Fout bij aanmaken klant',
      details: process.env.NODE_ENV === 'development' ? error.stack : undefined
    }, { status: 500 });
  }
}