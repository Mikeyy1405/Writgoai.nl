import { createClient } from '@/lib/supabase-server';
import { NextRequest, NextResponse } from 'next/server';
import { executeCommand, executeCommands, testConnection } from '@/lib/vps-executor';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';
export const maxDuration = 300; // 5 minuten max voor lange commands

/**
 * POST /api/agent/execute
 * Voer command(s) uit op VPS via SSH
 */
export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient();

    // Authenticatie check
    const {
      data: { user },
      error: userError,
    } = await supabase.auth.getUser();

    if (userError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { command, commands, task_id } = body;

    // Validatie: of single command of array van commands
    if (!command && !commands) {
      return NextResponse.json(
        { error: 'command of commands is verplicht' },
        { status: 400 }
      );
    }

    // Check of VPS geconfigureerd is
    if (!process.env.VPS_HOST || !process.env.VPS_USER) {
      return NextResponse.json(
        { error: 'VPS niet geconfigureerd. Voeg VPS_HOST en VPS_USER toe aan .env' },
        { status: 503 }
      );
    }

    // Log execution start
    console.log(`[VPS Execute] User ${user.email} executing:`, command || commands);

    let results;

    // Voer command(s) uit
    if (commands && Array.isArray(commands)) {
      // Multiple commands sequentieel uitvoeren
      results = await executeCommands(commands);
    } else {
      // Single command
      const result = await executeCommand(command);
      results = [result];
    }

    // Sla execution log op in database (optioneel)
    if (task_id) {
      await supabase.from('agent_sessions').insert({
        task_id,
        user_id: user.id,
        activity_type: 'vps_command',
        activity_data: {
          commands: command || commands,
          results,
        },
      });
    }

    // Check of alle commands succesvol waren
    const allSuccess = results.every((r) => r.success);
    const hasErrors = results.some((r) => r.error);

    return NextResponse.json({
      success: allSuccess,
      results,
      summary: {
        total: results.length,
        successful: results.filter((r) => r.success).length,
        failed: results.filter((r) => !r.success).length,
        hasErrors,
      },
    });
  } catch (error: any) {
    console.error('Error in POST /api/agent/execute:', error);
    return NextResponse.json(
      {
        success: false,
        error: error.message,
      },
      { status: 500 }
    );
  }
}

/**
 * GET /api/agent/execute/test
 * Test VPS connectie
 */
export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient();

    // Authenticatie check
    const {
      data: { user },
      error: userError,
    } = await supabase.auth.getUser();

    if (userError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Check VPS configuratie
    if (!process.env.VPS_HOST || !process.env.VPS_USER) {
      return NextResponse.json(
        {
          connected: false,
          error: 'VPS niet geconfigureerd',
          config: {
            host: null,
            user: null,
          },
        },
        { status: 200 }
      );
    }

    // Test connectie
    const connected = await testConnection();

    return NextResponse.json({
      connected,
      config: {
        host: process.env.VPS_HOST,
        user: process.env.VPS_USER,
        port: process.env.VPS_PORT || 22,
        authMethod: process.env.VPS_SSH_KEY_PATH ? 'ssh-key' : 'password',
      },
    });
  } catch (error: any) {
    console.error('Error in GET /api/agent/execute/test:', error);
    return NextResponse.json(
      {
        connected: false,
        error: error.message,
      },
      { status: 500 }
    );
  }
}
