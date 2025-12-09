
// Client login API

import { NextRequest, NextResponse } from 'next/server';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { withRateLimit } from '@/lib/rate-limiter';
import { validateInput, loginSchema } from '@/lib/validation';
import { log, logFailedLogin, logError } from '@/lib/logger';


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
    
    // Try to find user in Client table first
    const client = await prisma.client.findUnique({
      where: { email: email.toLowerCase() }
    });
    
    if (client) {
      // Verify password for client
      const isValidPassword = await bcrypt.compare(password, client.password);
      
      if (!isValidPassword) {
        logFailedLogin(email, ip, 'Invalid password');
        return NextResponse.json({ error: 'Ongeldige inloggegevens' }, { status: 401 });
      }
      
      // Create JWT token for client
      const token = jwt.sign(
        { 
          clientId: client.id, 
          email: client.email,
          role: 'client',
          userType: 'client'
        },
        process.env.JWT_SECRET || process.env.NEXTAUTH_SECRET || 'fallback-secret',
        { expiresIn: '7d' }
      );
      
      log('info', 'Client logged in successfully', {
        clientId: client.id,
        email: client.email,
        role: 'client',
        ip,
      });

      return NextResponse.json({
        success: true,
        token,
        userType: 'client',
        role: 'client',
        user: {
          id: client.id,
          email: client.email,
          name: client.name,
          companyName: client.companyName,
          automationActive: client.automationActive
        }
      });
    }
    
    // If not found in Client table, try User table (admin)
    const user = await prisma.user.findUnique({
      where: { email: email.toLowerCase() }
    });
    
    if (!user) {
      logFailedLogin(email, ip, 'User not found in both Client and User tables');
      return NextResponse.json({ error: 'Ongeldige inloggegevens' }, { status: 401 });
    }
    
    // Verify password for admin user
    const isValidPassword = await bcrypt.compare(password, user.password);
    
    if (!isValidPassword) {
      logFailedLogin(email, ip, 'Invalid password for admin user');
      return NextResponse.json({ error: 'Ongeldige inloggegevens' }, { status: 401 });
    }
    
    // Create JWT token for admin user
    const token = jwt.sign(
      { 
        userId: user.id, 
        email: user.email,
        role: user.role,
        userType: 'user'
      },
      process.env.JWT_SECRET || process.env.NEXTAUTH_SECRET || 'fallback-secret',
      { expiresIn: '7d' }
    );
    
    log('info', 'Admin user logged in successfully', {
      userId: user.id,
      email: user.email,
      role: user.role,
      ip,
    });

    return NextResponse.json({
      success: true,
      token,
      userType: 'user',
      role: user.role,
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        role: user.role
      }
    });
  } catch (error: any) {
    logError(error, { endpoint: '/api/client-auth/login' });
    console.error('Login error:', error);
    return NextResponse.json({ error: 'Er ging iets mis bij het inloggen' }, { status: 500 });
  }
}
