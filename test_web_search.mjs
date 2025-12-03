import OpenAI from 'openai';

const apiKey = 'eb1cd6eaee0d4c5ca30dffe07cdcb600';
const baseURL = 'https://api.aimlapi.com/v1';

const openai = new OpenAI({ apiKey, baseURL });

async function testWebSearch() {
  console.log('🧪 Testing web search via AI/ML API...\n');
  
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
    console.log('Response:', content);
    
    if (content) {
      const data = JSON.parse(content);
      console.log('\n✅ Web search werkt!');
      console.log(`Gevonden ${data.results?.length || 0} resultaten:`);
      data.results?.forEach((r, i) => {
        console.log(`\n${i+1}. ${r.title}`);
        console.log(`   URL: ${r.url}`);
        console.log(`   ${r.snippet}`);
      });
    }
  } catch (error) {
    console.error('❌ Error:', error.message);
  }
}

testWebSearch();
