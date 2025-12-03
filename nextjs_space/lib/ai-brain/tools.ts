/**
 * AI Brain Tool Definitions
 * Defines all tools that the AI agent can use to interact with the system
 */

export interface ToolParameter {
  name: string;
  type: 'string' | 'number' | 'boolean' | 'array' | 'object';
  description: string;
  required: boolean;
  enum?: string[];
  items?: { type: string };
}

export interface Tool {
  name: string;
  description: string;
  parameters: ToolParameter[];
}

export const AVAILABLE_TOOLS: Tool[] = [
  {
    name: 'get_clients',
    description: 'Haal alle klanten op of zoek een specifieke klant. Gebruik dit om informatie over klanten te vinden.',
    parameters: [
      {
        name: 'search',
        type: 'string',
        description: 'Optionele zoekterm om te filteren op naam, email of bedrijfsnaam',
        required: false,
      },
    ],
  },
  {
    name: 'get_client_details',
    description: 'Haal gedetailleerde informatie op van een specifieke klant, inclusief subscription, credits en settings',
    parameters: [
      {
        name: 'clientId',
        type: 'string',
        description: 'Het unieke ID van de klant',
        required: true,
      },
    ],
  },
  {
    name: 'generate_article',
    description: 'Genereer een SEO-geoptimaliseerd blog artikel voor een klant. Dit gebruikt de AI content generator.',
    parameters: [
      {
        name: 'clientId',
        type: 'string',
        description: 'Het unieke ID van de klant',
        required: true,
      },
      {
        name: 'topic',
        type: 'string',
        description: 'Het onderwerp van het artikel',
        required: true,
      },
      {
        name: 'keywords',
        type: 'array',
        description: 'Optionele array van SEO keywords',
        required: false,
        items: { type: 'string' },
      },
      {
        name: 'wordCount',
        type: 'number',
        description: 'Gewenst aantal woorden (standaard: 2000)',
        required: false,
      },
    ],
  },
  {
    name: 'generate_video_script',
    description: 'Genereer een video script voor een reel of YouTube video',
    parameters: [
      {
        name: 'clientId',
        type: 'string',
        description: 'Het unieke ID van de klant',
        required: true,
      },
      {
        name: 'topic',
        type: 'string',
        description: 'Het onderwerp van de video',
        required: true,
      },
      {
        name: 'duration',
        type: 'number',
        description: 'Gewenste duur in seconden (bijv. 30, 60, 90)',
        required: false,
      },
      {
        name: 'style',
        type: 'string',
        description: 'Stijl van de video (bijv. "educatief", "entertainend", "commercieel")',
        required: false,
      },
    ],
  },
  {
    name: 'create_invoice',
    description: 'Maak een nieuwe factuur aan voor een klant',
    parameters: [
      {
        name: 'clientId',
        type: 'string',
        description: 'Het unieke ID van de klant',
        required: true,
      },
      {
        name: 'amount',
        type: 'number',
        description: 'Het factuurbedrag in euro\'s',
        required: true,
      },
      {
        name: 'description',
        type: 'string',
        description: 'Beschrijving van de factuur',
        required: true,
      },
    ],
  },
  {
    name: 'send_email',
    description: 'Verstuur een email naar een klant',
    parameters: [
      {
        name: 'clientId',
        type: 'string',
        description: 'Het unieke ID van de klant',
        required: true,
      },
      {
        name: 'subject',
        type: 'string',
        description: 'Het onderwerp van de email',
        required: true,
      },
      {
        name: 'body',
        type: 'string',
        description: 'De inhoud van de email (HTML mogelijk)',
        required: true,
      },
    ],
  },
  {
    name: 'get_assignments',
    description: 'Haal opdrachten op, optioneel gefilterd op status of klant',
    parameters: [
      {
        name: 'status',
        type: 'string',
        description: 'Filter op status',
        required: false,
        enum: ['pending', 'in_progress', 'completed', 'cancelled'],
      },
      {
        name: 'clientId',
        type: 'string',
        description: 'Filter op klant ID',
        required: false,
      },
    ],
  },
  {
    name: 'update_assignment',
    description: 'Update de status of notities van een opdracht',
    parameters: [
      {
        name: 'assignmentId',
        type: 'string',
        description: 'Het unieke ID van de opdracht',
        required: true,
      },
      {
        name: 'status',
        type: 'string',
        description: 'Nieuwe status',
        required: true,
        enum: ['pending', 'in_progress', 'completed', 'cancelled'],
      },
      {
        name: 'notes',
        type: 'string',
        description: 'Optionele notities',
        required: false,
      },
    ],
  },
  {
    name: 'get_analytics',
    description: 'Haal business statistieken en analytics op',
    parameters: [
      {
        name: 'period',
        type: 'string',
        description: 'Tijdsperiode voor de statistieken',
        required: false,
        enum: ['today', 'week', 'month', 'year'],
      },
    ],
  },
  {
    name: 'generate_image',
    description: 'Genereer een afbeelding met AI (DALL-E, FLUX, etc.)',
    parameters: [
      {
        name: 'prompt',
        type: 'string',
        description: 'Beschrijving van de gewenste afbeelding',
        required: true,
      },
      {
        name: 'style',
        type: 'string',
        description: 'Stijl van de afbeelding',
        required: false,
        enum: ['realistic', 'artistic', 'logo', 'thumbnail'],
      },
      {
        name: 'model',
        type: 'string',
        description: 'Optioneel: specifiek model ID',
        required: false,
      },
    ],
  },
  {
    name: 'list_models',
    description: 'Toon beschikbare AI modellen, optioneel gefilterd op categorie',
    parameters: [
      {
        name: 'category',
        type: 'string',
        description: 'Filter op model categorie',
        required: false,
        enum: ['chat', 'code', 'image', 'video', 'voice', 'audio', 'embedding', 'moderation'],
      },
    ],
  },
  {
    name: 'run_model',
    description: 'Voer een specifiek AI model uit met een prompt. Gebruik dit voor gespecialiseerde taken met een specifiek model.',
    parameters: [
      {
        name: 'modelId',
        type: 'string',
        description: 'Het ID van het model (bijv. "gpt-5-2025-08-07")',
        required: true,
      },
      {
        name: 'prompt',
        type: 'string',
        description: 'De prompt voor het model',
        required: true,
      },
      {
        name: 'options',
        type: 'object',
        description: 'Optionele model parameters (temperature, max_tokens, etc.)',
        required: false,
      },
    ],
  },
  {
    name: 'get_content_plan',
    description: 'Haal het content plan van een klant op',
    parameters: [
      {
        name: 'clientId',
        type: 'string',
        description: 'Het unieke ID van de klant',
        required: true,
      },
    ],
  },
  {
    name: 'generate_content_plan',
    description: 'Genereer een nieuw content plan voor een klant',
    parameters: [
      {
        name: 'clientId',
        type: 'string',
        description: 'Het unieke ID van de klant',
        required: true,
      },
      {
        name: 'duration',
        type: 'number',
        description: 'Aantal dagen (bijv. 30 voor een maand)',
        required: false,
      },
    ],
  },
  {
    name: 'get_autopilot_status',
    description: 'Haal de autopilot status van een klant op',
    parameters: [
      {
        name: 'clientId',
        type: 'string',
        description: 'Het unieke ID van de klant',
        required: true,
      },
    ],
  },
  {
    name: 'update_autopilot',
    description: 'Update autopilot instellingen van een klant',
    parameters: [
      {
        name: 'clientId',
        type: 'string',
        description: 'Het unieke ID van de klant',
        required: true,
      },
      {
        name: 'active',
        type: 'boolean',
        description: 'Zet autopilot aan of uit',
        required: true,
      },
      {
        name: 'frequency',
        type: 'string',
        description: 'Frequentie van content generatie',
        required: false,
        enum: ['daily', 'weekly', 'monthly'],
      },
    ],
  },
  {
    name: 'get_wordpress_posts',
    description: 'Haal WordPress posts van een klant op',
    parameters: [
      {
        name: 'clientId',
        type: 'string',
        description: 'Het unieke ID van de klant',
        required: true,
      },
      {
        name: 'limit',
        type: 'number',
        description: 'Maximum aantal posts',
        required: false,
      },
    ],
  },
  {
    name: 'publish_to_wordpress',
    description: 'Publiceer content naar WordPress van een klant',
    parameters: [
      {
        name: 'clientId',
        type: 'string',
        description: 'Het unieke ID van de klant',
        required: true,
      },
      {
        name: 'title',
        type: 'string',
        description: 'Titel van het artikel',
        required: true,
      },
      {
        name: 'content',
        type: 'string',
        description: 'Inhoud van het artikel (HTML)',
        required: true,
      },
      {
        name: 'status',
        type: 'string',
        description: 'Publicatie status',
        required: false,
        enum: ['publish', 'draft', 'pending'],
      },
    ],
  },
  {
    name: 'search_database',
    description: 'Zoek in de database naar specifieke informatie',
    parameters: [
      {
        name: 'query',
        type: 'string',
        description: 'Zoekterm',
        required: true,
      },
      {
        name: 'table',
        type: 'string',
        description: 'Optioneel: specifieke tabel om in te zoeken',
        required: false,
        enum: ['clients', 'articles', 'assignments', 'invoices'],
      },
    ],
  },
];

/**
 * Convert tool to OpenAI function calling format
 */
export function toolToOpenAIFunction(tool: Tool): any {
  const properties: any = {};
  const required: string[] = [];

  for (const param of tool.parameters) {
    properties[param.name] = {
      type: param.type,
      description: param.description,
    };

    if (param.enum) {
      properties[param.name].enum = param.enum;
    }

    if (param.items) {
      properties[param.name].items = param.items;
    }

    if (param.required) {
      required.push(param.name);
    }
  }

  return {
    type: 'function',
    function: {
      name: tool.name,
      description: tool.description,
      parameters: {
        type: 'object',
        properties,
        required: required.length > 0 ? required : undefined,
      },
    },
  };
}

/**
 * Convert all tools to OpenAI function calling format
 */
export function getAllToolsAsOpenAIFunctions(): any[] {
  return AVAILABLE_TOOLS.map(toolToOpenAIFunction);
}

/**
 * Get tool by name
 */
export function getToolByName(name: string): Tool | undefined {
  return AVAILABLE_TOOLS.find(tool => tool.name === name);
}
