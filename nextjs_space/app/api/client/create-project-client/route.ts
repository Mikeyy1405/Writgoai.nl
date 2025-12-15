
/**
 * Direct Client Creation API
 * Creates a new client account with custom password and links to project
 */

import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth-options';
import { prisma } from '@/lib/db';
import bcrypt from 'bcryptjs';
import { randomBytes } from 'crypto';

export const dynamic = 'force-dynamic';

export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.email) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const ownerClient = await prisma.client.findUnique({
      where: { email: session.user.email },
    });

    if (!ownerClient) {
      return NextResponse.json({ error: 'Client not found' }, { status: 404 });
    }

    const body = await req.json();
    const { projectId, email, name, password, role } = body;

    // Validate required fields
    if (!projectId || !email || !name || !password) {
      return NextResponse.json(
        { error: 'Project ID, email, naam en wachtwoord zijn verplicht' },
        { status: 400 }
      );
    }

    // Validate password length
    if (password.length < 8) {
      return NextResponse.json(
        { error: 'Wachtwoord moet minimaal 8 tekens bevatten' },
        { status: 400 }
      );
    }

    // Validate role
    const clientRole = role || 'client';
    if (!['employee', 'client'].includes(clientRole)) {
      return NextResponse.json(
        { error: 'Role must be either "employee" or "client"' },
        { status: 400 }
      );
    }

    // Verify project ownership
    const project = await prisma.project.findFirst({
      where: {
        id: projectId,
        clientId: ownerClient.id,
      },
    });

    if (!project) {
      return NextResponse.json({ error: 'Project niet gevonden' }, { status: 404 });
    }

    // Check if email already exists
    const existingClient = await prisma.client.findUnique({
      where: { email },
    });

    if (existingClient) {
      return NextResponse.json(
        { error: 'Dit emailadres is al in gebruik' },
        { status: 400 }
      );
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(password, 10);

    // Create new client account
    const newClient = await prisma.client.create({
      data: {
        email,
        name,
        password: hashedPassword,
        companyName: name, // Use name as company name
      },
    });

    // Generate access token for project view
    const accessToken = randomBytes(32).toString('hex');

    // Create project collaborator entry to link them to the project
    await prisma.projectCollaborator.create({
      data: {
        projectId,
        email,
        name,
        role: clientRole,
        status: 'active', // Directly active, no invitation needed
        accessToken,
      },
    });

    return NextResponse.json({
      success: true,
      client: {
        id: newClient.id,
        email: newClient.email,
        name: newClient.name,
      },
      credentials: {
        email,
        password, // Return plain password so user can share it
      },
      loginUrl: `${process.env.NEXTAUTH_URL || 'https://WritgoAI.nl'}/inloggen`,
      message: 'Client succesvol aangemaakt. Bewaar de inloggegevens om te delen met de client.',
    });
  } catch (error: any) {
    console.error('Error creating client:', error);
    return NextResponse.json(
      { error: error.message || 'Kon client niet aanmaken' },
      { status: 500 }
    );
  }
}
