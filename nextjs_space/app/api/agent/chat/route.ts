/**
 * AI Agent Chat API Route
 * Handles streaming chat with the AI brain and tool execution
 */

import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth-options';
import {
  processAgentChat,
  executeToolCalls,
  streamAgentChat,
  Message,
  ToolCall,
} from '@/lib/ai-brain';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

/**
 * POST /api/agent/chat
 * Process agent chat messages with streaming support
 */
export async function POST(req: NextRequest) {
  try {
    // Check authentication
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json(
        { error: 'Niet geautoriseerd' },
        { status: 401 }
      );
    }

    // Check if user is admin
    const user = session.user as any;
    if (user.role !== 'admin' && user.role !== 'superadmin') {
      return NextResponse.json(
        { error: 'Alleen admins hebben toegang tot de AI Agent' },
        { status: 403 }
      );
    }

    const body = await req.json();
    const { messages, toolCalls, stream = false } = body;

    // Validate request
    if (!messages || !Array.isArray(messages)) {
      return NextResponse.json(
        { error: 'Messages array is verplicht' },
        { status: 400 }
      );
    }

    // If toolCalls are provided, execute them and continue
    if (toolCalls && Array.isArray(toolCalls)) {
      const response = await executeToolCalls(messages, toolCalls);
      return NextResponse.json(response);
    }

    // Handle streaming
    if (stream) {
      const encoder = new TextEncoder();
      
      const readableStream = new ReadableStream({
        async start(controller) {
          try {
            for await (const chunk of streamAgentChat(messages)) {
              // Check if chunk is tool calls
              if (Array.isArray(chunk)) {
                const data = JSON.stringify({
                  type: 'tool_calls',
                  toolCalls: chunk,
                });
                controller.enqueue(
                  encoder.encode(`data: ${data}\n\n`)
                );
              } else {
                // Regular text chunk
                const data = JSON.stringify({
                  type: 'content',
                  content: chunk,
                });
                controller.enqueue(
                  encoder.encode(`data: ${data}\n\n`)
                );
              }
            }

            // Send done signal
            controller.enqueue(
              encoder.encode(
                `data: ${JSON.stringify({ type: 'done' })}\n\n`
              )
            );
            controller.close();
          } catch (error: any) {
            console.error('Streaming error:', error);
            const errorData = JSON.stringify({
              type: 'error',
              error: error.message,
            });
            controller.enqueue(
              encoder.encode(`data: ${errorData}\n\n`)
            );
            controller.close();
          }
        },
      });

      return new Response(readableStream, {
        headers: {
          'Content-Type': 'text/event-stream',
          'Cache-Control': 'no-cache',
          'Connection': 'keep-alive',
        },
      });
    }

    // Non-streaming response
    const response = await processAgentChat(messages);
    return NextResponse.json(response);
  } catch (error: any) {
    console.error('Agent chat error:', error);
    return NextResponse.json(
      { error: error.message || 'Er is een fout opgetreden' },
      { status: 500 }
    );
  }
}
