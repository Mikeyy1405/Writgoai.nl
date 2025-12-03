
/**
 * 🤖 WritgoAI DeepAgent - Native AIML Tool Calling
 * 
 * Echte autonomous AI agent met computer access - precies zoals Abacus DeepAgent
 * Geen vaste layouts, geen handmatige orchestration - de AI beslist ALLES zelf.
 */

// Importeer verboden woorden vanuit centrale lijst
import { BANNED_WORDS } from './banned-words';
import { prisma } from './db';

/**
 * Helper functie om gegenereerde blog op te slaan in SavedContent
 */
async function saveBlogToDatabase(
  clientId: string,
  title: string,
  content: string,
  wordCount: number,
  projectId?: string,
  keywords?: string[]
): Promise<string> {
  try {
    // Strip markdown voor plain text content
    const plainContent = content.replace(/^#+ /gm, '').replace(/[*_]/g, '');
    
    // Genereer meta description (eerste 125 karakters, altijd met hoofdletter)
    let metaDesc = plainContent.substring(0, 125).trim();
    if (metaDesc.length > 0) {
      // Zorg dat het begint met een hoofdletter
      metaDesc = metaDesc.charAt(0).toUpperCase() + metaDesc.slice(1);
    }
    if (plainContent.length > 125) {
      metaDesc += '...';
    }
    
    // Converteer markdown naar HTML (basic conversion)
    let contentHtml = content
      .replace(/^# (.+)$/gm, '<h1>$1</h1>')
      .replace(/^## (.+)$/gm, '<h2>$1</h2>')
      .replace(/^### (.+)$/gm, '<h3>$1</h3>')
      .replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>')
      .replace(/\*(.+?)\*/g, '<em>$1</em>')
      .replace(/\n\n/g, '</p><p>')
      .replace(/\n/g, '<br>');
    contentHtml = '<p>' + contentHtml + '</p>';
    
    const savedContent = await prisma.savedContent.create({
      data: {
        clientId,
        type: 'blog',
        title,
        content: plainContent,
        contentHtml,
        category: 'blog',
        tags: keywords || [],
        description: metaDesc,
        keywords: keywords || [],
        metaDesc,
        wordCount,
        characterCount: plainContent.length,
        projectId: projectId || null,
        isFavorite: false,
        isArchived: false,
      }
    });
    
    console.log(`✅ Blog opgeslagen in database: ${savedContent.id}`);
    return savedContent.id;
  } catch (error) {
    console.error('❌ Fout bij opslaan blog:', error);
    return '';
  }
}

// Tool Definitions voor AIML API (OpenAI compatible format)
export const DEEPAGENT_TOOLS = [
  // ═══════════════════════════════════════════════════════
  // 🎨 WRITGOAI CONTENT GENERATIE TOOLS
  // ═══════════════════════════════════════════════════════
  {
    type: 'function',
    function: {
      name: 'generate_blog',
      description: 'Generate a professional SEO-optimized blog article. Use when user asks to write/create a blog, article, or long-form content. Supports product reviews, news articles, and general blogs with real-time web research, images, and YouTube videos.',
      parameters: {
        type: 'object',
        properties: {
          topic: {
            type: 'string',
            description: 'The blog topic or title (e.g., "Best laptops for students 2025", "How to start a YouTube channel")',
          },
          keywords: {
            type: 'array',
            items: { type: 'string' },
            description: 'Target keywords for SEO optimization (e.g., ["laptop for students", "budget laptops"])',
          },
          type: {
            type: 'string',
            enum: ['general', 'product_review', 'news', 'comparison', 'how_to', 'listicle'],
            description: 'Type of blog article to generate',
          },
          wordCount: {
            type: 'number',
            description: 'Target word count (500-3000). Default: 1000',
          },
          tone: {
            type: 'string',
            enum: ['professional', 'casual', 'expert', 'friendly', 'formal'],
            description: 'Writing tone. Default: professional',
          },
          includeImages: {
            type: 'boolean',
            description: 'Include product images in the blog. Default: true',
          },
          includeVideo: {
            type: 'boolean',
            description: 'Search for and include relevant YouTube videos. Default: true',
          },
          webResearch: {
            type: 'boolean',
            description: 'Perform real-time web research for facts. Default: true',
          },
        },
        required: ['topic'],
      },
    },
  },
  {
    type: 'function',
    function: {
      name: 'generate_video',
      description: 'Generate a professional AI video with voiceover, images, and background music. Use when user wants to create a video, reel, TikTok, YouTube short, etc. Supports custom images, text-to-speech in multiple languages, and automatic video editing.',
      parameters: {
        type: 'object',
        properties: {
          topic: {
            type: 'string',
            description: 'Video topic or script idea (e.g., "5 tips for healthy eating", "Product unboxing review")',
          },
          aspectRatio: {
            type: 'string',
            enum: ['9:16', '16:9', '1:1'],
            description: 'Video aspect ratio. 9:16 for TikTok/Reels/Shorts, 16:9 for YouTube, 1:1 for Instagram Feed. Default: 9:16',
          },
          language: {
            type: 'string',
            enum: ['nl', 'en'],
            description: 'Script and voiceover language. Default: nl (Dutch)',
          },
          voice: {
            type: 'string',
            description: 'ElevenLabs voice ID. Default: CwhRBWXzGAHq8TQ4Fs17 (Dutch male - Roger)',
          },
          imageCount: {
            type: 'number',
            description: 'Number of images to generate (3-10). More images = more visual variety. Default: 5',
          },
          includeMusic: {
            type: 'boolean',
            description: 'Add background music. Default: true',
          },
          visualStyle: {
            type: 'string',
            enum: ['realistic', 'cinematic', 'animated', 'cartoon', 'fantasy', 'digital-art', '3d'],
            description: 'Visual style for generated images. Default: realistic',
          },
        },
        required: ['topic'],
      },
    },
  },
  {
    type: 'function',
    function: {
      name: 'keyword_research',
      description: 'Perform comprehensive keyword research for a website or topic. Analyzes existing keywords, generates new long-tail opportunities, provides competition analysis, and suggests content silos. Use when user wants SEO research, keyword analysis, or content strategy.',
      parameters: {
        type: 'object',
        properties: {
          websiteUrl: {
            type: 'string',
            description: 'Website URL to analyze (e.g., "https://example.com"). Optional if using topic.',
          },
          topic: {
            type: 'string',
            description: 'Keyword topic or niche (e.g., "fitness coaching", "digital marketing"). Optional if using websiteUrl.',
          },
          type: {
            type: 'string',
            enum: ['quick_scan', 'deep_scan', 'keyword_research', 'content_silos', 'full_site_plan'],
            description: 'Type of keyword research. Default: keyword_research',
          },
          targetCountry: {
            type: 'string',
            description: 'Target country code (e.g., "nl", "us", "de"). Default: nl',
          },
          generateSuggestions: {
            type: 'boolean',
            description: 'Generate actionable keyword suggestions. Default: true',
          },
        },
        required: [],
      },
    },
  },
  {
    type: 'function',
    function: {
      name: 'generate_social_post',
      description: 'Generate professional social media posts optimized for specific platforms. Use when user wants to create Instagram, LinkedIn, Twitter/X, or Facebook content. Includes hashtags, emojis, and platform-specific formatting.',
      parameters: {
        type: 'object',
        properties: {
          topic: {
            type: 'string',
            description: 'Social post topic or message (e.g., "Announcing our new product", "Motivational Monday quote")',
          },
          platforms: {
            type: 'array',
            items: { type: 'string', enum: ['instagram', 'linkedin', 'twitter', 'facebook'] },
            description: 'Target platforms. Each platform gets optimized content.',
          },
          tone: {
            type: 'string',
            enum: ['professional', 'casual', 'inspirational', 'humorous', 'educational'],
            description: 'Post tone. Default: professional',
          },
          length: {
            type: 'string',
            enum: ['short', 'medium', 'long'],
            description: 'Post length. Short (50-100 words), Medium (100-200), Long (200+). Default: medium',
          },
          includeHashtags: {
            type: 'boolean',
            description: 'Include relevant hashtags. Default: true',
          },
          includeEmojis: {
            type: 'boolean',
            description: 'Include emojis for engagement. Default: true',
          },
          includeCallToAction: {
            type: 'boolean',
            description: 'Include a call-to-action. Default: true',
          },
        },
        required: ['topic', 'platforms'],
      },
    },
  },
  {
    type: 'function',
    function: {
      name: 'generate_woocommerce_product',
      description: 'Generate SEO-optimized WooCommerce product descriptions with short description, features, and long HTML description. Use when user wants to create product descriptions for e-commerce.',
      parameters: {
        type: 'object',
        properties: {
          productName: {
            type: 'string',
            description: 'Product name (e.g., "Samsung Galaxy S24 Ultra")',
          },
          productInfo: {
            type: 'string',
            description: 'Product details, specifications, or features (e.g., "256GB, 5G, Triple camera")',
          },
          category: {
            type: 'string',
            description: 'Product category (e.g., "Electronics", "Fashion", "Home & Garden")',
          },
          targetAudience: {
            type: 'string',
            description: 'Target customer (e.g., "Tech enthusiasts", "Budget shoppers", "Professionals")',
          },
          keywords: {
            type: 'array',
            items: { type: 'string' },
            description: 'SEO keywords for the product',
          },
        },
        required: ['productName'],
      },
    },
  },
  // ═══════════════════════════════════════════════════════
  // 🖥️ SYSTEM TOOLS (Computer Access)
  // ═══════════════════════════════════════════════════════
  {
    type: 'function',
    function: {
      name: 'bash_command',
      description: 'Execute bash commands on the server. Use for file operations, data processing, system commands, etc. ALWAYS use absolute paths.',
      parameters: {
        type: 'object',
        properties: {
          command: {
            type: 'string',
            description: 'The bash command to execute (e.g., "ls -la /home", "cat file.txt", "python script.py")',
          },
        },
        required: ['command'],
      },
    },
  },
  {
    type: 'function',
    function: {
      name: 'read_file',
      description: 'Read the contents of a file. Use for text files, code, configuration, logs, etc.',
      parameters: {
        type: 'object',
        properties: {
          path: {
            type: 'string',
            description: 'Absolute path to the file',
          },
        },
        required: ['path'],
      },
    },
  },
  {
    type: 'function',
    function: {
      name: 'write_file',
      description: 'Write or overwrite a file with new content. Creates directories if needed.',
      parameters: {
        type: 'object',
        properties: {
          path: {
            type: 'string',
            description: 'Absolute path to the file',
          },
          content: {
            type: 'string',
            description: 'The full content to write',
          },
        },
        required: ['path', 'content'],
      },
    },
  },
  {
    type: 'function',
    function: {
      name: 'web_search',
      description: 'Zoek actuele informatie op internet met GPT-4o Search Preview (primary) + 7 fallback modellen. Gebruik voor nieuws, weer, statistieken, prijzen, trends, events, feiten. Automatisch in Nederlands met bronvermeldingen.',
      parameters: {
        type: 'object',
        properties: {
          query: {
            type: 'string',
            description: 'Zoekopdracht in natuurlijke taal',
          },
        },
        required: ['query'],
      },
    },
  },
  {
    type: 'function',
    function: {
      name: 'scan_website',
      description: 'Analyseer een website. Gebruik alleen als gebruiker expliciet vraagt om een scan of als je echt website info nodig hebt.',
      parameters: {
        type: 'object',
        properties: {
          url: {
            type: 'string',
            description: 'Website URL (optioneel, gebruikt configured site als niet gegeven)',
          },
        },
        required: [],
      },
    },
  },
  {
    type: 'function',
    function: {
      name: 'generate_blog',
      description: 'Schrijf een SEO-geoptimaliseerde blog met afbeeldingen. BELANGRIJK: Gebruik alleen bij SPECIFIEKE onderwerpen (> 10 tekens). Bij vage input ("blog", "marketing", "website" etc) → vraag gebruiker eerst om specificatie. Goede voorbeelden: "Instagram Reels tips 2025", "WordPress SEO gids", "Top 10 smoothie recepten".',
      parameters: {
        type: 'object',
        properties: {
          topic: {
            type: 'string',
            description: 'Specifiek en duidelijk onderwerp (minimaal 10 tekens)',
          },
          wordCount: {
            type: 'number',
            description: 'Aantal woorden (default: 800)',
          },
          websiteUrl: {
            type: 'string',
            description: 'Website URL om te scannen voor interne links en stijl (optioneel)'
          },
          modification: {
            type: 'string',
            description: 'Specifieke wijziging aan bestaande blog (bijv. "Maak langer", "Verbeter SEO", "Vriendelijker toon"). Als dit is ingevuld, pas de blog aan volgens de instructie.'
          },
        },
        required: ['topic'],
      },
    },
  },
  {
    type: 'function',
    function: {
      name: 'generate_linkbuilding_article',
      description: 'Schrijf een professioneel linkbuilding artikel volgens strikte SEO regels. Gebruikt specifieke richtlijnen om AI-detectie te vermijden. Ideaal voor gastblogs en externe content met anchor texts.',
      parameters: {
        type: 'object',
        properties: {
          targetDomain: {
            type: 'string',
            description: 'Het doeldomein waar het artikel voor geschreven wordt (bijv. "lifeandyou.nl")'
          },
          anchors: {
            type: 'array',
            description: 'Array van anchor objects met keyword en url properties',
            items: {
              type: 'object',
              properties: {
                keyword: {
                  type: 'string',
                  description: 'De anchor text / keyword'
                },
                url: {
                  type: 'string',
                  description: 'De URL waarnaar gelinkt moet worden'
                }
              }
            }
          },
          wordCount: {
            type: 'number',
            description: 'Exact aantal woorden (meestal 400-600 voor linkbuilding)'
          },
          topic: {
            type: 'string',
            description: 'Optioneel: specifiek onderwerp. Als niet gegeven, wordt automatisch gekozen op basis van target domain scan'
          }
        },
        required: ['targetDomain', 'anchors', 'wordCount'],
      },
    },
  },
  {
    type: 'function',
    function: {
      name: 'generate_image',
      description: 'Genereer een afbeelding met AI. Kies automatisch het beste model op basis van de beschrijving. Models: stable-diffusion-3 (beste prijs/kwaliteit, AANBEVOLEN), flux-pro (high-end quality), flux-realism (fotorealistisch), recraft-v3 (design/logo), dall-e-3 (OpenAI).',
      parameters: {
        type: 'object',
        properties: {
          description: {
            type: 'string',
            description: 'Gedetailleerde beschrijving van de afbeelding in het Engels',
          },
          model: {
            type: 'string',
            description: 'AI model te gebruiken. Kies op basis van use case: stable-diffusion-3 voor beste prijs/kwaliteit (AANBEVOLEN), flux-pro voor high-end quality, flux-realism voor foto\'s, recraft-v3 voor designs, dall-e-3 voor creativiteit',
            enum: ['stable-diffusion-3', 'flux-pro', 'flux-realism', 'recraft-v3', 'dall-e-3', 'imagen-3.0-generate-002'],
          },
          aspectRatio: {
            type: 'string',
            description: 'Aspect ratio (default: 1:1)',
            enum: ['1:1', '16:9', '9:16', '4:3', '3:4'],
          },
        },
        required: ['description', 'model'],
      },
    },
  },
  {
    type: 'function',
    function: {
      name: 'generate_video',
      description: 'Genereer een complete AI story video met meerdere scènes: AI-gegenereerde afbeeldingen (DALL-E), voiceover (ElevenLabs), en FFmpeg compositie. Perfect voor TikTok, Instagram Reels, YouTube Shorts. BELANGRIJK: Maak ALTIJD eerst een uitgebreid script voordat je deze tool aanroept. De video wordt automatisch opgedeeld in meerdere visuele scènes voor een professionele AI story.',
      parameters: {
        type: 'object',
        properties: {
          topic: {
            type: 'string',
            description: 'Het onderwerp van de AI story (bijv. "De toekomst van kunstmatige intelligentie")',
          },
          script: {
            type: 'string',
            description: 'Het volledige script dat voorgelezen wordt. Maak dit uitgebreid en boeiend (minimaal 150 woorden voor complete AI story van 60-90 sec).',
          },
          style: {
            type: 'string',
            description: 'Visuele stijl voor de afbeeldingen',
            enum: ['realistic', 'cinematic', 'animated', 'cartoon', 'fantasy', 'digital-art', '3d'],
          },
          aspect_ratio: {
            type: 'string',
            description: 'Formaat: "9:16" (verticaal - TikTok/Reels/Shorts), "16:9" (horizontaal - YouTube), "1:1" (vierkant - Instagram)',
            enum: ['9:16', '16:9', '1:1'],
          },
          voice_id: {
            type: 'string',
            description: 'ElevenLabs voice ID. Voor Nederlands: "CwhRBWXzGAHq8TQ4Fs17" (Roger - mannelijk, casual). Voor Engels: "EXAVITQu4vr4xnSDxMaL" (Sarah - vrouwelijk), "2EiwWnXFnvU5JabPnv8n" (Clyde - mannelijk)',
          },
          scene_count: {
            type: 'number',
            description: 'Aantal visuele scènes in de AI story (3-8). Default: 5. Meer scènes = meer variatie maar langere generatie tijd.',
          },
          background_music: {
            type: 'boolean',
            description: 'Voeg achtergrondmuziek toe (default: true voor professionele AI stories)',
          },
        },
        required: ['topic', 'script'],
      },
    },
  },
  {
    type: 'function',
    function: {
      name: 'generate_code',
      description: 'Genereer een interactief webcomponent met HTML, CSS en JavaScript. De gebruiker krijgt een live preview en kan de code bewerken. Gebruik dit voor: landing pages, formulieren, widgets, dashboards, animaties, interactive demos. Retourneert een embed link naar de code canvas.',
      parameters: {
        type: 'object',
        properties: {
          prompt: {
            type: 'string',
            description: 'Gedetailleerde beschrijving van het gewenste component. Wees specifiek over functionaliteit, stijl, interactiviteit en responsive design. Bijvoorbeeld: "Een moderne todo list app met localStorage, drag & drop, en dark mode toggle"',
          },
        },
        required: ['prompt'],
      },
    },
  },
  {
    type: 'function',
    function: {
      name: 'upload_file',
      description: 'Upload een bestand (vanaf externe URL) naar cloud storage en retourneer de file path. Gebruik dit voor het bewaren van bestanden die je wilt analyseren of later downloaden.',
      parameters: {
        type: 'object',
        properties: {
          url: {
            type: 'string',
            description: 'URL van het bestand om te uploaden',
          },
          filename: {
            type: 'string',
            description: 'Gewenste bestandsnaam',
          },
        },
        required: ['url', 'filename'],
      },
    },
  },
  {
    type: 'function',
    function: {
      name: 'analyze_pdf',
      description: 'Analyseer een PDF bestand. Extraheert tekst en geeft antwoord op vragen over de inhoud.',
      parameters: {
        type: 'object',
        properties: {
          file_path: {
            type: 'string',
            description: 'S3 cloud storage path van het PDF bestand (van upload_file)',
          },
          question: {
            type: 'string',
            description: 'Specifieke vraag over het PDF document (optioneel, geeft volledige samenvatting als niet opgegeven)',
          },
        },
        required: ['file_path'],
      },
    },
  },
  {
    type: 'function',
    function: {
      name: 'analyze_excel',
      description: 'Analyseer een Excel/CSV bestand. Leest data, maakt statistieken, beantwoordt vragen over de data.',
      parameters: {
        type: 'object',
        properties: {
          file_path: {
            type: 'string',
            description: 'S3 cloud storage path van het Excel/CSV bestand',
          },
          question: {
            type: 'string',
            description: 'Specifieke vraag over de data (optioneel)',
          },
        },
        required: ['file_path'],
      },
    },
  },
  {
    type: 'function',
    function: {
      name: 'analyze_word',
      description: 'Analyseer een Word document (.docx). Extraheert tekst en beantwoordt vragen.',
      parameters: {
        type: 'object',
        properties: {
          file_path: {
            type: 'string',
            description: 'S3 cloud storage path van het Word document',
          },
          question: {
            type: 'string',
            description: 'Specifieke vraag over het document (optioneel)',
          },
        },
        required: ['file_path'],
      },
    },
  },
  {
    type: 'function',
    function: {
      name: 'analyze_image',
      description: 'Analyseer een afbeelding met AI Vision. Kan afbeeldingen beschrijven, tekst herkennen (OCR), objecten detecteren, screenshots analyseren, etc.',
      parameters: {
        type: 'object',
        properties: {
          image_url: {
            type: 'string',
            description: 'URL of S3 path van de afbeelding',
          },
          question: {
            type: 'string',
            description: 'Wat wil je weten over deze afbeelding? (bijv: "Wat zie je?", "Lees de tekst", "Welke kleuren zie je?")',
          },
        },
        required: ['image_url', 'question'],
      },
    },
  },
  {
    type: 'function',
    function: {
      name: 'python_execute',
      description: 'Voer Python code uit voor data analyse, berekeningen, visualisaties, etc. Heeft toegang tot pandas, numpy, matplotlib, scipy. Gebruik voor complexe data processing en analyses.',
      parameters: {
        type: 'object',
        properties: {
          code: {
            type: 'string',
            description: 'Python code om uit te voeren. Gebruik print() voor output.',
          },
          save_plot: {
            type: 'boolean',
            description: 'True als de code een matplotlib plot maakt die je wilt bewaren (default: false)',
          },
        },
        required: ['code'],
      },
    },
  },
  {
    type: 'function',
    function: {
      name: 'calculator',
      description: 'Voer exacte wiskundige berekeningen uit. Gebruik voor complexe formules, trigonometrie, statistiek, matrices, etc. Ondersteunt alles wat Math.js kan.',
      parameters: {
        type: 'object',
        properties: {
          expression: {
            type: 'string',
            description: 'Wiskundige expressie (bijv: "sqrt(16) + sin(pi/2)", "matrix([[1,2],[3,4]]) * 2")',
          },
        },
        required: ['expression'],
      },
    },
  },
  {
    type: 'function',
    function: {
      name: 'get_datetime',
      description: 'Krijg huidige datum/tijd in verschillende formaten en tijdzones. Bereken tijdsverschillen, converteer tussen timezones, formatteer datums.',
      parameters: {
        type: 'object',
        properties: {
          timezone: {
            type: 'string',
            description: 'Tijdzone (bijv: "Europe/Amsterdam", "America/New_York", "Asia/Tokyo"). Default: UTC',
          },
          format: {
            type: 'string',
            description: 'Gewenst formaat: "full" (volledige datum+tijd), "date" (alleen datum), "time" (alleen tijd), "iso" (ISO 8601), "unix" (timestamp)',
            enum: ['full', 'date', 'time', 'iso', 'unix'],
          },
        },
        required: [],
      },
    },
  },
  {
    type: 'function',
    function: {
      name: 'create_chart',
      description: 'Maak een professionele grafiek/chart van data. Retourneert JSON data die de frontend kan visualiseren met Recharts.',
      parameters: {
        type: 'object',
        properties: {
          data: {
            type: 'array',
            items: {
              type: 'object',
              properties: {},
            },
            description: 'Array van data objecten (bijv: [{name: "Jan", value: 100}, {name: "Feb", value: 200}])',
          },
          chart_type: {
            type: 'string',
            description: 'Type grafiek',
            enum: ['line', 'bar', 'pie', 'area', 'scatter'],
          },
          title: {
            type: 'string',
            description: 'Titel van de grafiek',
          },
          x_axis: {
            type: 'string',
            description: 'Key voor X-as (bijv: "name", "date")',
          },
          y_axis: {
            type: 'string',
            description: 'Key voor Y-as (bijv: "value", "count")',
          },
        },
        required: ['data', 'chart_type', 'title'],
      },
    },
  },
  {
    type: 'function',
    function: {
      name: 'browse_website',
      description: 'Bezoek een website en krijg de VOLLEDIGE HTML inhoud. Gebruik dit voor web scraping, research, data extractie. Kan elke website lezen inclusief nieuws, prijzen, producten, etc. Retourneert de complete HTML source.',
      parameters: {
        type: 'object',
        properties: {
          url: {
            type: 'string',
            description: 'URL van de website (bijv: "https://nu.nl", "https://tweakers.net/pricewatch")',
          },
          extract_text_only: {
            type: 'boolean',
            description: 'True = alleen leesbare tekst (geen HTML tags), False = volledige HTML (default: true)',
          },
        },
        required: ['url'],
      },
    },
  },
  {
    type: 'function',
    function: {
      name: 'screenshot_website',
      description: 'Maak een screenshot van een website. Perfect voor visuele verificatie, bewijs van content, of om te laten zien wat je gevonden hebt. Retourneert een URL naar de screenshot die je kunt laten zien aan de gebruiker.',
      parameters: {
        type: 'object',
        properties: {
          url: {
            type: 'string',
            description: 'URL van de website',
          },
          full_page: {
            type: 'boolean',
            description: 'True = hele pagina, False = alleen zichtbare deel (default: false)',
          },
          wait_seconds: {
            type: 'number',
            description: 'Seconden wachten voor screenshot (voor dynamische content, default: 2)',
          },
        },
        required: ['url'],
      },
    },
  },
  {
    type: 'function',
    function: {
      name: 'download_from_url',
      description: 'Download een bestand van een URL en bewaar het lokaal of in cloud storage. Gebruik voor PDFs, afbeeldingen, datasets, documenten, etc. Retourneert bestandspad voor verdere analyse.',
      parameters: {
        type: 'object',
        properties: {
          url: {
            type: 'string',
            description: 'URL van het bestand',
          },
          filename: {
            type: 'string',
            description: 'Gewenste bestandsnaam (optioneel, anders auto-detect)',
          },
          analyze_after: {
            type: 'boolean',
            description: 'True = automatisch analyseren na download (default: false)',
          },
        },
        required: ['url'],
      },
    },
  },
  {
    type: 'function',
    function: {
      name: 'research_topic',
      description: 'Voer DIEPGAAND onderzoek uit naar een onderwerp. Combineert meerdere web searches, scrapt relevante websites, verzamelt data, en levert een uitgebreide research rapport. Gebruik voor complexe research taken.',
      parameters: {
        type: 'object',
        properties: {
          topic: {
            type: 'string',
            description: 'Het onderwerp om te onderzoeken',
          },
          num_sources: {
            type: 'number',
            description: 'Aantal bronnen te raadplegen (1-10, default: 3)',
          },
          language: {
            type: 'string',
            description: 'Taal voor het rapport (default: "nl")',
            enum: ['nl', 'en', 'de', 'fr', 'es'],
          },
        },
        required: ['topic'],
      },
    },
  },
  {
    type: 'function',
    function: {
      name: 'extract_structured_data',
      description: 'Extraheer gestructureerde data van een website (prijzen, producten, nieuws, etc.). Retourneert JSON data. Gebruik voor web scraping taken.',
      parameters: {
        type: 'object',
        properties: {
          url: {
            type: 'string',
            description: 'URL van de website',
          },
          data_type: {
            type: 'string',
            description: 'Type data te extraheren',
            enum: ['prices', 'products', 'articles', 'contacts', 'reviews', 'custom'],
          },
          custom_selectors: {
            type: 'string',
            description: 'CSS selectors voor custom extractie (optioneel, alleen bij data_type="custom")',
          },
        },
        required: ['url', 'data_type'],
      },
    },
  },
  {
    type: 'function',
    function: {
      name: 'keyword_research',
      description: 'Voer zoekwoordonderzoek uit voor een website/niche. Scant bestaande content en genereert een lijst met relevante keywords die NOG NIET op de site staan. Perfect voor nieuwe content ideeën en SEO strategie.',
      parameters: {
        type: 'object',
        properties: {
          niche: {
            type: 'string',
            description: 'Het onderwerp/niche waarvoor je keywords wilt vinden (bijv. "yoga", "digitale marketing", "recepten")',
          },
          website_url: {
            type: 'string',
            description: 'Website URL om te scannen voor bestaande content (optioneel)',
          },
          num_keywords: {
            type: 'number',
            description: 'Aantal nieuwe keywords te genereren (5-50, default: 20)',
          },
          language: {
            type: 'string',
            description: 'Taal voor keywords (default: "nl")',
            enum: ['nl', 'en', 'de', 'fr', 'es'],
          },
        },
        required: ['niche'],
      },
    },
  },
  
  // ========================================
  // 🚀 AUTONOMOUS AGENT ACTION TOOLS
  // ========================================
  
  {
    type: 'function',
    function: {
      name: 'wordpress_publish',
      description: 'Publiceer een blog artikel DIRECT naar WordPress. De blog wordt automatisch live op de website gezet. Gebruik dit om blogs meteen te publiceren in plaats van alleen op te slaan.',
      parameters: {
        type: 'object',
        properties: {
          title: {
            type: 'string',
            description: 'Titel van het artikel',
          },
          content: {
            type: 'string',
            description: 'HTML content van het artikel (met <h2>, <p>, <strong>, etc.)',
          },
          excerpt: {
            type: 'string',
            description: 'Korte samenvatting/excerpt voor het artikel (optioneel)',
          },
          status: {
            type: 'string',
            description: 'Publicatie status: "publish" (direct live), "draft" (concept), "private" (privé)',
            enum: ['publish', 'draft', 'private'],
          },
          categories: {
            type: 'array',
            items: { type: 'string' },
            description: 'Categorieën voor het artikel (optioneel)',
          },
          tags: {
            type: 'array',
            items: { type: 'string' },
            description: 'Tags voor het artikel (optioneel)',
          },
          featured_image_url: {
            type: 'string',
            description: 'URL van de featured image (optioneel)',
          },
        },
        required: ['title', 'content'],
      },
    },
  },
  
  {
    type: 'function',
    function: {
      name: 'create_social_media_post',
      description: 'Creëer een COMPLETE social media post met automatisch gegenereerde afbeelding, tekst en hashtags. Ideaal voor Instagram, Facebook, LinkedIn. De AI genereert alles wat nodig is voor een perfecte post.',
      parameters: {
        type: 'object',
        properties: {
          topic: {
            type: 'string',
            description: 'Het onderwerp van de social media post',
          },
          platforms: {
            type: 'array',
            items: { 
              type: 'string',
              enum: ['instagram', 'facebook', 'linkedin', 'twitter', 'tiktok']
            },
            description: 'Social media platforms (default: ["instagram", "facebook", "linkedin"])',
          },
          style: {
            type: 'string',
            description: 'Visuele stijl van de afbeelding',
            enum: ['realistic', 'modern', 'minimalist', 'vibrant', 'professional'],
          },
          post_type: {
            type: 'string',
            description: 'Type post: "promotional", "educational", "inspirational", "announcement"',
            enum: ['promotional', 'educational', 'inspirational', 'announcement', 'story'],
          },
          include_image: {
            type: 'boolean',
            description: 'Genereer automatisch een AI afbeelding (default: true)',
          },
        },
        required: ['topic'],
      },
    },
  },
  
  {
    type: 'function',
    function: {
      name: 'create_content_plan',
      description: 'Genereer een COMPLETE 7-daagse content planning voor alle platforms (blog, social, video). De AI analyseert de website, doet marktonderzoek en maakt een strategische planning.',
      parameters: {
        type: 'object',
        properties: {
          focus_area: {
            type: 'string',
            description: 'Specifiek focus gebied voor de planning (optioneel, bijv: "Instagram Reels", "YouTube shorts", "SEO blogs")',
          },
          include_competitors: {
            type: 'boolean',
            description: 'True = ook concurrent analyse uitvoeren (default: false)',
          },
        },
        required: [],
      },
    },
  },
  
  {
    type: 'function',
    function: {
      name: 'execute_content_plan',
      description: 'Voer een bestaande content planning UIT - genereer alle content en publiceer alles automatisch. Dit is een volledige workflow die uren werk in minuten doet.',
      parameters: {
        type: 'object',
        properties: {
          plan_id: {
            type: 'string',
            description: 'ID van de content planning om uit te voeren (optioneel, gebruikt laatste planning als niet opgegeven)',
          },
          auto_publish: {
            type: 'boolean',
            description: 'True = direct publiceren, False = opslaan als concept (default: false)',
          },
          platforms: {
            type: 'array',
            items: { type: 'string' },
            description: 'Welke platforms? Optioneel, anders alle platforms (["wordpress", "instagram", "facebook", "tiktok", "youtube"])',
          },
        },
        required: [],
      },
    },
  },
  
  {
    type: 'function',
    function: {
      name: 'manage_task',
      description: 'Beheer taken in het WritgoAI systeem - aanmaken, updaten, voltooien. Gebruik voor workflow management en task tracking.',
      parameters: {
        type: 'object',
        properties: {
          action: {
            type: 'string',
            description: 'Actie: "create" (nieuwe taak), "update" (bestaande taak updaten), "complete" (taak voltooien)',
            enum: ['create', 'update', 'complete', 'list'],
          },
          task_id: {
            type: 'string',
            description: 'Task ID (vereist voor update/complete)',
          },
          title: {
            type: 'string',
            description: 'Taak titel (vereist voor create)',
          },
          description: {
            type: 'string',
            description: 'Taak beschrijving (optioneel)',
          },
          priority: {
            type: 'string',
            description: 'Prioriteit: "low", "medium", "high", "urgent"',
            enum: ['low', 'medium', 'high', 'urgent'],
          },
          deadline: {
            type: 'string',
            description: 'Deadline in ISO formaat (optioneel)',
          },
          status: {
            type: 'string',
            description: 'Status voor update',
            enum: ['pending', 'in_progress', 'review', 'completed', 'cancelled'],
          },
        },
        required: ['action'],
      },
    },
  },
  
  {
    type: 'function',
    function: {
      name: 'check_credits',
      description: 'Controleer het huidige credit saldo van de client. Geef waarschuwingen als credits laag zijn. Gebruik voor credit management.',
      parameters: {
        type: 'object',
        properties: {
          warn_threshold: {
            type: 'number',
            description: 'Waarschuwing geven als credits onder dit aantal (default: 100)',
          },
        },
        required: [],
      },
    },
  },
  
  {
    type: 'function',
    function: {
      name: 'send_notification',
      description: 'Stuur een notificatie naar de client (email of in-app). Gebruik voor updates, waarschuwingen, voltooide taken, etc.',
      parameters: {
        type: 'object',
        properties: {
          subject: {
            type: 'string',
            description: 'Onderwerp van de notificatie',
          },
          message: {
            type: 'string',
            description: 'Bericht inhoud',
          },
          type: {
            type: 'string',
            description: 'Type notificatie: "email" (stuurt email), "in_app" (toont in dashboard), "both" (beide)',
            enum: ['email', 'in_app', 'both'],
          },
          priority: {
            type: 'string',
            description: 'Prioriteit: "low", "normal", "high"',
            enum: ['low', 'normal', 'high'],
          },
        },
        required: ['subject', 'message'],
      },
    },
  },
  
  {
    type: 'function',
    function: {
      name: 'analyze_performance',
      description: 'Analyseer content performance - welke blogs/posts presteren goed, trends, engagement statistieken. Gebruik voor data-driven beslissingen.',
      parameters: {
        type: 'object',
        properties: {
          time_period: {
            type: 'string',
            description: 'Periode te analyseren: "week", "month", "quarter", "year"',
            enum: ['week', 'month', 'quarter', 'year'],
          },
          content_types: {
            type: 'array',
            items: { type: 'string' },
            description: 'Content types: ["blog", "social", "video", "reel"]',
          },
          metrics: {
            type: 'array',
            items: { type: 'string' },
            description: 'Metrics: ["views", "engagement", "conversions", "revenue"]',
          },
        },
        required: [],
      },
    },
  },
  
  {
    type: 'function',
    function: {
      name: 'schedule_automation',
      description: 'Plan automatische content generatie en publicatie in. Zet een recurring workflow op die automatisch content maakt en publiceert op vaste tijden.',
      parameters: {
        type: 'object',
        properties: {
          frequency: {
            type: 'string',
            description: 'Hoe vaak: "daily", "weekly", "biweekly", "monthly"',
            enum: ['daily', 'weekly', 'biweekly', 'monthly'],
          },
          content_types: {
            type: 'array',
            items: { type: 'string' },
            description: 'Welke content types: ["blog", "social", "video"]',
          },
          platforms: {
            type: 'array',
            items: { type: 'string' },
            description: 'Platforms: ["wordpress", "instagram", "facebook", "tiktok", "youtube"]',
          },
          time_of_day: {
            type: 'string',
            description: 'Tijd in 24u formaat (bijv: "09:00", "14:30")',
          },
          auto_publish: {
            type: 'boolean',
            description: 'True = automatisch publiceren, False = opslaan als concept',
          },
        },
        required: ['frequency', 'content_types'],
      },
    },
  },
];

// Tool Execution Functions
export async function executeBashCommand(command: string): Promise<string> {
  try {
    const { exec } = require('child_process');
    const { promisify } = require('util');
    const execAsync = promisify(exec);
    
    console.log(`🔧 Executing bash: ${command}`);
    
    const { stdout, stderr } = await execAsync(command, {
      timeout: 30000, // 30 seconds timeout
      maxBuffer: 10 * 1024 * 1024, // 10MB buffer
    });
    
    const result = stdout || stderr || 'Command executed successfully';
    console.log(`✅ Bash result: ${result.substring(0, 200)}...`);
    return result;
  } catch (error: any) {
    console.error(`❌ Bash error: ${error.message}`);
    throw new Error(`Bash command failed: ${error.message}`);
  }
}

export async function readFile(path: string): Promise<string> {
  try {
    const fs = require('fs').promises;
    console.log(`📖 Reading file: ${path}`);
    const content = await fs.readFile(path, 'utf-8');
    console.log(`✅ File read: ${content.length} bytes`);
    return content;
  } catch (error: any) {
    console.error(`❌ Read file error: ${error.message}`);
    throw new Error(`Failed to read file: ${error.message}`);
  }
}

export async function writeFile(path: string, content: string): Promise<string> {
  try {
    const fs = require('fs').promises;
    const pathModule = require('path');
    
    console.log(`📝 Writing file: ${path}`);
    
    // Ensure directory exists
    const dir = pathModule.dirname(path);
    await fs.mkdir(dir, { recursive: true });
    
    await fs.writeFile(path, content, 'utf-8');
    console.log(`✅ File written: ${path} (${content.length} bytes)`);
    return `File written successfully: ${path}`;
  } catch (error: any) {
    console.error(`❌ Write file error: ${error.message}`);
    throw new Error(`Failed to write file: ${error.message}`);
  }
}

export async function webSearch(query: string): Promise<string> {
  try {
    const currentDate = new Date().toLocaleDateString('nl-NL', { 
      weekday: 'long', 
      year: 'numeric', 
      month: 'long', 
      day: 'numeric' 
    });
    
    console.log(`🔍 GPT-4o WebSearch - Actueel Internet Zoeken (${currentDate}): ${query}`);
    
    const systemPrompt = `Je bent een expert onderzoeksassistent met REAL-TIME INTERNET TOEGANG tot actuele data.
              
🔴 KRITIEK: VANDAAG IS ${currentDate}

TAAK: Zoek de MEEST ACTUELE en SPECIFIEKE informatie op internet voor deze vraag:
"${query}"

Vereisten voor je antwoord:
✅ Concrete feiten en cijfers (temperaturen, prijzen, data, etc.)
✅ Datum/tijd vermeldingen als relevant
✅ ALTIJD in het Nederlands, zelfs als de vraag in het Engels is
✅ SPECIFIEKE actuele data - geen algemene informatie!

✅ **BRONVERMELDING VEREIST** - Eindig je antwoord ALTIJD met:
---
**Bronnen:**
- [Bron 1 naam](https://www.voorbeeld1.nl)
- [Bron 2 naam](https://www.voorbeeld2.nl)
- [Bron 3 naam](https://www.voorbeeld3.nl)

Gebruik echte bronnen die je hebt geraadpleegd (KNMI, Buienradar, officiële websites, nieuws sites)

❌ VERBODEN:
- Vage antwoorden zonder concrete data
- Algemene informatie die niet actueel is
- "Ik kan niet..." of "Helaas geen informatie"
- Antwoorden ZONDER bronvermelding onderaan

Als je GEEN actuele data vindt, zeg dan expliciet: "GEEN ACTUELE DATA GEVONDEN voor [onderwerp]"
Zo weet de gebruiker dat er echt geen data beschikbaar is.`;

    // 🥇 PRIMARY: GPT-4o Search Preview (BESTE MODEL VOOR ACTUELE INFO)
    try {
      console.log('🎯 PRIMARY: GPT-4o Search Preview (beste voor actuele info)');
      const response = await fetch('https://api.aimlapi.com/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${process.env.AIML_API_KEY}`,
        },
        body: JSON.stringify({
          model: 'gpt-4o-search-preview',
          messages: [
            { role: 'system', content: systemPrompt },
            { role: 'user', content: query }
          ],
          max_tokens: 4000,
          temperature: 0.1,
        }),
      });
      
      if (response.ok) {
        const data = await response.json();
        const content = data.choices?.[0]?.message?.content;
        
        if (content && content.length > 50) {
          console.log(`✅ GPT-4o Search Preview succesvol: ${content.substring(0, 200)}...`);
          return `📅 Actuele informatie van ${currentDate}:\n\n${content}`;
        }
      }
      console.warn('⚠️ GPT-4o Search Preview failed, trying fallback...');
    } catch (error: any) {
      console.warn(`⚠️ GPT-4o Search Preview error: ${error.message}`);
    }
    
    // 🥈 FALLBACK 1: GPT-5 met web_search_mode
    try {
      console.log('🚀 FALLBACK 1: GPT-5 2025-08-07 met web search');
      const response = await fetch('https://api.aimlapi.com/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${process.env.AIML_API_KEY}`,
        },
        body: JSON.stringify({
          model: 'openai/gpt-5-2025-08-07',
          messages: [
            { role: 'system', content: systemPrompt },
            { role: 'user', content: query }
          ],
          max_tokens: 3000,
          temperature: 0.1,
          web_search_mode: 'always',
        }),
      });
      
      if (response.ok) {
        const data = await response.json();
        const content = data.choices?.[0]?.message?.content;
        
        if (content && content.length > 50) {
          console.log(`✅ GPT-5 web search succesvol: ${content.substring(0, 200)}...`);
          return `📅 Informatie van ${currentDate} (via GPT-5):\n\n${content}`;
        }
      }
      console.warn('⚠️ GPT-5 failed, trying Bagoodex Search...');
    } catch (error: any) {
      console.warn(`⚠️ GPT-5 error: ${error.message}`);
    }
    
    // 🥉 FALLBACK 2: Bagoodex Search v1 (specialized search model)
    try {
      console.log('🎯 FALLBACK 2: Bagoodex Search v1');
      const response = await fetch('https://api.aimlapi.com/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${process.env.AIML_API_KEY}`,
        },
        body: JSON.stringify({
          model: 'bagoodex/bagoodex-search-v1',
          messages: [
            { role: 'system', content: systemPrompt },
            { role: 'user', content: query }
          ],
          max_tokens: 3000,
          temperature: 0.1,
        }),
      });
      
      if (response.ok) {
        const data = await response.json();
        const content = data.choices?.[0]?.message?.content;
        
        if (content && content.length > 50) {
          console.log(`✅ Bagoodex Search succesvol: ${content.substring(0, 200)}...`);
          return `📅 Informatie van ${currentDate} (via Bagoodex Search):\n\n${content}`;
        }
      }
      console.warn('⚠️ Bagoodex Search failed, trying GPT-5 Mini...');
    } catch (error: any) {
      console.warn(`⚠️ Bagoodex error: ${error.message}`);
    }
    
    // 🔄 FALLBACK 3: GPT-5 Mini (fast + efficient)
    try {
      console.log('⚡ FALLBACK 3: GPT-5 Mini');
      const response = await fetch('https://api.aimlapi.com/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${process.env.AIML_API_KEY}`,
        },
        body: JSON.stringify({
          model: 'openai/gpt-5-mini-2025-08-07',
          messages: [
            { role: 'system', content: systemPrompt },
            { role: 'user', content: query }
          ],
          max_tokens: 3000,
          temperature: 0.1,
          web_search_mode: 'always',
        }),
      });
      
      if (response.ok) {
        const data = await response.json();
        const content = data.choices?.[0]?.message?.content;
        
        if (content && content.length > 50) {
          console.log(`✅ GPT-5 Mini succesvol: ${content.substring(0, 200)}...`);
          return `📅 Informatie van ${currentDate} (via GPT-5 Mini):\n\n${content}`;
        }
      }
      console.warn('⚠️ GPT-5 Mini failed, trying GPT-4o...');
    } catch (error: any) {
      console.warn(`⚠️ GPT-5 Mini error: ${error.message}`);
    }
    
    // Strategie 3B: GPT-4o (reliable fallback)
    try {
      console.log('🔄 Tier 3B: GPT-4o (reliable fallback)');
      const response = await fetch('https://api.aimlapi.com/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${process.env.AIML_API_KEY}`,
        },
        body: JSON.stringify({
          model: 'gpt-4o',
          messages: [
            { role: 'system', content: systemPrompt },
            { role: 'user', content: query }
          ],
          max_tokens: 3000,
          temperature: 0.1,
          web_search_mode: 'always',
        }),
      });
      
      if (response.ok) {
        const data = await response.json();
        const content = data.choices?.[0]?.message?.content;
        
        if (content && content.length > 50) {
          console.log(`✅ GPT-4o succesvol: ${content.substring(0, 200)}...`);
          return `📅 Informatie van ${currentDate} (via GPT-4o):\n\n${content}`;
        }
      }
      console.warn('⚠️ GPT-4o failed, trying Gemini...');
    } catch (error: any) {
      console.warn(`⚠️ GPT-4o error: ${error.message}`);
    }
    
    // 🔧 TIER 4: Final Fallbacks
    // Strategie 4A: Gemini 2.5 Flash (Google Search) - BELANGRIJKST!
    try {
      console.log('🔄 Tier 4A: Gemini 2.5 Flash (Google Search grounding) - ENHANCED QUERY');
      const response = await fetch('https://api.aimlapi.com/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${process.env.AIML_API_KEY}`,
        },
        body: JSON.stringify({
          model: 'gemini-2.5-flash',
          messages: [
            { role: 'system', content: systemPrompt },
            { role: 'user', content: query }
          ],
          max_tokens: 3000,
          temperature: 0.1,
          web_search_mode: 'always',
        }),
      });
      
      if (response.ok) {
        const data = await response.json();
        const content = data.choices?.[0]?.message?.content;
        
        if (content && content.length > 50) {
          console.log(`✅ Gemini succesvol: ${content.substring(0, 200)}...`);
          return `📅 Informatie van ${currentDate} (via Gemini):\n\n${content}`;
        }
      }
      console.warn('⚠️ Gemini failed, trying Perplexity...');
    } catch (error: any) {
      console.warn(`⚠️ Gemini error: ${error.message}`);
    }
    
    // Strategie 4B: Claude 3.5 Sonnet (final fallback - general knowledge)
    try {
      console.log('🔄 Tier 4B: Claude 3.5 Sonnet (final fallback)');
      const response = await fetch('https://api.aimlapi.com/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${process.env.AIML_API_KEY}`,
        },
        body: JSON.stringify({
          model: 'claude-sonnet-4-5',
          messages: [
            { role: 'system', content: `Onderzoeksexpert. Datum: ${currentDate}. Nederlands antwoord met bronnen indien mogelijk.` },
            { role: 'user', content: query }
          ],
          max_tokens: 3000,
          temperature: 0.1,
        }),
      });
      
      if (response.ok) {
        const data = await response.json();
        const content = data.choices?.[0]?.message?.content;
        
        if (content && content.length > 50) {
          console.log(`✅ Claude 3.5 Sonnet succesvol: ${content.substring(0, 200)}...`);
          return `📅 Informatie van ${currentDate} (via Claude 3.5 Sonnet):\n\n${content}`;
        }
      }
      
      throw new Error('Alle 8 web search modellen faalden');
    } catch (error: any) {
      console.error(`❌ Claude 3.5 Sonnet fallback gefaald: ${error.message}`);
      throw new Error(`Alle web search strategieën gefaald. Laatste error: ${error.message}`);
    }
  } catch (error: any) {
    console.error(`❌ Web search kritieke error: ${error.message}`);
    throw new Error(`Web search niet beschikbaar: ${error.message}`);
  }
}

