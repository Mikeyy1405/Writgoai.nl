
// Client login API

import { NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';

const prisma = new PrismaClient();

export async function POST(request: Request) {
  try {
    const { email, password } = await request.json();
    
    if (!email || !password) {
      return NextResponse.json({ error: 'Email en wachtwoord zijn verplicht' }, { status: 400 });
    }
    
    // Find client
    const client = await prisma.client.findUnique({
      where: { email: email.toLowerCase() }
    });
    
    if (!client) {
      return NextResponse.json({ error: 'Ongeldige inloggegevens' }, { status: 401 });
    }
    
    // Verify password
    const isValidPassword = await bcrypt.compare(password, client.password);
    
    if (!isValidPassword) {
      return NextResponse.json({ error: 'Ongeldige inloggegevens' }, { status: 401 });
    }
    
    // Create JWT token
    const token = jwt.sign(
      { clientId: client.id, email: client.email },
      process.env.JWT_SECRET || 'your-secret-key',
      { expiresIn: '7d' }
    );
    
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
  } catch (error) {
    console.error('Login error:', error);
    return NextResponse.json({ error: 'Er ging iets mis bij het inloggen' }, { status: 500 });
  }
}
