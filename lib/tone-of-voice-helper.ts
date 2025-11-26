/**
 * Tone of Voice Helper
 * Helper functies om tone of voice op te halen en te gebruiken in content generatie
 */

import { prisma } from '@/lib/db';

export interface ToneOfVoiceData {
  toneOfVoice: string;
  customInstructions: string;
  hasCustomTone: boolean;
}

/**
 * Haal tone of voice op voor een client (met optioneel project override)
 */
export async function getClientToneOfVoice(
  clientId: string,
  projectId?: string
): Promise<ToneOfVoiceData> {
  // Get client-level settings
  const clientData = await prisma.client.findUnique({
    where: { id: clientId },
    select: {
      brandVoice: true,
      aiSettings: {
        select: {
          toneOfVoice: true,
          customInstructions: true,
        },
      },
    },
  });

  let toneOfVoice = clientData?.aiSettings?.toneOfVoice || clientData?.brandVoice || '';
  let customInstructions = clientData?.aiSettings?.customInstructions || '';

  // Override with project-level settings if project ID is provided
  if (projectId) {
    const project = await prisma.project.findUnique({
      where: { id: projectId },
      select: {
        brandVoice: true,
        customInstructions: true,
      },
    });

    if (project) {
      toneOfVoice = project.brandVoice || toneOfVoice;
      customInstructions = project.customInstructions || customInstructions;
    }
  }

  return {
    toneOfVoice,
    customInstructions,
    hasCustomTone: !!toneOfVoice,
  };
}

/**
 * Genereer tone of voice instructies voor AI prompts
 */
export function generateToneOfVoicePrompt(
  toneData: ToneOfVoiceData,
  fallbackTone: 'professional' | 'casual' | 'friendly' | 'expert' | 'formal' = 'professional'
): string {
  if (toneData.hasCustomTone) {
    let prompt = `
**TONE OF VOICE (CUSTOM - DIT IS DE STEM VAN HET MERK):**
${toneData.toneOfVoice}

Volg deze tone of voice instructies nauwkeurig bij het schrijven. Dit bepaalt HOE je schrijft (formeel/informeel, je/u, wel/geen emoji's, schrijfstijl, etc.).
`;

    if (toneData.customInstructions) {
      prompt += `

**EXTRA SCHRIJFINSTRUCTIES:**
${toneData.customInstructions}
`;
    }

    return prompt;
  }

  // Fallback to default tones
  const defaultToneMap: Record<string, string> = {
    professional: 'Professionele, zakelijke toon. Formeel maar toegankelijk. Gebruik "u" of "je" afhankelijk van de context.',
    casual: 'Casual, vriendelijke toon. Gebruik "je/jij" en schrijf alsof je een vriend adviseert. Informeel maar wel professioneel.',
    expert: 'Autoritaire, expert toon. Technisch en grondig. Toon diepgaande kennis en expertise.',
    friendly: 'Vriendelijke, warme toon. Persoonlijk en toegankelijk. Betrokken en empathisch.',
    formal: 'Formele, academische toon. Objectief en nauwkeurig. Gebruik correcte terminologie.',
  };

  return `**TONE:** ${defaultToneMap[fallbackTone]}`;
}

/**
 * Verkrijg tone of voice door email (voor routes zonder clientId)
 */
export async function getClientToneOfVoiceByEmail(
  email: string,
  projectId?: string
): Promise<ToneOfVoiceData> {
  const client = await prisma.client.findUnique({
    where: { email },
    select: { id: true },
  });

  if (!client) {
    return {
      toneOfVoice: '',
      customInstructions: '',
      hasCustomTone: false,
    };
  }

  return getClientToneOfVoice(client.id, projectId);
}
