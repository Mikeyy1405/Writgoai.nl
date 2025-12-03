
/**
 * YouTube Search Helper
 * Zoekt relevante YouTube video's voor een onderwerp
 */

interface YouTubeVideo {
  videoId: string;
  title: string;
  description: string;
  thumbnail: string;
  channelTitle: string;
  publishedAt: string;
  embedUrl: string;
}

/**
 * Zoek YouTube video's via web research
 */
export async function searchYouTubeVideos(
  query: string,
  maxResults: number = 3
): Promise<YouTubeVideo[]> {
  try {
    console.log(`🔍 Zoeken naar YouTube video's voor: ${query}`);
    
    // Gebruik AIML API om de beste YouTube video's te vinden
    const { chatCompletion } = await import('./aiml-api');
    
    const searchPrompt = `
Je bent een YouTube onderzoeksassistent. Zoek de meest relevante YouTube video's voor: "${query}"

TAAK:
1. Identificeer de 3 beste, meest relevante YouTube video's
2. Focus op:
   - Hoge kwaliteit
   - Relevantie voor het onderwerp
   - Populaire/betrouwbare kanalen
   - Nederlands OF Engels (beide OK)

Geef het resultaat in dit EXACT formaat (JSON):
{
  "videos": [
    {
      "title": "Video titel",
      "videoId": "YouTube video ID (11 karakters na watch?v=)",
      "channelTitle": "Kanaal naam",
      "description": "Korte beschrijving waarom deze video relevant is"
    }
  ]
}

BELANGRIJK:
- Geef ECHTE, BESTAANDE YouTube video IDs
- Geen placeholders of voorbeelden
- Als je geen goede video's kunt vinden, retourneer een lege array
`;

    const response = await chatCompletion({
      messages: [{ role: 'user', content: searchPrompt }],
      model: 'gpt-4o',
      temperature: 0.3,
      max_tokens: 1000
    });

    const content = response.choices[0]?.message?.content || '';
    
    // Parse JSON response
    const jsonMatch = content.match(/\{[\s\S]*\}/);
    if (!jsonMatch) {
      console.log('⚠️ Geen JSON gevonden in YouTube search response');
      return [];
    }

    const data = JSON.parse(jsonMatch[0]);
    const videos: YouTubeVideo[] = [];

    if (data.videos && Array.isArray(data.videos)) {
      for (const video of data.videos.slice(0, maxResults)) {
        if (video.videoId && video.title) {
          videos.push({
            videoId: video.videoId,
            title: video.title,
            description: video.description || '',
            thumbnail: `https://lh3.googleusercontent.com/UP8Kmf1suMkW4ibPP-bU7tD8yCM70wymtA_t3IHLKN-rR-UGbOcDhRA966WwieJX6YpIKfQnoX6XSoIIL9Fr0CKfCHs=s1280-w1280-h800`,
            channelTitle: video.channelTitle || 'YouTube',
            publishedAt: new Date().toISOString(),
            embedUrl: `https://www.youtube.com/embed/${video.videoId}`
          });
        }
      }
    }

    console.log(`✅ ${videos.length} YouTube video's gevonden`);
    return videos;

  } catch (error) {
    console.error('❌ YouTube search error:', error);
    return [];
  }
}

/**
 * Genereer YouTube Embed HTML met daadwerkelijke video embed
 */
export function generateYouTubeEmbed(video: YouTubeVideo): string {
  return `
<div class="youtube-embed-container" style="margin: 30px 0; padding: 20px; background: #f8f9fa; border-radius: 8px; border-left: 4px solid #ff0000;">
  <h3 style="margin-top: 0; color: #ff0000; font-size: 1.1rem;">🎥 Bekijk deze video over ${video.title}</h3>
  <p style="margin: 10px 0; color: #666; font-size: 0.9rem;">Door: ${video.channelTitle}</p>
  <div style="position: relative; padding-bottom: 56.25%; height: 0; overflow: hidden; margin-top: 15px;">
    <iframe style="position: absolute; top: 0; left: 0; width: 100%; height: 100%;" 
            src="https://www.youtube.com/embed/${video.videoId}" 
            frameborder="0" 
            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share" 
            allowfullscreen>
    </iframe>
  </div>
</div>
`.trim();
}

/**
 * Zoek en voeg YouTube video toe aan content
 */
export async function addYouTubeToContent(
  content: string,
  topic: string
): Promise<string> {
  try {
    // Zoek relevante video's
    const videos = await searchYouTubeVideos(topic, 1);
    
    if (videos.length === 0) {
      console.log('⚠️ Geen YouTube video gevonden voor:', topic);
      return content;
    }

    const video = videos[0];
    const embedHtml = generateYouTubeEmbed(video);

    // Voeg video toe na de eerste of tweede H2 sectie (circa 30-40% van de content)
    const h2Positions: number[] = [];
    const h2Regex = /<h2[^>]*>.*?<\/h2>/gi;
    let match;
    
    while ((match = h2Regex.exec(content)) !== null) {
      h2Positions.push(match.index + match[0].length);
    }

    if (h2Positions.length >= 2) {
      // Voeg toe na de tweede H2
      const insertPosition = h2Positions[1];
      content = content.slice(0, insertPosition) + '\n\n' + embedHtml + '\n\n' + content.slice(insertPosition);
    } else if (h2Positions.length >= 1) {
      // Voeg toe na de eerste H2
      const insertPosition = h2Positions[0];
      content = content.slice(0, insertPosition) + '\n\n' + embedHtml + '\n\n' + content.slice(insertPosition);
    } else {
      // Geen H2 gevonden, voeg toe aan het einde van de eerste 30% van de content
      const insertPosition = Math.floor(content.length * 0.3);
      content = content.slice(0, insertPosition) + '\n\n' + embedHtml + '\n\n' + content.slice(insertPosition);
    }

    console.log(`✅ YouTube video toegevoegd: ${video.title}`);
    return content;

  } catch (error) {
    console.error('❌ Error adding YouTube video:', error);
    return content;
  }
}
