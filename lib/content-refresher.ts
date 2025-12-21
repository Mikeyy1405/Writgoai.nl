import { createClient } from '@/lib/supabase-server';
import aiClient from '@/lib/ai-client';

export interface RefreshOptions {
  articleId: string;
  reason: 'declining' | 'outdated' | 'manual';
  currentContent: string;
  currentTitle: string;
  keywords?: string[];
  position?: number;
}

export class ContentRefresher {
  /**
   * Refresh an article with updated information
   */
  async refreshArticle(options: RefreshOptions): Promise<{
    updatedContent: string;
    updatedTitle?: string;
    changes: string[];
  }> {
    const { articleId, reason, currentContent, currentTitle, keywords, position } = options;

    // Build refresh prompt
    const refreshPrompt = this.buildRefreshPrompt(
      currentContent,
      currentTitle,
      reason,
      keywords,
      position
    );

    // Generate refreshed content
    const response = await aiClient.generateText(refreshPrompt, {
      maxTokens: 4000,
      temperature: 0.7,
    });

    // Parse response
    const refreshed = this.parseRefreshResponse(response);

    return refreshed;
  }

  /**
   * Build prompt for content refresh
   */
  private buildRefreshPrompt(
    currentContent: string,
    currentTitle: string,
    reason: string,
    keywords?: string[],
    position?: number
  ): string {
    const today = new Date().toLocaleDateString('nl-NL', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });

    let reasonContext = '';
    if (reason === 'declining') {
      reasonContext = `Dit artikel verliest rankings en traffic. Het staat nu op positie ${position || 'onbekend'}.`;
    } else if (reason === 'outdated') {
      reasonContext = 'Dit artikel is verouderd en moet ge-update worden met recente informatie.';
    } else {
      reasonContext = 'Dit artikel moet geoptimaliseerd worden voor betere rankings.';
    }

    const keywordContext = keywords && keywords.length > 0
      ? `\n\nFocus keywords: ${keywords.join(', ')}`
      : '';

    return `Je bent een expert SEO content writer. Je taak is om een bestaand artikel te refreshen en verbeteren.

${reasonContext}${keywordContext}

**HUIDIGE ARTIKEL:**
Titel: ${currentTitle}

${currentContent}

**REFRESH INSTRUCTIES:**

1. **Update met recente informatie:**
   - Voeg de laatste updates toe (december 2024)
   - Update statistieken en cijfers
   - Voeg nieuwe ontwikkelingen toe
   - Verwijder verouderde informatie

2. **Verbeter SEO:**
   - Optimaliseer voor focus keywords
   - Verbeter meta description
   - Voeg relevante H2/H3 headings toe
   - Voeg FAQ sectie toe of update bestaande

3. **Verbeter leesbaarheid:**
   - Maak zinnen korter en punchier
   - Voeg praktische voorbeelden toe
   - Gebruik bullet points waar mogelijk
   - Voeg call-to-actions toe

4. **AI Overview optimization:**
   - Start met direct antwoord
   - Gebruik numbered lists
   - Voeg tabellen toe voor vergelijkingen
   - Gebruik exacte cijfers en datums

5. **Voeg "Laatst bijgewerkt" toe:**
   - Voeg bovenaan toe: "Laatst bijgewerkt: ${today}"

**OUTPUT FORMAT:**

UPDATED_TITLE: [nieuwe titel indien nodig, of "SAME" als titel goed is]

CHANGES:
- [lijst van belangrijkste wijzigingen]
- [wat is toegevoegd/verwijderd/verbeterd]

UPDATED_CONTENT:
[volledige ge-update artikel in HTML format, inclusief alle secties]

Schrijf in professioneel Nederlands, SEO-geoptimaliseerd, en klaar voor publicatie.`;
  }

  /**
   * Parse AI response
   */
  private parseRefreshResponse(response: string): {
    updatedContent: string;
    updatedTitle?: string;
    changes: string[];
  } {
    const titleMatch = response.match(/UPDATED_TITLE:\s*(.+)/);
    const updatedTitle = titleMatch && titleMatch[1].trim() !== 'SAME'
      ? titleMatch[1].trim()
      : undefined;

    const changesMatch = response.match(/CHANGES:\n((?:- .+\n?)+)/);
    const changes = changesMatch
      ? changesMatch[1].split('\n').filter(line => line.trim().startsWith('-')).map(line => line.replace(/^-\s*/, '').trim())
      : [];

    const contentMatch = response.match(/UPDATED_CONTENT:\n([\s\S]+)/);
    const updatedContent = contentMatch ? contentMatch[1].trim() : response;

    return {
      updatedContent,
      updatedTitle,
      changes,
    };
  }

  /**
   * Save refreshed article
   */
  async saveRefreshedArticle(
    articleId: string,
    updatedContent: string,
    updatedTitle?: string,
    changes?: string[]
  ): Promise<void> {
    const supabase = createClient();

    const updateData: any = {
      content: updatedContent,
      updated_at: new Date().toISOString(),
    };

    if (updatedTitle) {
      updateData.title = updatedTitle;
    }

    await supabase
      .from('articles')
      .update(updateData)
      .eq('id', articleId);

    // Log the refresh
    await supabase
      .from('writgo_activity_log')
      .insert({
        action: 'content_refreshed',
        details: {
          article_id: articleId,
          changes: changes || [],
          refreshed_at: new Date().toISOString(),
        },
      });
  }

  /**
   * Find articles that need refresh
   */
  async findArticlesNeedingRefresh(): Promise<any[]> {
    const supabase = createClient();

    // Find articles older than 6 months
    const sixMonthsAgo = new Date();
    sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 6);

    const { data: articles } = await supabase
      .from('articles')
      .select('id, slug, title, content, published_at, updated_at')
      .eq('status', 'published')
      .lt('updated_at', sixMonthsAgo.toISOString())
      .order('published_at', { ascending: true })
      .limit(50);

    return articles || [];
  }
}

// Export singleton
export const contentRefresher = new ContentRefresher();
