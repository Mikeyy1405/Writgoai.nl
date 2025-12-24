/**
 * Project Context Helper
 * 
 * Provides context information for AI content generation including:
 * - Knowledge base entries
 * - Internal links from existing articles
 * - External links from other projects
 * - Affiliate configuration
 */

import { createClient } from '@supabase/supabase-js';

const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export interface ProjectContext {
  knowledgeBase: string;
  internalLinks: InternalLink[];
  externalLinks: ExternalLink[];
  affiliateConfig: AffiliateConfig | null;
  customInstructions: string;
}

export interface InternalLink {
  title: string;
  slug: string;
  url: string;
  excerpt?: string;
}

export interface ExternalLink {
  projectName: string;
  title: string;
  url: string;
  excerpt?: string;
}

export interface AffiliateConfig {
  platform: string;
  siteCode: string;
  clientId?: string;
  clientSecret?: string;
  isActive: boolean;
}

export interface CustomAffiliateLink {
  name: string;
  url: string;
  description: string;
}

/**
 * Get full project context for content generation
 */
export async function getProjectContext(projectId: string): Promise<ProjectContext & { customAffiliateLinks: CustomAffiliateLink[] }> {
  // Check if backlinks are enabled for this project
  const { data: project } = await supabaseAdmin
    .from('projects')
    .select('enable_backlinks')
    .eq('id', projectId)
    .single();

  const backlinksEnabled = project?.enable_backlinks !== false; // Default to true

  const [knowledgeBase, internalLinks, externalLinks, affiliateConfig, customInstructions, customAffiliateLinks] = await Promise.all([
    getKnowledgeBaseContext(projectId),
    backlinksEnabled ? getInternalLinks(projectId) : Promise.resolve([]),
    backlinksEnabled ? getExternalLinks(projectId) : Promise.resolve([]),
    getAffiliateConfig(projectId),
    getCustomInstructions(projectId),
    getCustomAffiliateLinks(projectId),
  ]);

  return {
    knowledgeBase,
    internalLinks,
    externalLinks,
    affiliateConfig,
    customInstructions,
    customAffiliateLinks,
  };
}

/**
 * Get knowledge base entries as context string
 */
async function getKnowledgeBaseContext(projectId: string): Promise<string> {
  const { data: entries } = await supabaseAdmin
    .from('project_knowledge_base')
    .select('title, content, category')
    .eq('project_id', projectId)
    .eq('is_active', true);

  if (!entries || entries.length === 0) {
    return '';
  }

  const context = entries.map(entry => 
    `### ${entry.title} (${entry.category})\n${entry.content}`
  ).join('\n\n');

  return `\n\n## Kennisbank informatie (gebruik dit in je artikel waar relevant):\n${context}`;
}

/**
 * Get internal links from existing articles in the same project
 */
async function getInternalLinks(projectId: string): Promise<InternalLink[]> {
  // Get project website URL
  const { data: project } = await supabaseAdmin
    .from('projects')
    .select('websiteUrl')
    .eq('id', projectId)
    .single();

  if (!project?.websiteUrl) {
    return [];
  }

  // Get published articles from this project
  const { data: articles } = await supabaseAdmin
    .from('articles')
    .select('title, slug, excerpt')
    .eq('project_id', projectId)
    .eq('status', 'published')
    .order('created_at', { ascending: false })
    .limit(50);

  if (!articles || articles.length === 0) {
    return [];
  }

  const baseUrl = project.websiteUrl.replace(/\/$/, '');

  return articles.map(article => ({
    title: article.title,
    slug: article.slug,
    url: `${baseUrl}/${article.slug}`,
    excerpt: article.excerpt,
  }));
}

/**
 * Get external links from other projects
 * Includes both:
 * 1. Other projects from the same user/client
 * 2. Projects from other users participating in backlink exchange network
 */
