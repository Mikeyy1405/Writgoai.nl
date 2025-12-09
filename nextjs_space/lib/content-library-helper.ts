
/**
 * Content Library Auto-Save Helper
 * 
 * Automatisch content opslaan in de Content Bibliotheek
 * met slimme duplicate detection
 */

import { supabaseAdmin as prisma } from '@/lib/supabase';

// Language type definition (from Supabase schema)
export type Language = 'NL' | 'EN' | 'DE' | 'ES' | 'FR' | 'IT' | 'PT' | 'PL' | 'SV' | 'DA';

export interface ContentToSave {
  clientId: string;
  type: 'blog' | 'social' | 'video' | 'code' | 'linkbuilding' | 'other';
  title: string;
  content: string;
  contentHtml?: string;
  category?: string;
  tags?: string[];
  description?: string;
  keywords?: string[];
  metaDesc?: string;
  slug?: string;
  thumbnailUrl?: string;
  imageUrls?: string[];
  projectId?: string;
  language?: Language | string;
}

/**
 * Sla content automatisch op in de bibliotheek
 * - Voorkomt duplicaten (zelfde title + type binnen 24 uur)
 * - Berekent automatisch word count en character count
 * - Retourneert success status
 */
export async function autoSaveToLibrary(data: ContentToSave): Promise<{
  success: boolean;
  saved: boolean;
  duplicate: boolean;
  contentId?: string;
  message: string;
}> {
  try {
    // Valideer verplichte velden
    if (!data.clientId || !data.type || !data.title || !data.content) {
      return {
        success: false,
        saved: false,
        duplicate: false,
        message: 'Ontbrekende verplichte velden (clientId, type, title, content)',
      };
    }

    // Check voor duplicaten (binnen 24 uur, zelfde title + type)
    const oneDayAgo = new Date();
    oneDayAgo.setDate(oneDayAgo.getDate() - 1);

    const existingContent = await prisma.savedContent.findFirst({
      where: {
        clientId: data.clientId,
        type: data.type,
        title: data.title,
        createdAt: {
          gte: oneDayAgo, // Alleen content van laatste 24 uur
        },
      },
      select: {
        id: true,
        title: true,
        createdAt: true,
      },
    });

    // Als duplicate gevonden, skip opslaan
    if (existingContent) {
      console.log(`⏭️  Duplicate content gedetecteerd, overslaan: "${data.title}"`);
      return {
        success: true,
        saved: false,
        duplicate: true,
        contentId: existingContent.id,
        message: `Content "${data.title}" al opgeslagen (${existingContent.createdAt.toLocaleString('nl-NL')})`,
      };
    }

    // Bereken stats
    const text = data.content || '';
    const wordCount = text.split(/\s+/).filter((word: string) => word.length > 0).length;
    const characterCount = text.length;

    // Maak slug als die niet bestaat
    const slug = data.slug || data.title
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-+|-+$/g, '');

    // Sla content op
    const savedContent = await prisma.savedContent.create({
      data: {
        clientId: data.clientId,
        type: data.type,
        title: data.title,
        content: data.content,
        contentHtml: data.contentHtml || null,
        category: data.category || null,
        tags: data.tags || [],
        description: data.description || null,
        keywords: data.keywords || [],
        metaDesc: data.metaDesc || null,
        slug,
        thumbnailUrl: data.thumbnailUrl || null,
        imageUrls: data.imageUrls || [],
        projectId: data.projectId || null,
        language: (data.language as Language) || 'NL', // Gebruik opgegeven taal of default NL
        wordCount,
        characterCount,
        isFavorite: false,
        isArchived: false,
      },
    });

    console.log(`✅ Content automatisch opgeslagen in bibliotheek: "${savedContent.title}" (${savedContent.type})`);

    return {
      success: true,
      saved: true,
      duplicate: false,
      contentId: savedContent.id,
      message: `Content "${savedContent.title}" succesvol opgeslagen in de Content Bibliotheek`,
    };

  } catch (error: any) {
    console.error('❌ Fout bij auto-save naar Content Bibliotheek:', error);
    return {
      success: false,
      saved: false,
      duplicate: false,
      message: `Fout bij opslaan: ${error.message}`,
    };
  }
}

/**
 * Helper functie om meerdere content items tegelijk op te slaan
 * Handig voor bulk operaties
 */
export async function autoSaveBulkToLibrary(items: ContentToSave[]): Promise<{
  success: boolean;
  saved: number;
  duplicates: number;
  errors: number;
  messages: string[];
}> {
  const results = {
    success: true,
    saved: 0,
    duplicates: 0,
    errors: 0,
    messages: [] as string[],
  };

  for (const item of items) {
    const result = await autoSaveToLibrary(item);
    
    if (result.saved) {
      results.saved++;
      results.messages.push(`✅ ${item.title}`);
    } else if (result.duplicate) {
      results.duplicates++;
      results.messages.push(`⏭️  ${item.title} (duplicate)`);
    } else {
      results.errors++;
      results.messages.push(`❌ ${item.title}: ${result.message}`);
      results.success = false;
    }
  }

  return results;
}
