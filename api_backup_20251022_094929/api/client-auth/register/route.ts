
// Client registratie API

import { NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

export async function POST(request: Request) {
  try {
    const { email, password, name, companyName, website } = await request.json();
    
    if (!email || !password || !name) {
      return NextResponse.json({ error: 'Vul alle verplichte velden in' }, { status: 400 });
    }
    
    // Check if client already exists
    const existingClient = await prisma.client.findUnique({
      where: { email: email.toLowerCase() }
    });
    
    if (existingClient) {
      return NextResponse.json({ error: 'Dit email adres is al in gebruik' }, { status: 400 });
    }
    
    // Hash password
    const hashedPassword = await bcrypt.hash(password, 10);
    
    // Create client
    const client = await prisma.client.create({
      data: {
        email: email.toLowerCase(),
        password: hashedPassword,
        name,
        companyName,
        website,
        automationActive: false
      }
    });
    
    return NextResponse.json({
      success: true,
      message: 'Account succesvol aangemaakt',
      client: {
        id: client.id,
        email: client.email,
        name: client.name
      }
    });
  } catch (error) {
    console.error('Registration error:', error);
    return NextResponse.json({ error: 'Er ging iets mis bij het aanmaken van je account' }, { status: 500 });
  }
}