async function getExternalLinks(projectId: string): Promise<ExternalLink[]> {
  // Get current project info
  const { data: currentProject } = await supabaseAdmin
    .from('projects')
    .select('user_id, participate_in_backlink_exchange, backlink_exchange_category, max_outbound_backlinks')
    .eq('id', projectId)
    .single();

  if (!currentProject) {
    return [];
  }

  const externalLinks: ExternalLink[] = [];
  const maxLinks = currentProject.max_outbound_backlinks || 5;

  // 1. Get projects from the same user (always included)
  const { data: sameUserProjects } = await supabaseAdmin
    .from('projects')
    .select('id, name, website_url')
    .eq('user_id', currentProject.user_id)
    .neq('id', projectId)
    .limit(3);

  if (sameUserProjects && sameUserProjects.length > 0) {
    for (const project of sameUserProjects) {
      const { data: articles } = await supabaseAdmin
        .from('articles')
        .select('title, slug, excerpt')
        .eq('project_id', project.id)
        .eq('status', 'published')
        .order('created_at', { ascending: false })
        .limit(3);

      if (articles && articles.length > 0) {
        const baseUrl = project.website_url?.replace(/\/$/, '') || '';

        for (const article of articles) {
          externalLinks.push({
            projectName: project.name,
            title: article.title,
            url: `${baseUrl}/${article.slug}`,
            excerpt: article.excerpt,
          });
        }
      }
    }
  }

  // 2. Get projects from backlink exchange network (if opted in)
  if (currentProject.participate_in_backlink_exchange) {
    const { data: exchangeProjects } = await supabaseAdmin
      .from('projects')
      .select('id, name, website_url, backlink_exchange_category')
      .eq('participate_in_backlink_exchange', true)
      .neq('id', projectId)
      .neq('user_id', currentProject.user_id) // Different users only
      .limit(10);

    if (exchangeProjects && exchangeProjects.length > 0) {
      // Filter by matching category if specified
      const relevantProjects = currentProject.backlink_exchange_category
        ? exchangeProjects.filter(p =>
            p.backlink_exchange_category === currentProject.backlink_exchange_category
          )
        : exchangeProjects;

      // Shuffle to distribute backlinks fairly across the network
      const shuffled = relevantProjects.sort(() => Math.random() - 0.5);
      const selectedProjects = shuffled.slice(0, 3); // Max 3 external projects

      for (const project of selectedProjects) {
        const { data: articles } = await supabaseAdmin
          .from('articles')
          .select('id, title, slug, excerpt')
          .eq('project_id', project.id)
          .eq('status', 'published')
          .order('created_at', { ascending: false })
          .limit(2); // Max 2 articles per external project

        if (articles && articles.length > 0) {
          const baseUrl = project.website_url?.replace(/\/$/, '') || '';

          for (const article of articles) {
            externalLinks.push({
              projectName: project.name,
              title: article.title,
              url: `${baseUrl}/${article.slug}`,
              excerpt: article.excerpt,
            });
          }
        }
      }
    }
  }

  // Limit total external links
  return externalLinks.slice(0, maxLinks);
}

/**
 * Get affiliate configuration for the project
 */
async function getAffiliateConfig(projectId: string): Promise<AffiliateConfig | null> {
  const { data: affiliate } = await supabaseAdmin
    .from('project_affiliates')
    .select('*')
    .eq('project_id', projectId)
    .eq('platform', 'bol.com')
    .eq('is_active', true)
    .single();

  if (!affiliate) {
    return null;
  }

  return {
    platform: affiliate.platform,
    siteCode: affiliate.site_code || '',
    clientId: affiliate.client_id,
    clientSecret: affiliate.client_secret,
    isActive: affiliate.is_active,
  };
}

/**
 * Get custom affiliate links for the project
 */
async function getCustomAffiliateLinks(projectId: string): Promise<CustomAffiliateLink[]> {
  const { data: affiliate } = await supabaseAdmin
    .from('project_affiliates')
    .select('custom_links')
    .eq('project_id', projectId)
    .eq('platform', 'custom')
    .eq('is_active', true)
    .single();

  if (!affiliate?.custom_links) {
    return [];
  }

  // Parse custom_links - it's stored as text in format: "Name | URL | Description" per line
  const linksText = typeof affiliate.custom_links === 'string' 
    ? affiliate.custom_links 
    : '';

  const links: CustomAffiliateLink[] = [];
  const lines = linksText.split('\n').filter((line: string) => line.trim());

  for (const line of lines) {
    const parts = line.split('|').map((p: string) => p.trim());
    if (parts.length >= 2) {
      links.push({
        name: parts[0] || '',
        url: parts[1] || '',
        description: parts[2] || '',
      });
    }
  }

  return links;
}

/**
 * Get custom instructions from project settings
 */
async function getCustomInstructions(projectId: string): Promise<string> {
  const { data: project } = await supabaseAdmin
    .from('projects')
    .select('customInstructions, brandVoice, targetAudience, writingStyle')
    .eq('id', projectId)
    .single();

  if (!project) {
    return '';
  }

  const instructions: string[] = [];

  if (project.customInstructions) {
    instructions.push(`Custom instructies: ${project.customInstructions}`);
  }
  if (project.brandVoice) {
    instructions.push(`Brand voice: ${project.brandVoice}`);
  }
  if (project.targetAudience) {
    instructions.push(`Doelgroep: ${project.targetAudience}`);
  }
  if (project.writingStyle) {
    instructions.push(`Schrijfstijl: ${project.writingStyle}`);
  }

  return instructions.join('\n');
}

/**
 * Format internal links for AI prompt
 */
