
/**
 * 🚀 AIML API - ADVANCED CAPABILITIES
 * 
 * Complete toolkit voor alle AI/ML mogelijkheden:
 * - Image Generation (Flux, Imagen, DALL-E, etc)
 * - Video Generation (MiniMax, Veo, Kling, etc)
 * - Speech-to-Text (Whisper, Assembly, Deepgram)
 * - Text-to-Speech (ElevenLabs, OpenAI)
 * - Vision/OCR (Multimodal models)
 * - Image Enhancement & Upscaling
 */

const AIML_API_KEY = process.env.AIML_API_KEY || '';
const AIML_BASE_URL = 'https://api.aimlapi.com';

if (!AIML_API_KEY) {
  console.warn('⚠️ AIML_API_KEY niet ingesteld!');
}

// ═══════════════════════════════════════════════════════
// 🎨 IMAGE GENERATION
// ═══════════════════════════════════════════════════════

/**
 * Alle beschikbare image models volgens AIML API docs
 * https://docs.aimlapi.com/api-references/image-models
 */
export const IMAGE_MODELS = {
  // Flux Models (Fast & High Quality)
  'flux/schnell': 'FLUX.1 [schnell] - Snelste model, goede kwaliteit',
  'flux/dev': 'FLUX.1 [dev] - Hoge kwaliteit, goed voor development',
  'flux-pro': 'FLUX.1 [pro] - Top kwaliteit, professioneel',
  'flux-pro/v1.1': 'FLUX 1.1 [pro] - Nieuwste versie, beste kwaliteit',
  'flux-pro/v1.1-ultra': 'FLUX 1.1 [pro ultra] - Ultra HD kwaliteit',
  'flux-realism': 'FLUX Realism LoRA - Ultra realistic images',
  
  // Google Imagen (Excellent quality)
  'imagen-3.0-generate-002': 'Google Imagen 3 - Hoge kwaliteit',
  'google/imagen4/preview': 'Google Imagen 4 Preview - Latest',
  'imagen-4.0-ultra-generate-preview-06-06': 'Google Imagen 4 Ultra - Top kwaliteit',
  'google/gemini-2.5-flash-image': 'Google Gemini 2.5 Flash Image',
  
  // OpenAI DALL-E
  'dall-e-2': 'OpenAI DALL-E 2 - Classic',
  'dall-e-3': 'OpenAI DALL-E 3 - Beste prompts',
  
  // Stable Diffusion
  'stable-diffusion-v3-medium': 'Stable Diffusion 3 - Open source',
  'stable-diffusion-v35-large': 'Stable Diffusion 3.5 Large - Latest',
  
  // Recraft (Design focused)
  'recraft-v3': 'Recraft v3 - Design & illustrations',
  
  // ByteDance
  'bytedance/seedream-3.0': 'ByteDance Seedream 3.0',
  'bytedance/seedream-v4-text-to-image': 'ByteDance Seedream 4',
  
  // Tencent
  'hunyuan/hunyuan-image-v3-text-to-image': 'Tencent HunyuanImage 3.0',
} as const;

export type ImageModel = keyof typeof IMAGE_MODELS;

export interface ImageGenerationOptions {
  model?: ImageModel;
  prompt: string;
  width?: number;
  height?: number;
  num_images?: number;
  style?: 'realistic' | 'artistic' | 'anime' | 'photographic';
}

/**
 * Genereer afbeeldingen met AIML API
 * Volgens officiële docs: https://docs.aimlapi.com/api-references/image-models
 */
