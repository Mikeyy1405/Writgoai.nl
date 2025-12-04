/**
 * AI Agent Chat API Route
 * Handles chat with non-streaming AI responses but streaming status updates via SSE
 */

import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth-options';
import {
  processAgentChat,
  executeToolCalls,
  Message,
  ToolCall,
} from '@/lib/ai-brain';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

/**
 * Helper function to get status message for tool execution
 */
function getToolStatusMessage(toolName: string, args?: any): string {
  switch(toolName) {
    case 'web_search':
      return `🔍 Zoeken naar: "${args?.query || 'informatie'}"...`;
    case 'generate_blog':
      return `✍️ Blog schrijven over: "${args?.topic || 'onderwerp'}"...`;
    case 'generate_image':
      return `🖼️ Afbeelding genereren...`;
    case 'generate_video':
      return `🎬 Video genereren...`;
    case 'scan_website':
      return `🌐 Website scannen: ${args?.url || ''}...`;
    case 'read_file':
      return `📖 Bestand lezen...`;
    case 'write_file':
      return `📝 Bestand schrijven...`;
    case 'bash_command':
      return `💻 Command uitvoeren...`;
    default:
      return `⚙️ ${toolName} uitvoeren...`;
  }
}

/**
 * Helper function to send SSE status updates
 */
function sendStatusUpdate(
  controller: ReadableStreamDefaultController,
  encoder: TextEncoder,
  status: {
    type: 'status' | 'tool_start' | 'tool_complete' | 'error' | 'complete';
    message: string;
    tool?: string;
    step?: number;
    progress?: number;
  }
) {
  controller.enqueue(encoder.encode(`data: ${JSON.stringify(status)}\n\n`));
}

/**
 * POST /api/agent/chat
 * Process agent chat messages with SSE status updates (non-streaming AI response)
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
    const { messages, useSSE = false } = body;

    // Validate request
    if (!messages || !Array.isArray(messages)) {
      return NextResponse.json(
        { error: 'Messages array is verplicht' },
        { status: 400 }
      );
    }

    // Handle with SSE status updates
    if (useSSE) {
      const encoder = new TextEncoder();
      
      const readableStream = new ReadableStream({
        async start(controller) {
          try {
            // Initial status
            sendStatusUpdate(controller, encoder, {
              type: 'status',
              message: '🤖 AI Agent wordt geactiveerd...'
            });

            let currentMessages = [...messages];
            let step = 0;
            let maxIterations = 10; // Prevent infinite loops

            while (maxIterations > 0) {
              maxIterations--;
              step++;

              // Send thinking status
              sendStatusUpdate(controller, encoder, {
                type: 'status',
                message: '🤖 AI denkt na...',
                step
              });

              // Process agent chat (non-streaming)
              const response = await processAgentChat(currentMessages);

              // Check if there are tool calls to execute
              if (response.toolCalls && response.toolCalls.length > 0) {
                // Send status for each tool
                for (const toolCall of response.toolCalls) {
                  sendStatusUpdate(controller, encoder, {
                    type: 'tool_start',
                    message: getToolStatusMessage(toolCall.name, toolCall.parameters),
                    tool: toolCall.name,
                    step
                  });
                }

                // Execute tool calls
                const executedResponse = await executeToolCalls(currentMessages, response.toolCalls);

                // Send completion status for each tool
                for (const toolCall of response.toolCalls) {
                  sendStatusUpdate(controller, encoder, {
                    type: 'tool_complete',
                    message: `✅ ${toolCall.name} voltooid`,
                    tool: toolCall.name,
                    step
                  });
                }

                // Update messages with tool results
                currentMessages = [
                  ...currentMessages,
                  {
                    role: 'assistant' as const,
                    content: response.message || '',
                    tool_calls: response.toolCalls.map(tc => ({
                      id: tc.id,
                      type: 'function',
                      function: {
                        name: tc.name,
                        arguments: JSON.stringify(tc.parameters),
                      },
                    })),
                  },
                  ...response.toolCalls.map(tc => ({
                    role: 'tool' as const,
                    tool_call_id: tc.id,
                    name: tc.name,
                    content: JSON.stringify(tc.result),
                  })),
                ];

                // Continue if AI wants to make more calls
                if (!executedResponse.done) {
                  continue;
                }

                // Send final response
                sendStatusUpdate(controller, encoder, {
                  type: 'complete',
                  message: executedResponse.message
                });
                break;
              } else {
                // No tool calls, send final response
                sendStatusUpdate(controller, encoder, {
                  type: 'complete',
                  message: response.message
                });
                break;
              }
            }

            if (maxIterations === 0) {
              sendStatusUpdate(controller, encoder, {
                type: 'error',
                message: 'Te veel iteraties, proces gestopt.'
              });
            }

            controller.close();
          } catch (error: any) {
            console.error('Agent chat error:', error);
            sendStatusUpdate(controller, encoder, {
              type: 'error',
              message: 'Er ging iets mis. Probeer het opnieuw.'
            });
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

    // Simple non-SSE response
    const response = await processAgentChat(messages);
    
    // If there are tool calls, execute them automatically
    if (response.toolCalls && response.toolCalls.length > 0) {
      const finalResponse = await executeToolCalls(messages, response.toolCalls);
      return NextResponse.json(finalResponse);
    }
    
    return NextResponse.json(response);
  } catch (error: any) {
    console.error('Agent chat error:', error);
    return NextResponse.json(
      { error: error.message || 'Er is een fout opgetreden' },
      { status: 500 }
    );
  }
}
