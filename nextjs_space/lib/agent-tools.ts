import { prisma } from './db';

// 🛠️ WritgoAI DeepAgent Tools System
// Geïnspireerd door Abacus.AI DeepAgent

export interface Tool {
  name: string;
  description: string;
  parameters: {
    type: string;
    properties: Record<string, {
      type: string;
      description: string;
      enum?: string[];
    }>;
    required: string[];
  };
}

export const AVAILABLE_TOOLS: Tool[] = [
  {
    name: 'bash',
    description: 'Voer bash commando\'s uit op de server. Gebruik voor file operations, data verwerking, scripts, etc. Gebruik ALTIJD absolute paths.',
    parameters: {
      type: 'object',
      properties: {
        command: {
          type: 'string',
          description: 'Het bash commando om uit te voeren (bijv. "ls -la /home", "cat file.txt")',
        },
      },
      required: ['command'],
    },
  },
  {
    name: 'read_file',
    description: 'Lees de inhoud van een bestand. Gebruik voor text bestanden, code, configuratie, etc.',
    parameters: {
      type: 'object',
      properties: {
        path: {
          type: 'string',
          description: 'Absolute pad naar het bestand',
        },
      },
      required: ['path'],
    },
  },
  {
    name: 'write_file',
    description: 'Schrijf of overschrijf een bestand met nieuwe inhoud.',
    parameters: {
      type: 'object',
      properties: {
        path: {
          type: 'string',
          description: 'Absolute pad naar het bestand',
        },
        content: {
          type: 'string',
          description: 'De volledige inhoud om te schrijven',
        },
      },
      required: ['path', 'content'],
    },
  },
  {
    name: 'web_search',
    description: 'Zoek real-time informatie op het internet. Gebruik voor actuele data, nieuws, research, etc.',
    parameters: {
      type: 'object',
      properties: {
        query: {
          type: 'string',
          description: 'De zoekquery',
        },
      },
      required: ['query'],
    },
  },
  {
    name: 'scan_website',
    description: 'Scan en analyseer een website voor content, SEO, keywords, niche, doelgroep, etc. Als geen URL gegeven is, wordt de geconfigureerde WordPress URL gebruikt.',
    parameters: {
      type: 'object',
      properties: {
        url: {
          type: 'string',
          description: 'De volledige URL van de website (met https://). Optioneel - als niet gegeven wordt de geconfigureerde site gebruikt.',
        },
      },
      required: [],
    },
  },
  {
    name: 'generate_blog',
    description: 'Genereer een professionele blog artikel op basis van topic en website analyse. De AI scant eerst je website en schrijft dan een artikel in jouw stijl.',
    parameters: {
      type: 'object',
      properties: {
        topic: {
          type: 'string',
          description: 'Het onderwerp van de blog',
        },
        wordCount: {
          type: 'string',
          description: 'Gewenst aantal woorden (bijv. "800", "1500")',
        },
      },
      required: ['topic'],
    },
  },
  {
    name: 'ask_user',
    description: 'Stel een vraag aan de gebruiker voor verduidelijking of extra informatie. Gebruik alleen als essentiële info ontbreekt.',
    parameters: {
      type: 'object',
      properties: {
        question: {
          type: 'string',
          description: 'De vraag om aan de gebruiker te stellen',
        },
      },
      required: ['question'],
    },
  },
];

// Tool execution logic
export async function executeTool(
  toolName: string,
  params: Record<string, any>,
  clientId?: string
): Promise<{ success: boolean; result: string; error?: string }> {
  try {
    switch (toolName) {
      case 'bash':
        return await executeBash(params.command);
      
      case 'read_file':
        return await readFile(params.path);
      
      case 'write_file':
        return await writeFile(params.path, params.content);
      
      case 'web_search':
        return await webSearch(params.query);
      
      case 'scan_website':
        return await scanWebsite(params.url, clientId);
      
      case 'generate_blog':
        return await generateBlog(params.topic, params.wordCount || '800', clientId);
      
      case 'ask_user':
        // Special case - wordt afgehandeld in de agent zelf
        return {
          success: true,
          result: `ASK_USER: ${params.question}`,
        };
      
      default:
        return {
          success: false,
          result: '',
          error: `Unknown tool: ${toolName}`,
        };
    }
  } catch (error: any) {
    return {
      success: false,
      result: '',
      error: error.message || 'Tool execution failed',
    };
  }
}

