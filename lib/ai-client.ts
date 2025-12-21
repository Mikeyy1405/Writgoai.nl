import Anthropic from '@anthropic-ai/sdk';
import OpenAI from 'openai';

// Anthropic client via AIML API (for Claude models)
export const anthropicClient = new Anthropic({
  baseURL: 'https://api.aimlapi.com/',
  apiKey: process.env.AIML_API_KEY || '',
});

// OpenAI-compatible client via AIML API (for Perplexity and other models)
export const openaiClient = new OpenAI({
  apiKey: process.env.AIML_API_KEY || '',
  baseURL: 'https://api.aimlapi.com/v1',
});

// For backwards compatibility
export const aimlClient = openaiClient;

// Best models for each task
export const BEST_MODELS = {
  CONTENT: 'claude-sonnet-4-5',              // Best content writing (Anthropic)
  TECHNICAL: 'claude-sonnet-4-5',            // Best coding (Anthropic)
  QUICK: 'claude-sonnet-4-5',                // Fast & reliable (Anthropic)
  BUDGET: 'claude-sonnet-4-5',               // Same model (Anthropic)
  IMAGE: 'flux-pro/v1.1',                    // Best quality images
  PERPLEXITY: 'perplexity/llama-3.1-sonar-large-128k-online', // For research/discovery
};

interface GenerateOptions {
  model?: string;
  task?: 'content' | 'technical' | 'quick' | 'budget';
  systemPrompt: string;
  userPrompt: string;
  temperature?: number;
  maxTokens?: number;
}

export async function generateAICompletion(options: GenerateOptions): Promise<string> {
  const {
    model,
    task = 'content',
    systemPrompt,
    userPrompt,
    temperature = 0.7,
    maxTokens = 4000,
  } = options;

  const modelMap = {
    content: BEST_MODELS.CONTENT,
    technical: BEST_MODELS.TECHNICAL,
    quick: BEST_MODELS.QUICK,
    budget: BEST_MODELS.BUDGET,
  };

  const selectedModel = model || modelMap[task];

  try {
    // Use Anthropic SDK for Claude models
    if (selectedModel.includes('claude')) {
      const message = await anthropicClient.messages.create({
        model: selectedModel,
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

      // Extract text from response
      const textContent = message.content.find((block) => block.type === 'text');
      return textContent?.type === 'text' ? textContent.text : '';
    }
    
    // Use OpenAI-compatible client for other models (Perplexity, etc.)
    const completion = await openaiClient.chat.completions.create({
      model: selectedModel,
      messages: [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: userPrompt },
      ],
      temperature,
      max_tokens: maxTokens,
    });

    return completion.choices[0]?.message?.content || '';
  } catch (error: any) {
    console.error('AI completion error:', error);
    throw new Error(`AI generation failed: ${error.message}`);
  }
}

export async function generateJSONCompletion<T>(options: GenerateOptions): Promise<T> {
  const content = await generateAICompletion(options);
  
  try {
    const jsonMatch = content.match(/```json\n?([\s\S]*?)\n?```/) || content.match(/```\n?([\s\S]*?)\n?```/);
    const jsonString = jsonMatch ? jsonMatch[1] : content;
    return JSON.parse(jsonString.trim());
  } catch (error) {
    console.error('JSON parsing error:', error);
    throw new Error('Failed to parse AI response as JSON');
  }
}

export default anthropicClient;
