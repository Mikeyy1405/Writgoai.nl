/**
 * AI Agent Chat API Route
 * Handles chat with the AI brain and tool execution with status updates
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
import { executeTool } from '@/lib/ai-brain/tool-executor';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

// Helper function to get tool status message
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
    case 'analyze_content':
      return `📊 Content analyseren...`;
    case 'keyword_research':
      return `🔑 Keyword onderzoek...`;
    default:
      return `⚙️ ${toolName} uitvoeren...`;
  }
}

// Helper to create SSE update
function createStatusUpdate(type: string, data: any): string {
  return `data: ${JSON.stringify({ type, ...data })}\n\n`;
}

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
    const { messages, toolCalls, stream = true } = body;

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

    // Always use SSE for status updates (but NOT streaming AI response)
    const encoder = new TextEncoder();
    
    const readableStream = new ReadableStream({
      async start(controller) {
        try {
          // Send initial status
          controller.enqueue(encoder.encode(createStatusUpdate('status', {
            message: '🤖 AI Agent wordt geactiveerd...',
            step: 0
          })));

          let currentMessages = [...messages];
          let iteration = 0;
          const maxIterations = 10;
          const toolExecutionLog: Array<{tool: string; args: any}> = [];

          while (iteration < maxIterations) {
            iteration++;
            
            // Send thinking status
            controller.enqueue(encoder.encode(createStatusUpdate('status', {
              message: '🧠 AI denkt na...',
              step: iteration
            })));

            // Call AI (non-streaming)
            const response = await processAgentChat(currentMessages);

            // Check if AI wants to use tools
            if (response.toolCalls && response.toolCalls.length > 0) {
              // Add assistant message with tool calls first
              currentMessages = [
                ...currentMessages,
                {
                  role: 'assistant',
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
              ];

              // Execute each tool with status updates
              for (const toolCall of response.toolCalls) {
                // Send tool start status
                controller.enqueue(encoder.encode(createStatusUpdate('tool_start', {
                  tool: toolCall.name,
                  message: getToolStatusMessage(toolCall.name, toolCall.parameters),
                  step: iteration
                })));

                // Execute the tool and get result
                toolCall.status = 'executing';
                try {
                  const result = await executeTool(toolCall.name, toolCall.parameters);
                  toolCall.result = result;
                  toolCall.status = result.success ? 'completed' : 'failed';
                } catch (error: any) {
                  toolCall.result = {
                    success: false,
                    error: error.message,
                  };
                  toolCall.status = 'failed';
                }
                
                // Add tool result to messages
                currentMessages = [
                  ...currentMessages,
                  {
                    role: 'tool',
                    tool_call_id: toolCall.id,
                    content: JSON.stringify(toolCall.result || {}),
                  },
                ];

                toolExecutionLog.push({ tool: toolCall.name, args: toolCall.parameters });

                // Send tool complete status
                controller.enqueue(encoder.encode(createStatusUpdate('tool_complete', {
                  tool: toolCall.name,
                  message: `✅ ${toolCall.name} voltooid`,
                  step: iteration
                })));
              }

              // Continue loop to process tool results
              continue;
            }

            // No more tool calls - send final response
            if (response.message) {
              controller.enqueue(encoder.encode(createStatusUpdate('complete', {
                message: response.message,
                toolsUsed: toolExecutionLog,
                iterations: iteration
              })));
            }

            break;
          }

          // Send done signal
          controller.enqueue(encoder.encode(createStatusUpdate('done', {})));
          controller.close();

        } catch (error: any) {
          console.error('Agent chat error:', error);
          controller.enqueue(encoder.encode(createStatusUpdate('error', {
            message: 'Er ging iets mis. Probeer het opnieuw.',
            details: error.message
          })));
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

  } catch (error: any) {
    console.error('Agent chat error:', error);
    return NextResponse.json(
      { error: error.message || 'Er is een fout opgetreden' },
      { status: 500 }
    );
  }
}