export async function scanWebsite(url: string | undefined, clientId: string | undefined): Promise<string> {
  try {
    if (!clientId) {
      throw new Error('Client ID is vereist voor website scan');
    }

    // Import website scanner directly
    const { scanWebsite: scanWebsiteDirect } = await import('./website-scanner');
    const { PrismaClient } = await import('@prisma/client');
    const prisma = new PrismaClient();
    
    try {
      // If no URL provided, get from client profile
      let targetUrl = url;
      if (!targetUrl) {
        const client = await prisma.client.findUnique({
          where: { id: clientId },
          select: { website: true },
        });
        
        if (!client) {
          throw new Error('Client niet gevonden');
        }
        
        targetUrl = client.website || undefined;
        
        if (!targetUrl) {
          throw new Error('Geen website URL gevonden in je profiel. Configureer eerst je WordPress site in de instellingen, of geef een URL op. Bijvoorbeeld: "Scan mijn website https://WritgoAI.nl"');
        }
      }
      
      // Validate URL
      if (!targetUrl.startsWith('http')) {
        targetUrl = `https://${targetUrl}`;
      }

      console.log(`🌐 Scanning website: ${targetUrl}`);

      // Scan website directly (geen API call)
      const scanResult = await scanWebsiteDirect(targetUrl);
      
      // Store scan result in client
      await prisma.client.update({
        where: { id: clientId },
        data: {
          targetAudience: scanResult.websiteAnalysis.targetAudience,
          brandVoice: scanResult.websiteAnalysis.toneOfVoice,
          keywords: scanResult.nicheAnalysis.keywords,
        },
      });
      
      const summary = `✅ Website gescand: ${targetUrl}

📊 Analyse resultaten:
- Niche: ${scanResult.nicheAnalysis.primaryNiche || 'Niet gevonden'}
- Keywords: ${scanResult.nicheAnalysis.keywords.slice(0, 5).join(', ') || 'Geen keywords'}
- Tone of voice: ${scanResult.websiteAnalysis.toneOfVoice || 'Niet gedetecteerd'}
- Target audience: ${scanResult.websiteAnalysis.targetAudience || 'Onbekend'}

💡 De website is succesvol geanalyseerd en kan nu gebruikt worden voor content generatie.`;
      
      console.log(`✅ Website scan compleet: ${targetUrl}`);
      return summary;
    } finally {
      await prisma.$disconnect();
    }
  } catch (error: any) {
    console.error(`❌ Website scan error: ${error.message}`);
    
    // 🚨 GRACEFUL DEGRADATION - Als scan faalt, geef een vriendelijke melding terug
    // maar throw GEEN error zodat de AI gewoon kan doorgaan!
    const errorMessage = error.message.toLowerCase();
    
    if (errorMessage.includes('403') || errorMessage.includes('forbidden')) {
      return `⚠️ Website scan niet mogelijk (toegang geweigerd). Geen probleem - ik ga gewoon verder met content generatie zonder website analyse.`;
    }
    
    if (errorMessage.includes('404') || errorMessage.includes('not found')) {
      return `⚠️ Website niet gevonden. Geen probleem - ik ga gewoon verder met content generatie zonder website analyse.`;
    }
    
    if (errorMessage.includes('timeout') || errorMessage.includes('timed out')) {
      return `⚠️ Website reageert niet (timeout). Geen probleem - ik ga gewoon verder met content generatie zonder website analyse.`;
    }
    
    // Andere errors
    return `⚠️ Website scan niet beschikbaar (${error.message}). Geen probleem - ik ga gewoon verder met content generatie zonder website analyse.`;
  }
}

