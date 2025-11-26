
/**
 * API Route for WritgoAI Agent
 * 
 * Usage:
 * POST /api/agent/execute
 * {
 *   "prompt": "Generate a week of content for client abc123",
 *   "clientId": "abc123"
 * }
 */

import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth-options';
import { WritgoAgent } from '@/lib/agent/agent-orchestrator';

export const dynamic = 'force-dynamic';
export const maxDuration = 300; // 5 minutes

export async function POST(request: NextRequest) {
  try {
    // Authenticate
    const session = await getServerSession(authOptions);
    
    if (!session?.user?.email) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }
    
    // Parse request
    const body = await request.json();
    const { prompt, clientId } = body;
    
    if (!prompt || !clientId) {
      return NextResponse.json(
        { error: 'Missing required fields: prompt, clientId' },
        { status: 400 }
      );
    }
    
    console.log(`🤖 Starting agent task for client ${clientId}`);
    console.log(`📝 Prompt: ${prompt}`);
    
    // Create agent instance
    const agent = new WritgoAgent({
      maxIterations: 15,
      timeout: 300000, // 5 min
      model: 'gpt-4o'
    });
    
    // Execute task
    const systemPrompt = `Je bent een content marketing agent voor WritgoAI.
Client ID: ${clientId}

Gebruik je beschikbare tools om de taak efficiënt uit te voeren.
Werk stap voor stap en denk logisch na over welke tools je wanneer nodig hebt.`;
    
    const result = await agent.executeTask(prompt, systemPrompt);
    
    console.log(`✅ Agent task completed`);
    
    return NextResponse.json({
      success: true,
      result: result,
      message: 'Agent task completed successfully'
    });
    
  } catch (error) {
    console.error('❌ Agent error:', error);
    
    return NextResponse.json(
      {
        error: 'Agent execution failed',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}

/**
 * Example Usage from Frontend:
 * 
 * const response = await fetch('/api/agent/execute', {
 *   method: 'POST',
 *   headers: { 'Content-Type': 'application/json' },
 *   body: JSON.stringify({
 *     prompt: 'Genereer een blog artikel over AI in Marketing. Doe eerst research, schrijf dan het artikel, en publiceer het als draft op WordPress.',
 *     clientId: 'abc123'
 *   })
 * });
 * 
 * const data = await response.json();
 * console.log(data.result);
 */
