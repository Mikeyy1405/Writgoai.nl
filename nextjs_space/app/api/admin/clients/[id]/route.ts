import { NextResponse } from 'next/server';

export const dynamic = "force-dynamic";
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth-options';
import { prisma } from '@/lib/db';
import bcrypt from 'bcryptjs';

// GET single client details
export async function GET(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session || !session.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    
    const client = await prisma.client.findUnique({
      where: { id: params.id },
      include: {
        _count: {
          select: {
            contentPieces: true,
            projects: true
          }
        }
      }
    });
    
    if (!client) {
      return NextResponse.json({ error: 'Client not found' }, { status: 404 });
    }
    
    // Don't send password hash to frontend
    const { password, ...clientWithoutPassword } = client;
    
    return NextResponse.json({ client: clientWithoutPassword });
  } catch (error) {
    console.error('Failed to fetch client:', error);
    return NextResponse.json({ error: 'Failed to fetch client' }, { status: 500 });
  }
}

// PUT update client
export async function PUT(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session || !session.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    
    const body = await request.json();
    const { 
      name, 
      email, 
      companyName, 
      website,
      subscriptionCredits,
      topUpCredits,
      isUnlimited,
      subscriptionPlan,
      subscriptionStatus,
      automationActive,
      targetAudience,
      brandVoice,
      keywords,
      wordpressUrl,
      wordpressUsername,
      wordpressPassword
    } = body;
    
    const updateData: any = {};
    
    if (name !== undefined) updateData.name = name;
    if (email !== undefined) updateData.email = email;
    if (companyName !== undefined) updateData.companyName = companyName;
    if (website !== undefined) updateData.website = website;
    if (subscriptionCredits !== undefined) updateData.subscriptionCredits = parseFloat(subscriptionCredits);
    if (topUpCredits !== undefined) updateData.topUpCredits = parseFloat(topUpCredits);
    if (isUnlimited !== undefined) updateData.isUnlimited = isUnlimited;
    if (subscriptionPlan !== undefined) updateData.subscriptionPlan = subscriptionPlan;
    if (subscriptionStatus !== undefined) updateData.subscriptionStatus = subscriptionStatus;
    if (automationActive !== undefined) updateData.automationActive = automationActive;
    if (targetAudience !== undefined) updateData.targetAudience = targetAudience;
    if (brandVoice !== undefined) updateData.brandVoice = brandVoice;
    if (keywords !== undefined) updateData.keywords = keywords;
    if (wordpressUrl !== undefined) updateData.wordpressUrl = wordpressUrl;
    if (wordpressUsername !== undefined) updateData.wordpressUsername = wordpressUsername;
    if (wordpressPassword !== undefined) updateData.wordpressPassword = wordpressPassword;
    
    const updatedClient = await prisma.client.update({
      where: { id: params.id },
      data: updateData
    });
    
    // Don't send password hash to frontend
    const { password, ...clientWithoutPassword } = updatedClient;
    
    return NextResponse.json({ 
      message: 'Client updated successfully',
      client: clientWithoutPassword 
    });
  } catch (error) {
    console.error('Failed to update client:', error);
    return NextResponse.json({ error: 'Failed to update client' }, { status: 500 });
  }
}

// POST special actions (change password, add credits)
export async function POST(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session || !session.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    
    const body = await request.json();
    const { action, newPassword, creditsToAdd, creditType } = body;
    
    if (action === 'changePassword') {
      if (!newPassword || newPassword.length < 6) {
        return NextResponse.json({ error: 'Password must be at least 6 characters' }, { status: 400 });
      }
      
      const hashedPassword = await bcrypt.hash(newPassword, 10);
      
      await prisma.client.update({
        where: { id: params.id },
        data: { password: hashedPassword }
      });
      
      return NextResponse.json({ message: 'Password changed successfully' });
    }
    
    if (action === 'addCredits') {
      if (!creditsToAdd || creditsToAdd <= 0) {
        return NextResponse.json({ error: 'Invalid credit amount' }, { status: 400 });
      }
      
      const client = await prisma.client.findUnique({
        where: { id: params.id }
      });
      
      if (!client) {
        return NextResponse.json({ error: 'Client not found' }, { status: 404 });
      }
      
      const updateData: any = {};
      
      if (creditType === 'subscription') {
        updateData.subscriptionCredits = client.subscriptionCredits + parseFloat(creditsToAdd);
      } else {
        updateData.topUpCredits = client.topUpCredits + parseFloat(creditsToAdd);
        updateData.totalCreditsPurchased = client.totalCreditsPurchased + parseFloat(creditsToAdd);
      }
      
      const updatedClient = await prisma.client.update({
        where: { id: params.id },
        data: updateData
      });
      
      return NextResponse.json({ 
        message: 'Credits added successfully',
        subscriptionCredits: updatedClient.subscriptionCredits,
        topUpCredits: updatedClient.topUpCredits
      });
    }
    
    return NextResponse.json({ error: 'Invalid action' }, { status: 400 });
  } catch (error) {
    console.error('Failed to process action:', error);
    return NextResponse.json({ error: 'Failed to process action' }, { status: 500 });
  }
}

// DELETE client
export async function DELETE(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session || !session.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    
    // Check if client exists
    const client = await prisma.client.findUnique({
      where: { id: params.id },
      select: { email: true }
    });
    
    if (!client) {
      return NextResponse.json({ error: 'Client not found' }, { status: 404 });
    }
    
    // Prevent deletion of special accounts
    const protectedEmails = ['mikeschonewille@gmail.com', 'cgrotebeverborg@gmail.com'];
    if (protectedEmails.includes(client.email)) {
      return NextResponse.json({ 
        error: 'Cannot delete protected accounts' 
      }, { status: 403 });
    }
    
    // Delete all related data first
    await prisma.contentPiece.deleteMany({
      where: { clientId: params.id }
    });
    
    await prisma.project.deleteMany({
      where: { clientId: params.id }
    });
    
    // Delete the client
    await prisma.client.delete({
      where: { id: params.id }
    });
    
    return NextResponse.json({ message: 'Client deleted successfully' });
  } catch (error) {
    console.error('Failed to delete client:', error);
    return NextResponse.json({ error: 'Failed to delete client' }, { status: 500 });
  }
}