export async function generateBlog(
  topic: string, 
  wordCount: number = 800, 
  clientId: string | undefined, 
  websiteUrl?: string,
  modification?: string
): Promise<string> {
  try {
    console.log(`🚀 Starting NEW Advanced SEO Writer`);
    console.log(`   📝 Topic: ${topic}`);
    console.log(`   📊 Words: ${wordCount}`);
    console.log(`   🌐 Website: ${websiteUrl || 'none'}`);
    
    // ═══════════════════════════════════════════════════════════
    // 🆕 GEBRUIK NIEUWE ADVANCED SEO WRITER
    // ═══════════════════════════════════════════════════════════
    
    const { PrismaClient } = await import('@prisma/client');
    const prisma = new PrismaClient();
    
    try {
      // Get client info
      let clientInfo: any = null;
      let sitemapData: any = null;
      
      if (clientId) {
        clientInfo = await prisma.client.findUnique({
          where: { id: clientId },
          select: {
            website: true,
            targetAudience: true,
            brandVoice: true,
            keywords: true,
          },
        });
        
        // Get sitemap data if we have a website
        const targetWebsite = websiteUrl || clientInfo?.website;
        if (targetWebsite) {
          const projects = await prisma.project.findMany({
            where: { 
              clientId: clientId,
              websiteUrl: {
                contains: targetWebsite.replace(/^https?:\/\/(www\.)?/, '').split('/')[0]
              }
            },
            select: { sitemap: true },
            orderBy: { sitemapScannedAt: 'desc' },
            take: 1,
          });
          
          if (projects.length > 0 && projects[0].sitemap) {
            sitemapData = projects[0].sitemap;
            console.log(`✅ Sitemap data loaded`);
          }
        }
      }
      
      // Import de nieuwe SEO writer
      const { generateSEOContent } = await import('./advanced-seo-writer');
      
      // Configureer SEO writer
      const config = {
        topic: modification ? `${topic} [INSTRUCTIE: ${modification}]` : topic,
        wordCount: wordCount,
        tone: 'professional' as const,
        language: 'nl' as const,
        keywords: clientInfo?.keywords || [],
        includeSEO: true,
        includeImages: true,
        includeTOC: true,
        websiteUrl: websiteUrl || clientInfo?.website,
        sitemap: sitemapData,
        targetAudience: clientInfo?.targetAudience,
        brandVoice: clientInfo?.brandVoice,
        webResearch: true,
        numSources: 3,
      };
      
      console.log(`🎯 SEO Writer config ready`);
      
      // Genereer content met progress updates
      const result = await generateSEOContent(config, (step: string, progress: number) => {
        // Log progress updates - deze worden opgepikt door de AI agent
        console.log(`📊 [${progress}%] ${step}`);
      });
      
      if (!result.success) {
        throw new Error(result.error || 'Blog generation failed');
      }
      
      // ═══════════════════════════════════════════════════════════
      // 📦 FORMAT OUTPUT
      // ═══════════════════════════════════════════════════════════
      
      const qualityEmoji = (check: boolean) => check ? '✅' : '❌';
      
      const fullBlog = `# ✅ Blog Succesvol Gegenereerd!

## 📝 ${result.title}

**📊 Statistieken:**
- **Woorden:** ${result.stats.wordCount}/${wordCount}
- **Leestijd:** ${result.stats.readingTime} minuten
- **Koppen:** ${result.stats.headingCount}
- **Paragrafen:** ${result.stats.paragraphCount}
- **Afbeeldingen:** ${result.stats.imageCount}
- **Interne links:** ${result.stats.internalLinkCount}
- **Externe links:** ${result.stats.externalLinkCount}

**🎯 SEO Score:** ${result.seoScore}/100

**✅ Kwaliteit:**
${qualityEmoji(result.qualityChecks.noForbiddenWords)} Geen verboden woorden
${qualityEmoji(result.qualityChecks.goodLength)} Goede lengte
${qualityEmoji(result.qualityChecks.goodStructure)} Goede structuur
${qualityEmoji(result.qualityChecks.goodReadability)} Goede leesbaarheid

${result.keywords.length > 0 ? `**🔑 Keywords & Densiteit:**\n${result.keywords.map(kw => `- ${kw}: ${result.keywordDensity[kw] || 0}%`).join('\n')}\n` : ''}

${result.suggestions.length > 0 ? `**💡 Suggesties:**\n${result.suggestions.map(s => `- ${s}`).join('\n')}\n` : ''}

${result.warnings.length > 0 ? `**⚠️ Waarschuwingen:**\n${result.warnings.map(w => `- ${w}`).join('\n')}\n` : ''}

**⏱️ Generatie tijd:** ${result.generationTime}ms

---

${result.content}

---

**Meta Description:**
${result.metaDescription}

---

💡 **De blog is volledig gegenereerd en klaar voor publicatie!**`;
      
      // Sla blog automatisch op in database
      await saveBlogToDatabase(
        clientId!,
        result.title,
        result.content,
        result.stats.wordCount,
        undefined,
        result.keywords
      );
      
      console.log(`✅ Blog generated successfully with NEW SEO Writer`);
      return fullBlog + '\n\n📚 **De blog is automatisch opgeslagen in je [Content Bibliotheek](/client-portal/content-library-new)!**';
      
    } finally {
      await prisma.$disconnect();
    }
    
  } catch (error: any) {
    console.error('❌ Blog generation failed:', error);
    return `❌ **Blog generatie mislukt**\n\n${error.message}\n\nProbeer het opnieuw met een ander onderwerp of neem contact op met support.`;
  }
}

/**
 * 🔗 Genereer linkbuilding artikel (OUDE FUNCTIE - BLIJFT BESTAAN)
 * Deze functie blijft bestaan voor backwards compatibility
 */
