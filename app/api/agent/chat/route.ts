import { createClient } from '@/lib/supabase/server';
import { NextRequest, NextResponse } from 'next/server';
import { aiClient } from '@/lib/ai-client';

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
      role: msg.role === 'agent' ? 'assistant' : 'user',
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

    // System prompt for AI agent
    const systemPrompt = `You are an AI Virtual Assistant for WritGo.nl, helping the user automate tasks.

Your capabilities:
- Browser automation (scraping, form filling, navigation)
- WordPress management (publish posts, manage content)
- SEO tasks (GSC reports, keyword research, competitor analysis)
- E-commerce (price monitoring, product research on sites like bol.com)
- Social media content creation
- Data analysis and reporting

User's projects:
${projects?.map((p) => `- ${p.name} (${p.url}) - ${p.niche || 'General'}`).join('\n')}

Available templates:
${templates?.map((t) => `- ${t.name}: ${t.description}`).join('\n')}

When the user asks you to do something:
1. Understand the request clearly
2. Break it down into steps
3. Ask for confirmation before executing
4. Provide clear status updates

If you need credentials (login info), ask the user to add them via the Credentials page.

Response format:
- Be concise and helpful
- Use bullet points for steps
- Ask clarifying questions if needed
- Suggest relevant templates when applicable

IMPORTANT: If the user wants to execute a task, respond with a JSON object in this format:
{
  "type": "task_proposal",
  "title": "Short title",
  "description": "What you'll do",
  "steps": ["step 1", "step 2", ...],
  "requires_credentials": ["service1", "service2"],
  "estimated_duration": "2-3 minutes",
  "template_id": "uuid or null"
}

Otherwise, just respond conversationally.`;

    // Call AI
    const aiResponse = await aiClient.chat.completions.create({
      model: 'claude-sonnet-4.5',
      messages: [
        { role: 'system', content: systemPrompt },
        ...conversationHistory,
        { role: 'user', content: message },
      ],
      temperature: 0.7,
      max_tokens: 2000,
    });

    const agentResponse = aiResponse.choices[0].message.content || 'Sorry, I couldn\'t process that.';

    // Check if response contains a task proposal
    let actionRequired = false;
    let actionType = null;
    let actionData = null;

    try {
      // Try to parse JSON from response
      const jsonMatch = agentResponse.match(/\{[\s\S]*"type":\s*"task_proposal"[\s\S]*\}/);
      if (jsonMatch) {
        const proposal = JSON.parse(jsonMatch[0]);
        actionRequired = true;
        actionType = 'task_proposal';
        actionData = proposal;
      }
    } catch (e) {
      // Not a task proposal, just normal response
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
        action_data: actionData,
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