export function formatInternalLinksForPrompt(links: InternalLink[]): string {
  if (links.length === 0) {
    return '';
  }

  const linkList = links.slice(0, 20).map(link => 
    `- "${link.title}": ${link.url}`
  ).join('\n');

  return `
## Interne links (voeg 2-4 relevante links toe in je artikel):
${linkList}

Instructies voor interne links:
- Voeg links toe waar ze natuurlijk passen in de tekst
- Gebruik beschrijvende anchor tekst (niet "klik hier")
- Link naar gerelateerde onderwerpen
- Gebruik HTML: <a href="URL">anchor tekst</a>
`;
}

/**
 * Format external links for AI prompt
 */
export function formatExternalLinksForPrompt(links: ExternalLink[]): string {
  if (links.length === 0) {
    return '';
  }

  const linkList = links.slice(0, 10).map(link =>
    `- "${link.title}" (${link.projectName}): ${link.url}`
  ).join('\n');

  return `
## BACKLINK EXCHANGE - Externe links naar partner websites (VERPLICHT - voeg 2-4 toe!):
${linkList}

**Backlink Exchange Instructies:**
- Dit zijn websites van andere WritGo gebruikers die ook naar jouw site linken
- Voeg MINIMAAL 2-4 van deze links toe in je artikel waar ze relevant zijn
- Gebruik beschrijvende anchor tekst (niet "klik hier" of "lees meer")
- Link naar artikelen die gerelateerd zijn aan jouw onderwerp
- Gebruik HTML: <a href="URL" target="_blank" rel="noopener">anchor tekst</a>
- Dit is een WIN-WIN: zij linken naar jou, jij linkt naar hen = betere SEO voor iedereen!

**Voorbeelden van goede integratie:**
- "Zoals uitgelegd in dit artikel over [onderwerp]..."
- "Meer informatie over [onderwerp] vind je hier: [link]"
- "Een vergelijkbaar perspectief wordt besproken in [artikel titel]"
`;
}

/**
 * Generate Bol.com affiliate link
 */
export function generateBolAffiliateLink(
  productUrl: string,
  siteCode: string,
  productName?: string
): string {
  const encodedUrl = encodeURIComponent(productUrl);
  const encodedName = encodeURIComponent(productName || 'Product');
  
  return `https://partner.bol.com/click/click?p=2&t=url&s=${siteCode}&f=TXL&url=${encodedUrl}&name=${encodedName}`;
}

/**
 * Format affiliate instructions for AI prompt
 */
export function formatAffiliateInstructions(config: AffiliateConfig | null): string {
  if (!config || !config.isActive || !config.siteCode) {
    return '';
  }

  return `
## Affiliate Links (Bol.com):
- Site code: ${config.siteCode}
- Wanneer je producten noemt, voeg een affiliate link toe
- Link format: https://partner.bol.com/click/click?p=2&t=url&s=${config.siteCode}&f=TXL&url=[ENCODED_BOL_URL]&name=[PRODUCT_NAME]
- Voorbeeld: <a href="https://partner.bol.com/click/click?p=2&t=url&s=${config.siteCode}&f=TXL&url=https%3A%2F%2Fwww.bol.com%2Fnl%2Fnl%2F&name=Product">Bekijk op Bol.com</a>
`;
}

/**
 * Format custom affiliate links for AI prompt
 */
export function formatCustomAffiliateLinks(links: CustomAffiliateLink[]): string {
  if (links.length === 0) {
    return '';
  }

  const linkList = links.map(link => 
    `- ${link.name}: ${link.url}${link.description ? ` - ${link.description}` : ''}`
  ).join('\n');

  return `
## Eigen Affiliate Links (voeg deze toe waar relevant):
${linkList}

Instructies voor affiliate links:
- Voeg deze links toe wanneer je producten of diensten noemt die hierbij passen
- Gebruik de productnaam als anchor tekst
- Maak de link natuurlijk onderdeel van de tekst
- Gebruik HTML: <a href="URL" target="_blank" rel="noopener">productnaam</a>
`;
}

/**
 * Build complete context prompt for content generation
 */
export function buildContextPrompt(context: ProjectContext & { customAffiliateLinks?: CustomAffiliateLink[] }): string {
  const parts: string[] = [];

  if (context.customInstructions) {
    parts.push(`## Project Instructies:\n${context.customInstructions}`);
  }

  if (context.knowledgeBase) {
    parts.push(context.knowledgeBase);
  }

  if (context.internalLinks.length > 0) {
    parts.push(formatInternalLinksForPrompt(context.internalLinks));
  }

  if (context.externalLinks.length > 0) {
    parts.push(formatExternalLinksForPrompt(context.externalLinks));
  }

  if (context.affiliateConfig) {
    parts.push(formatAffiliateInstructions(context.affiliateConfig));
  }

  if (context.customAffiliateLinks && context.customAffiliateLinks.length > 0) {
    parts.push(formatCustomAffiliateLinks(context.customAffiliateLinks));
  }

  return parts.join('\n\n');
}