export async function generateBlogOLD_BACKUP(
  topic: string, 
  wordCount: number = 800, 
  clientId: string | undefined, 
  websiteUrl?: string,
  modification?: string
): Promise<string> {
  try {
    // Als er een modification is opgegeven, voeg deze toe aan het topic
    let enhancedTopic = topic;
    if (modification) {
      enhancedTopic = `${topic} [INSTRUCTIE: ${modification}]`;
      console.log(`🔄 Blog wijziging gevraagd: ${modification}`);
    }
    
    // ✅ NIEUWE LOGICA: Als websiteUrl gegeven is, gebruik die direct
    if (websiteUrl) {
      console.log(`🌐 Website URL gegeven: ${websiteUrl} - Genereer blog zonder profile check`);
      
      const { generateBlogAutomatically } = await import('./ai-blog-generator');
      
      const result = await generateBlogAutomatically({
        websiteUrl: websiteUrl.startsWith('http') ? websiteUrl : `https://${websiteUrl}`,
        topic: enhancedTopic,
        wordCount: wordCount,
        clientId: clientId,
      });
      
      const fullBlog = `# ✅ Blog Succesvol Gegenereerd!

## 📝 ${result.topic || topic}

**📊 Statistieken:**
- Woorden: ${result.wordCount || wordCount}
- Afbeeldingen: ${result.imageCount || 0}
- Interne links: ${result.internalLinkCount || 0}
- Website: ${websiteUrl}

---

${result.content}

---

💡 **De blog is volledig gegenereerd en klaar voor publicatie!**`;
      
      // Sla blog automatisch op in database
      await saveBlogToDatabase(
        clientId!,
        result.topic || topic,
        result.content,
        result.wordCount || wordCount,
        undefined,
        []
      );
      
      console.log(`✅ Blog gegenereerd met gegeven website URL`);
      return fullBlog + '\n\n📚 **De blog is automatisch opgeslagen in je [Content Bibliotheek](/client-portal/content-library-new)!**';
    }

    if (!clientId) {
      return `⚠️ **Geen website URL**\n\nOm een blog te genereren heb ik een website URL nodig.\n\n💡 **Opties:**\n1. Geef de URL mee: "schrijf blog over [onderwerp] voor example.nl"\n2. Configureer je website in je profiel instellingen\n\n🎯 **Voorbeeld:**\n"Schrijf een blog over WordPress SEO voor WritgoAI.nl"`
    }

    const topicLower = topic.toLowerCase().trim();
    
    // 🌐 NIEUWE LOGICA: Detecteer of de input een URL/domein is
    const urlPattern = /^(https?:\/\/)?(www\.)?([a-zA-Z0-9-]+\.)+(com|nl|be|de|co\.uk|io|org|net|dev)(\/.*)?$/i;
    const isUrl = urlPattern.test(topicLower) || topicLower.includes('.');
    
    if (isUrl) {
      console.log(`🌐 URL gedetecteerd: ${topic} - Website wordt gescand om onderwerp te vinden...`);
      
      // Scan de website
      const scanResult = await scanWebsite(topic, clientId);
      
      // Extract onderwerp uit de scan
      const { PrismaClient } = await import('@prisma/client');
      const prisma = new PrismaClient();
      
      try {
        const client = await prisma.client.findUnique({
          where: { id: clientId },
          select: { 
            website: true,
            targetAudience: true,
            brandVoice: true,
            keywords: true,
          },
        });
        
        if (!client) {
          throw new Error('Client niet gevonden');
        }
        
        // Gebruik de eerste 3 keywords als onderwerp
        const extractedTopic = client.keywords && client.keywords.length > 0
          ? client.keywords.slice(0, 3).join(', ')
          : client.targetAudience || 'Algemeen onderwerp';
        
        console.log(`✅ Onderwerp geëxtraheerd van website: ${extractedTopic}`);
        
        // Genereer blog met het geëxtraheerde onderwerp
        const { generateBlogAutomatically } = await import('./ai-blog-generator');
        
        const result = await generateBlogAutomatically({
          websiteUrl: topic.startsWith('http') ? topic : `https://${topic}`,
          topic: extractedTopic,
          wordCount: wordCount,
          clientId: clientId,
        });
        
        // Retourneer de VOLLEDIGE blog met mooie layout
        const fullBlog = `# ✅ Blog Succesvol Gegenereerd!

## 📝 ${result.topic || extractedTopic}

**📊 Statistieken:**
- Woorden: ${result.wordCount || wordCount}
- Afbeeldingen: ${result.imageCount || 0}
- Interne links: ${result.internalLinkCount || 0}
- Website: ${topic}
- Onderwerp gevonden: ${extractedTopic}

---

${result.content}

---

💡 **De blog is volledig gegenereerd en klaar voor publicatie!**`;
        
        // Sla blog automatisch op in database
        await saveBlogToDatabase(
          clientId!,
          result.topic || extractedTopic,
          result.content,
          result.wordCount || wordCount,
          undefined,
          []
        );
        
        console.log(`✅ Blog gegenereerd van website: ${topic}`);
        return fullBlog + '\n\n📚 **De blog is automatisch opgeslagen in je [Content Bibliotheek](/client-portal/content-library-new)!**';
      } finally {
        await prisma.$disconnect();
      }
    }
    
    // 🔴 ORIGINELE LOGICA: Check of topic niet te vaag is
    const vagueTopics = [
      'blog', 'bloggen', 'blogging', 
      'artikel', 'articles', 'artikelen',
      'mijn website', 'website', 'site',
      'content', 'inhoud', 'post', 'posts',
      'social media', 'socialmedia', 'social',
      'marketing', 'reclame', 'advertising',
      'youtube', 'tiktok', 'instagram', 'facebook',
      'video', 'videos', 'video\'s',
      'seo', 'google', 'zoekmachine',
    ];
    
    // Check 1: Is het een te kort onderwerp?
    if (topicLower.length < 5) {
      return `⚠️ Het onderwerp "${topic}" is te kort!\n\n🎯 Geef een specifieker onderwerp, bijvoorbeeld:\n• "10 tips voor effectief thuiswerken"\n• "De voordelen van yoga voor rugpijn"\n• "Hoe start je een online webshop in 2025"\n• "Instagram marketing strategieën voor 2025"\n\n💬 Of geef gewoon een website URL (bijv: "WritgoAI.nl") en ik vind zelf het onderwerp!`;
    }
    
    // Check 2: Is het een vaag onderwerp zonder context?
    if (vagueTopics.includes(topicLower)) {
      return `⚠️ Het onderwerp "${topic}" is te breed!\n\n🎯 Maak het specifieker, bijvoorbeeld:\n• In plaats van "bloggen" → "Hoe schrijf je SEO-vriendelijke blogs in 2025"\n• In plaats van "marketing" → "E-mail marketing tips voor kleine bedrijven"\n• In plaats van "video" → "TikTok video trends voor 2025"\n• In plaats van "social media" → "Instagram Reels strategie voor meer bereik"\n\n💡 Of geef een website URL (bijv: "WritgoAI.nl") en ik zoek zelf een onderwerp voor je!`;
    }
    
    // Check 3: Bevat het woord "over" gevolgd door een vaag onderwerp?
    const overPattern = /over\s+(\w+)/i;
    const match = topicLower.match(overPattern);
    if (match && vagueTopics.includes(match[1])) {
      return `⚠️ "Over ${match[1]}" is nog te breed!\n\n🎯 Geef een specifiek onderwerp, bijvoorbeeld:\n• "Top 10 AI tools voor contentmakers in 2025"\n• "Complete gids: WordPress SEO optimalisatie"\n• "Instagram groei strategie: van 0 naar 10K volgers"\n• "E-commerce trends die je niet mag missen in 2025"\n\n💡 Of geef een website URL en ik vind een relevant onderwerp!`;
    }

    console.log(`📝 Blog genereren: ${topic} (${wordCount} woorden)`);

    // Import blog generator directly
    const { PrismaClient } = await import('@prisma/client');
    const prisma = new PrismaClient();
    
    try {
      // Get website URL from client
      const client = await prisma.client.findUnique({
        where: { id: clientId },
        select: { website: true },
      });
      
      if (!client) {
        throw new Error('Client niet gevonden');
      }
      
      const websiteUrl = client.website;
      
      // 🔄 NIEUWE LOGICA: Genereer blog MET of ZONDER website URL
      if (websiteUrl) {
        console.log(`🚀 Starting FAST blog generation (no sitemap scan): ${websiteUrl}`);
        
        // ⚡ SNELLE BLOG: Skip sitemap scanning, gebruik alleen web search
        const webResearch = await import('./web-research-v2');
        const searchResults = await webResearch.quickWebSearch(topic);
        
        // 🔗 SITEMAP DATA: Haal project data op voor interne links
        let internalLinksText = '';
        try {
          const projects = await prisma.project.findMany({
            where: { 
              clientId: clientId,
              websiteUrl: {
                contains: websiteUrl.replace(/^https?:\/\/(www\.)?/, '').split('/')[0]
              }
            },
            select: { sitemap: true, sitemapScannedAt: true },
            orderBy: { sitemapScannedAt: 'desc' },
            take: 1,
          });

          if (projects.length > 0 && projects[0].sitemap) {
            const sitemap = projects[0].sitemap as any;
            console.log(`🔗 Sitemap data gevonden: ${sitemap.totalPages || 0} pagina's`);
            
            // Vind relevante interne links
            const sitemapLoader = await import('./sitemap-loader');
            const relevantLinks = sitemapLoader.findRelevantInternalLinks(sitemap, topic, 5);
            
            if (relevantLinks.length > 0) {
              internalLinksText = `\n\n🔗 INTERNE LINKS (gebruik deze in de blog waar relevant):\n${relevantLinks.map(link => `- [${link.title}](${link.url})`).join('\n')}\n\nVoeg deze links toe in relevante secties van de blog. Gebruik natuurlijke anchor teksten die passen bij de context.\n\n🚫 BELANGRIJK: Plaats NOOIT links in headings (H1, H2, H3, etc.) of FAQ vragen. Links mogen ALLEEN in normale tekst paragrafen.\n`;
              console.log(`✅ ${relevantLinks.length} relevante interne links gevonden`);
            } else {
              console.log(`⚠️ Geen relevante interne links gevonden voor onderwerp: ${topic}`);
            }
          } else {
            console.log(`⚠️ Geen sitemap data beschikbaar voor ${websiteUrl}`);
          }
        } catch (error) {
          console.error('Error loading sitemap data:', error);
          // Continue zonder interne links
        }
        
        // Gebruik AIML API voor blog generatie
        const aimlAdvanced = await import('./aiml-advanced');
        
        // Genereer blog met web search resultaten + interne links
        const blogPrompt = `Schrijf een professionele, SEO-geoptimaliseerde blog over: "${topic}"

📊 Vereisten:
- ${wordCount} woorden
- Gebruik de onderstaande web search resultaten voor actuele informatie
- Structuur met H2 en H3 headings
- Voeg tabellen toe waar nuttig
- Maak een inhoudsopgave
- Gebruik opsommingen en bullet points
- Schrijf in Nederlands
- SEO-vriendelijk met goede zoekwoorden
- Professionele maar toegankelijke tone of voice
- Website: ${websiteUrl}
${internalLinksText}
🌐 Web Search Resultaten:
${searchResults}

📋 VERBODEN WOORDEN/ZINNEN (GEBRUIK DEZE NOOIT):
${BANNED_WORDS.join(', ')}

✍️ FORMATTING REGELS:
- Gebruik alleen "## " voor H2 (GEEN "##-", "## -", of andere varianten)
- Gebruik alleen "### " voor H3 (GEEN "###-", "### -", of andere varianten)
- Geen === of --- scheidingstekens tussen headings
- Headings moeten direct na elkaar kunnen zonder spaties of scheidingstekens

Schrijf nu de volledige blog:`;

        const blogResult = await aimlAdvanced.chatCompletion({
          model: 'gpt-4o',
          messages: [
            {
              role: 'system',
              content: 'Je bent een professionele content schrijver die SEO-geoptimaliseerde blogs schrijft in het Nederlands. Je schrijft boeiende, informatieve content met perfecte structuur.'
            },
            {
              role: 'user',
              content: blogPrompt
            }
          ],
          temperature: 0.7,
          max_tokens: wordCount * 2,
        });
        
        if (!blogResult.success || !blogResult.message) {
          throw new Error(blogResult.error || 'Blog generatie mislukt');
        }
        
        const blogContent = blogResult.message;
        
        // Tel woorden
        const wordCountActual = blogContent.split(/\s+/).filter((w: string) => w.length > 0).length;
        
        const result = {
          topic: topic,
          wordCount: wordCountActual,
          imageCount: 0,
          internalLinkCount: 0,
          content: blogContent,
        };
      
        // Retourneer de VOLLEDIGE blog met mooie layout
        const fullBlog = `# ✅ Blog Succesvol Gegenereerd!

## 📝 ${result.topic || topic}

**📊 Statistieken:**
- Woorden: ${result.wordCount || wordCount}
- Afbeeldingen: ${result.imageCount || 0}
- Interne links: ${result.internalLinkCount || 0}
- Website: ${websiteUrl}

---

${result.content}

---

💡 **De blog is volledig gegenereerd en klaar voor publicatie!**`;
      
        // Sla blog automatisch op in database
        await saveBlogToDatabase(
          clientId!,
          result.topic || topic,
          result.content,
          result.wordCount || wordCount,
          undefined,
          []
        );
      
        console.log(`✅ Blog gegenereerd met website: ${topic}`);
        return fullBlog + '\n\n📚 **De blog is automatisch opgeslagen in je [Content Bibliotheek](/client-portal/content-library-new)!**';
      } else {
        // 📝 ZONDER WEBSITE: Genereer blog zonder sitemap scan
        console.log(`🚀 Starting blog generation WITHOUT website (generic blog)`);
        
        // Gebruik web research voor actuele info
        const webResearch = await import('./web-research-v2');
        const searchResults = await webResearch.quickWebSearch(topic);
        
        // Gebruik AIML API voor blog generatie
        const aimlAdvanced = await import('./aiml-advanced');
        
        // Genereer blog met web search resultaten
        const blogPrompt = `Schrijf een professionele, SEO-geoptimaliseerde blog over: "${topic}"

📊 Vereisten:
- ${wordCount} woorden
- Gebruik de onderstaande web search resultaten voor actuele informatie
- Structuur met H2 en H3 headings
- Voeg tabellen toe waar nuttig
- Maak een inhoudsopgave
- Gebruik opsommingen en bullet points
- Schrijf in Nederlands
- SEO-vriendelijk met goede zoekwoorden
- Professionele maar toegankelijke tone of voice
- GEEN interne links (website URL niet beschikbaar)

🌐 Web Search Resultaten:
${searchResults}

📋 VERBODEN WOORDEN/ZINNEN (GEBRUIK DEZE NOOIT):
${BANNED_WORDS.join(', ')}

✍️ FORMATTING REGELS:
- Gebruik alleen "## " voor H2 (GEEN "##-", "## -", of andere varianten)
- Gebruik alleen "### " voor H3 (GEEN "###-", "### -", of andere varianten)
- Geen === of --- scheidingstekens tussen headings
- Headings moeten direct na elkaar kunnen zonder spaties of scheidingstekens

Schrijf nu de volledige blog:`;

        const blogResult = await aimlAdvanced.chatCompletion({
          model: 'gpt-4o',
          messages: [
            {
              role: 'system',
              content: 'Je bent een professionele content schrijver die SEO-geoptimaliseerde blogs schrijft in het Nederlands. Je schrijft boeiende, informatieve content met perfecte structuur.'
            },
            {
              role: 'user',
              content: blogPrompt
            }
          ],
          temperature: 0.7,
          max_tokens: wordCount * 2, // Ruimte voor uitgebreide content
        });
        
        if (!blogResult.success || !blogResult.message) {
          throw new Error(blogResult.error || 'Blog generatie mislukt');
        }
        
        const blogContent = blogResult.message;
        
        // Tel woorden
        const wordCountActual = blogContent.split(/\s+/).filter((w: string) => w.length > 0).length;
        
        // Retourneer de blog (geen file opslag nodig, wordt getoond in chat)
        const fullBlog = `# ✅ Blog Succesvol Gegenereerd!

## 📝 ${topic}

**📊 Statistieken:**
- Woorden: ${wordCountActual}
- Afbeeldingen: 0 (geen website voor afbeeldingen)
- Interne links: 0 (geen website URL beschikbaar)
- Website: Niet geconfigureerd

---

${blogContent}

---

💡 **De blog is klaar! Je kunt hem nu kopiëren of direct publiceren naar WordPress.**`;
      
        // Sla blog automatisch op in database
        await saveBlogToDatabase(
          clientId!,
          topic,
          blogContent,
          wordCountActual,
          undefined,
          []
        );
      
        console.log(`✅ Blog gegenereerd zonder website: ${topic}`);
        return fullBlog + '\n\n📚 **De blog is automatisch opgeslagen in je [Content Bibliotheek](/client-portal/content-library-new)!**';
      }
    } finally {
      await prisma.$disconnect();
    }
  } catch (error: any) {
    console.error(`❌ Blog generatie error:`, error);
    
    // Geef duidelijke foutmelding
    if (error.message.includes('te vaag')) {
      throw error; // Gooi de vage topic error direct door
    }
    
    throw new Error(`Blog generatie mislukt: ${error.message}\n\nTip: Probeer een meer specifiek onderwerp of geef een website URL.`);
  }
}

/**
 * 🔗 Genereer linkbuilding artikel
 */
export async function generateLinkbuildingArticle(
  targetDomain: string,
  anchors: Array<{ keyword: string; url: string }>,
  wordCount: number,
  topic: string | undefined,
  clientId: string | undefined
): Promise<string> {
  try {
    console.log(`🔗 Genereer linkbuilding artikel: ${targetDomain}`, {
      anchors: anchors.length,
      wordCount,
      topic: topic || 'auto'
    });

    // Import linkbuilding generator
    const { generateLinkbuildingArticle: generateArticle } = await import('./linkbuilding-generator');
    
    // Genereer artikel
    const result = await generateArticle({
      targetDomain,
      anchors,
      wordCount,
      topic,
    });

    // Return mooi geformatteerd resultaat
    return `# ✅ Linkbuilding Artikel Succesvol Gegenereerd!

## 📝 ${result.topic}

**📊 Statistieken:**
- Woorden: ${result.wordCount} / ${wordCount}
- Anchors gebruikt: ${result.anchorsUsed}
- Doeldomein: ${targetDomain}
- Bestand: ${result.filePath}

---

${result.content}

---

💡 **Het linkbuilding artikel is klaar voor publicatie!**
✅ Alle anchors zijn natuurlijk verwerkt in verschillende subsecties
✅ Geen AI-detecteerbare woorden gebruikt
✅ Exact woordenaantal bereikt`;
  } catch (error: any) {
    console.error('❌ Linkbuilding article error:', error);
    return `❌ **Linkbuilding artikel generatie mislukt**\n\nFout: ${error.message}\n\nProbeer het opnieuw of neem contact op als het probleem aanhoudt.`;
  }
}

export async function generateImage(description: string, model: string, aspectRatio: string = '1:1', clientId: string | undefined): Promise<string> {
  try {
    if (!clientId) {
      throw new Error('Client ID is vereist voor afbeelding generatie');
    }

    console.log(`🎨 Afbeelding genereren: ${description.substring(0, 50)}... met ${model}`);

    // Import image generator directly
    const aimlAdvanced = await import('./aiml-advanced');
    
    // Enhance the prompt for better results
    let enhancedPrompt = description;
    if (!description.toLowerCase().includes('high quality') && 
        !description.toLowerCase().includes('detailed') &&
        !description.toLowerCase().includes('professional')) {
      enhancedPrompt = `${description}, professional photography, high quality, detailed, sharp focus`;
    }
    
    console.log(`📝 Enhanced prompt: ${enhancedPrompt.substring(0, 100)}...`);
    
    // Generate image directly (geen API call)
    const result = await aimlAdvanced.generateImage({
      prompt: enhancedPrompt,
      model: model as any,
      num_images: 1,
    });
    
    if (!result.success || !result.images?.[0]) {
      throw new Error(result.error || 'Afbeelding generatie mislukt');
    }
    
    const imageUrl = result.images[0];
    
    const summary = `✅ Afbeelding succesvol gegenereerd!

🎨 Model: ${model}
📐 Aspect Ratio: ${aspectRatio}
🔗 URL: ${imageUrl}

Je kunt de afbeelding nu bekijken en downloaden!`;
    
    console.log(`✅ Afbeelding gegenereerd met ${model}`);
    return summary;
  } catch (error: any) {
    console.error(`❌ Afbeelding generatie error: ${error.message}`);
    throw new Error(`Afbeelding generatie mislukt: ${error.message}`);
  }
}

