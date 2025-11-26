
import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth-options';
import { prisma } from '@/lib/db';

// GET: Fetch AI profile voor de ingelogde client
export async function GET(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user?.email) {
      return NextResponse.json({ error: 'Niet geauthenticeerd' }, { status: 401 });
    }

    const client = await prisma.client.findUnique({
      where: { email: session.user.email },
      include: { AIProfile: true },
    });

    if (!client) {
      return NextResponse.json({ error: 'Client niet gevonden' }, { status: 404 });
    }

    return NextResponse.json({
      profile: client.AIProfile,
      onboardingCompleted: client.onboardingCompleted
    });
  } catch (error) {
    console.error('Error fetching AI profile:', error);
    return NextResponse.json({ error: 'Fout bij ophalen profiel' }, { status: 500 });
  }
}

// POST: Create or update AI profile
export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user?.email) {
      return NextResponse.json({ error: 'Niet geauthenticeerd' }, { status: 401 });
    }

    const client = await prisma.client.findUnique({
      where: { email: session.user.email },
    });

    if (!client) {
      return NextResponse.json({ error: 'Client niet gevonden' }, { status: 404 });
    }

    const data = await req.json();

    // Extract Buffer credentials (apart from AI profile data)
    const { bufferEmail, bufferPassword, ...aiProfileData } = data;

    // Upsert AI profile
    const aiProfile = await prisma.clientAIProfile.upsert({
      where: { clientId: client.id },
      create: {
        clientId: client.id,
        ...aiProfileData,
      },
      update: aiProfileData,
    });

    // Update client with Buffer credentials and onboarding status
    const updateData: any = {};
    
    if (bufferEmail) {
      updateData.bufferEmail = bufferEmail;
      updateData.bufferConnected = true;
      updateData.bufferConnectedAt = new Date();
    }
    
    if (!client.onboardingCompleted) {
      updateData.onboardingCompleted = true;
    }

    if (Object.keys(updateData).length > 0) {
      await prisma.client.update({
        where: { id: client.id },
        data: updateData,
      });
    }

    return NextResponse.json({ 
      success: true, 
      profile: aiProfile 
    });
  } catch (error) {
    console.error('Error saving AI profile:', error);
    return NextResponse.json({ error: 'Fout bij opslaan profiel' }, { status: 500 });
  }
}
