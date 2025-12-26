import { createClient } from '@/lib/supabase-server';
import { NextRequest, NextResponse } from 'next/server';
import { aimlClient } from '@/lib/ai-client';
import { executeCommand } from '@/lib/vps-executor';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

/**
 * GET /api/agent/chat
 * Get chat history
 */
export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient();

    // Get current user
    const {
      data: { user },
      error: userError,
    } = await supabase.auth.getUser();

    if (userError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Get optional task_id filter
    const searchParams = request.nextUrl.searchParams;
    const taskId = searchParams.get('task_id');
    const limit = parseInt(searchParams.get('limit') || '50');

    // Build query
    let query = supabase
      .from('agent_chat_messages')
      .select('*')
      .eq('user_id', user.id)
      .order('created_at', { ascending: true })
      .limit(limit);

    if (taskId) {
      query = query.eq('task_id', taskId);
    }

    const { data: messages, error } = await query;

    if (error) {
      console.error('Error fetching chat messages:', error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ messages });
  } catch (error: any) {
    console.error('Error in GET /api/agent/chat:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

/**
 * POST /api/agent/chat
 * Send a message to the AI agent
 */
export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient();

    // Get current user
    const {
      data: { user },
      error: userError,
    } = await supabase.auth.getUser();

    if (userError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { message, task_id } = body;

    if (!message) {
      return NextResponse.json({ error: 'Message is required' }, { status: 400 });
    }

    // Save user message
    const { data: userMessage, error: saveError } = await supabase
      .from('agent_chat_messages')
      .insert({
        user_id: user.id,
        task_id: task_id || null,
        role: 'user',
        content: message,
      })
      .select()
      .single();

    if (saveError) {
      console.error('Error saving user message:', saveError);
      return NextResponse.json({ error: saveError.message }, { status: 500 });
    }

    // Get chat history for context
    const { data: chatHistory } = await supabase
      .from('agent_chat_messages')
      .select('*')
      .eq('user_id', user.id)
      .order('created_at', { ascending: true })
      .limit(20);

    // Build conversation context
    const conversationHistory = (chatHistory || []).map((msg) => ({
      role: (msg.role === 'agent' ? 'assistant' : 'user') as 'assistant' | 'user',
      content: msg.content,
    }));

    // Get user's projects for context
    const { data: projects } = await supabase
      .from('projects')
      .select('id, name, url, niche')
      .eq('user_id', user.id);

    // Get available templates
    const { data: templates } = await supabase
      .from('agent_templates')
      .select('id, name, description, category')
      .or(`user_id.eq.${user.id},is_public.eq.true,is_system.eq.true`)
      .limit(10);

    // Check if VPS is configured
    const vpsConfigured = !!(process.env.VPS_HOST && process.env.VPS_USER);

    // System prompt for AI agent
    const systemPrompt = `You are an AI Virtual Assistant for WritGo.nl, helping the user automate tasks.

Your capabilities:
${vpsConfigured ? '- **VPS Terminal Access**: Je hebt DIRECTE toegang tot een Ubuntu VPS server via SSH. Je kunt ALLES uitvoeren: installeren, configureren, deployen, scripts draaien, etc.' : ''}
- Browser automation (scraping, form filling, navigation)
- WordPress management (publish posts, manage content)
- SEO tasks (GSC reports, keyword research, competitor analysis)
- E-commerce (price monitoring, product research on sites like bol.com)
- Social media content creation
- Data analysis and reporting

User's projects:
${projects?.map((p) => `- ${p.name} (${p.url}) - ${p.niche || 'General'}`).join('\n')}

${vpsConfigured ? `
🚀 **VPS TERMINAL MODE ENABLED**
Je hebt toegang tot een Ubuntu VPS server. Wanneer de gebruiker iets vraagt dat op een server uitgevoerd moet worden, genereer dan een VPS command.

Voorbeelden van VPS commands:
- "installeer docker" → "sudo apt-get update && sudo apt-get install -y docker.io"
- "check disk ruimte" → "df -h"
- "lijst alle processen" → "ps aux"
- "deploy een node.js app" → Commands voor git clone, npm install, pm2 start
- "setup een database" → Docker commando's voor PostgreSQL/MySQL
- "check system resources" → "free -h && df -h && uptime"

Wanneer je een VPS command wilt uitvoeren, respond met JSON:
{
  "type": "vps_command",
  "command": "het bash command",
  "description": "Wat dit doet",
  "auto_execute": true
}

Als auto_execute true is, wordt het DIRECT uitgevoerd zonder bevestiging.
Voor destructieve commands (rm, delete, drop) zet auto_execute op false voor bevestiging.
` : ''}

Response format:
- Be concise and helpful
- Use bullet points for steps
- Ask clarifying questions if needed

Otherwise, just respond conversationally.`;

    // Call AI - Using Claude Opus 4.5 for AI Agent chat
    const aiResponse = await aimlClient.chat.completions.create({
      model: 'claude-opus-4.5',
      messages: [
        { role: 'system' as const, content: systemPrompt },
        ...conversationHistory,
        { role: 'user' as const, content: message },
      ],
      temperature: 0.7,
      max_tokens: 4000, // Opus has higher capacity
    });

    let agentResponse = aiResponse.choices[0].message.content || 'Sorry, I couldn\'t process that.';

    // Check if response contains a task proposal or VPS command
    let actionRequired = false;
    let actionType = null;
    let actionData = null;
    let vpsExecutionResult = null;

    try {
      // Try to parse JSON from response
      const jsonMatch = agentResponse.match(/\{[\s\S]*"type":\s*"(task_proposal|vps_command)"[\s\S]*\}/);
      if (jsonMatch) {
        const proposal = JSON.parse(jsonMatch[0]);

        if (proposal.type === 'vps_command') {
          // VPS Command detected
          actionType = 'vps_command';
          actionData = proposal;

          // Auto-execute if configured
          if (vpsConfigured && proposal.auto_execute) {
            console.log('[VPS] Auto-executing command:', proposal.command);

            try {
              const result = await executeCommand(proposal.command);
              vpsExecutionResult = result;

              // Append execution result to response
              agentResponse += `\n\n**✅ VPS Command Executed**\n`;
              agentResponse += `Command: \`${proposal.command}\`\n\n`;

              if (result.success) {
                agentResponse += `**Output:**\n\`\`\`\n${result.stdout || '(no output)'}\`\`\`\n`;
                if (result.stderr) {
                  agentResponse += `\n**Warnings:**\n\`\`\`\n${result.stderr}\`\`\`\n`;
                }
              } else {
                agentResponse += `**❌ Error:**\n\`\`\`\n${result.error || result.stderr}\`\`\`\n`;
              }

              agentResponse += `\nExit code: ${result.exitCode}`;
            } catch (execError: any) {
              agentResponse += `\n\n❌ Failed to execute VPS command: ${execError.message}`;
            }
          } else {
            // Requires confirmation
            actionRequired = true;
          }
        } else if (proposal.type === 'task_proposal') {
          // Task proposal
          actionRequired = true;
          actionType = 'task_proposal';
          actionData = proposal;
        }
      }
    } catch (e) {
      // Not a proposal, just normal response
    }

    // Save agent response
    const { data: agentMessage, error: agentSaveError } = await supabase
      .from('agent_chat_messages')
      .insert({
        user_id: user.id,
        task_id: task_id || null,
        role: 'agent',
        content: agentResponse,
        action_required: actionRequired,
        action_type: actionType,
        action_data: {
          ...actionData,
          vps_result: vpsExecutionResult,
        },
      })
      .select()
      .single();

    if (agentSaveError) {
      console.error('Error saving agent message:', agentSaveError);
      return NextResponse.json({ error: agentSaveError.message }, { status: 500 });
    }

    return NextResponse.json({
      userMessage,
      agentMessage,
    });
  } catch (error: any) {
    console.error('Error in POST /api/agent/chat:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