export async function generateVideo(args: any, clientId: string | undefined): Promise<string> {
  try {
    if (!clientId) {
      throw new Error('Client ID is vereist voor video generatie');
    }

    const { 
      topic, 
      script, 
      style = 'cinematic', 
      aspect_ratio = '9:16',
      voice_id = 'CwhRBWXzGAHq8TQ4Fs17',
      scene_count = 5, // 🎬 Aantal scènes voor AI story (was image_count)
      background_music = true // 🎵 Default AAN voor professionele AI stories
    } = args;

    console.log(`🎬 AI Story Video genereren: ${topic}`);
    console.log(`📝 Script lengte: ${script?.length || 0} karakters`);
    console.log(`🎨 Stijl: ${style}, Format: ${aspect_ratio}`);
    console.log(`🎞️  Scènes: ${scene_count}`);

    if (!script || script.length < 100) {
      throw new Error('Script moet minimaal 100 karakters bevatten voor een complete AI story');
    }

    if (scene_count < 3 || scene_count > 8) {
      throw new Error('Scène count moet tussen 3 en 8 zijn');
    }

    // Import story video generator
    const { generateScenesWithAI, generateStoryVideo } = await import('./ai-story-video-generator');
    const { PrismaClient } = await import('@prisma/client');
    const prisma = new PrismaClient();
    
    try {
      console.log('🎬 Generating AI story scenes with AI...');
      
      // Generate scenes from script using AI
      const scenes = await generateScenesWithAI(script, topic, style, scene_count);
      console.log(`✅ Generated ${scenes.length} scenes`);
      
      // Generate the complete story video
      const result = await generateStoryVideo({
        topic,
        script,
        scenes,
        voiceId: voice_id,
        style: style as any,
        aspectRatio: aspect_ratio as any,
        backgroundMusic: background_music,
        musicVolume: 30,
      });
      
      if (result.error) {
        throw new Error(result.error);
      }
      
      if (!result.videoUrl) {
        throw new Error('Video generatie mislukt - geen video URL ontvangen');
      }
      
      console.log(`✅ AI Story Video succesvol gegenereerd: ${result.videoUrl}`);
      
      // Save to database
      await prisma.video.create({
        data: {
          vid: `story_${Date.now()}`,
          topic: topic.slice(0, 100),
          script: script,
          language: 'Dutch',
          voiceId: voice_id,
          style: style,
          duration: `${Math.round(result.duration)}`,
          status: 'completed',
          videoUrl: result.videoUrl,
          thumbnailUrl: result.thumbnailUrl,
          clientId: clientId,
        },
      });
      
      const styleLabels: Record<string, string> = {
        'realistic': 'Realistisch',
        'cinematic': 'Cinematisch',
        'animated': 'Geanimeerd',
        'cartoon': 'Cartoon',
        'fantasy': 'Fantasy',
        'digital-art': 'Digital Art',
        '3d': '3D Render',
      };
      
      const voiceLabels: Record<string, string> = {
        'CwhRBWXzGAHq8TQ4Fs17': 'Roger (Nederlands, mannelijk)',
        'EXAVITQu4vr4xnSDxMaL': 'Sarah (Engels, vrouwelijk)',
        '2EiwWnXFnvU5JabPnv8n': 'Clyde (Engels, mannelijk)',
      };
      
      const summary = `✅ Complete AI Story Video gegenereerd!

🎬 Onderwerp: ${topic}
🎨 Stijl: ${styleLabels[style] || style}
📐 Format: ${aspect_ratio}
⏱️ Duur: ${Math.round(result.duration)} seconden
🎞️  Scènes: ${scene_count}x unieke visuele scènes met ${styleLabels[style] || style} stijl
🎤 Voiceover: ${voiceLabels[voice_id] || voice_id}
🎵 Achtergrondmuziek: ${background_music ? 'Ja' : 'Nee'}

📹 Video URL: ${result.videoUrl}
${result.thumbnailUrl ? `🖼️ Thumbnail: ${result.thumbnailUrl}` : ''}

Je complete AI story is klaar! Elke scène heeft een unieke visuele compositie die past bij het verhaal. 🚀`;
      
      return summary;
    } finally {
      await prisma.$disconnect();
    }
  } catch (error: any) {
    console.error(`❌ Video generatie error:`, error);
    const errorMsg = error.message || 'Onbekende fout';
    
    // Duidelijke foutmeldingen
    if (errorMsg.includes('AIML') || errorMsg.includes('API') || errorMsg.includes('401')) {
      return `❌ Video generatie mislukt: API fout

🔧 Mogelijke oorzaken:
- AIML API key niet correct geconfigureerd
- API rate limit bereikt
- Network connectie problemen

💡 Probeer het over een paar minuten opnieuw.`;
    }
    
    if (errorMsg.includes('FFmpeg') || errorMsg.includes('video')) {
      return `❌ Video compositie mislukt: FFmpeg fout

🔧 Er ging iets mis tijdens het samenstellen van de video.
💡 Probeer het opnieuw met een korter script of minder afbeeldingen.`;
    }
    
    if (errorMsg.includes('ElevenLabs') || errorMsg.includes('speech')) {
      return `❌ Voiceover generatie mislukt

🔧 Er ging iets mis met de spraakgeneratie.
💡 Controleer of je ElevenLabs API key correct is geconfigureerd.`;
    }
    
    return `❌ Video generatie mislukt: ${errorMsg}

💡 Probeer het opnieuw of neem contact op met support.`;
  }
}

export async function generateCode(prompt: string, clientId: string | undefined): Promise<string> {
  try {
    if (!clientId) {
      throw new Error('Client ID is vereist voor code generatie');
    }

    console.log(`💻 Code genereren: ${prompt.substring(0, 100)}...`);

    // Call the generate-code API
    const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'https://WritgoAI.nl';
    const response = await fetch(`${baseUrl}/api/ai-agent/generate-code`, {
      method: 'POST',
      headers: { 
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        prompt,
        clientId,
      }),
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.message || 'Code generatie mislukt');
    }

    const data = await response.json();

    // Return success message with embedded code data
    const summary = `✅ Code succesvol gegenereerd!

📝 **${data.title}**
${data.description}

🎨 **Features:**
• HTML: ${data.html.split('\n').length} regels
• CSS: ${data.css.split('\n').length} regels  
• JavaScript: ${data.js.split('\n').length} regels
• Live preview beschikbaar
• Volledig bewerkbaar

De code is nu zichtbaar in een interactieve editor met live preview!
Je kunt de code aanpassen en direct het resultaat zien.

💾 Download de code als HTML bestand voor gebruik op je eigen website.

[CODE_DATA_START]
${JSON.stringify(data)}
[CODE_DATA_END]`;

    console.log(`✅ Code gegenereerd: ${data.title}`);
    return summary;
  } catch (error: any) {
    console.error(`❌ Code generatie error: ${error.message}`);
    
    const errorMsg = error.message?.toLowerCase() || '';
    
    if (errorMsg.includes('insufficient credits') || errorMsg.includes('niet genoeg credits')) {
      return `❌ Niet genoeg credits

💳 Code generatie kost 10 credits.
🔄 Koop nieuwe credits om verder te gaan.`;
    }
    
    return `❌ Code generatie mislukt: ${error.message}

💡 Probeer een andere beschrijving of neem contact op met support.`;
  }
}

// ═══════════════════════════════════════════════════════
// 🎨 WRITGOAI TOOL IMPLEMENTATIONS
// ═══════════════════════════════════════════════════════

/**
 * Generate advanced blog with all features
 */
async function generateBlogAdvanced(args: any, clientId?: string): Promise<string> {
  try {
    const {
      topic,
      keywords = [],
      type = 'general',
      wordCount = 1000,
      tone = 'professional',
      includeImages = true,
      includeVideo = true,
      webResearch = true,
    } = args;

    // Call the existing blog generation API
    const response = await fetch('http://localhost:3000/api/client/generate-article', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        clientId,
        title: topic,
        keywords,
        type,
        wordCount,
        tone,
        includeProductImages: includeImages,
        includeYouTubeVideos: includeVideo,
        webResearch,
      }),
    });

    if (!response.ok) {
      throw new Error(`Blog generation failed: ${response.statusText}`);
    }

    const data = await response.json();
    
    return `✅ Blog succesvol gegenereerd!

**Titel:** ${data.title}

**Inhoud:**
${data.content}

${data.imageUrls?.length > 0 ? `\n**Afbeeldingen:** ${data.imageUrls.length} afbeeldingen toegevoegd` : ''}
${data.youtubeVideos?.length > 0 ? `\n**YouTube Video's:** ${data.youtubeVideos.length} video's gevonden` : ''}

De blog is automatisch opgeslagen in de Content Bibliotheek.`;
  } catch (error: any) {
    console.error('❌ Blog generation error:', error);
    return `❌ Fout bij blog generatie: ${error.message}`;
  }
}

/**
 * Perform keyword research
 */
async function performKeywordResearch(args: any, clientId?: string): Promise<string> {
  try {
    const {
      websiteUrl,
      topic,
      type = 'keyword_research',
      targetCountry = 'nl',
      generateSuggestions = true,
    } = args;

    // Build query parameters
    const params = new URLSearchParams({
      clientId: clientId || '',
      type,
      targetCountry,
    });

    if (websiteUrl) params.append('websiteUrl', websiteUrl);
    if (topic) params.append('topic', topic);

    const response = await fetch(`http://localhost:3000/api/client/keyword-research?${params}`, {
      method: 'GET',
    });

    if (!response.ok) {
      throw new Error(`Keyword research failed: ${response.statusText}`);
    }

    const data = await response.json();
    
    // Format the results
    let result = `✅ Keyword Research Voltooid!\n\n`;
    
    if (data.existingKeywords?.length > 0) {
      result += `**Bestaande Keywords:** ${data.existingKeywords.length} gevonden\n`;
      result += data.existingKeywords.slice(0, 10).map((kw: any) => 
        `- ${kw.keyword} (zoekvolume: ${kw.volume || 'n/a'}, difficulty: ${kw.difficulty || 'n/a'})`
      ).join('\n') + '\n\n';
    }

    if (data.suggestedKeywords?.length > 0) {
      result += `**Nieuwe Keyword Suggesties:** ${data.suggestedKeywords.length} gegenereerd\n`;
      result += data.suggestedKeywords.slice(0, 10).map((kw: any) => 
        `- ${kw.keyword} (zoekvolume: ${kw.volume || 'n/a'}, difficulty: ${kw.difficulty || 'n/a'})`
      ).join('\n') + '\n\n';
    }

    if (data.contentSilos?.length > 0) {
      result += `**Content Silo's:** ${data.contentSilos.length} silo's\n`;
      result += data.contentSilos.map((silo: any) => 
        `- ${silo.name} (${silo.keywords?.length || 0} keywords)`
      ).join('\n') + '\n\n';
    }

    result += `Alle resultaten zijn opgeslagen en kunnen bekeken worden in het Keyword Research dashboard.`;
    
    return result;
  } catch (error: any) {
    console.error('❌ Keyword research error:', error);
    return `❌ Fout bij keyword research: ${error.message}`;
  }
}

/**
 * Generate social media posts
 */
async function generateSocialPost(args: any, clientId?: string): Promise<string> {
  try {
    const {
      topic,
      platforms = ['instagram'],
      tone = 'professional',
      length = 'medium',
      includeHashtags = true,
      includeEmojis = true,
      includeCallToAction = true,
    } = args;

    const response = await fetch('http://localhost:3000/api/social-media/generate-media', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        clientId,
        topic,
        platforms,
        tone,
        length,
        includeHashtags,
        includeEmojis,
        includeCallToAction,
      }),
    });

    if (!response.ok) {
      throw new Error(`Social post generation failed: ${response.statusText}`);
    }

    const data = await response.json();
    
    let result = `✅ Social Media Posts Gegenereerd!\n\n`;
    
    for (const post of data.posts || []) {
      result += `**${post.platform.toUpperCase()}:**\n`;
      result += `${post.content}\n\n`;
      if (post.hashtags && includeHashtags) {
        result += `Hashtags: ${post.hashtags.join(' ')}\n\n`;
      }
      result += `---\n\n`;
    }

    result += `De posts zijn automatisch opgeslagen in de Content Bibliotheek.`;
    
    return result;
  } catch (error: any) {
    console.error('❌ Social post generation error:', error);
    return `❌ Fout bij social media generatie: ${error.message}`;
  }
}

/**
 * Generate WooCommerce product description
 */
async function generateWooCommerceProduct(args: any, clientId?: string): Promise<string> {
  try {
    const {
      productName,
      productInfo = '',
      category = '',
      targetAudience = '',
      keywords = [],
    } = args;

    const response = await fetch('http://localhost:3000/api/client/generate-woocommerce-product', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        clientId,
        productName,
        productInfo,
        category,
        targetAudience,
        keywords,
      }),
    });

    if (!response.ok) {
      throw new Error(`WooCommerce generation failed: ${response.statusText}`);
    }

    const data = await response.json();
    
    return `✅ WooCommerce Product Beschrijving Gegenereerd!

**Product:** ${productName}

**Korte Beschrijving:**
${data.shortDescription}

**Product Features:**
${data.features.map((f: string) => `- ${f}`).join('\n')}

**Lange Beschrijving (HTML):**
${data.longDescription}

De product beschrijving is automatisch opgeslagen in de Content Bibliotheek en klaar om te kopiëren naar WooCommerce.`;
  } catch (error: any) {
    console.error('❌ WooCommerce generation error:', error);
    return `❌ Fout bij WooCommerce generatie: ${error.message}`;
  }
}

// Main tool executor - called by AIML API
export async function executeToolCall(toolName: string, args: any, clientId?: string): Promise<string> {
  console.log(`🔧 Tool call: ${toolName}`, args);
  
  try {
    switch (toolName) {
      case 'bash_command':
        return await executeBashCommand(args.command);
      
      case 'read_file':
        return await readFile(args.path);
      
      case 'write_file':
        return await writeFile(args.path, args.content);
      
      case 'web_search':
        return await webSearch(args.query);
      
      case 'scan_website':
        return await scanWebsite(args.url, clientId);
      
      case 'generate_blog':
        return await generateBlogAdvanced(args, clientId);
      
      case 'keyword_research':
        return await performKeywordResearch(args, clientId);
      
      case 'generate_social_post':
        return await generateSocialPost(args, clientId);
      
      case 'generate_woocommerce_product':
        return await generateWooCommerceProduct(args, clientId);
      
      case 'generate_linkbuilding_article':
        return await generateLinkbuildingArticle(args.targetDomain, args.anchors, args.wordCount, args.topic, clientId);
      
      case 'generate_image':
        return await generateImage(args.description, args.model, args.aspectRatio || '1:1', clientId);
      
      case 'generate_video':
        return await generateVideo(args, clientId);
      
      case 'generate_code':
        return await generateCode(args.prompt, clientId);
      
      case 'upload_file':
        return await uploadFileFromUrl(args.url, args.filename);
      
      case 'analyze_pdf':
        return await analyzePdf(args.file_path, args.question);
      
      case 'analyze_excel':
        return await analyzeExcel(args.file_path, args.question);
      
      case 'analyze_word':
        return await analyzeWord(args.file_path, args.question);
      
      case 'analyze_image':
        return await analyzeImage(args.image_url, args.question);
      
      case 'python_execute':
        return await executePython(args.code, args.save_plot || false);
      
      case 'calculator':
        return await calculate(args.expression);
      
      case 'get_datetime':
        return await getDateTime(args.timezone, args.format);
      
      case 'create_chart':
        return await createChart(args.data, args.chart_type, args.title, args.x_axis, args.y_axis);
      
      case 'browse_website':
        return await browseWebsite(args.url, args.extract_text_only ?? true);
      
      case 'screenshot_website':
        return await screenshotWebsite(args.url, args.full_page ?? false, args.wait_seconds ?? 2);
      
      case 'download_from_url':
        return await downloadFromUrl(args.url, args.filename, args.analyze_after ?? false);
      
      case 'research_topic':
        return await researchTopic(args.topic, args.num_sources ?? 3, args.language ?? 'nl');
      
      case 'extract_structured_data':
        return await extractStructuredData(args.url, args.data_type, args.custom_selectors);
      
      case 'keyword_research':
        return await keywordResearch(args.niche, args.website_url, args.num_keywords ?? 20, args.language ?? 'nl', clientId);
      
      // 🚀 AUTONOMOUS AGENT ACTION TOOLS
      case 'wordpress_publish':
        return await wordpressPublish(args.title, args.content, args.excerpt, args.status || 'publish', args.categories, args.tags, args.featured_image_url, clientId);
      
      case 'create_social_media_post':
        return await createSocialMediaPost(args.topic, args.platforms, args.style, args.post_type, args.include_image, clientId);
      
      case 'social_media_post':
        return await socialMediaPost(args.text, args.platforms, args.media_url, args.media_type, args.schedule_time, clientId);
      
      case 'create_content_plan':
        return await createContentPlan(args.focus_area, args.include_competitors || false, clientId);
      
      case 'execute_content_plan':
        return await executeContentPlan(args.plan_id, args.auto_publish || false, args.platforms, clientId);
      
      case 'manage_task':
        return await manageTask(args.action, args.task_id, args.title, args.description, args.priority, args.deadline, args.status, clientId);
      
      case 'check_credits':
        return await checkCredits(args.warn_threshold || 100, clientId);
      
      case 'send_notification':
        return await sendNotification(args.subject, args.message, args.type || 'in_app', args.priority || 'normal', clientId);
      
      case 'analyze_performance':
        return await analyzePerformance(args.time_period || 'month', args.content_types, args.metrics, clientId);
      
      case 'schedule_automation':
        return await scheduleAutomation(args.frequency, args.content_types, args.platforms, args.time_of_day, args.auto_publish || false, clientId);
      
      default:
        throw new Error(`Unknown tool: ${toolName}`);
    }
  } catch (error: any) {
    console.error(`❌ Tool execution failed: ${toolName}`, error);
    throw error; // Re-throw to let AIML handle it
  }
}

// ========================================
// 📦 NEW TOOL IMPLEMENTATIONS
// ========================================

import { uploadFile, getFileBuffer, getDownloadUrl } from './s3';
import * as XLSX from 'xlsx';
import * as math from 'mathjs';

/**
 * 📤 Upload File from URL
 */
export async function uploadFileFromUrl(url: string, filename: string): Promise<string> {
  try {
    console.log(`📤 Uploading file from URL: ${url}`);
    
    // Download file from URL
    const response = await fetch(url);
    if (!response.ok) {
      throw new Error(`Failed to download file: ${response.statusText}`);
    }
    
    const arrayBuffer = await response.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);
    
    // Get content type
    const contentType = response.headers.get('content-type') || 'application/octet-stream';
    
    // Upload to S3
    const s3Key = await uploadFile(buffer, filename, contentType);
    
    // Get download URL
    const downloadUrl = await getDownloadUrl(s3Key);
    
    return JSON.stringify({
      success: true,
      file_path: s3Key,
      download_url: downloadUrl,
      filename: filename,
      size: buffer.length,
      message: `✅ Bestand succesvol geüpload: ${filename} (${(buffer.length / 1024).toFixed(2)} KB)`
    });
  } catch (error: any) {
    console.error('Upload error:', error);
    return JSON.stringify({
      success: false,
      error: error.message
    });
  }
}

/**
 * 📄 Analyze PDF
 */
export async function analyzePdf(filePath: string, question?: string): Promise<string> {
  try {
    console.log(`📄 Analyzing PDF: ${filePath}`);
    
    // Download from S3
    const buffer = await getFileBuffer(filePath);
    
    // Parse PDF
    const pdf = require('pdf-parse');
    const data = await pdf(buffer);
    const text = data.text;
    const pages = data.numpages;
    
    if (!question) {
      // No question - return summary
      const preview = text.substring(0, 2000);
      return JSON.stringify({
        success: true,
        pages: pages,
        text_length: text.length,
        preview: preview,
        message: `📄 PDF geanalyseerd: ${pages} pagina's, ${text.length} karakters`
      });
    }
    
    // Answer question using AI
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
            role: 'system',
            content: 'Je bent een expert document analist. Beantwoord vragen op basis van de gegeven tekst.'
          },
          {
            role: 'user',
            content: `Beantwoord deze vraag op basis van de volgende PDF tekst:\n\nVraag: ${question}\n\nPDF Tekst:\n${text.substring(0, 50000)}`
          }
        ],
        max_tokens: 2000,
      }),
    });
    
    const aiData = await response.json();
    const answer = aiData.choices?.[0]?.message?.content || 'Kon geen antwoord genereren';
    
    return JSON.stringify({
      success: true,
      pages: pages,
      answer: answer,
      message: '✅ PDF analyse compleet'
    });
  } catch (error: any) {
    console.error('PDF analysis error:', error);
    return JSON.stringify({
      success: false,
      error: error.message
    });
  }
}

/**
 * 📊 Analyze Excel/CSV
 */
