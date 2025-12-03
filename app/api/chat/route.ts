
/**
 * 🤖 WritgoAI DeepAgent - Native AIML Tool Calling API
 * 
 * Echte autonomous AI agent met computer access - precies zoals Abacus DeepAgent
 * - Native AIML tool calling (AI beslist zelf welke tools te gebruiken)
 * - Computer access (Bash Terminal, file operations, web search)
 * - Autonomous (geen vaste layouts, AI doet alles zelf)
 * - Simpel (geen complexe orchestration layers)
 */

import { NextRequest, NextResponse } from 'next/server';
import { DEEPAGENT_TOOLS, executeToolCall } from '@/lib/deepagent-tools';
import { hasEnoughCredits, deductCredits, calculateCreditCost } from '@/lib/credits';
import { memoryManager } from '@/lib/user-memory';

interface Message {
  role: 'system' | 'user' | 'assistant' | 'tool';
  content: string | null;
  tool_call_id?: string;
  tool_calls?: Array<{
    id: string;
    type: 'function';
    function: {
      name: string;
      arguments: string;
    };
  }>;
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { 
      message, 
      clientId, 
      conversationHistory = [], 
      stream = false,
      userLocation = null,
      userName = null 
    } = body;

    if (!message) {
      return NextResponse.json(
        { error: 'Message is vereist' },
        { status: 400 }
      );
    }

    console.log('🤖 DeepAgent request:', { 
      message: message.substring(0, 100), 
      clientId,
      hasLocation: !!userLocation,
      userName 
    });

    // 💳 Credit Check
    if (clientId) {
      const creditCost = calculateCreditCost('chat', 'gpt-4o');
      const hasCredits = await hasEnoughCredits(clientId, creditCost);
      
      if (!hasCredits) {
        return NextResponse.json(
          { 
            error: 'Insufficient credits',
            message: 'Je hebt niet genoeg credits. Koop nieuwe credits om door te gaan.',
            requiredCredits: creditCost
          },
          { status: 402 }
        );
      }
    }

    // Get user memory if available
    let memorySummary = '';
    if (clientId) {
      memorySummary = memoryManager.getMemorySummary(clientId);
    }
    
    // Build user context
    let userContext = '';
    if (userName) {
      userContext += `\n👤 Gebruikersnaam: ${userName}`;
    }
    if (userLocation) {
      userContext += `\n📍 Huidige locatie: ${userLocation.city || 'Onbekend'}, ${userLocation.country || ''}`;
      userContext += `\n   Coördinaten: ${userLocation.latitude}, ${userLocation.longitude}`;
    }
    if (memorySummary) {
      userContext += `\n🧠 Gebruikers context: ${memorySummary}`;
    }
    
