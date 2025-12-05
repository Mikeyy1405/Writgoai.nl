
import OpenAI from 'openai';
import { type ModelId, AI_MODELS, type TaskType, getModelForTask, getFallbackModels } from './aiml-chat-models';

// Server-side only: Initialize AIML API client with OpenAI SDK
// This should NEVER be imported in client components
function getAimlClient() {
  return new OpenAI({
    baseURL: 'https://api.aimlapi.com/v1',
    apiKey: process.env.AIML_API_KEY || '',
  });
}

export interface ChatMessage {
  role: 'system' | 'user' | 'assistant';
  content: string | Array<{type: 'text' | 'image_url'; text?: string; image_url?: {url: string}}>;
  images?: string[];
}

export interface ChatCompletionOptions {
  model: string;
  messages: ChatMessage[];
  temperature?: number;
  max_tokens?: number;
  stream?: boolean;
  taskType?: TaskType;  // Optional task type for intelligent routing
}

// Re-export model definitions from separate file for client-side use
export { AVAILABLE_MODELS, getDefaultModel, AI_MODELS, type ModelId, type TaskType, getModelForTask } from './aiml-chat-models';

/**
 * Send a chat completion request to AIML API with intelligent fallback
 */
export async function sendChatCompletion(options: ChatCompletionOptions) {
  // Use task-based routing if taskType is provided
  const primaryModel = options.taskType 
    ? getModelForTask(options.taskType)
    : options.model;
  
  const fallbackModels = getFallbackModels(primaryModel);
  
  // Try primary model first
  try {
    const aiml = getAimlClient();
    const response = await aiml.chat.completions.create({
      model: primaryModel,
      messages: options.messages.map(msg => ({
        role: msg.role,
        content: msg.content as any, // OpenAI SDK supports both string and content array
      })),
      temperature: options.temperature ?? 0.7,
      max_tokens: options.max_tokens ?? 4096,
      stream: options.stream ?? false,
    });

    console.log(`✅ AIML API success with model: ${primaryModel}`);
    return response;
  } catch (error: any) {
    console.error(`❌ AIML API error with model ${primaryModel}:`, error);
    
    // Try fallback models
    for (const fallbackModel of fallbackModels) {
      try {
        console.log(`🔄 Trying fallback model: ${fallbackModel}`);
        const aiml = getAimlClient();
        const response = await aiml.chat.completions.create({
          model: fallbackModel,
          messages: options.messages.map(msg => ({
            role: msg.role,
            content: msg.content as any,
          })),
          temperature: options.temperature ?? 0.7,
          max_tokens: options.max_tokens ?? 4096,
          stream: options.stream ?? false,
        });

        console.log(`✅ AIML API success with fallback model: ${fallbackModel}`);
        return response;
      } catch (fallbackError: any) {
        console.error(`❌ Fallback model ${fallbackModel} also failed:`, fallbackError);
        continue;
      }
    }
    
    // All models failed
    throw new Error(`AIML API fout: ${error.message}`);
  }
}

/**
 * Send a streaming chat completion request
 */
export async function sendStreamingChatCompletion(options: ChatCompletionOptions) {
  try {
    const aiml = getAimlClient();
    const stream = await aiml.chat.completions.create({
      model: options.model,
      messages: options.messages.map(msg => ({
        role: msg.role,
        content: msg.content as any, // OpenAI SDK supports both string and content array
      })),
      temperature: options.temperature ?? 0.7,
      max_tokens: options.max_tokens ?? 4096,
      stream: true,
    });

    return stream;
  } catch (error: any) {
    console.error('AIML API streaming error:', error);
    throw new Error(`AIML API streaming fout: ${error.message}`);
  }
}
