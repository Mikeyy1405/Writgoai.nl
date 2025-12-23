import OpenAI from 'openai';
import Anthropic from '@anthropic-ai/sdk';
import { GoogleGenerativeAI } from '@google/generative-ai';

// Model definitions
export const AI_MODELS = {
  // Content Generation (Best for blog posts)
  GEMINI_3_PRO: 'gemini-2.0-flash-exp',
  GEMINI_FLASH: 'gemini-2.0-flash-exp',
  
  // Coding & Technical
  CLAUDE_OPUS: 'claude-3-5-sonnet-20241022',
  CLAUDE_SONNET: 'claude-3-5-sonnet-20241022',
  
  // General & Fast
  GPT_4_TURBO: 'gpt-4-turbo-preview',
  GPT_4: 'gpt-4-turbo-preview',
  
  // Budget & High Volume
  DEEPSEEK: 'gpt-4-turbo-preview', // Fallback to GPT for now
} as const;

export type AIModel = typeof AI_MODELS[keyof typeof AI_MODELS];

// Task-based model selection
export function selectModelForTask(task: 'content' | 'technical' | 'quick' | 'budget'): AIModel {
  switch (task) {
    case 'content':
      return AI_MODELS.GEMINI_3_PRO; // 1M context, best for content
    case 'technical':
      return AI_MODELS.CLAUDE_OPUS; // Best for coding
    case 'quick':
      return AI_MODELS.GPT_4; // Fast responses
    case 'budget':
      return AI_MODELS.DEEPSEEK; // Cost-effective
    default:
      return AI_MODELS.GEMINI_3_PRO;
  }
}

// OpenAI Client (for GPT models)
const openaiClient = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

// Anthropic Client (for Claude models)
const anthropicClient = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY || 'dummy-key',
});

// Google AI Client (for Gemini models)
const googleAI = new GoogleGenerativeAI(
  process.env.GOOGLE_AI_API_KEY || 'dummy-key'
);

// Unified AI completion function
export async function generateAICompletion(params: {
  model?: AIModel;
  task?: 'content' | 'technical' | 'quick' | 'budget';
  systemPrompt: string;
  userPrompt: string;
  temperature?: number;
  maxTokens?: number;
}): Promise<string> {
  const {
    model,
    task = 'content',
    systemPrompt,
    userPrompt,
    temperature = 0.7,
    maxTokens = 4000,
  } = params;

  const selectedModel = model || selectModelForTask(task);

  try {
    // Route to appropriate client based on model
    if (selectedModel.startsWith('gemini')) {
      return await generateWithGemini(selectedModel, systemPrompt, userPrompt, temperature);
    } else if (selectedModel.startsWith('claude')) {
      return await generateWithClaude(selectedModel, systemPrompt, userPrompt, temperature, maxTokens);
    } else {
      return await generateWithOpenAI(selectedModel, systemPrompt, userPrompt, temperature, maxTokens);
    }
  } catch (error: any) {
    console.error(`Error with ${selectedModel}:`, error.message);
    
    // Fallback to GPT-4 if primary model fails
    if (selectedModel !== AI_MODELS.GPT_4) {
      console.log('Falling back to GPT-4...');
      return await generateWithOpenAI(AI_MODELS.GPT_4, systemPrompt, userPrompt, temperature, maxTokens);
    }
    
    throw error;
  }
}

// Gemini implementation
async function generateWithGemini(
  model: string,
  systemPrompt: string,
  userPrompt: string,
  temperature: number
): Promise<string> {
  const genAI = googleAI.getGenerativeModel({ 
    model,
    systemInstruction: systemPrompt,
  });

  const result = await genAI.generateContent({
    contents: [{ role: 'user', parts: [{ text: userPrompt }] }],
    generationConfig: {
      temperature,
      maxOutputTokens: 8192,
    },
  });

  return result.response.text();
}

// Claude implementation
async function generateWithClaude(
  model: string,
  systemPrompt: string,
  userPrompt: string,
  temperature: number,
  maxTokens: number
): Promise<string> {
  const message = await anthropicClient.messages.create({
    model,
    max_tokens: maxTokens,
    temperature,
    system: systemPrompt,
    messages: [
      {
        role: 'user',
        content: userPrompt,
      },
    ],
  });

  const textContent = message.content.find((c) => c.type === 'text');
  return textContent && 'text' in textContent ? textContent.text : '';
}

// OpenAI implementation
async function generateWithOpenAI(
  model: string,
  systemPrompt: string,
  userPrompt: string,
  temperature: number,
  maxTokens: number
): Promise<string> {
  const completion = await openaiClient.chat.completions.create({
    model,
    messages: [
      { role: 'system', content: systemPrompt },
      { role: 'user', content: userPrompt },
    ],
    temperature,
    max_tokens: maxTokens,
  });

  return completion.choices[0]?.message?.content || '';
}

// JSON completion (with retry for valid JSON)
export async function generateJSONCompletion<T = any>(params: {
  model?: AIModel;
  task?: 'content' | 'technical' | 'quick' | 'budget';
  systemPrompt: string;
  userPrompt: string;
  temperature?: number;
}): Promise<T> {
  const {
    model,
    task = 'content',
    systemPrompt,
    userPrompt,
    temperature = 0.3,
  } = params;

  const selectedModel = model || selectModelForTask(task);

  // For JSON, use OpenAI with structured output
  if (selectedModel.startsWith('gpt')) {
    const completion = await openaiClient.chat.completions.create({
      model: selectedModel,
      messages: [
        { role: 'system', content: systemPrompt + '\n\nAlways respond with valid JSON.' },
        { role: 'user', content: userPrompt },
      ],
      temperature,
      response_format: { type: 'json_object' },
    });

    const content = completion.choices[0]?.message?.content || '{}';
    return JSON.parse(content);
  }

  // For other models, parse JSON from text
  const result = await generateAICompletion({
    model: selectedModel,
    task,
    systemPrompt: systemPrompt + '\n\nAlways respond with valid JSON only, no other text.',
    userPrompt,
    temperature,
  });

  // Extract JSON from response (handle markdown code blocks)
  const jsonMatch = result.match(/```json\n?([\s\S]*?)\n?```/) || result.match(/\{[\s\S]*\}/);
  const jsonStr = jsonMatch ? (jsonMatch[1] || jsonMatch[0]) : result;
  
  return JSON.parse(jsonStr.trim());
}

export default {
  generateAICompletion,
  generateJSONCompletion,
  selectModelForTask,
  AI_MODELS,
};