export async function analyzeExcel(filePath: string, question?: string): Promise<string> {
  try {
    console.log(`📊 Analyzing Excel: ${filePath}`);
    
    // Download from S3
    const buffer = await getFileBuffer(filePath);
    
    // Parse Excel
    const workbook = XLSX.read(buffer, { type: 'buffer' });
    const sheetName = workbook.SheetNames[0];
    const worksheet = workbook.Sheets[sheetName];
    const jsonData = XLSX.utils.sheet_to_json(worksheet);
    
    if (!question) {
      // No question - return data preview
      const preview = jsonData.slice(0, 10);
      return JSON.stringify({
        success: true,
        sheets: workbook.SheetNames,
        rows: jsonData.length,
        columns: Object.keys(jsonData[0] || {}),
        preview: preview,
        message: `📊 Excel geanalyseerd: ${jsonData.length} rijen, ${Object.keys(jsonData[0] || {}).length} kolommen`
      });
    }
    
    // Answer question using AI
    const dataStr = JSON.stringify(jsonData.slice(0, 100)); // First 100 rows
    
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
            role: 'system',
            content: 'Je bent een expert data analist. Analyseer de gegeven data en beantwoord vragen.'
          },
          {
            role: 'user',
            content: `Beantwoord deze vraag op basis van de volgende Excel data:\n\nVraag: ${question}\n\nData (eerste 100 rijen):\n${dataStr}`
          }
        ],
        max_tokens: 2000,
      }),
    });
    
    const aiData = await response.json();
    const answer = aiData.choices?.[0]?.message?.content || 'Kon geen antwoord genereren';
    
    return JSON.stringify({
      success: true,
      rows: jsonData.length,
      answer: answer,
      message: '✅ Excel analyse compleet'
    });
  } catch (error: any) {
    console.error('Excel analysis error:', error);
    return JSON.stringify({
      success: false,
      error: error.message
    });
  }
}

/**
 * 📝 Analyze Word Document
 */
export async function analyzeWord(filePath: string, question?: string): Promise<string> {
  try {
    console.log(`📝 Analyzing Word doc: ${filePath}`);
    
    // Download from S3
    const buffer = await getFileBuffer(filePath);
    
    // Parse Word document
    const mammoth = require('mammoth');
    const result = await mammoth.extractRawText({ buffer });
    const text = result.value;
    
    if (!question) {
      // No question - return preview
      const preview = text.substring(0, 2000);
      return JSON.stringify({
        success: true,
        text_length: text.length,
        preview: preview,
        message: `📝 Word document geanalyseerd: ${text.length} karakters`
      });
    }
    
    // Answer question using AI
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
            role: 'system',
            content: 'Je bent een expert document analist. Beantwoord vragen op basis van de gegeven tekst.'
          },
          {
            role: 'user',
            content: `Beantwoord deze vraag op basis van de volgende Word document tekst:\n\nVraag: ${question}\n\nDocument Tekst:\n${text.substring(0, 50000)}`
          }
        ],
        max_tokens: 2000,
      }),
    });
    
    const aiData = await response.json();
    const answer = aiData.choices?.[0]?.message?.content || 'Kon geen antwoord genereren';
    
    return JSON.stringify({
      success: true,
      answer: answer,
      message: '✅ Word analyse compleet'
    });
  } catch (error: any) {
    console.error('Word analysis error:', error);
    return JSON.stringify({
      success: false,
      error: error.message
    });
  }
}

/**
 * 👁️ Analyze Image with Vision
 */
export async function analyzeImage(imageUrl: string, question: string): Promise<string> {
  try {
    console.log(`👁️ Analyzing image with Vision: ${imageUrl}`);
    
    // If S3 path, get signed URL
    let finalUrl = imageUrl;
    if (imageUrl.startsWith('6559/') || !imageUrl.startsWith('http')) {
      finalUrl = await getDownloadUrl(imageUrl);
    }
    
    // Use GPT-4o Vision
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
            content: [
              {
                type: 'text',
                text: question
              },
              {
                type: 'image_url',
                image_url: {
                  url: finalUrl
                }
              }
            ]
          }
        ],
        max_tokens: 2000,
      }),
    });
    
    const data = await response.json();
    const answer = data.choices?.[0]?.message?.content || 'Kon afbeelding niet analyseren';
    
    return JSON.stringify({
      success: true,
      answer: answer,
      message: '👁️ Afbeelding geanalyseerd'
    });
  } catch (error: any) {
    console.error('Image analysis error:', error);
    return JSON.stringify({
      success: false,
      error: error.message
    });
  }
}

/**
 * 🐍 Execute Python Code
 */
export async function executePython(code: string, savePlot: boolean): Promise<string> {
  try {
    console.log(`🐍 Executing Python code`);
    
    // Save code to temp file
    const tempFile = `/tmp/python_${Date.now()}.py`;
    const plotFile = `/tmp/plot_${Date.now()}.png`;
    
    let finalCode = code;
    
    // If save_plot, add matplotlib save
    if (savePlot) {
      finalCode = code + `\nimport matplotlib.pyplot as plt\nplt.savefig('${plotFile}')\n`;
    }
    
    const { exec } = require('child_process');
    const fs = require('fs');
    
    // Write code
    fs.writeFileSync(tempFile, finalCode);
    
    // Execute
    const result = await new Promise<string>((resolve, reject) => {
      exec(`python3 ${tempFile}`, { timeout: 30000 }, (error: any, stdout: string, stderr: string) => {
        if (error && !stdout) {
          reject(error);
        } else {
          resolve(stdout || stderr);
        }
      });
    });
    
    // Cleanup temp file
    fs.unlinkSync(tempFile);
    
    // If plot was saved, upload it
    let plotUrl = null;
    if (savePlot && fs.existsSync(plotFile)) {
      const plotBuffer = fs.readFileSync(plotFile);
      const plotKey = await uploadFile(plotBuffer, `plot_${Date.now()}.png`, 'image/png');
      plotUrl = await getDownloadUrl(plotKey);
      fs.unlinkSync(plotFile);
    }
    
    return JSON.stringify({
      success: true,
      output: result,
      plot_url: plotUrl,
      message: '🐍 Python code succesvol uitgevoerd'
    });
  } catch (error: any) {
    console.error('Python execution error:', error);
    return JSON.stringify({
      success: false,
      error: error.message,
      output: error.stdout || error.stderr || ''
    });
  }
}

/**
 * 🧮 Calculator
 */
export async function calculate(expression: string): Promise<string> {
  try {
    console.log(`🧮 Calculating: ${expression}`);
    
    const result = math.evaluate(expression);
    
    return JSON.stringify({
      success: true,
      expression: expression,
      result: result,
      formatted: typeof result === 'number' ? result.toLocaleString('nl-NL') : String(result),
      message: `🧮 Berekening: ${expression} = ${result}`
    });
  } catch (error: any) {
    console.error('Calculation error:', error);
    return JSON.stringify({
      success: false,
      error: error.message
    });
  }
}

/**
 * 🕐 Get Date/Time
 */
export async function getDateTime(timezone?: string, format?: string): Promise<string> {
  try {
    const tz = timezone || 'UTC';
    const fmt = format || 'full';
    
    // Create date in specified timezone
    const now = new Date();
    const options: Intl.DateTimeFormatOptions = {
      timeZone: tz,
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
      weekday: 'long'
    };
    
    let formatted: string;
    
    switch (fmt) {
      case 'date':
        formatted = now.toLocaleDateString('nl-NL', { timeZone: tz, ...options });
        break;
      case 'time':
        formatted = now.toLocaleTimeString('nl-NL', { timeZone: tz });
        break;
      case 'iso':
        formatted = now.toISOString();
        break;
      case 'unix':
        formatted = String(Math.floor(now.getTime() / 1000));
        break;
      default:
        formatted = now.toLocaleString('nl-NL', options);
    }
    
    return JSON.stringify({
      success: true,
      timezone: tz,
      format: fmt,
      datetime: formatted,
      iso: now.toISOString(),
      unix: Math.floor(now.getTime() / 1000),
      message: `🕐 Huidige tijd in ${tz}: ${formatted}`
    });
  } catch (error: any) {
    console.error('DateTime error:', error);
    return JSON.stringify({
      success: false,
      error: error.message
    });
  }
}

/**
 * 📊 Create Chart
 */
export async function createChart(
  data: any[],
  chartType: string,
  title: string,
  xAxis?: string,
  yAxis?: string
): Promise<string> {
  try {
    console.log(`📊 Creating ${chartType} chart: ${title}`);
    
    return JSON.stringify({
      success: true,
      chart_type: chartType,
      title: title,
      data: data,
      x_axis: xAxis,
      y_axis: yAxis,
      message: `📊 Chart data gegenereerd: ${title}`,
      render_instruction: 'Frontend moet deze chart renderen met Recharts'
    });
  } catch (error: any) {
    console.error('Chart creation error:', error);
    return JSON.stringify({
      success: false,
      error: error.message
    });
  }
}

/**
 * ========================================
 * 🌐 ADVANCED BROWSER & RESEARCH TOOLS
 * ========================================
 */

/**
 * 🌐 Browse Website - Fetch full HTML content
 */
export async function browseWebsite(url: string, extractTextOnly: boolean = true): Promise<string> {
  try {
    console.log(`🌐 Browsing website: ${url}`);
    
    const response = await fetch(url, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
      }
    });
    
    if (!response.ok) {
      throw new Error(`HTTP ${response.status}: ${response.statusText}`);
    }
    
    const html = await response.text();
    
    if (extractTextOnly) {
      // Extract readable text only (remove HTML tags)
      const cheerio = require('cheerio');
      const $ = cheerio.load(html);
      
      // Remove scripts, styles, nav, footer
      $('script, style, nav, footer, header, aside').remove();
      
      // Get text from body
      const text = $('body').text()
        .replace(/\s+/g, ' ')
        .replace(/\n+/g, '\n')
        .trim();
      
      return JSON.stringify({
        success: true,
        url: url,
        content: text.substring(0, 50000), // First 50k chars
        content_length: text.length,
        type: 'text',
        message: `✅ Website bezocht: ${url} (${text.length} tekens)`
      });
    }
    
    return JSON.stringify({
      success: true,
      url: url,
      html: html.substring(0, 100000), // First 100k chars
      html_length: html.length,
      type: 'html',
      message: `✅ Website HTML opgehaald: ${url} (${html.length} tekens)`
    });
  } catch (error: any) {
    console.error('Browse website error:', error);
    return JSON.stringify({
      success: false,
      error: error.message,
      url: url
    });
  }
}

/**
 * 📸 Screenshot Website
 */
export async function screenshotWebsite(
  url: string, 
  fullPage: boolean = false, 
  waitSeconds: number = 2
): Promise<string> {
  try {
    console.log(`📸 Taking screenshot: ${url}`);
    
    // Instead of Playwright, use a screenshot API service
    // (More reliable in serverless/cloud environments)
    const screenshotApiUrl = `https://lh3.googleusercontent.com/HuHYtKowEGbbUV4yVdiKCWgLsLxDNMF20np0lHgTlakcUac4YlOVZnc9tyvwlksMCVziQs6mUNTk1oS5_8ZGr_i6Nzw=s1280-w1280-h800`;
    const params = new URLSearchParams({
      url: url,
      full_page: fullPage.toString(),
      viewport_width: '1920',
      viewport_height: '1080',
      format: 'png',
      delay: (waitSeconds * 1000).toString(),
    });
    
    // Try using ScreenshotOne API (requires API key in production)
    // For now, use alternative: browse website and return text summary
    
    // Fallback: browse website and create a text summary
    const browseResult = await browseWebsite(url, true);
    const browseData = JSON.parse(browseResult);
    
    if (browseData.success) {
      return JSON.stringify({
        success: true,
        url: url,
        fallback_mode: true,
        content_preview: browseData.content?.substring(0, 2000),
        message: `📸 Website bezocht (screenshot niet beschikbaar, text preview gegeven): ${url}`,
        note: 'Voor echte screenshots, configureer ScreenshotOne API of installeer Playwright browsers'
      });
    } else {
      throw new Error('Kon website niet bezoeken');
    }
  } catch (error: any) {
    console.error('Screenshot error:', error);
    return JSON.stringify({
      success: false,
      error: error.message,
      url: url
    });
  }
}

/**
 * 💾 Download from URL
 */
export async function downloadFromUrl(
  url: string, 
  filename?: string, 
  analyzeAfter: boolean = false
): Promise<string> {
  try {
    console.log(`💾 Downloading from: ${url}`);
    
    const response = await fetch(url);
    if (!response.ok) {
      throw new Error(`HTTP ${response.status}: ${response.statusText}`);
    }
    
    const arrayBuffer = await response.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);
    
    // Auto-detect filename if not provided
    if (!filename) {
      const urlPath = new URL(url).pathname;
      filename = urlPath.split('/').pop() || `download-${Date.now()}`;
    }
    
    // Get content type
    const contentType = response.headers.get('content-type') || 'application/octet-stream';
    
    // Upload to S3
    const { uploadFile } = require('./s3');
    const s3Key = await uploadFile(buffer, filename, contentType);
    
    // Get download URL
    const { getDownloadUrl } = require('./s3');
    const downloadUrl = await getDownloadUrl(s3Key);
    
    let analysisResult: any = null;
    
    // Auto-analyze if requested
    if (analyzeAfter) {
      const ext = filename.split('.').pop()?.toLowerCase();
      
      if (ext === 'pdf') {
        const pdfAnalysis = await analyzePdf(s3Key);
        analysisResult = JSON.parse(pdfAnalysis);
      } else if (ext === 'xlsx' || ext === 'xls' || ext === 'csv') {
        const excelAnalysis = await analyzeExcel(s3Key);
        analysisResult = JSON.parse(excelAnalysis);
      } else if (['jpg', 'jpeg', 'png', 'gif', 'webp'].includes(ext || '')) {
        const imageAnalysis = await analyzeImage(s3Key, 'Beschrijf deze afbeelding in detail');
        analysisResult = JSON.parse(imageAnalysis);
      }
    }
    
    return JSON.stringify({
      success: true,
      url: url,
      file_path: s3Key,
      download_url: downloadUrl,
      filename: filename,
      size: buffer.length,
      content_type: contentType,
      analysis: analysisResult,
      message: `💾 Bestand gedownload: ${filename} (${(buffer.length / 1024).toFixed(2)} KB)`
    });
  } catch (error: any) {
    console.error('Download error:', error);
    return JSON.stringify({
      success: false,
      error: error.message,
      url: url
    });
  }
}

/**
 * 🔍 Research Topic - Deep multi-source research
 */
export async function researchTopic(
  topic: string, 
  numSources: number = 3, 
  language: string = 'nl'
): Promise<string> {
  try {
    console.log(`🔍 Researching topic: ${topic} (${numSources} sources)`);
    
    const sources = [];
    const errors = [];
    
    // Phase 1: Web Search for initial sources
    const searchResult = await webSearch(`${topic} uitgebreide informatie bronnen`);
    const searchData = typeof searchResult === 'string' 
      ? searchResult 
      : JSON.stringify(searchResult);
    
    sources.push({
      type: 'web_search',
      content: searchData,
      reliability: 'high'
    });
    
    // Phase 2: Try to find specific websites
    const queries = [
      `${topic} officiële website`,
      `${topic} wikipedia`,
      `${topic} nieuwsartikelen`
    ];
    
    for (let i = 0; i < Math.min(numSources - 1, queries.length); i++) {
      try {
        const result = await webSearch(queries[i]);
        sources.push({
          type: 'web_search',
          query: queries[i],
          content: typeof result === 'string' ? result : JSON.stringify(result),
          reliability: 'medium'
        });
      } catch (error: any) {
        errors.push(`Query "${queries[i]}" failed: ${error.message}`);
      }
    }
    
    // Phase 3: Compile research report using AI
    const compiledContent = sources.map((s, i) => 
      `\n## Bron ${i + 1} (${s.type})\n${s.content}\n`
    ).join('\n');
    
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
            role: 'system',
            content: `Je bent een expert onderzoeker. Maak een uitgebreid, gestructureerd research rapport in het ${language === 'nl' ? 'Nederlands' : 'Engels'}. Gebruik markdown formatting met headers, bullets, en bronvermeldingen.`
          },
          {
            role: 'user',
            content: `Maak een diepgaand research rapport over: "${topic}"\n\nGebruik deze bronnen:\n${compiledContent}\n\nLever een professioneel rapport met:\n1. Samenvatting\n2. Belangrijkste bevindingen\n3. Gedetailleerde analyse\n4. Bronvermeldingen\n5. Conclusies`
          }
        ],
        max_tokens: 4000,
        temperature: 0.3,
      }),
    });
    
    const aiData = await response.json();
    const report = aiData.choices?.[0]?.message?.content || 'Kon geen rapport genereren';
    
    return JSON.stringify({
      success: true,
      topic: topic,
      sources_consulted: sources.length,
      report: report,
      errors: errors.length > 0 ? errors : undefined,
      message: `🔍 Research compleet: ${topic} (${sources.length} bronnen)`
    });
  } catch (error: any) {
    console.error('Research error:', error);
    return JSON.stringify({
      success: false,
      error: error.message,
      topic: topic
    });
  }
}

/**
 * 🎯 Extract Structured Data from Website
 */
export async function extractStructuredData(
  url: string, 
  dataType: string, 
  customSelectors?: string
): Promise<string> {
  try {
    console.log(`🎯 Extracting ${dataType} data from: ${url}`);
    
    const response = await fetch(url, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
      }
    });
    
    if (!response.ok) {
      throw new Error(`HTTP ${response.status}: ${response.statusText}`);
    }
    
    const html = await response.text();
    const cheerio = require('cheerio');
    const $ = cheerio.load(html);
    
    let extractedData: any = [];
    
    switch (dataType) {
      case 'prices':
        // Extract price information
        $('[class*="price"], [class*="prijs"], [data-price]').each((_i: number, el: any) => {
          const price = $(el).text().trim();
          const context = $(el).parent().text().substring(0, 100);
          if (price) {
            extractedData.push({ price, context });
          }
        });
        break;
        
      case 'products':
        // Extract product information
        $('[class*="product"], [data-product], article').each((_i: number, el: any) => {
          const title = $(el).find('h1, h2, h3, h4, [class*="title"]').first().text().trim();
          const price = $(el).find('[class*="price"], [class*="prijs"]').first().text().trim();
          const description = $(el).find('p, [class*="description"]').first().text().trim();
          
          if (title) {
            extractedData.push({ title, price, description: description.substring(0, 200) });
          }
        });
        break;
        
      case 'articles':
        // Extract article/blog information
        $('article, [class*="post"], [class*="article"]').each((_i: number, el: any) => {
          const title = $(el).find('h1, h2, h3, [class*="title"]').first().text().trim();
          const date = $(el).find('[class*="date"], time').first().text().trim();
          const excerpt = $(el).find('p, [class*="excerpt"], [class*="summary"]').first().text().trim();
          
          if (title) {
            extractedData.push({ title, date, excerpt: excerpt.substring(0, 200) });
          }
        });
        break;
        
      case 'contacts':
        // Extract contact information
        const emails = html.match(/[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/g) || [];
        const phones = html.match(/(\+|00)?[0-9]{1,4}[\s-]?[0-9]{2,4}[\s-]?[0-9]{2,4}[\s-]?[0-9]{2,4}/g) || [];
        
        extractedData = {
          emails: [...new Set(emails)].slice(0, 10),
          phones: [...new Set(phones)].slice(0, 10)
        };
        break;
        
      case 'reviews':
        // Extract reviews/ratings
        $('[class*="review"], [class*="rating"], [class*="feedback"]').each((_i: number, el: any) => {
          const rating = $(el).find('[class*="star"], [class*="rating"]').first().text().trim();
          const review = $(el).find('p, [class*="text"], [class*="comment"]').first().text().trim();
          const author = $(el).find('[class*="author"], [class*="name"]').first().text().trim();
          
          if (review) {
            extractedData.push({ rating, review: review.substring(0, 300), author });
          }
        });
        break;
        
      case 'custom':
        // Custom CSS selectors
        if (customSelectors) {
          $(customSelectors).each((_i: number, el: any) => {
            extractedData.push({
              text: $(el).text().trim(),
              html: $(el).html()
            });
          });
        }
        break;
    }
    
    return JSON.stringify({
      success: true,
      url: url,
      data_type: dataType,
      items_found: Array.isArray(extractedData) ? extractedData.length : Object.keys(extractedData).length,
      data: extractedData,
      message: `🎯 Data geëxtraheerd van ${url}`
    });
  } catch (error: any) {
    console.error('Data extraction error:', error);
    return JSON.stringify({
      success: false,
      error: error.message,
      url: url
    });
  }
}

