import Anthropic from '@anthropic-ai/sdk';
import OpenAI from 'openai';

// Get API key - support multiple env var names for flexibility
const getApiKey = () => {
  return process.env.AIML_API_KEY || 
         process.env.ANTHROPIC_API_KEY || 
         process.env.OPENAI_API_KEY || 
         '';
};

const apiKey = getApiKey();

// Anthropic client via AIML API (for Claude models)
export const anthropicClient = new Anthropic({
  baseURL: process.env.AIML_BASE_URL || 'https://api.aimlapi.com/',
  apiKey: apiKey,
});

// OpenAI-compatible client via AIML API (for Perplexity and other models)
export const openaiClient = new OpenAI({
  apiKey: apiKey,
  baseURL: process.env.OPENAI_BASE_URL || 'https://api.aimlapi.com/v1',
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

  // Check if API key is configured
  if (!apiKey) {
    console.error('No AI API key configured. Please set AIML_API_KEY, ANTHROPIC_API_KEY, or OPENAI_API_KEY');
    throw new Error('AI API key not configured. Please check environment variables.');
  }

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
    
    // Provide more helpful error messages
    if (error.status === 401) {
      throw new Error('AI API authentication failed. Please check your API key.');
    }
    if (error.status === 429) {
      throw new Error('AI API rate limit exceeded. Please try again later.');
    }
    if (error.status === 500) {
      throw new Error('AI API server error. Please try again later.');
    }
    
    throw new Error(`AI generation failed: ${error.message}`);
  }
}

export async function generateJSONCompletion<T>(options: GenerateOptions): Promise<T> {
  const content = await generateAICompletion(options);
  
  try {
    // Try to extract JSON from various formats
    let jsonString = content;
    
    // First try to find JSON in code blocks
    const codeBlockMatch = content.match(/```(?:json)?\n?([\s\S]*?)\n?```/);
    if (codeBlockMatch) {
      jsonString = codeBlockMatch[1];
    } else {
      // Try to find standalone JSON object or array
      const objectMatch = content.match(/\{[\s\S]*\}/);
      const arrayMatch = content.match(/\[[\s\S]*\]/);
      
      if (objectMatch) {
        jsonString = objectMatch[0];
      } else if (arrayMatch) {
        jsonString = arrayMatch[0];
      }
    }
    
    // Clean up common issues
    jsonString = jsonString
      .trim()
      .replace(/,\s*}/g, '}')  // Remove trailing commas before }
      .replace(/,\s*]/g, ']')  // Remove trailing commas before ]
      .replace(/[\x00-\x1F\x7F]/g, ' ')  // Remove control characters
      .replace(/\\n/g, '\\n')  // Escape newlines properly
      .replace(/\n/g, ' ');  // Replace actual newlines with spaces in strings
    
    return JSON.parse(jsonString);
  } catch (error) {
    console.error('JSON parsing error:', error);
    console.error('Raw content:', content.substring(0, 1000));
    
    // Try one more time with aggressive cleaning
    try {
      const cleanedContent = content
        .replace(/```(?:json)?/g, '')
        .replace(/```/g, '')
        .trim();
      
      // Find the first { and last } or first [ and last ]
      const firstBrace = cleanedContent.indexOf('{');
      const lastBrace = cleanedContent.lastIndexOf('}');
      const firstBracket = cleanedContent.indexOf('[');
      const lastBracket = cleanedContent.lastIndexOf(']');
      
      let jsonStr = '';
      if (firstBrace !== -1 && lastBrace !== -1 && (firstBracket === -1 || firstBrace < firstBracket)) {
        jsonStr = cleanedContent.substring(firstBrace, lastBrace + 1);
      } else if (firstBracket !== -1 && lastBracket !== -1) {
        jsonStr = cleanedContent.substring(firstBracket, lastBracket + 1);
      }
      
      if (jsonStr) {
        return JSON.parse(jsonStr);
      }
    } catch (e) {
      // Final fallback failed
    }
    
    throw new Error('Failed to parse AI response as JSON');
  }
}

export default anthropicClient;