// Tool implementations
async function executeBash(command: string) {
  try {
    const { exec } = require('child_process');
    const { promisify } = require('util');
    const execAsync = promisify(exec);
    
    const { stdout, stderr } = await execAsync(command, {
      timeout: 30000, // 30 seconds timeout
      maxBuffer: 10 * 1024 * 1024, // 10MB buffer
    });
    
    return {
      success: true,
      result: stdout || stderr || 'Command executed successfully',
    };
  } catch (error: any) {
    return {
      success: false,
      result: '',
      error: error.message,
    };
  }
}

async function readFile(path: string) {
  try {
    const fs = require('fs').promises;
    const content = await fs.readFile(path, 'utf-8');
    
    return {
      success: true,
      result: content,
    };
  } catch (error: any) {
    return {
      success: false,
      result: '',
      error: error.message,
    };
  }
}

async function writeFile(path: string, content: string) {
  try {
    const fs = require('fs').promises;
    const pathModule = require('path');
    
    // Ensure directory exists
    const dir = pathModule.dirname(path);
    await fs.mkdir(dir, { recursive: true });
    
    await fs.writeFile(path, content, 'utf-8');
    
    return {
      success: true,
      result: `File written successfully: ${path}`,
    };
  } catch (error: any) {
    return {
      success: false,
      result: '',
      error: error.message,
    };
  }
}

async function webSearch(query: string) {
  try {
    // Gebruik AIML chat completion met web grounding
    const response = await fetch('https://api.aimlapi.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${process.env.AIML_API_KEY}`,
      },
      body: JSON.stringify({
        model: 'gpt-4o',
        messages: [
          {
            role: 'user',
            content: `Zoek actuele informatie over: ${query}\n\nGeef een samenvatting met relevante feiten en bronnen.`
          }
        ],
        max_tokens: 2000,
        web_search_mode: 'auto',
      }),
    });
    
    if (!response.ok) {
      const error = await response.text();
      console.error('Web search error:', error);
      throw new Error(`Web search failed: ${response.status}`);
    }
    
    const data = await response.json();
    const content = data.choices?.[0]?.message?.content || 'Geen resultaten gevonden';
    
    return {
      success: true,
      result: content,
    };
  } catch (error: any) {
    console.error('Web search error:', error);
    return {
      success: false,
      result: '',
      error: error.message,
    };
  }
}

async function scanWebsite(url: string | undefined, clientId: string | undefined) {
  try {
    if (!clientId) {
      throw new Error('Client ID is vereist voor website scan');
    }

    // Als geen URL gegeven, haal WordPress config op
    let targetUrl = url;
    if (!targetUrl) {
      const prisma = require('@/lib/db').default;
      const client = await prisma.client.findUnique({
        where: { id: clientId },
        select: { wpApiUrl: true },
      });
      
      if (!client?.wpApiUrl) {
        throw new Error('Geen website URL gevonden. Configureer je WordPress site eerst in de instellingen, of geef een URL op.');
      }
      
      targetUrl = client.wpApiUrl;
    }

    const response = await fetch(`${process.env.NEXTAUTH_URL}/api/ai-planner/scan-website`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ url: targetUrl, clientId }),
    });
    
    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.details || 'Website scan failed');
    }
    
    const data = await response.json();
    
    // Maak het resultaat leesbaar
    const summary = `
✅ Website gescand: ${targetUrl}

📊 Analyse resultaat:
- Niche: ${data.niche || 'Niet gevonden'}
- Keywords: ${data.keywords?.slice(0, 5).join(', ') || 'Geen keywords'}
- Tone of voice: ${data.toneOfVoice || 'Niet gedetecteerd'}
- Content type: ${data.contentType || 'Onbekend'}

💡 De website is succesvol geanalyseerd en kan nu gebruikt worden voor content generatie.
    `.trim();
    
    return {
      success: true,
      result: summary,
    };
  } catch (error: any) {
    return {
      success: false,
      result: '',
      error: error.message,
    };
  }
}

async function generateBlog(topic: string, wordCount: string, clientId: string | undefined) {
  try {
    if (!clientId) {
      throw new Error('Client ID is vereist voor blog generatie');
    }

    // Roep de blog generation API aan
    const response = await fetch(`${process.env.NEXTAUTH_URL}/api/ai-agent/generate-blog`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ 
        topic, 
        wordCount: parseInt(wordCount) || 800,
        clientId 
      }),
    });
    
    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || 'Blog generatie mislukt');
    }
    
    const data = await response.json();
    
    return {
      success: true,
      result: `✅ Blog succesvol gegenereerd!\n\n📝 Titel: ${data.title || topic}\n📊 Woorden: ${wordCount}\n\n${data.content?.substring(0, 500)}...`,
    };
  } catch (error: any) {
    return {
      success: false,
      result: '',
      error: error.message,
    };
  }
}
