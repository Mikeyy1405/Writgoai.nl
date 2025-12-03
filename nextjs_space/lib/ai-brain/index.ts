/**
 * AI Brain - Main Orchestrator
 * Uses Claude Opus 4.5 as the brain with function calling for tool execution
 */

import OpenAI from 'openai';
import { getAllToolsAsOpenAIFunctions } from './tools';
import { executeTool, ToolExecutionResult } from './tool-executor';

const AIML_API_KEY = process.env.AIML_API_KEY || '';
const AIML_API_BASE = 'https://api.aimlapi.com/v1';

// OpenAI SDK client met AIML base URL
const aimlClient = new OpenAI({
  apiKey: AIML_API_KEY,
  baseURL: AIML_API_BASE,
});

// Default orchestrator model - Claude Opus 4.5
const ORCHESTRATOR_MODEL = 'claude-opus-4-5-20250514';

export interface Message {
  role: 'system' | 'user' | 'assistant' | 'tool';
  content: string;
  name?: string;
  tool_call_id?: string;
  tool_calls?: any[];
}

export interface ChatOptions {
  model?: string;
  temperature?: number;
  maxTokens?: number;
  stream?: boolean;
}

export interface AgentResponse {
  message: string;
  toolCalls?: ToolCall[];
  done: boolean;
}

export interface ToolCall {
  id: string;
  name: string;
  parameters: any;
  result?: ToolExecutionResult;
  status: 'pending' | 'executing' | 'completed' | 'failed';
}

/**
 * Process a chat message with the AI brain
 * This handles the complete flow: user input -> tool calling -> response
 */
export async function processAgentChat(
  messages: Message[],
  options: ChatOptions = {}
): Promise<AgentResponse> {
  const model = options.model || ORCHESTRATOR_MODEL;
  const temperature = options.temperature || 0.7;
  const maxTokens = options.maxTokens || 4096;

  // Add system message if not present
  if (!messages.find(m => m.role === 'system')) {
    messages.unshift({
      role: 'system',
      content: SYSTEM_PROMPT,
    });
  }

  try {
    // Call AIML API with function calling
    const response = await aimlClient.chat.completions.create({
      model,
      messages: messages as any,
      tools: getAllToolsAsOpenAIFunctions(),
      tool_choice: 'auto',
      temperature,
      max_tokens: maxTokens,
    });

    const choice = response.choices[0];
    const assistantMessage = choice.message;

    // Check if the model wants to call tools
    if (assistantMessage.tool_calls && assistantMessage.tool_calls.length > 0) {
      const toolCalls: ToolCall[] = assistantMessage.tool_calls.map(tc => ({
        id: tc.id,
        name: tc.function.name,
        parameters: JSON.parse(tc.function.arguments),
        status: 'pending' as const,
      }));

      return {
        message: assistantMessage.content || 'Executing tools...',
        toolCalls,
        done: false,
      };
    }

    // No tool calls, return final message
    return {
      message: assistantMessage.content || '',
      done: choice.finish_reason === 'stop',
    };
  } catch (error: any) {
    console.error('AI Brain error:', error);
    throw new Error(`AI Brain fout: ${error.message}`);
  }
}

/**
 * Execute tool calls and continue the conversation
 */
export async function executeToolCalls(
  messages: Message[],
  toolCalls: ToolCall[],
  options: ChatOptions = {}
): Promise<AgentResponse> {
  // Execute all tool calls
  const executedToolCalls: ToolCall[] = await Promise.all(
    toolCalls.map(async (tc) => {
      tc.status = 'executing';
      try {
        const result = await executeTool(tc.name, tc.parameters);
        tc.result = result;
        tc.status = result.success ? 'completed' : 'failed';
      } catch (error: any) {
        tc.result = {
          success: false,
          error: error.message,
        };
        tc.status = 'failed';
      }
      return tc;
    })
  );

  // Add tool results to messages
  const updatedMessages: Message[] = [
    ...messages,
    {
      role: 'assistant',
      content: '',
      tool_calls: executedToolCalls.map(tc => ({
        id: tc.id,
        type: 'function',
        function: {
          name: tc.name,
          arguments: JSON.stringify(tc.parameters),
        },
      })),
    },
    ...executedToolCalls.map(tc => ({
      role: 'tool' as const,
      tool_call_id: tc.id,
      name: tc.name,
      content: JSON.stringify(tc.result),
    })),
  ];

  // Continue conversation with tool results
  return processAgentChat(updatedMessages, options);
}

/**
 * Stream agent responses
 */
