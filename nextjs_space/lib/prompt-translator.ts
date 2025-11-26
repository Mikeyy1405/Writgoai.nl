
/**
 * Prompt Translator
 * Vertaalt Nederlandse prompts naar Engels voor betere AI resultaten
 */

interface TranslationCache {
  [key: string]: string;
}

// In-memory cache voor vertalingen
const translationCache: TranslationCache = {};

/**
 * Vertaalt een prompt naar Engels als het niet al Engels is
 */
export async function translateToEnglish(text: string): Promise<string> {
  if (!text || text.trim().length === 0) {
    return text;
  }

  // Check cache first
  const cacheKey = text.toLowerCase().trim();
  if (translationCache[cacheKey]) {
    return translationCache[cacheKey];
  }

  // Detecteer of de tekst al voornamelijk Engels is
  const englishWords = [
    'the', 'and', 'or', 'in', 'on', 'at', 'to', 'for', 'of', 'with',
    'a', 'an', 'is', 'are', 'was', 'were', 'have', 'has', 'had',
    'image', 'photo', 'picture', 'landscape', 'portrait', 'style'
  ];
  
  const words = text.toLowerCase().split(/\s+/);
  const englishWordCount = words.filter(word => 
    englishWords.some(ew => word.includes(ew))
  ).length;
  
  // Als meer dan 30% van de woorden Engels zijn, veronderstel dat het al Engels is
  if (englishWordCount / words.length > 0.3) {
    translationCache[cacheKey] = text;
    return text;
  }

  // Gebruik de AIML API voor vertaling
  try {
    const response = await fetch('https://api.aimlapi.com/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${process.env.AIML_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'gpt-4o-mini',
        messages: [
          {
            role: 'system',
            content: 'You are a translator. Translate the following text to English. Only return the translation, nothing else. Keep it concise and suitable for image generation prompts or search queries.'
          },
          {
            role: 'user',
            content: text
          }
        ],
        max_tokens: 200,
        temperature: 0.3,
      }),
    });

    if (!response.ok) {
      console.error('Translation API error:', response.status);
      return text; // Fallback to original text
    }

    const data = await response.json();
    const translated = data.choices?.[0]?.message?.content?.trim() || text;
    
    // Cache the result
    translationCache[cacheKey] = translated;
    
    console.log('Translated:', text, '->', translated);
    return translated;
    
  } catch (error) {
    console.error('Translation error:', error);
    return text; // Fallback to original text
  }
}

/**
 * Batch translate meerdere prompts
 */
export async function batchTranslateToEnglish(texts: string[]): Promise<string[]> {
  const promises = texts.map(text => translateToEnglish(text));
  return Promise.all(promises);
}
