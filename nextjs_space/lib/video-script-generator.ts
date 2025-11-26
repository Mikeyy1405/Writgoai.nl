
/**
 * Video Script Generator
 * Generates engaging video scripts using AI
 */

interface ScriptSegment {
  timestamp: number; // in seconds
  text: string;
  duration: number;
}

export interface VideoScript {
  title: string;
  totalDuration: number;
  segments: ScriptSegment[];
  fullText: string;
}

/**
 * Generates a video script using AI
 */
export async function generateVideoScript(
  topic: string,
  duration: string,
  language: string,
  style: string
): Promise<VideoScript> {
  const apiKey = process.env.AIML_API_KEY;
  
  if (!apiKey) {
    throw new Error('AIML API key niet gevonden');
  }

  // Parse duration
  const [minDur, maxDur] = duration.split('-').map(Number);
  const targetDuration = (minDur + maxDur) / 2;

  const systemPrompt = `Je bent een professionele video scriptschrijver. Schrijf een boeiend script voor een korte video.

BELANGRIJKE REGELS:
1. Schrijf in ${language}
2. Maak het ${style.toLowerCase()} en engaging
3. Target duur: ${targetDuration} seconden
4. Gebruik korte, pakkende zinnen
5. Begin met een sterke hook
6. Einddig met een call-to-action
7. Splits het script in segmenten van ~5-10 seconden

Formaat:
[0-5s] Hook tekst hier
[5-10s] Tweede segment
[10-15s] Derde segment
etc.`;

  const userPrompt = `Schrijf een video script over: ${topic}

Maak het viraal en boeiend!`;

  try {
    const response = await fetch('https://api.aimlapi.com/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'gpt-4o',
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: userPrompt }
        ],
        max_tokens: 1000,
        temperature: 0.8,
      }),
    });

    if (!response.ok) {
      const error = await response.text();
      console.error('Script generation error:', error);
      throw new Error('Script generatie mislukt');
    }

    const data = await response.json();
    const scriptText = data.choices?.[0]?.message?.content || '';

    // Parse script into segments
    const segments: ScriptSegment[] = [];
    const lines = scriptText.split('\n').filter(line => line.trim());
    
    let currentTimestamp = 0;
    for (const line of lines) {
      const timeMatch = line.match(/\[(\d+)-(\d+)s\]/);
      if (timeMatch) {
        const startTime = parseInt(timeMatch[1]);
        const endTime = parseInt(timeMatch[2]);
        const text = line.replace(/\[\d+-\d+s\]\s*/, '').trim();
        
        if (text) {
          segments.push({
            timestamp: startTime,
            text,
            duration: endTime - startTime,
          });
          currentTimestamp = endTime;
        }
      }
    }

    return {
      title: topic,
      totalDuration: currentTimestamp || targetDuration,
      segments,
      fullText: scriptText,
    };

  } catch (error) {
    console.error('Video script generation error:', error);
    throw error;
  }
}

/**
 * Generates captions/subtitles from script
 */
export function generateCaptions(script: VideoScript): Array<{
  start: number;
  end: number;
  text: string;
}> {
  return script.segments.map(segment => ({
    start: segment.timestamp,
    end: segment.timestamp + segment.duration,
    text: segment.text,
  }));
}