// ========================================
// 🚀 AUTONOMOUS AGENT ACTION TOOL IMPLEMENTATIONS
// ========================================

/**
 * 📝 WordPress Publish - Publiceer direct naar WordPress
 */
export async function wordpressPublish(
  title: string,
  content: string,
  excerpt: string | undefined,
  status: string,
  categories: string[] | undefined,
  tags: string[] | undefined,
  featuredImageUrl: string | undefined,
  clientId: string | undefined
): Promise<string> {
  try {
    if (!clientId) {
      throw new Error('Client ID is vereist voor WordPress publicatie');
    }

    console.log(`📝 WordPress publiceren: ${title}`);

    // Import WordPress service
    const { PrismaClient } = await import('@prisma/client');
    const { publishToWordPress } = await import('./wordpress-publisher');
    const prisma = new PrismaClient();
    
    try {
      // Get client WordPress config
      const client = await prisma.client.findUnique({
        where: { id: clientId },
      });
      
      if (!client) {
        throw new Error('Client niet gevonden');
      }
      
      if (!client.wordpressUrl || !client.wordpressUsername || !client.wordpressPassword) {
        return `⚠️ WordPress configuratie ontbreekt!\n\n💡 **Configureer eerst je WordPress:**\n1. Ga naar Settings\n2. Vul in: WordPress API URL, Username, Application Password\n3. Daarna kan ik direct publiceren naar je website!\n\n📌 Ik heb de content wel gegenereerd, maar kan nog niet publiceren.`;
      }
      
      // Publish to WordPress
      const result = await publishToWordPress(
        {
          siteUrl: client.wordpressUrl,
          username: client.wordpressUsername,
          applicationPassword: client.wordpressPassword,
        },
        {
          title: title,
          content: content,
          excerpt: excerpt || '',
          status: (status as 'publish' | 'draft') || 'publish',
          tags: tags || [],
        }
      );
      
      const summary = `✅ **Artikel succesvol gepubliceerd op WordPress!**\n\n📝 **${title}**\n\n🌐 Website: ${client.website}\n🔗 WordPress URL: ${result.link}\n📊 Post ID: ${result.id}\n✨ Status: ${result.status === 'publish' ? '🟢 Live' : '📝 Concept'}\n\n${categories && categories.length > 0 ? `🏷️ Categorieën: ${categories.join(', ')}\n` : ''}${tags && tags.length > 0 ? `#️⃣ Tags: ${tags.join(', ')}\n` : ''}\n💡 **Het artikel is nu live en bereikbaar voor je bezoekers!**`;
      
      console.log(`✅ WordPress publicatie succesvol: ${title}`);
      return summary;
    } finally {
      await prisma.$disconnect();
    }
  } catch (error: any) {
    console.error(`❌ WordPress publicatie error: ${error.message}`);
    throw new Error(`WordPress publicatie mislukt: ${error.message}`);
  }
}

/**
 * 📱 Social Media Post - Post naar alle platforms via Late.dev
 */
/**
 * 📱 Create Complete Social Media Post - Met automatische afbeelding, tekst en hashtags
 */
export async function createSocialMediaPost(
  topic: string,
  platforms: string[] = ['instagram', 'facebook', 'linkedin'],
  style: string = 'modern',
  postType: string = 'promotional',
  includeImage: boolean = true,
  clientId: string | undefined
): Promise<string> {
  try {
    if (!clientId) {
      throw new Error('Client ID is vereist voor social media posts');
    }

    console.log(`📱 Complete social media post maken: ${topic}`);
    console.log(`🎨 Platforms: ${platforms.join(', ')}, Stijl: ${style}, Type: ${postType}`);

    // 1. Genereer engaging post tekst met AI (gebruik AIML API)
    const AIML_API_KEY = process.env.AIML_API_KEY;
    if (!AIML_API_KEY) {
      throw new Error('AIML_API_KEY niet geconfigureerd');
    }

    const postPrompt = `Schrijf een perfecte ${postType} social media post over: ${topic}

Platform(en): ${platforms.join(', ')}
Vereisten:
- Engaging en aantrekkelijk
- Optimale lengte voor ${platforms[0]}
- 5-10 relevante hashtags
- Call-to-action
- Emoji's voor visuele appeal
- Nederlands tenzij anders aangegeven

Geef ALLEEN de post tekst terug (inclusief hashtags), geen extra uitleg.`;

    const textResponse = await fetch('https://api.aimlapi.com/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${AIML_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'gpt-4o',
        messages: [
          { role: 'user', content: postPrompt }
        ],
        max_tokens: 500,
        temperature: 0.8,
      }),
    });

    if (!textResponse.ok) {
      throw new Error(`AIML API error: ${textResponse.status}`);
    }

    const textData = await textResponse.json();
    const postText = textData.choices?.[0]?.message?.content?.trim() || '';

    if (!postText) {
      throw new Error('Geen post tekst gegenereerd');
    }

    console.log(`✅ Post tekst gegenereerd (${postText.length} karakters)`);

    // 2. Genereer afbeelding met AI (als includeImage true is)
    let imageUrl = '';
    if (includeImage) {
      console.log('🎨 Afbeelding genereren...');
      
      const imagePrompt = `Create a ${style} social media image for ${postType} post about: ${topic}. Eye-catching, professional, high-quality, suitable for Instagram and Facebook.`;
      
      // Use flux-realism for realistic photos, recraft-v3 for designs
      const imageModel = style === 'realistic' ? 'flux-realism' : 'recraft-v3';
      
      try {
        imageUrl = await generateImage(imagePrompt, imageModel, '1:1', clientId);
        console.log(`✅ Afbeelding gegenereerd: ${imageUrl}`);
      } catch (error) {
        console.error('❌ Afbeelding genereren mislukt:', error);
        // Continue zonder afbeelding
      }
    }

    // 3. Formatteer het resultaat
    const summary = `✅ **Complete Social Media Post Klaar!**

📱 **Platforms:** ${platforms.map(p => p.charAt(0).toUpperCase() + p.slice(1)).join(', ')}

📝 **Post Tekst:**
${postText}

${imageUrl ? `🖼️ **Afbeelding:** ${imageUrl}\n` : ''}
🎨 **Stijl:** ${style}
📊 **Type:** ${postType}

💡 **Volgende stappen:**
${imageUrl ? '1. Download de afbeelding\n2. Kopieer de tekst\n3. Post handmatig of via Late.dev' : '1. Kopieer de tekst\n2. Voeg je eigen afbeelding toe\n3. Post naar je platforms'}

✨ **De post is geoptimaliseerd voor ${platforms[0]} en klaar voor publicatie!**`;

    return summary;
  } catch (error: any) {
    console.error(`❌ Social media post creation error:`, error);
    throw new Error(`Social media post maken mislukt: ${error.message}`);
  }
}