    // System prompt voor DeepAgent
    const systemMessage: Message = {
      role: 'system',
      content: `Je bent WritgoAI DeepAgent - een krachtige autonomous AI agent met computer access.

🎯 JE MISSIE:
Help de gebruiker met ALLES wat ze nodig hebben - geen beperkingen, geen vaste layouts.
Je kunt bestanden lezen/schrijven, bash commands uitvoeren, websites scannen, content genereren, en meer.
${userContext ? `\n${userContext}\n` : ''}

🛠️ BESCHIKBARE TOOLS:
- bash_command: Voer bash commands uit (ls, cat, grep, python scripts, etc.)
- read_file: Lees bestanden
- write_file: Schrijf/update bestanden
- web_search: Zoek actuele informatie op internet (GEBRUIK DIT ALTIJD voor actuele info!)
- scan_website: Analyseer websites voor content/SEO
- generate_blog: Genereer professionele blog artikelen

💡 HOE TE WERK GAAN:
1. Begrijp wat de gebruiker wil
2. Gebruik tools AUTONOOM - jij beslist wat nodig is
3. Combineer tools indien nodig (bijv. web_search + analyse)
4. Geef duidelijke, bruikbare resultaten
5. Als gebruiker vraagt naar zijn locatie of waar hij woont, gebruik de locatie informatie hierboven

🎨 VOORBEELDEN:
- "scan mijn website" → gebruik scan_website (zonder URL = configured site)
- "schrijf een blog over X" → scan eerst website, dan generate_blog
- "zoek informatie over Y" → web_search
- "maak een bestand Z" → write_file
- "wat staat in file.txt" → read_file
- "restaurants bij mij in de buurt" → gebruik userLocation en zoek restaurants

📋 ANTWOORD FORMATTING REGELS (VERPLICHT!):

1. **ALTIJD STRUCTUUR MET VEEL WITRUIMTE:**
   - Gebruik headers (##, ###) voor secties
   - MINIMAAL 1-2 lege regels tussen verschillende secties
   - ALTIJD lege regels tussen alinea's
   - Bullets en genummerde lijsten voor overzicht
   - **Vetgedrukte** tekst voor belangrijke punten
   - Gebruik --- voor visuele scheidingslijnen tussen grote secties
   - GEEN lange lappen tekst - splits op in korte, leesbare alinea's

2. **BRONVERMELDING & LINKS (ESSENTIEEL!):**
   - Voeg ALTIJD bronnen toe met werkende Markdown links: [Tekst](URL)
   - Voor locaties: [📍 Route naar Google Maps](https://www.google.com/maps/search/locatienaam+stad)
   - Voor websites: [🌐 Websitenaam](https://url.nl) - gebruik de echte naam, niet "Website"
   - Voor reserveringen/boekingen: [🎫 Reserveren](https://boekurl.nl)
   - Voor telefoonnummers: [📞 Bel nu](tel:+31123456789)
   - Voor email: [📧 Email](mailto:info@example.nl)
   - Nummer referenties: [1], [2] met bronnenlijst aan einde
   - **BELANGRIJK:** Gebruik NOOIT plain text URLs - altijd Markdown links!
   
3. **YOUTUBE VIDEOS (VOOR FILMS/TRAILERS):**
   - Als gebruiker vraagt naar een film/serie/trailer, zoek dan de YouTube video
   - Embed YouTube videos met: \`\`\`youtube\nVIDEO_ID\n\`\`\`
   - Bijvoorbeeld: \`\`\`youtube\ndQw4w9WgXcQ\n\`\`\` (video ID van youtube.com/watch?v=dQw4w9WgXcQ)
   - Dit zal automatisch een embedded player tonen in de chat
   - Voeg ook een link toe: [▶️ Bekijk trailer op YouTube](https://youtube.com/watch?v=VIDEO_ID)
   
4. **GOOGLE MAPS INTEGRATIE:**
   - Als gebruiker vraagt naar route/navigatie, maak Google Maps links
   - Formaat: https://www.google.com/maps/dir/CURRENT_LOC/DESTINATION
   - Als userLocation bekend is, gebruik die coördinaten
   - Gebruik altijd https://www.google.com/maps/search/ voor zoeken naar plaatsen
   - Voorbeeld: [📍 Navigeer naar restaurant](https://www.google.com/maps/search/Restaurant+De+Kas+Amsterdam)
   
5. **MODEL TRACKING (TRANSPARANTIE):**
   - Vermeld ALTIJD aan het EINDE van je antwoord welk model je gebruikt hebt
   - Formaat: \`\`\`models\ngpt-4o: Hoofdmodel voor analyse en antwoorden\ngemini-2.5-flash: Voor snelle web searches\n\`\`\`
   - Dit zorgt voor transparantie over welke AI modellen zijn gebruikt

6. **KWALITEITSEISEN:**
   - **ABSOLUUT GEEN compacte lappen tekst** - splits ALLES op in kleine, leesbare chunks
   - **VEEL witruimte** - minimaal 1 lege regel tussen alinea's, 2 lege regels tussen secties
   - ALTIJD concrete informatie (geen vage antwoorden)
   - Voeg praktische tips toe waar mogelijk
   - Gebruik emoji's spaarzaam maar effectief voor iconen (📍, 📞, 🌐, ⏰, 💰, ⭐)
   - Voeg routebeschrijvingen/praktische info toe indien relevant
   - Maak antwoorden scanbaar - gebruik bullets, headers en visuele scheiding

7. **FORMATTING VOORBEELDEN:**

   **GOED ✅:**
   
   ## Populaire restaurants in Amsterdam
   
   Hier zijn enkele van de beste restaurants die Amsterdam te bieden heeft.
   
   
   ### 1. Restaurant De Kas
   
   Een uniek restaurant in een botanische kas met dagverse ingrediënten uit eigen moestuin.
   
   
   **📍 Locatie**
   
   Kamerlingh Onneslaan 3, Amsterdam
   
   [📍 Route starten via Google Maps](https://www.google.com/maps/search/Restaurant+De+Kas+Amsterdam)
   
   
   **📞 Contact**
   
   [📞 Bel nu: 020-462 4562](tel:+31204624562)
   
   [🌐 Restaurant De Kas](https://restaurantdekas.nl)
   
   [🎫 Reserveren](https://restaurantdekas.nl/reserveren)
   
   
   **⏰ Openingstijden**
   
   Maandag t/m Zondag: 18:30 - 22:00 uur
   
   
   **💰 Prijsklasse**
   
   €€€€ (vanaf €75 per persoon)
   
   
   **⭐ Waarom bijzonder?**
   
   - 🌱 Farm-to-table concept met eigen moestuin
   
   - 📅 Wisselend menu op basis van seizoensoogst
   
   - 🏛️ Geserveerd op historische locatie in voormalige botanische kas
   
   
   ---
   
   **SLECHT ❌:**
   Restaurant De Kas is een restaurant in Amsterdam op Kamerlingh Onneslaan 3. Het is open van maandag tot zondag van 18:30 tot 22:00 uur. Je kunt er terecht voor fijn eten. Het heeft een bijzonder concept met verse ingrediënten.

8. **VOOR EVENEMENTEN/ACTIVITEITEN:**
   - Datum en tijd vermelden
   - Locatie met Google Maps link
   - Ticketprijs en bestellink indien beschikbaar
   - Praktische informatie (OV, parkeren)

9. **VOOR PRODUCTEN/DIENSTEN:**
   - Specificaties in bullets
   - Prijsvergelijkingen in tabel indien mogelijk
   - Kooplinks naar shops
   - Voor-/nadelen lijstje

🔥 BELANGRIJK:
- Wees PROACTIEF - als je meer info nodig hebt, vraag het!
- Gebruik tools AUTONOOM - geen toestemming nodig
- Geef COMPLETE antwoorden met alle details
- Wees vriendelijk en professioneel
- Antwoord ALTIJD in het Nederlands
- **VOLG ALTIJD DE FORMATTING REGELS - dit is ESSENTIEEL voor gebruikservaring!**

${clientId ? `\n🆔 Client ID: ${clientId} (gebruik voor website/blog tools)` : ''}

LET'S GO! 🚀`,
    };