export async function* streamAgentChat(
  messages: Message[],
  options: ChatOptions = {}
): AsyncGenerator<string | ToolCall[], void, unknown> {
  const model = options.model || ORCHESTRATOR_MODEL;
  const temperature = options.temperature || 0.7;
  const maxTokens = options.maxTokens || 4096;

  // Add system message if not present
  if (!messages.find(m => m.role === 'system')) {
    messages.unshift({
      role: 'system',
      content: SYSTEM_PROMPT,
    });
  }

  try {
    const stream = await aimlClient.chat.completions.create({
      model,
      messages: messages as any,
      tools: getAllToolsAsOpenAIFunctions(),
      tool_choice: 'auto',
      temperature,
      max_tokens: maxTokens,
      stream: true,
    });

    let accumulatedToolCalls: any[] = [];
    let currentContent = '';

    for await (const chunk of stream) {
      const delta = chunk.choices[0]?.delta;

      if (!delta) continue;

      // Handle content streaming
      if (delta.content) {
        currentContent += delta.content;
        yield delta.content;
      }

      // Handle tool calls
      if (delta.tool_calls) {
        for (const toolCall of delta.tool_calls) {
          if (!accumulatedToolCalls[toolCall.index]) {
            accumulatedToolCalls[toolCall.index] = {
              id: toolCall.id || '',
              type: 'function',
              function: {
                name: toolCall.function?.name || '',
                arguments: '',
              },
            };
          }
          if (toolCall.function?.arguments) {
            accumulatedToolCalls[toolCall.index].function.arguments +=
              toolCall.function.arguments;
          }
          if (toolCall.function?.name) {
            accumulatedToolCalls[toolCall.index].function.name =
              toolCall.function.name;
          }
          if (toolCall.id) {
            accumulatedToolCalls[toolCall.index].id = toolCall.id;
          }
        }
      }

      // Check if stream is done
      if (chunk.choices[0]?.finish_reason === 'tool_calls') {
        // Convert accumulated tool calls to ToolCall format
        const toolCalls: ToolCall[] = accumulatedToolCalls
          .filter(tc => tc.id && tc.function.name)
          .map(tc => ({
            id: tc.id,
            name: tc.function.name,
            parameters: JSON.parse(tc.function.arguments || '{}'),
            status: 'pending' as const,
          }));

        yield toolCalls;
        return;
      }
    }
  } catch (error: any) {
    console.error('AI Brain streaming error:', error);
    throw new Error(`AI Brain streaming fout: ${error.message}`);
  }
}

/**
 * System prompt for the AI brain
 */
const SYSTEM_PROMPT = `Je bent een intelligente AI assistent voor WritgoAI, een content marketing platform.

Je rol is om de admin te helpen met het beheren van klanten, content generatie, en andere taken via een chat interface.

Je hebt toegang tot verschillende tools om taken uit te voeren:
- Klanten beheren (zoeken, details bekijken)
- Content genereren (blogs, video scripts, etc.)
- Facturen maken
- Emails verzenden
- Opdrachten beheren
- Analytics bekijken
- AI modellen gebruiken
- WordPress integratie
- En meer

Wanneer een gebruiker een verzoek doet:
1. Analyseer wat de gebruiker wil
2. Gebruik de juiste tools om de taak uit te voeren
3. Geef duidelijke feedback over wat je doet
4. Als een taak meerdere stappen vereist, leg dit uit
5. Als je informatie mist, vraag er om

Communiceer in het Nederlands en gebruik een professionele maar vriendelijke toon.

Bij het uitvoeren van tools:
- Gebruik altijd de meest specifieke tool voor de taak
- Als je meerdere tools nodig hebt, voer ze dan in logische volgorde uit
- Geef duidelijke updates over de voortgang
- Als een tool faalt, leg uit wat er mis ging en suggereer alternatieven

Voor content generatie:
- Gebruik de juiste AI modellen (je hebt toegang tot 400+ modellen)
- Voor lange blogs: gebruik Claude Sonnet 4.5 of GPT-5
- Voor korte content: gebruik GPT-5 Mini of Gemini 2.5 Flash
- Voor code: gebruik Claude Sonnet 4.5
- Voor images: gebruik FLUX 1 Pro of DALL-E 3
- Voor bulk taken: gebruik DeepSeek V3 (goedkoop)

Belangrijke richtlijnen:
- Wees proactief en stel verbeteringen voor
- Denk stap voor stap bij complexe taken
- Verifieer belangrijke acties met de gebruiker
- Geef altijd context bij je antwoorden
- Als iets niet mogelijk is, leg uit waarom en bied alternatieven

Je bent slim, efficiënt, en helpt de admin om tijd te besparen en betere resultaten te behalen.`;

export { SYSTEM_PROMPT };
