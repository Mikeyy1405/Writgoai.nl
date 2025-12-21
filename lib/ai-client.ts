import Anthropic from '@anthropic-ai/sdk';

// Anthropic client via AIML API
const anthropicClient = new Anthropic({
  baseURL: 'https://api.aimlapi.com/',
  apiKey: process.env.AIML_API_KEY || '',
});

// Best models for each task
export const BEST_MODELS = {
  CONTENT: 'claude-sonnet-4-5',              // Best content writing
  TECHNICAL: 'claude-sonnet-4-5',            // Best coding
  QUICK: 'claude-sonnet-4-5',                // Fast & reliable
  BUDGET: 'claude-sonnet-4-5',               // Same model
  IMAGE: 'flux-pro/v1.1',                    // Best quality images
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