export async function generateImage(options: ImageGenerationOptions): Promise<{
  success: boolean;
  images?: string[];
  model?: string;
  error?: string;
}> {
  try {
    // Default: flux/schnell (snelste, goede kwaliteit, gratis)
    const model = options.model || 'flux/schnell';
    
    console.log(`🎨 Generating image with model: ${model}`);
    
    const response = await fetch(`${AIML_BASE_URL}/v1/images/generations/`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${AIML_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: model,
        prompt: options.prompt,
        n: options.num_images || 1,
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('Image generation failed:', errorText);
      throw new Error(`Image generation failed: ${errorText}`);
    }

    const data = await response.json();
    console.log('Image generation response:', data);
    
    const images = data.data?.map((img: any) => img.url || img.b64_json) || [];

    return {
      success: true,
      images,
      model,
    };
  } catch (error: any) {
    console.error('Image generation error:', error);
    return {
      success: false,
      error: error.message,
    };
  }
}

/**
 * Verbeter/upscale een afbeelding
 */
export async function enhanceImage(imageUrl: string): Promise<{
  success: boolean;
  enhancedUrl?: string;
  error?: string;
}> {
  try {
    // Gebruik image-to-image model voor enhancement
    const response = await fetch(`${AIML_BASE_URL}/v1/images/edits`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${AIML_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        image: imageUrl,
        prompt: 'enhance quality, increase resolution, improve details, professional quality',
        model: 'stable-diffusion-3.5',
      }),
    });

    if (!response.ok) {
      throw new Error('Image enhancement failed');
    }

    const data = await response.json();
    return {
      success: true,
      enhancedUrl: data.data?.[0]?.url,
    };
  } catch (error: any) {
    console.error('Image enhancement error:', error);
    return {
      success: false,
      error: error.message,
    };
  }
}

// ═══════════════════════════════════════════════════════
// 🎬 VIDEO GENERATION
// ═══════════════════════════════════════════════════════

export interface VideoGenerationOptions {
  prompt: string;
  duration?: number; // seconds
  resolution?: '720p' | '1080p' | '4K';
  style?: 'realistic' | 'animated' | 'cinematic';
  aspectRatio?: '16:9' | '9:16' | '1:1';
}

/**
 * Genereer video's met AIML API (MiniMax, Veo, etc)
 */
export async function generateVideo(options: VideoGenerationOptions): Promise<{
  success: boolean;
  videoId?: string;
  status?: string;
  error?: string;
}> {
  try {
    // Start video generation (async)
    const response = await fetch(`${AIML_BASE_URL}/v1/videos/generations`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${AIML_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'minimax/video-01', // Best all-round model
        prompt: options.prompt,
        duration: options.duration || 5,
        resolution: options.resolution || '1080p',
        aspect_ratio: options.aspectRatio || '16:9',
      }),
    });

    if (!response.ok) {
      throw new Error('Video generation start failed');
    }

    const data = await response.json();
    
    return {
      success: true,
      videoId: data.id,
      status: 'generating',
    };
  } catch (error: any) {
    console.error('Video generation error:', error);
    return {
      success: false,
      error: error.message,
    };
  }
}

/**
 * Check video generation status
 */
export async function checkVideoStatus(videoId: string): Promise<{
  success: boolean;
  status?: 'generating' | 'completed' | 'failed';
  videoUrl?: string;
  error?: string;
}> {
  try {
    const response = await fetch(`${AIML_BASE_URL}/v1/videos/${videoId}`, {
      headers: {
        'Authorization': `Bearer ${AIML_API_KEY}`,
      },
    });

    if (!response.ok) {
      throw new Error('Failed to check video status');
    }

    const data = await response.json();
    
    return {
      success: true,
      status: data.status,
      videoUrl: data.url,
    };
  } catch (error: any) {
    console.error('Video status check error:', error);
    return {
      success: false,
      error: error.message,
    };
  }
}

// ═══════════════════════════════════════════════════════
// 🎤 SPEECH-TO-TEXT
// ═══════════════════════════════════════════════════════

/**
 * Transcribeer audio naar text (Whisper, Assembly AI)
 */
