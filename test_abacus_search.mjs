import OpenAI from 'openai';

const apiKey = '3d67409cbceb4b70ac2076946d3fedcc';
const baseURL = 'https://api.abacus.ai/v1';

const openai = new OpenAI({ apiKey, baseURL });

async function testWebSearch() {
  console.log('🧪 Testing web search via Abacus AI API...\n');
  
  try {
    const response = await openai.chat.completions.create({
      model: 'gpt-4o',
      messages: [
        { 
          role: 'system', 
          content: 'Je bent een research assistent. Zoek actuele informatie op het web en geef de resultaten terug in JSON formaat.' 
        },
        { 
          role: 'user', 
          content: `Zoek op het web naar actuele informatie over: "WordPress SEO tips"\n\nGeef terug in dit exacte JSON formaat:\n{\n  "results": [\n    {"title": "Artikel titel", "url": "https://...", "snippet": "Korte samenvatting van 2-3 zinnen"},\n    ...\n  ]\n}\n\nGeef minimaal 3-5 relevante resultaten van verschillende betrouwbare bronnen.`
        }
      ],
      response_format: { type: 'json_object' },
      temperature: 0.3
    });
    
    const content = response.choices[0]?.message?.content;
    console.log('Response:', content?.substring(0, 500));
    
    if (content) {
      const data = JSON.parse(content);
      console.log('\n✅ Web search werkt!');
      console.log(`Gevonden ${data.results?.length || 0} resultaten`);
    }
  } catch (error) {
    console.error('❌ Error:', error.message);
  }
}

testWebSearch();
