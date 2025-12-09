

export const dynamic = "force-dynamic";
/**
 * ⚙️ Client AI Settings API
 * 
 * Beheer custom instructions en AI voorkeuren
 */

import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';


// GET: Haal AI settings op voor een client
export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession();
    
    // Check authentication
    if (!session?.user?.email) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    // Find client by email from session
    const client = await prisma.client.findUnique({
      where: { email: session.user.email },
    });

    // Default settings to return if client doesn't exist
    const defaultSettings = {
      preferredModel: 'gpt-5',
      temperature: 0.7,
      enableWebSearch: true,
      enableImageGen: true,
      enableVideoGen: true,
    };

    // If client doesn't exist, return default settings (don't throw error)
    if (!client) {
      console.log(`Client not found for ${session.user.email}, returning default settings`);
      return NextResponse.json({
        success: true,
        settings: defaultSettings,
      });
    }

    let settings = await prisma.clientAISettings.findUnique({
      where: { clientId: client.id },
    });

    // Create default settings if not exists
    if (!settings) {
      try {
        settings = await prisma.clientAISettings.create({
          data: {
            clientId: client.id,
            ...defaultSettings,
          },
        });
      } catch (createError: any) {
        console.error('Error creating default settings:', createError);
        // Return default settings even if creation fails
        return NextResponse.json({
          success: true,
          settings: defaultSettings,
        });
      }
    }

    return NextResponse.json({
      success: true,
      settings,
    });
  } catch (error: any) {
    console.error('Get settings error:', error);
    return NextResponse.json(
      { error: error.message },
      { status: 500 }
    );
  }
}

// POST/PUT: Update AI settings
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession();
    
    // Check authentication
    if (!session?.user?.email) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const body = await request.json();
    const { ...settingsData } = body;

    // Find client by email from session
    const client = await prisma.client.findUnique({
      where: { email: session.user.email },
    });

    // If client doesn't exist, return success with the settings data (but don't save to DB)
    if (!client) {
      console.log(`Client not found for ${session.user.email}, returning settings without saving`);
      return NextResponse.json({
        success: true,
        settings: settingsData,
      });
    }

    // Client exists, save settings to database
    const settings = await prisma.clientAISettings.upsert({
      where: { clientId: client.id },
      update: settingsData,
      create: {
        clientId: client.id,
        ...settingsData,
      },
    });

    return NextResponse.json({
      success: true,
      settings,
    });
  } catch (error: any) {
    console.error('Update settings error:', error);
    return NextResponse.json(
      { error: error.message },
      { status: 500 }
    );
  }
}