export async function speechToText(audioUrl: string, language?: string): Promise<{
  success: boolean;
  text?: string;
  error?: string;
}> {
  try {
    const response = await fetch(`${AIML_BASE_URL}/v1/stt/create`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${AIML_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: '#g1_whisper-large', // Best model voor Nederlands
        audio_url: audioUrl,
        language: language || 'nl',
      }),
    });

    if (!response.ok) {
      throw new Error('Speech to text failed');
    }

    const data = await response.json();
    
    // Poll for result
    const taskId = data.task_id;
    let completed = false;
    let text = '';
    
    for (let i = 0; i < 30; i++) {
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      const statusResponse = await fetch(`${AIML_BASE_URL}/v1/stt/status/${taskId}`, {
        headers: {
          'Authorization': `Bearer ${AIML_API_KEY}`,
        },
      });
      
      const statusData = await statusResponse.json();
      
      if (statusData.status === 'completed') {
        text = statusData.text;
        completed = true;
        break;
      } else if (statusData.status === 'failed') {
        throw new Error('Transcription failed');
      }
    }
    
    if (!completed) {
      throw new Error('Transcription timeout');
    }

    return {
      success: true,
      text,
    };
  } catch (error: any) {
    console.error('Speech to text error:', error);
    return {
      success: false,
      error: error.message,
    };
  }
}

// ═══════════════════════════════════════════════════════
// 🔊 TEXT-TO-SPEECH
// ═══════════════════════════════════════════════════════

export interface TextToSpeechOptions {
  text: string;
  voice?: 'alloy' | 'echo' | 'fable' | 'onyx' | 'nova' | 'shimmer';
  model?: 'tts-1' | 'tts-1-hd' | 'elevenlabs';
  speed?: number; // 0.25 - 4.0
}

/**
 * Converteer text naar speech (OpenAI TTS, ElevenLabs)
 */
export async function textToSpeech(options: TextToSpeechOptions): Promise<{
  success: boolean;
  audioUrl?: string;
  error?: string;
}> {
  try {
    const response = await fetch(`${AIML_BASE_URL}/v1/audio/speech`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${AIML_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: options.model || 'tts-1-hd',
        input: options.text,
        voice: options.voice || 'nova',
        speed: options.speed || 1.0,
      }),
    });

    if (!response.ok) {
      throw new Error('Text to speech failed');
    }

    // Response is audio data
    const audioBlob = await response.blob();
    const audioUrl = URL.createObjectURL(audioBlob);

    return {
      success: true,
      audioUrl,
    };
  } catch (error: any) {
    console.error('Text to speech error:', error);
    return {
      success: false,
      error: error.message,
    };
  }
}

// ═══════════════════════════════════════════════════════
// 👁️ VISION & OCR
// ═══════════════════════════════════════════════════════

/**
 * Analyseer afbeelding met vision model
 */
export async function analyzeImage(imageUrl: string, question?: string): Promise<{
  success: boolean;
  analysis?: string;
  error?: string;
}> {
  try {
    const response = await fetch(`${AIML_BASE_URL}/v1/chat/completions`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${AIML_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'gpt-4o', // Has vision capabilities
        messages: [
          {
            role: 'user',
            content: [
              {
                type: 'text',
                text: question || 'Beschrijf deze afbeelding in detail.',
              },
              {
                type: 'image_url',
                image_url: {
                  url: imageUrl,
                },
              },
            ],
          },
        ],
        max_tokens: 1000,
      }),
    });

    if (!response.ok) {
      throw new Error('Image analysis failed');
    }

    const data = await response.json();
    
    return {
      success: true,
      analysis: data.choices?.[0]?.message?.content,
    };
  } catch (error: any) {
    console.error('Image analysis error:', error);
    return {
      success: false,
      error: error.message,
    };
  }
}

/**
 * OCR - Extract text from image
 */
export async function extractTextFromImage(imageUrl: string): Promise<{
  success: boolean;
  text?: string;
  error?: string;
}> {
  try {
    const response = await fetch(`${AIML_BASE_URL}/v1/vision/ocr`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${AIML_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        image_url: imageUrl,
      }),
    });

    if (!response.ok) {
      throw new Error('OCR failed');
    }

    const data = await response.json();
    
    return {
      success: true,
      text: data.text,
    };
  } catch (error: any) {
    console.error('OCR error:', error);
    return {
      success: false,
      error: error.message,
    };
  }
}

// ═══════════════════════════════════════════════════════
// 💬 CHAT COMPLETIONS (STREAMING SUPPORT)
// ═══════════════════════════════════════════════════════

