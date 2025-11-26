
// Client login API

import { NextRequest, NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { withRateLimit } from '@/lib/rate-limiter';
import { validateInput, loginSchema } from '@/lib/validation';
import { log, logFailedLogin, logError } from '@/lib/logger';

const prisma = new PrismaClient();

export async function POST(request: NextRequest) {
  try {
    // 🛡️ Rate limiting - Max 5 login pogingen per 15 min
    const rateLimitResult = await withRateLimit(request, 'login');
    if (rateLimitResult) return rateLimitResult;

    const body = await request.json();
    
    // 🛡️ Input validation
    const validation = validateInput(loginSchema, body);
    if (!validation.success || !validation.data) {
      return NextResponse.json({ error: validation.error || 'Ongeldige input' }, { status: 400 });
    }

    const { email, password } = validation.data;
    const ip = request.ip || request.headers.get('x-forwarded-for') || 'unknown';
    
    // Find client
    const client = await prisma.client.findUnique({
      where: { email: email.toLowerCase() }
    });
    
    if (!client) {
      logFailedLogin(email, ip, 'User not found');
      return NextResponse.json({ error: 'Ongeldige inloggegevens' }, { status: 401 });
    }
    
    // Verify password
    const isValidPassword = await bcrypt.compare(password, client.password);
    
    if (!isValidPassword) {
      logFailedLogin(email, ip, 'Invalid password');
      return NextResponse.json({ error: 'Ongeldige inloggegevens' }, { status: 401 });
    }
    
    // Create JWT token
    const token = jwt.sign(
      { clientId: client.id, email: client.email },
      process.env.JWT_SECRET || process.env.NEXTAUTH_SECRET || 'fallback-secret',
      { expiresIn: '7d' }
    );
    
    log('info', 'Client logged in successfully', {
      clientId: client.id,
      email: client.email,
      ip,
    });

    return NextResponse.json({
      success: true,
      token,
      client: {
        id: client.id,
        email: client.email,
        name: client.name,
        companyName: client.companyName,
        automationActive: client.automationActive
      }
    });
  } catch (error: any) {
    logError(error, { endpoint: '/api/client-auth/login' });
    console.error('Login error:', error);
    return NextResponse.json({ error: 'Er ging iets mis bij het inloggen' }, { status: 500 });
  }
}
