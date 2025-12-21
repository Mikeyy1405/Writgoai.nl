import OpenAI from 'openai';

// AIML API Client (OpenAI-compatible)
const aimlClient = new OpenAI({
  apiKey: process.env.AIML_API_KEY || '',
  baseURL: 'https://api.aimlapi.com/v1',
});

// Best models for each task
export const BEST_MODELS = {
  CONTENT: 'claude-4-5-sonnet',          // Best content writing
  TECHNICAL: 'claude-3-5-sonnet-20241022', // Best coding
  QUICK: 'gpt-4o-mini',                  // Fast & reliable
  BUDGET: 'deepseek-chat',               // Cheapest
  IMAGE: 'flux-pro/v1.1',                // Best quality images
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
    const completion = await aimlClient.chat.completions.create({
      model: selectedModel,
      messages: [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: userPrompt },
      ],
      temperature,
      max_tokens: maxTokens,
    });

    return completion.choices[0]?.message?.content || '';
  } catch (error) {
    console.error('AI completion error:', error);
    
    // Fallback to budget model
    if (selectedModel !== BEST_MODELS.BUDGET) {
      const fallback = await aimlClient.chat.completions.create({
        model: BEST_MODELS.BUDGET,
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: userPrompt },
        ],
        temperature,
        max_tokens: maxTokens,
      });
      return fallback.choices[0]?.message?.content || '';
    }
    
    throw error;
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

export default aimlClient;