export interface ChatMessage {
  role: 'system' | 'user' | 'assistant';
  content: string;
}

export interface ChatCompletionOptions {
  messages: ChatMessage[];
  model?: string;
  temperature?: number;
  max_tokens?: number;
  stream?: boolean;
  tools?: any[];
}

/**
 * Chat completion met AIML (met streaming support)
 */
export async function chatCompletion(
  options: ChatCompletionOptions,
  onChunk?: (text: string) => void
): Promise<{
  success: boolean;
  message?: string;
  error?: string;
}> {
  try {
    const response = await fetch(`${AIML_BASE_URL}/v1/chat/completions`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${AIML_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: options.model || 'gpt-4o',
        messages: options.messages,
        temperature: options.temperature || 0.7,
        max_tokens: options.max_tokens || 2000,
        stream: options.stream || false,
        tools: options.tools,
      }),
    });

    if (!response.ok) {
      const error = await response.text();
      throw new Error(`Chat completion failed: ${error}`);
    }

    // Handle streaming
    if (options.stream) {
      const reader = response.body?.getReader();
      const decoder = new TextDecoder();
      let fullMessage = '';

      if (reader) {
        while (true) {
          const { done, value } = await reader.read();
          if (done) break;

          const chunk = decoder.decode(value);
          const lines = chunk.split('\n').filter(line => line.trim().startsWith('data:'));

          for (const line of lines) {
            const data = line.replace('data: ', '').trim();
            if (data === '[DONE]') break;

            try {
              const parsed = JSON.parse(data);
              const content = parsed.choices?.[0]?.delta?.content;
              if (content) {
                fullMessage += content;
                onChunk?.(content);
              }
            } catch (e) {
              // Skip invalid JSON
            }
          }
        }
      }

      return {
        success: true,
        message: fullMessage,
      };
    } else {
      // Non-streaming
      const data = await response.json();
      return {
        success: true,
        message: data.choices?.[0]?.message?.content,
      };
    }
  } catch (error: any) {
    console.error('Chat completion error:', error);
    return {
      success: false,
      error: error.message,
    };
  }
}

// ═══════════════════════════════════════════════════════
// 🎯 SMART MODEL ROUTER
// ═══════════════════════════════════════════════════════

const MODEL_PREFERENCES = {
  // Beste modellen per taak
  reasoning: ['gpt-4o', 'claude-sonnet-4-5', 'gemini-2.0-flash-exp'],
  creative: ['claude-sonnet-4-5', 'gpt-4o', 'meta-llama/llama-3.3-70b-instruct'],
  fast: ['gemini-2.0-flash-exp', 'gpt-4o-mini', 'meta-llama/llama-3.3-70b-instruct'],
  coding: ['gpt-4o', 'claude-sonnet-4-5', 'deepseek-chat'],
  vision: ['gpt-4o', 'claude-sonnet-4-5', 'gemini-2.0-flash-exp'],
  planning: ['gpt-4o', 'claude-sonnet-4-5', 'gemini-2.0-flash-exp'],
};

/**
 * Slimme model router - kiest automatisch het beste model
 */
export async function smartModelRouter(
  taskType: keyof typeof MODEL_PREFERENCES,
  messages: ChatMessage[],
  options?: Partial<ChatCompletionOptions>
): Promise<string> {
  const models = MODEL_PREFERENCES[taskType] || MODEL_PREFERENCES.reasoning;
  
  // Probeer modellen tot één werkt
  for (const model of models) {
    try {
      const result = await chatCompletion({
        ...options,
        messages,
        model,
      });

      if (result.success && result.message) {
        return result.message;
      }
    } catch (error) {
      console.warn(`Model ${model} failed, trying next...`);
      continue;
    }
  }

  throw new Error('All models failed');
}

export default {
  // Image
  generateImage,
  enhanceImage,
  analyzeImage,
  extractTextFromImage,
  
  // Video
  generateVideo,
  checkVideoStatus,
  
  // Speech
  speechToText,
  textToSpeech,
  
  // Chat
  chatCompletion,
  smartModelRouter,
};
