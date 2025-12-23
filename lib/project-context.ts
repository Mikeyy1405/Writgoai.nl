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

/**
 * Get full project context for content generation
 */
export async function getProjectContext(projectId: string): Promise<ProjectContext> {
  const [knowledgeBase, internalLinks, externalLinks, affiliateConfig, customInstructions] = await Promise.all([
    getKnowledgeBaseContext(projectId),
    getInternalLinks(projectId),
    getExternalLinks(projectId),
    getAffiliateConfig(projectId),
    getCustomInstructions(projectId),
  ]);

  return {
    knowledgeBase,
    internalLinks,
    externalLinks,
    affiliateConfig,
    customInstructions,
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
    .from('Project')
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
 * Get external links from other projects of the same client
 */
async function getExternalLinks(projectId: string): Promise<ExternalLink[]> {
  // Get client ID for this project
  const { data: currentProject } = await supabaseAdmin
    .from('Project')
    .select('clientId')
    .eq('id', projectId)
    .single();

  if (!currentProject?.clientId) {
    return [];
  }

  // Get other projects from the same client
  const { data: otherProjects } = await supabaseAdmin
    .from('Project')
    .select('id, name, websiteUrl')
    .eq('clientId', currentProject.clientId)
    .neq('id', projectId)
    .eq('isActive', true);

  if (!otherProjects || otherProjects.length === 0) {
    return [];
  }

  // Get published articles from other projects
  const externalLinks: ExternalLink[] = [];

  for (const project of otherProjects) {
    const { data: articles } = await supabaseAdmin
      .from('articles')
      .select('title, slug, excerpt')
      .eq('project_id', project.id)
      .eq('status', 'published')
      .order('created_at', { ascending: false })
      .limit(10);

    if (articles && articles.length > 0) {
      const baseUrl = project.websiteUrl?.replace(/\/$/, '') || '';
      
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

  return externalLinks;
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
 * Get custom instructions from project settings
 */
async function getCustomInstructions(projectId: string): Promise<string> {
  const { data: project } = await supabaseAdmin
    .from('Project')
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
## Externe links naar gerelateerde websites (optioneel, voeg 1-2 toe indien relevant):
${linkList}
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
 * Build complete context prompt for content generation
 */
export function buildContextPrompt(context: ProjectContext): string {
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

  return parts.join('\n\n');
}
