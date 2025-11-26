import OpenAI from 'openai';
import dotenv from 'dotenv';

dotenv.config();

console.log('Testing AIML API for content research...\n');

const apiKey = process.env.AIML_API_KEY;
if (!apiKey) {
  console.error('❌ AIML_API_KEY not found in .env file');
  process.exit(1);
}

console.log('✅ API Key found:', apiKey.substring(0, 10) + '...');

const openai = new OpenAI({ 
  apiKey,
  baseURL: 'https://api.aimlapi.com/v1'
});

async function testContentGeneration() {
  try {
    console.log('\n📤 Testing simple content idea generation...');
    
    const response = await openai.chat.completions.create({
      model: 'claude-sonnet-4-5',
      messages: [
        {
          role: 'user',
          content: `Genereer 3 content ideeën voor "yoga oefeningen" voor Nederlandse lezers.

Geef alleen een JSON array terug:
[
  {
    "title": "Titel van het artikel",
    "focusKeyword": "hoofdkeyword",
    "description": "Korte omschrijving",
    "contentType": "guide",
    "priority": "high"
  }
]`
        }
      ],
      temperature: 0.8,
      max_tokens: 2000,
    });

    console.log('\n📥 Response received!');
    const content = response.choices[0]?.message?.content || '';
    console.log('Raw content length:', content.length);
    console.log('Raw content:\n', content);
    
    // Try to parse JSON
    const cleanContent = content
      .replace(/```json\n?/g, '')
      .replace(/```\n?/g, '')
      .trim();
    
    const jsonMatch = cleanContent.match(/\[[\s\S]*\]/);
    if (jsonMatch) {
      const ideas = JSON.parse(jsonMatch[0]);
      console.log('\n✅ Successfully parsed', ideas.length, 'content ideas:');
      ideas.forEach((idea, i) => {
        console.log(`\n${i + 1}. ${idea.title}`);
        console.log(`   Keyword: ${idea.focusKeyword}`);
        console.log(`   Type: ${idea.contentType}`);
        console.log(`   Priority: ${idea.priority}`);
      });
    } else {
      console.error('❌ Could not find JSON array in response');
    }
    
  } catch (error) {
    console.error('❌ Error:', error.message);
    if (error.response) {
      console.error('Response status:', error.response.status);
      console.error('Response data:', error.response.data);
    }
  }
}

testContentGeneration();
