import OpenAI from 'openai';

const apiKey = '3d67409cbceb4b70ac2076946d3fedcc';
const baseURL = 'https://apps.abacus.ai/v1';

const openai = new OpenAI({ apiKey, baseURL });

async function testWebSearch() {
  console.log('🧪 Testing Abacus AI API met correcte endpoint...\n');
  
  try {
    // Test 1: Basic chat
    console.log('Test 1: Basic chat completion...');
    const response1 = await openai.chat.completions.create({
      model: 'gpt-4o',
      messages: [
        { role: 'user', content: 'Zeg hallo in het Nederlands' }
      ]
    });
    console.log('✅ Basic chat werkt:', response1.choices[0].message.content);
    
    // Test 2: Web search request
    console.log('\nTest 2: Web search...');
    const response2 = await openai.chat.completions.create({
      model: 'gpt-4o',
      messages: [
        { 
          role: 'system', 
          content: 'Je bent een research assistent. Zoek actuele informatie op het web en geef de resultaten terug in JSON formaat.' 
        },
        { 
          role: 'user', 
          content: `Zoek op het web naar actuele informatie over: "WordPress SEO tips 2025"\n\nGeef terug in dit exacte JSON formaat:\n{\n  "results": [\n    {"title": "Artikel titel", "url": "https://...", "snippet": "Korte samenvatting van 2-3 zinnen"},\n    ...\n  ]\n}\n\nGeef minimaal 3-5 relevante resultaten van verschillende betrouwbare bronnen.`
        }
      ],
      response_format: { type: 'json_object' },
      temperature: 0.3
    });
    
    const content = response2.choices[0]?.message?.content;
    if (content) {
      const data = JSON.parse(content);
      console.log('✅ Web search werkt!');
      console.log(`Gevonden ${data.results?.length || 0} resultaten`);
      if (data.results?.length > 0) {
        console.log('\nEerste resultaat:', data.results[0].title);
      }
    }
  } catch (error) {
    console.error('❌ Error:', error.message);
  }
}

testWebSearch();