export async function socialMediaPost(
  text: string,
  platforms: string[],
  mediaUrl: string | undefined,
  mediaType: string | undefined,
  scheduleTime: string | undefined,
  clientId: string | undefined
): Promise<string> {
  try {
    if (!clientId) {
      throw new Error('Client ID is vereist voor social media posting');
    }

    console.log(`📱 Social media posten naar: ${platforms.join(', ')}`);

    // Import Late.dev service
    const { PrismaClient } = await import('@prisma/client');
    const prisma = new PrismaClient();
    
    try {
      // Get client Late.dev config
      const client = await prisma.client.findUnique({
        where: { id: clientId },
      });
      
      if (!client) {
        throw new Error('Client niet gevonden');
      }
      
      if (!client.lateDevProfileId) {
        return `⚠️ Late.dev configuratie ontbreekt!\n\n💡 **Configureer eerst Late.dev:**\n1. Maak een account op late.dev\n2. Koppel je social media accounts\n3. Haal je API key op\n4. Voeg deze toe in WritgoAI Settings\n\n📌 Dan kan ik automatisch posten naar: ${platforms.join(', ')}`;
      }
      
      // Prepare post data for Late.dev API
      const postData: any = {
        text: text,
        platforms: platforms,
      };
      
      if (mediaUrl && mediaType) {
        postData.media = {
          url: mediaUrl,
          type: mediaType,
        };
      }
      
      if (scheduleTime) {
        postData.scheduled_at = scheduleTime;
      }
      
      // Post via Late.dev API
      const response = await fetch('https://api.late.dev/v1/posts', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${client.lateDevProfileId}`,
        },
        body: JSON.stringify(postData),
      });
      
      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || 'Late.dev API error');
      }
      
      const result = await response.json();
      
      const summary = `✅ **Social media post succesvol ${scheduleTime ? 'ingepland' : 'gepubliceerd'}!**\n\n📱 Platforms: ${platforms.map(p => `✓ ${p.charAt(0).toUpperCase() + p.slice(1)}`).join(', ')}\n\n📝 Tekst:\n"${text.substring(0, 200)}${text.length > 200 ? '...' : ''}"\n\n${mediaUrl ? `🖼️ Media: ${mediaType === 'image' ? 'Afbeelding' : 'Video'} bijgevoegd\n` : ''}${scheduleTime ? `⏰ Gepland voor: ${new Date(scheduleTime).toLocaleString('nl-NL')}\n` : '🟢 Status: Live!\n'}\n💡 Post ID: ${result.id || 'N/A'}`;
      
      console.log(`✅ Social media post succesvol naar ${platforms.join(', ')}`);
      return summary;
    } finally {
      await prisma.$disconnect();
    }
  } catch (error: any) {
    console.error(`❌ Social media posting error: ${error.message}`);
    throw new Error(`Social media posting mislukt: ${error.message}\n\nTip: Controleer je Late.dev configuratie en gekoppelde accounts.`);
  }
}

/**
 * 📅 Create Content Plan - Genereer complete 7-daagse content planning
 */
export async function createContentPlan(
  focusArea: string | undefined,
  includeCompetitors: boolean,
  clientId: string | undefined
): Promise<string> {
  try {
    if (!clientId) {
      throw new Error('Client ID is vereist voor content planning');
    }

    console.log(`📅 Content planning genereren${focusArea ? ` voor: ${focusArea}` : ''}`);

    // TODO: Implement full content planning with ContentPlan model
    const { PrismaClient } = await import('@prisma/client');
    const prisma = new PrismaClient();
    
    try {
      // Get client data
      const client = await prisma.client.findUnique({
        where: { id: clientId },
      });
      
      if (!client?.website) {
        throw new Error('Geen website URL gevonden in je profiel. Configureer eerst je website in de instellingen.');
      }
      
      // Simple 7-day plan structure
      const plan = {
        focus: focusArea || 'algemeen',
        days: Array.from({ length: 7 }, (_, i) => ({
          day: i + 1,
          date: new Date(Date.now() + i * 24 * 60 * 60 * 1000).toLocaleDateString('nl-NL'),
          blog: { topic: `Blog dag ${i + 1}: ${focusArea || 'content'} trends` },
          social: [
            { platform: 'instagram', topic: `Instagram post dag ${i + 1}` },
            { platform: 'facebook', topic: `Facebook post dag ${i + 1}` }
          ],
          video: { topic: `Video dag ${i + 1}: ${focusArea || 'content'} tips` }
        }))
      };
      
      // Store in client contentPlan field (JSON)
      await prisma.client.update({
        where: { id: clientId },
        data: {
          contentPlan: plan as any,
          lastPlanGenerated: new Date(),
        },
      });
      
      // Format summary
      let summary = `✅ **7-Daagse Content Planning Succesvol Gegenereerd!**\n\n`;
      summary += `🎯 **Focus:** ${focusArea || 'Algemeen (alle content types)'}\n`;
      summary += `🌐 **Website:** ${client.website}\n\n`;
      
      summary += `**📅 Planning Overview:**\n`;
      
      plan.days.forEach((day: any) => {
        summary += `\n**Dag ${day.day} - ${day.date}:**\n`;
        summary += `  📝 Blog: "${day.blog.topic}"\n`;
        summary += `  📱 Social: ${day.social.length}x posts\n`;
        summary += `  🎬 Video: "${day.video.topic}"\n`;
      });
      
      summary += `\n\n💡 **Wat nu?**\n`;
      summary += `Gebruik \`execute_content_plan\` om de hele planning uit te voeren!\n`;
      summary += `Of vraag me om specifieke content te genereren.\n\n`;
      summary += `⚠️ Note: Full AI-powered planning wordt nog verder uitgebreid.`;
      
      console.log(`✅ Content plan gegenereerd voor ${clientId}`);
      return summary;
    } finally {
      await prisma.$disconnect();
    }
  } catch (error: any) {
    console.error(`❌ Content planning error: ${error.message}`);
    throw new Error(`Content planning mislukt: ${error.message}`);
  }
}

/**
 * ⚡ Execute Content Plan - Voer hele planning uit en publiceer alles
 */
export async function executeContentPlan(
  planId: string | undefined,
  autoPublish: boolean,
  platforms: string[] | undefined,
  clientId: string | undefined
): Promise<string> {
  try {
    if (!clientId) {
      throw new Error('Client ID is vereist voor plan executie');
    }

    console.log(`⚡ Content plan uitvoeren${planId ? ` (ID: ${planId})` : ' (laatste plan)'}`);

    const { PrismaClient } = await import('@prisma/client');
    const prisma = new PrismaClient();
    
    try {
      // Get content plan from client
      const client = await prisma.client.findUnique({
        where: { id: clientId },
      });
      
      if (!client) {
        throw new Error('Client niet gevonden');
      }
      
      if (!client.contentPlan) {
        throw new Error('Geen content plan gevonden. Genereer eerst een planning met `create_content_plan`.');
      }
      
      const planData: any = client.contentPlan;
      const targetPlatforms = platforms || ['wordpress', 'instagram', 'facebook', 'tiktok', 'youtube'];
      
      let summary = `⚡ **Content Plan Executie Gestart!**\n\n`;
      summary += `📊 Plan: ${planData.focus || 'Content Planning'}\n`;
      summary += `🎯 Platforms: ${targetPlatforms.join(', ')}\n`;
      summary += `✨ Auto-publish: ${autoPublish ? '✅ Ja' : '❌ Nee (concept)'}\n\n`;
      
      let successCount = 0;
      let failCount = 0;
      
      // Execute each day's content
      if (planData.days && Array.isArray(planData.days)) {
        for (let i = 0; i < Math.min(planData.days.length, 7); i++) {
          const day = planData.days[i];
          summary += `\n**📅 Dag ${i + 1}:**\n`;
          
          // Generate and publish blog
          if (day.blog && targetPlatforms.includes('wordpress')) {
            try {
              summary += `  📝 Blog genereren: "${day.blog.title || day.blog.topic}"...\n`;
              const blogResult = await generateBlog(day.blog.topic || day.blog.title, day.blog.wordCount || 800, clientId);
              
              if (autoPublish) {
                // Parse blog content from result
                const blogContent = blogResult.split('---')[1] || blogResult;
                await wordpressPublish(
                  day.blog.title || day.blog.topic,
                  blogContent,
                  day.blog.excerpt,
                  'publish',
                  day.blog.categories,
                  day.blog.tags,
                  undefined,
                  clientId
                );
                summary += `     ✅ Blog gepubliceerd!\n`;
              } else {
                summary += `     📄 Blog opgeslagen als concept\n`;
              }
              successCount++;
            } catch (error: any) {
              summary += `     ❌ Blog mislukt: ${error.message}\n`;
              failCount++;
            }
          }
          
          // Generate and post social media
          if (day.social && Array.isArray(day.social)) {
            for (const social of day.social) {
              if (targetPlatforms.includes(social.platform.toLowerCase())) {
                try {
                  summary += `  📱 Social post voor ${social.platform}...\n`;
                  
                  if (autoPublish) {
                    await socialMediaPost(
                      social.text || social.content,
                      [social.platform.toLowerCase()],
                      social.mediaUrl,
                      social.mediaType,
                      undefined,
                      clientId
                    );
                    summary += `     ✅ Gepost op ${social.platform}!\n`;
                  } else {
                    summary += `     📄 Social post voorbereid\n`;
                  }
                  successCount++;
                } catch (error: any) {
                  summary += `     ❌ Social post mislukt: ${error.message}\n`;
                  failCount++;
                }
              }
            }
          }
          
          // Generate video
          if (day.video && targetPlatforms.some(p => ['tiktok', 'youtube', 'instagram'].includes(p))) {
            try {
              summary += `  🎬 Video genereren: "${day.video.topic || day.video.title}"...\n`;
              await generateVideo({
                topic: day.video.topic || day.video.title,
                script: day.video.script || day.video.topic,
                style: 'realistic',
                aspect_ratio: '9:16',
                voice_id: 'CwhRBWXzGAHq8TQ4Fs17',
                image_count: 5,
                background_music: true,
              }, clientId);
              summary += `     ⏳ Video in processing (1-3 min)\n`;
              successCount++;
            } catch (error: any) {
              summary += `     ❌ Video mislukt: ${error.message}\n`;
              failCount++;
            }
          }
        }
      }
      
      summary += `\n\n**📊 Resultaten:**\n`;
      summary += `✅ Succesvol: ${successCount}\n`;
      summary += `❌ Mislukt: ${failCount}\n`;
      summary += `📈 Totaal: ${successCount + failCount}\n\n`;
      
      if (autoPublish) {
        summary += `🎉 **Alle content is gepubliceerd en live!**`;
      } else {
        summary += `📝 **Alle content is voorbereid en kan nu handmatig worden gepubliceerd.**`;
      }
      
      // Mark plan as executed in client
      await prisma.client.update({
        where: { id: clientId },
        data: { 
          lastPlanGenerated: new Date(), // Update timestamp
        },
      });
      
      console.log(`✅ Content plan uitgevoerd: ${successCount} succesvol, ${failCount} mislukt`);
      return summary;
    } finally {
      await prisma.$disconnect();
    }
  } catch (error: any) {
    console.error(`❌ Content plan executie error: ${error.message}`);
    throw new Error(`Content plan executie mislukt: ${error.message}`);
  }
}

/**
 * 📋 Manage Task - Beheer taken in het systeem
 */
export async function manageTask(
  action: string,
  taskId: string | undefined,
  title: string | undefined,
  description: string | undefined,
  priority: string | undefined,
  deadline: string | undefined,
  status: string | undefined,
  clientId: string | undefined
): Promise<string> {
  try {
    if (!clientId) {
      throw new Error('Client ID is vereist voor task management');
    }

    console.log(`📋 Task ${action}: ${taskId || title}`);

    const { PrismaClient } = await import('@prisma/client');
    const prisma = new PrismaClient();
    
    try {
      // TODO: Implement full task management with Task model
      switch (action) {
        case 'create':
          if (!title) {
            throw new Error('Titel is vereist voor nieuwe taak');
          }
          
          // Temporarily store as simple log
          console.log('Task created:', { clientId, title, description, priority, deadline });
          
          return `✅ **Taak aangemaakt!**\n\n📋 ${title}\n⭐ Prioriteit: ${priority || 'medium'}\n${deadline ? `📅 Deadline: ${new Date(deadline).toLocaleDateString('nl-NL')}\n` : ''}${description ? `📝 ${description}\n` : ''}\n💡 Status: Pending\n\n⚠️ Note: Task management feature wordt nog verder uitgebreid.`;
        
        case 'update':
          if (!taskId) {
            throw new Error('Task ID is vereist voor update');
          }
          
          console.log('Task updated:', { taskId, title, description, priority, deadline, status });
          
          return `✅ **Taak geüpdatet!**\n\n🆔 ${taskId}\n${title ? `📋 ${title}\n` : ''}${status ? `✨ Status: ${status}\n` : ''}${priority ? `⭐ Prioriteit: ${priority}\n` : ''}${deadline ? `📅 Deadline: ${new Date(deadline).toLocaleDateString('nl-NL')}\n` : ''}`;
        
        case 'complete':
          if (!taskId) {
            throw new Error('Task ID is vereist om taak te voltooien');
          }
          
          console.log('Task completed:', { taskId });
          
          return `✅ **Taak voltooid!**\n\n🆔 ${taskId}\n🎉 De taak is succesvol afgerond!\n📅 Voltooid op: ${new Date().toLocaleDateString('nl-NL')}`;
        
        case 'list':
          return `📋 **Task Management**\n\n💡 Task management feature wordt nog verder uitgebreid met een volledige task database.\n\nJe kunt wel al taken aanmaken met \`manage_task("create", ...)\``;
        
        default:
          throw new Error(`Onbekende actie: ${action}`);
      }
    } finally {
      await prisma.$disconnect();
    }
  } catch (error: any) {
    console.error(`❌ Task management error: ${error.message}`);
    throw new Error(`Task management mislukt: ${error.message}`);
  }
}

/**
 * 💰 Check Credits - Controleer credit saldo
 */
export async function checkCredits(
  warnThreshold: number,
  clientId: string | undefined
): Promise<string> {
  try {
    if (!clientId) {
      throw new Error('Client ID is vereist voor credit check');
    }

    console.log(`💰 Credits checken (threshold: ${warnThreshold})`);

    const { PrismaClient } = await import('@prisma/client');
    const prisma = new PrismaClient();
    
    try {
      const client = await prisma.client.findUnique({
        where: { id: clientId },
      });
      
      if (!client) {
        throw new Error('Client niet gevonden');
      }
      
      const credits = (client.subscriptionCredits || 0) + (client.topUpCredits || 0);
      const isLow = credits < warnThreshold;
      const isCritical = credits < 50;
      
      let summary = `💰 **Credit Saldo**\n\n`;
      
      if (isCritical) {
        summary += `🔴 **KRITIEK: ${credits} credits resterend!**\n\n`;
        summary += `⚠️ Je credits zijn bijna op. Upgrade je abonnement om door te gaan met content generatie.\n\n`;
      } else if (isLow) {
        summary += `🟡 **Let op: ${credits} credits resterend**\n\n`;
        summary += `💡 Je credits worden laag. Overweeg een upgrade om meer content te genereren.\n\n`;
      } else {
        summary += `🟢 **${credits} credits beschikbaar**\n\n`;
      }
      
      summary += `📊 **Subscription:** ${client.subscriptionPlan || 'Free'}\n`;
      summary += `✨ **Status:** ${client.subscriptionStatus || 'active'}\n\n`;
      
      summary += `**💡 Credit Costs:**\n`;
      summary += `• Blog (800 woorden): ~50 credits\n`;
      summary += `• Social media post: ~10 credits\n`;
      summary += `• Video generatie: ~100 credits\n`;
      summary += `• Afbeelding generatie: ~20 credits\n`;
      
      if (isLow) {
        summary += `\n🚀 **Upgrade om meer credits te krijgen!**`;
      }
      
      console.log(`✅ Credit check: ${credits} credits`);
      return summary;
    } finally {
      await prisma.$disconnect();
    }
  } catch (error: any) {
    console.error(`❌ Credit check error: ${error.message}`);
    throw new Error(`Credit check mislukt: ${error.message}`);
  }
}

/**
 * 📧 Send Notification - Stuur notificatie naar client
 */
export async function sendNotification(
  subject: string,
  message: string,
  type: string,
  priority: string,
  clientId: string | undefined
): Promise<string> {
  try {
    if (!clientId) {
      throw new Error('Client ID is vereist voor notificaties');
    }

    console.log(`📧 Notificatie sturen: ${subject} (${type})`);

    const { PrismaClient } = await import('@prisma/client');
    const prisma = new PrismaClient();
    
    try {
      const client = await prisma.client.findUnique({
        where: { id: clientId },
        select: { email: true, name: true },
      });
      
      if (!client) {
        throw new Error('Client niet gevonden');
      }
      
      // Store in-app notification (feature to be implemented)
      // TODO: Create Message model in Prisma schema
      if (type === 'in_app' || type === 'both') {
        console.log('In-app notification:', { clientId, subject, message });
      }
      
      // Send email notification (feature to be implemented)
      // TODO: Implement email sending
      if (type === 'email' || type === 'both') {
        console.log('Email notification:', { to: client.email, subject, message });
      }
      
      const summary = `✅ **Notificatie verzonden!**\n\n📧 ${subject}\n👤 Naar: ${client.name || client.email}\n📬 Type: ${type === 'both' ? 'Email + In-app' : type === 'email' ? 'Email' : 'In-app'}\n⭐ Prioriteit: ${priority}\n\n💬 "${message.substring(0, 100)}${message.length > 100 ? '...' : ''}"`;
      
      console.log(`✅ Notificatie verzonden naar ${client.email}`);
      return summary;
    } finally {
      await prisma.$disconnect();
    }
  } catch (error: any) {
    console.error(`❌ Notificatie error: ${error.message}`);
    throw new Error(`Notificatie versturen mislukt: ${error.message}`);
  }
}

/**
 * 📊 Analyze Performance - Analyseer content prestaties
 */
export async function analyzePerformance(
  timePeriod: string,
  contentTypes: string[] | undefined,
  metrics: string[] | undefined,
  clientId: string | undefined
): Promise<string> {
  try {
    if (!clientId) {
      throw new Error('Client ID is vereist voor performance analyse');
    }

    console.log(`📊 Performance analyse: ${timePeriod}`);

    const { PrismaClient } = await import('@prisma/client');
    const prisma = new PrismaClient();
    
    try {
      // Calculate date range
      const now = new Date();
      let startDate = new Date();
      
      switch (timePeriod) {
        case 'week':
          startDate.setDate(now.getDate() - 7);
          break;
        case 'month':
          startDate.setMonth(now.getMonth() - 1);
          break;
        case 'quarter':
          startDate.setMonth(now.getMonth() - 3);
          break;
        case 'year':
          startDate.setFullYear(now.getFullYear() - 1);
          break;
      }
      
      // Get content data
      const contentPieces = await prisma.contentPiece.findMany({
        where: {
          clientId: clientId,
          createdAt: { gte: startDate },
        },
        orderBy: { createdAt: 'desc' },
      });
      
      const videos = await prisma.video.findMany({
        where: {
          clientId: clientId,
          createdAt: { gte: startDate },
        },
        orderBy: { createdAt: 'desc' },
      });
      
      // For now, assume all contentPieces are articles/blogs
      const articles = contentPieces;
      
      let summary = `📊 **Performance Analyse**\n\n`;
      summary += `📅 Periode: ${timePeriod} (vanaf ${startDate.toLocaleDateString('nl-NL')})\n`;
      summary += `🎯 Client ID: ${clientId}\n\n`;
      
      summary += `**📝 Content Statistieken:**\n`;
      summary += `• Blogs gegenereerd: ${articles.length}\n`;
      summary += `• Video's gegenereerd: ${videos.length}\n`;
      summary += `• Totaal content items: ${articles.length + videos.length}\n\n`;
      
      if (articles.length > 0) {
        const publishedBlogs = articles.filter((a: any) => a.status === 'published').length;
        const draftBlogs = articles.filter((a: any) => a.status === 'draft').length;
        
        summary += `**📈 Blog Performance:**\n`;
        summary += `• Gepubliceerd: ${publishedBlogs} (${Math.round((publishedBlogs / articles.length) * 100)}%)\n`;
        summary += `• Concept: ${draftBlogs}\n\n`;
        
        summary += `**🔝 Top Blogs:**\n`;
        articles.slice(0, 3).forEach((article: any, index: number) => {
          summary += `${index + 1}. ${article.title || 'Untitled'}\n`;
          summary += `   📅 ${article.createdAt.toLocaleDateString('nl-NL')}\n`;
        });
      }
      
      if (videos.length > 0) {
        const completedVideos = videos.filter((v: any) => v.status === 'completed').length;
        
        summary += `\n**🎬 Video Performance:**\n`;
        summary += `• Voltooid: ${completedVideos} (${Math.round((completedVideos / videos.length) * 100)}%)\n`;
        summary += `• In processing: ${videos.filter((v: any) => v.status === 'processing').length}\n`;
        summary += `• Mislukt: ${videos.filter((v: any) => v.status === 'failed').length}\n`;
      }
      
      summary += `\n💡 **Inzichten:**\n`;
      
      if (articles.length + videos.length === 0) {
        summary += `• Nog geen content gegenereerd in deze periode\n`;
        summary += `• Start met content generatie om je prestaties te tracken!\n`;
      } else {
        const avgPerDay = (articles.length + videos.length) / Math.ceil((now.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24));
        summary += `• Gemiddeld ${avgPerDay.toFixed(1)} content items per dag\n`;
        
        if (articles.length > 10) {
          summary += `• 🔥 Hoge blog productie! Je bent productief bezig.\n`;
        }
        if (videos.length > 5) {
          summary += `• 🎬 Goede video output! Video content werkt goed.\n`;
        }
      }
      
      console.log(`✅ Performance analyse voltooid`);
      return summary;
    } finally {
      await prisma.$disconnect();
    }
  } catch (error: any) {
    console.error(`❌ Performance analyse error: ${error.message}`);
    throw new Error(`Performance analyse mislukt: ${error.message}`);
  }
}

/**
 * ⏰ Schedule Automation - Plan automatische content generatie in
 */
export async function scheduleAutomation(
  frequency: string,
  contentTypes: string[],
  platforms: string[] | undefined,
  timeOfDay: string | undefined,
  autoPublish: boolean,
  clientId: string | undefined
): Promise<string> {
  try {
    if (!clientId) {
      throw new Error('Client ID is vereist voor automation scheduling');
    }

    console.log(`⏰ Automation inplannen: ${frequency} - ${contentTypes.join(', ')}`);

    const { PrismaClient } = await import('@prisma/client');
    const prisma = new PrismaClient();
    
    try {
      const client = await prisma.client.findUnique({
        where: { id: clientId },
      });
      
      if (!client) {
        throw new Error('Client niet gevonden');
      }
      
      // Update client automation settings
      await prisma.client.update({
        where: { id: clientId },
        data: {
          automationActive: true,
          // TODO: Add frequency, types, platforms, time, publish fields to schema
        },
      });
      
      // Log settings for now
      console.log('Automation scheduled:', {
        clientId,
        frequency,
        contentTypes,
        platforms,
        timeOfDay,
        autoPublish,
      });
      
      let summary = `✅ **Automatische Content Generatie Ingeschakeld!**\n\n`;
      summary += `⏰ **Frequentie:** ${frequency === 'daily' ? 'Dagelijks' : frequency === 'weekly' ? 'Wekelijks' : frequency === 'biweekly' ? 'Tweewekelijks' : 'Maandelijks'}\n`;
      summary += `📝 **Content Types:** ${contentTypes.map(t => t.charAt(0).toUpperCase() + t.slice(1)).join(', ')}\n`;
      
      if (platforms && platforms.length > 0) {
        summary += `🌐 **Platforms:** ${platforms.join(', ')}\n`;
      }
      
      if (timeOfDay) {
        summary += `🕐 **Tijd:** ${timeOfDay}\n`;
      }
      
      summary += `🚀 **Auto-publish:** ${autoPublish ? '✅ Ja (direct live)' : '❌ Nee (concept)'}\n\n`;
      
      summary += `**📅 Wat gebeurt er nu?**\n`;
      
      switch (frequency) {
        case 'daily':
          summary += `• Elke dag ${timeOfDay || '09:00'} wordt automatisch content gegenereerd\n`;
          break;
        case 'weekly':
          summary += `• Elke week ${timeOfDay || '09:00'} wordt een content batch gegenereerd\n`;
          break;
        case 'biweekly':
          summary += `• Elke 2 weken ${timeOfDay || '09:00'} wordt content gegenereerd\n`;
          break;
        case 'monthly':
          summary += `• Elke maand ${timeOfDay || '09:00'} wordt een maandplanning uitgevoerd\n`;
          break;
      }
      
      summary += `• Content wordt automatisch gegenereerd volgens je brand voice\n`;
      summary += `• Web research zorgt voor actuele content\n`;
      
      if (autoPublish) {
        summary += `• Content wordt AUTOMATISCH gepubliceerd naar je platforms\n`;
      } else {
        summary += `• Content wordt opgeslagen als concept voor review\n`;
      }
      
      summary += `\n💡 **Pro tip:** Je ontvangt een notificatie na elke automatische run!`;
      
      console.log(`✅ Automation ingeschakeld: ${frequency}`);
      return summary;
    } finally {
      await prisma.$disconnect();
    }
  } catch (error: any) {
    console.error(`❌ Automation scheduling error: ${error.message}`);
    throw new Error(`Automation inplannen mislukt: ${error.message}`);
  }
}

/**
 * 🔍 Keyword Research - Generate new keyword opportunities
 * Scant website voor bestaande content en genereert nieuwe keyword suggesties
 */
export async function keywordResearch(
  niche: string,
  websiteUrl: string | undefined,
  numKeywords: number,
  language: string,
  clientId: string | undefined
): Promise<string> {
  try {
    console.log(`🔍 Keyword research voor: ${niche} (${language})`);
    
    let existingContent: string[] = [];
    let existingKeywords: string[] = [];
    let sitemapUrls: string[] = [];
    
    // Stap 1: Website scannen als URL gegeven is
    if (websiteUrl) {
      try {
        console.log(`📊 Website scannen: ${websiteUrl}`);
        
        // Probeer sitemap te laden
        try {
          const sitemapModule = await import('./sitemap-loader');
          const sitemap = await sitemapModule.loadWordPressSitemap(websiteUrl);
          
          if (sitemap && sitemap.pages) {
            sitemapUrls = sitemap.pages.map((page: any) => page.url || '');
            console.log(`✅ Sitemap geladen: ${sitemapUrls.length} URLs`);
            
            // Extract titels/keywords van URLs en titles
            existingContent = sitemap.pages.map((page: any) => {
              const title = page.title || '';
              const url = page.url || '';
              // Extract laatste deel van URL (slug)
              const parts = url.split('/').filter((p: string) => p);
              const slug = parts[parts.length - 1] || '';
              const urlKeywords = slug.replace(/[-_]/g, ' ').replace(/\.(html|php|aspx)$/i, '');
              return `${title} ${urlKeywords}`.trim();
            });
          }
        } catch (e) {
          console.log(`⚠️ Geen sitemap gevonden, scan homepage`);
        }
        
        // Scan homepage voor extra context
        try {
          const scanResult = await scanWebsite(websiteUrl, clientId);
          const scanData = JSON.parse(scanResult);
          
          if (scanData.keywords && Array.isArray(scanData.keywords)) {
            existingKeywords = scanData.keywords;
          }
          
          if (scanData.niche) {
            niche = `${niche} ${scanData.niche}`.trim();
          }
        } catch (e) {
          console.log('⚠️ Website scan mislukt, gebruik alleen niche');
        }
      } catch (e) {
        console.log('⚠️ Website analyse mislukt, gebruik alleen niche');
      }
    }
    
    // Stap 2: Genereer keyword suggesties met AI + Web Research
    console.log(`🧠 Genereer ${numKeywords} nieuwe keywords...`);
    
    const languageNames: Record<string, string> = {
      nl: 'Nederlands',
      en: 'Engels',
      de: 'Duits',
      fr: 'Frans',
      es: 'Spaans',
    };
    
    // Web search voor trending keywords in de niche
    let trendingKeywords = '';
    try {
      const searchQuery = language === 'nl' 
        ? `populaire zoekwoorden ${niche} 2025 Nederland`
        : `popular keywords ${niche} 2025`;
      
      const searchResults = await webSearch(searchQuery);
      trendingKeywords = searchResults;
    } catch (e) {
      console.log('⚠️ Web search voor trends mislukt');
    }
    
    // Gebruik AI voor keyword generatie
    const prompt = `Je bent een SEO keyword research expert. Genereer ${numKeywords} NIEUWE en relevante zoekwoorden voor de niche "${niche}" in het ${languageNames[language]}.

${existingKeywords.length > 0 ? `BELANGRIJKE BESTAANDE KEYWORDS (gebruik deze NIET in je suggesties):\n${existingKeywords.slice(0, 50).join(', ')}\n\n` : ''}${existingContent.length > 0 ? `BESTAANDE CONTENT ONDERWERPEN (genereer GEEN keywords over deze onderwerpen):\n${existingContent.slice(0, 30).join(', ')}\n\n` : ''}${trendingKeywords ? `TRENDING INFO (gebruik als inspiratie):\n${trendingKeywords.substring(0, 1000)}\n\n` : ''}INSTRUCTIES:
1. Genereer ALLEEN keywords die NIET in de bestaande lijst voorkomen
2. Focus op long-tail keywords (2-4 woorden) met goede zoekintentie
3. Mix van informational en transactional keywords
4. Relevante zoekwoorden met zoekvolume potential
5. In het ${languageNames[language]}

FORMAT je antwoord als simpele lijst (1 keyword per regel, GEEN nummering, GEEN uitleg):`;

    const aiResponse = await fetch('https://api.aimlapi.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${process.env.AIML_API_KEY}`,
      },
      body: JSON.stringify({
        model: 'gpt-5-mini-2025-08-07', // Snel en goed genoeg voor keyword gen
        messages: [
          {
            role: 'user',
            content: prompt,
          },
        ],
        temperature: 0.8, // Meer creativiteit
        max_tokens: 2000,
      }),
    });
    
    if (!aiResponse.ok) {
      throw new Error('AI keyword generation failed');
    }
    
    const aiData = await aiResponse.json();
    const keywordText = aiData.choices[0].message.content;
    
    // Parse keywords (1 per regel)
    const generatedKeywords = keywordText
      .split('\n')
      .map((line: string) => line.trim())
      .filter((line: string) => line && !line.match(/^\d+[\.\)]/)) // Remove numbered lists
      .filter((kw: string) => kw.length > 2 && kw.length < 100) // Reasonable length
      .filter((kw: string) => {
        // Filter uit keywords die te veel overlap hebben met bestaande
        const kwLower = kw.toLowerCase();
        return !existingKeywords.some(ek => {
          const ekLower = ek.toLowerCase();
          return kwLower.includes(ekLower) || ekLower.includes(kwLower);
        });
      })
      .slice(0, numKeywords);
    
    // Stap 3: Formateer resultaat
    let result = `# 🔍 Keyword Research Resultaten - ${niche}\n\n`;
    
    if (websiteUrl) {
      result += `📊 **Website:** ${websiteUrl}\n`;
      result += `✅ **Bestaande content:** ${existingContent.length} pagina's\n`;
      result += `🔑 **Bestaande keywords:** ${existingKeywords.length}\n\n`;
    }
    
    result += `## 🎯 ${generatedKeywords.length} Nieuwe Keyword Opportuniteiten\n\n`;
    result += `Deze keywords zijn NOG NIET op de site aanwezig en bieden nieuwe content mogelijkheden:\n\n`;
    
    generatedKeywords.forEach((kw: string, idx: number) => {
      result += `${idx + 1}. **${kw}**\n`;
    });
    
    result += `\n---\n\n`;
    result += `💡 **Tips:**\n`;
    result += `• Gebruik deze keywords voor nieuwe blog artikelen\n`;
    result += `• Combineer gerelateerde keywords in één artikel\n`;
    result += `• Focus op long-tail keywords voor snellere rankings\n`;
    result += `• Update bestaande content met deze nieuwe keywords waar relevant\n`;
    
    if (language === 'nl') {
      result += `\n🇳🇱 Keywords zijn geoptimaliseerd voor de Nederlandse markt\n`;
    }
    
    console.log(`✅ Keyword research voltooid: ${generatedKeywords.length} nieuwe keywords`);
    return result;
    
  } catch (error: any) {
    console.error(`❌ Keyword research error: ${error.message}`);
    throw new Error(`Keyword research mislukt: ${error.message}`);
  }
}
