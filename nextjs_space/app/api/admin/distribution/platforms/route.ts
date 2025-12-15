import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth-options';
import { PLATFORM_CONFIGS, PlatformConfig } from '@/lib/types/distribution';
import { testConnection } from '@/lib/services/getlatedev';

export const dynamic = 'force-dynamic';

export const maxDuration = 60;

// GET - Fetch all platform configurations
export async function GET() {
  try {
    const session = await getServerSession(authOptions);
    
    // Check if user is admin
    if (!session?.user?.email || session.user.role !== 'admin') {
      return NextResponse.json({ error: 'Niet geautoriseerd' }, { status: 401 });
    }

    // TODO: Get actual connection status from database or GetLateDev
    // For now, return mock data with all platforms
    const platforms: PlatformConfig[] = Object.values(PLATFORM_CONFIGS).map(config => ({
      ...config,
      enabled: true,
      connected: false, // TODO: Check actual connection status
      last_sync: undefined,
    }));

    return NextResponse.json(platforms);
  } catch (error) {
    console.error('[Platforms API] Failed to fetch platforms:', error);
    
    return NextResponse.json(
      { error: 'Er is een fout opgetreden bij het ophalen van de platforms' },
      { status: 500 }
    );
  }
}

// PUT - Update platform settings
export async function PUT(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    
    // Check if user is admin
    if (!session?.user?.email || session.user.role !== 'admin') {
      return NextResponse.json({ error: 'Niet geautoriseerd' }, { status: 401 });
    }

    const data = await req.json();

    if (!data.platform) {
      return NextResponse.json({ error: 'Platform is verplicht' }, { status: 400 });
    }

    // TODO: Store platform settings in database
    // For now, just return the updated config
    const config = PLATFORM_CONFIGS[data.platform as keyof typeof PLATFORM_CONFIGS];
    
    if (!config) {
      return NextResponse.json({ error: 'Onbekend platform' }, { status: 404 });
    }

    const updatedConfig: PlatformConfig = {
      ...config,
      enabled: data.enabled !== undefined ? data.enabled : true,
      connected: data.connected !== undefined ? data.connected : false,
      settings: {
        ...config.settings,
        ...(data.settings || {}),
      },
    };

    return NextResponse.json(updatedConfig);
  } catch (error) {
    console.error('[Platforms API] Failed to update platform:', error);
    
    return NextResponse.json(
      { error: 'Er is een fout opgetreden bij het bijwerken van het platform' },
      { status: 500 }
    );
  }
}

// POST - Test platform connection
export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    
    // Check if user is admin
    if (!session?.user?.email || session.user.role !== 'admin') {
      return NextResponse.json({ error: 'Niet geautoriseerd' }, { status: 401 });
    }

    const data = await req.json();

    if (!data.platform) {
      return NextResponse.json({ error: 'Platform is verplicht' }, { status: 400 });
    }

    // Test connection via GetLateDev
    const isConnected = await testConnection();

    return NextResponse.json({ 
      platform: data.platform,
      connected: isConnected,
      tested_at: new Date().toISOString(),
    });
  } catch (error) {
    console.error('[Platforms API] Failed to test connection:', error);
    
    return NextResponse.json(
      { error: 'Er is een fout opgetreden bij het testen van de verbinding' },
      { status: 500 }
    );
  }
}
