

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
          }
        }
      });
      
      return NextResponse.json({ clients: recentClients });
    }
    
    const clients = await prisma.client.findMany({
      orderBy: { createdAt: 'desc' },
      include: {
        _count: {
          select: { contentPieces: true }
        }
      }
    });
    
    return NextResponse.json({ clients });
  } catch (error) {
    console.error('Failed to fetch clients:', error);
    return NextResponse.json({ error: 'Failed to fetch clients' }, { status: 500 });
  }
}

// POST - Create new client
export async function POST(request: Request) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session || !session.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    
    const body = await request.json();
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
      return NextResponse.json({ 
        error: 'Name, email, and password are required' 
      }, { status: 400 });
    }
    
    if (password.length < 6) {
      return NextResponse.json({ 
        error: 'Password must be at least 6 characters' 
      }, { status: 400 });
    }
    
    // Check if email already exists
    const existingClient = await prisma.client.findUnique({
      where: { email }
    });
    
    if (existingClient) {
      return NextResponse.json({ 
        error: 'A client with this email already exists' 
      }, { status: 400 });
    }
    
    // Hash password
    const hashedPassword = await bcrypt.hash(password, 10);
    
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
    
    // Don't send password hash to frontend
    const { password: _, ...clientWithoutPassword } = client;
    
    return NextResponse.json({ 
      message: 'Client created successfully',
      client: clientWithoutPassword 
    }, { status: 201 });
  } catch (error) {
    console.error('Failed to create client:', error);
    return NextResponse.json({ 
      error: 'Failed to create client' 
    }, { status: 500 });
  }
}