    // Build messages array
    const messages: Message[] = [
      systemMessage,
      ...conversationHistory,
      {
        role: 'user',
        content: message,
      },
    ];

    // Track tool calls and iterations
    const maxIterations = 10; // Prevent infinite loops
    let iteration = 0;
    let continueLoop = true;
    const toolExecutionLog: Array<{tool: string; args: any; result: string}> = [];

    while (continueLoop && iteration < maxIterations) {
      iteration++;
      console.log(`🔄 Iteration ${iteration}/${maxIterations}`);

      // Clean messages for AIML API (remove content field from assistant messages with tool_calls)
      const cleanedMessages = messages.map(msg => {
        // For assistant messages with tool_calls, OMIT the content field entirely
        if (msg.role === 'assistant' && msg.tool_calls && msg.tool_calls.length > 0) {
          return {
            role: msg.role,
            tool_calls: msg.tool_calls,
          };
        }
        // For all other messages, include normally
        return msg;
      });

      // Call AIML API with native tool calling
      const response = await fetch('https://api.aimlapi.com/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${process.env.AIML_API_KEY}`,
        },
        body: JSON.stringify({
          model: 'gpt-4o',
          messages: cleanedMessages,
          tools: DEEPAGENT_TOOLS,
          tool_choice: 'auto', // Let AI decide when to use tools
          temperature: 0.7,
          max_tokens: 4000,
        }),
      });

      if (!response.ok) {
        const errorText = await response.text();
        console.error('❌ AIML API error:', errorText);
        throw new Error(`AIML API failed: ${response.status} - ${errorText}`);
      }

      const data = await response.json();
      const choice = data.choices[0];
      const assistantMessage = choice.message;

      console.log('🤖 AI response:', {
        hasContent: !!assistantMessage.content,
        hasToolCalls: !!assistantMessage.tool_calls,
        finishReason: choice.finish_reason,
      });

      // Add assistant message to history (with proper cleaning)
      // CRITICAL FIX: AIML API does NOT accept content field for assistant messages with tool_calls
      const cleanedAssistantMessage: Message = {
        role: 'assistant',
        content: assistantMessage.tool_calls && assistantMessage.tool_calls.length > 0 
          ? null  // OMIT content when tool_calls present
          : assistantMessage.content,
      };
      
      // Only add tool_calls if they exist
      if (assistantMessage.tool_calls && assistantMessage.tool_calls.length > 0) {
        cleanedAssistantMessage.tool_calls = assistantMessage.tool_calls;
      }
      
      messages.push(cleanedAssistantMessage);

      // Check if AI wants to use tools
      if (assistantMessage.tool_calls && assistantMessage.tool_calls.length > 0) {
        console.log(`🔧 AI wants to use ${assistantMessage.tool_calls.length} tools`);

        // Execute all tool calls
        for (const toolCall of assistantMessage.tool_calls) {
          const { id, function: func } = toolCall;
          const toolName = func.name;
          const args = JSON.parse(func.arguments);

          console.log(`🔧 Executing: ${toolName}`, args);

          try {
            const result = await executeToolCall(toolName, args, clientId);
            
            toolExecutionLog.push({ tool: toolName, args, result: result.substring(0, 500) });

            // Add tool result to messages
            messages.push({
              role: 'tool',
              tool_call_id: id,
              content: result,
            });

            console.log(`✅ Tool ${toolName} succeeded`);
          } catch (error: any) {
            console.error(`❌ Tool ${toolName} failed:`, error);
            
            // Add error to messages so AI knows it failed
            messages.push({
              role: 'tool',
              tool_call_id: id,
              content: `Error: ${error.message}`,
            });
          }
        }

        // Continue loop to let AI process tool results
        continue;
      }

      // If no tool calls, we're done
      if (assistantMessage.content) {
        console.log('✅ AI provided final answer');
        
        // 💳 Deduct credits
        if (clientId) {
          const creditCost = calculateCreditCost('chat', 'gpt-4o');
          await deductCredits(
            clientId,
            creditCost,
            `DeepAgent Chat - ${iteration} iterations - Tools: ${toolExecutionLog.map(t => t.tool).join(', ')}`,
            {
              model: 'gpt-4o',
              tokensUsed: Math.round((message.length + assistantMessage.content.length) / 4),
            }
          );
          console.log(`💳 Deducted ${creditCost} credits`);
        }

        // Return final response
        return NextResponse.json({
          success: true,
          message: assistantMessage.content,
          toolsUsed: toolExecutionLog.map(t => ({ tool: t.tool, args: t.args })),
          iterations: iteration,
          timestamp: new Date().toISOString(),
        });
      }

      // Safety: if we get here without content or tool calls, break
      console.warn('⚠️ No content or tool calls, breaking loop');
      continueLoop = false;
    }

    // If we hit max iterations
    if (iteration >= maxIterations) {
      console.error('❌ Max iterations reached');
      return NextResponse.json(
        { error: 'Max iterations reached. The AI got stuck in a loop.' },
        { status: 500 }
      );
    }

    // Fallback error
    return NextResponse.json(
      { error: 'AI did not provide a response' },
      { status: 500 }
    );

  } catch (error: any) {
    console.error('❌ Chat API error:', error);
    return NextResponse.json(
      {
        error: 'Er ging iets mis met de DeepAgent',
        details: error.message,
      },
      { status: 500 }
    );
  }
}

// Health check
export async function GET(request: NextRequest) {
  return NextResponse.json({
    status: 'ok',
    service: 'WritgoAI DeepAgent - Native AIML Tool Calling',
    features: [
      'Native AIML tool calling',
      'Computer access (bash, files, web)',
      'Autonomous decision making',
      'No fixed layouts - AI does everything',
    ],
    availableTools: DEEPAGENT_TOOLS.map(t => t.function.name),
    timestamp: new Date().toISOString(),
  });
}
