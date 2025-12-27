import { NextResponse } from 'next/server';
import { generateAICompletion, analyzeWithPerplexityJSON } from '@/lib/ai-client';
import { createClient as createServerClient } from '@/lib/supabase-server';
import { createClient } from '@supabase/supabase-js';
import { getRelatedKeywords } from '@/lib/dataforseo-client';
import { checkForbiddenWords } from '@/lib/writing-rules';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';
export const maxDuration = 480; // 8 minutes max (increased for better reliability with timeouts)

// Content extraction configuration
const CONTENT_EXTRACTION_CONFIG = {
  MIN_PRODUCT_NAME_LENGTH: 3,
  MIN_CATEGORY_NAME_LENGTH: 2,
  MAX_CATEGORY_NAME_LENGTH: 50,
  MIN_KEYWORD_LENGTH: 4,
  MAX_TEXT_CONTENT_LENGTH: 8000,
  MAX_PRODUCTS: 20,
  MAX_CATEGORIES: 15,
  MAX_KEYWORDS: 20,
};

// Stop words for keyword analysis (multi-language)
const STOP_WORDS = new Set([
  // Dutch
  'de', 'het', 'een', 'en', 'van', 'voor', 'op', 'in', 'met', 'is', 'zijn', 'dat', 'die', 'naar', 'te', 'aan',
  // English
  'the', 'a', 'an', 'and', 'or', 'of', 'to', 'in', 'for', 'on', 'with', 'at', 'by', 'from', 'as', 'are', 'was', 'were',
  // German
  'der', 'die', 'das', 'und', 'oder', 'für', 'ist', 'sind', 'war', 'waren', 'auf', 'mit', 'von', 'zu', 'bei',
]);

// Create admin client for background jobs - lazy initialization
let supabaseAdmin: ReturnType<typeof createClient> | null = null;

function getSupabaseAdmin(): any {
  if (!supabaseAdmin) {
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

    if (!supabaseUrl || !supabaseServiceKey) {
      throw new Error('Missing Supabase environment variables');
    }

    supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey);
  }
  return supabaseAdmin as any;
}

// Website type configuration
type WebsiteType = 'local_seo' | 'affiliate' | 'webshop' | 'blog' | 'general';

interface WebsiteTypeConfig {
  type: WebsiteType;
  typeName: string;
  modifiers: {
    nl: string[];
    en: string[];
    de: string[];
    fr: string[];
    es: string[];
  };
  contentTypes: string[];
  focusAreas: string[];
}

// Type-specific content strategies
const WEBSITE_TYPE_CONFIGS: Record<WebsiteType, WebsiteTypeConfig> = {
  local_seo: {
    type: 'local_seo',
    typeName: 'Lokale SEO Website',
    modifiers: {
      nl: [
        'in [stad]', 'bij mij in de buurt', 'beste in [regio]',
        'kosten', 'prijzen', 'tarief', 'offerte',
        'wanneer nodig', 'hoe vaak', 'waarom belangrijk',
        'wat doet een', 'wat is het verschil',
        'zelf doen of uitbesteden', 'checklist', 'tips',
        'specialist', 'ervaren', 'betrouwbaar',
      ],
      en: [
        'in [city]', 'near me', 'best in [region]',
        'cost', 'pricing', 'rates', 'quote',
        'when needed', 'how often', 'why important',
        'what does a', 'what is the difference',
        'diy or hire', 'checklist', 'tips',
        'specialist', 'experienced', 'reliable',
      ],
      de: [
        'in [stadt]', 'in meiner Nähe', 'beste in [region]',
        'kosten', 'preise', 'tarif', 'angebot',
        'wann nötig', 'wie oft', 'warum wichtig',
        'was macht ein', 'was ist der Unterschied',
        'selbst machen oder beauftragen', 'checkliste', 'tipps',
      ],
      fr: [
        'à [ville]', 'près de moi', 'meilleur à [région]',
        'coût', 'tarifs', 'prix', 'devis',
        'quand nécessaire', 'à quelle fréquence', 'pourquoi important',
      ],
      es: [
        'en [ciudad]', 'cerca de mí', 'mejor en [región]',
        'costo', 'precios', 'tarifas', 'presupuesto',
      ],
    },
    contentTypes: ['service-page', 'location-page', 'how-to', 'faq', 'guide', 'checklist'],
    focusAreas: ['diensten', 'locaties', 'werkgebied', 'kosten', 'proces', 'klantervaringen'],
  },
  affiliate: {
    type: 'affiliate',
    typeName: 'Affiliate Website',
    modifiers: {
      nl: [
        'review', 'ervaringen', 'test', 'vergelijking',
        'beste', 'top 10', 'top 5', 'alternatief voor',
        'vs', 'versus', 'of',
        'voordelen', 'nadelen', 'voor- en nadelen',
        'is het de moeite waard', 'moet je kopen',
        'kopen', 'waar te koop', 'kortingscode', 'aanbieding',
        'specificaties', 'kenmerken', 'eigenschappen',
      ],
      en: [
        'review', 'reviews', 'test', 'comparison',
        'best', 'top 10', 'top 5', 'alternative to',
        'vs', 'versus', 'or',
        'pros', 'cons', 'pros and cons',
        'is it worth it', 'should you buy',
        'buy', 'where to buy', 'discount code', 'deal',
        'specs', 'features', 'specifications',
      ],
      de: [
        'bewertung', 'test', 'vergleich', 'erfahrungen',
        'beste', 'top 10', 'alternative zu',
        'vs', 'versus',
        'vorteile', 'nachteile',
        'kaufen', 'wo kaufen', 'rabattcode',
      ],
      fr: [
        'avis', 'test', 'comparaison',
        'meilleur', 'top 10', 'alternative à',
        'avantages', 'inconvénients',
        'acheter', 'code promo',
      ],
      es: [
        'reseña', 'opiniones', 'comparación',
        'mejor', 'top 10', 'alternativa a',
        'comprar', 'código descuento',
      ],
    },
    contentTypes: ['review', 'comparison', 'roundup', 'buying-guide', 'vs-article'],
    focusAreas: ['productreviews', 'vergelijkingen', 'koopgidsen', 'alternatieven', 'deals'],
  },
  webshop: {
    type: 'webshop',
    typeName: 'Webshop/E-commerce',
    modifiers: {
      nl: [
        'kopen', 'bestellen', 'online kopen',
        'goedkoop', 'aanbieding', 'korting', 'sale',
        'beste', 'top merken', 'populair',
        'hoe te gebruiken', 'hoe werkt', 'handleiding',
        'voor beginners', 'voor professionals',
        'voordelen van', 'waarom kiezen voor',
        'wat is', 'soorten', 'types',
        'verschillen tussen', 'vergelijking',
      ],
      en: [
        'buy', 'shop', 'purchase online',
        'cheap', 'deal', 'discount', 'sale',
        'best', 'top brands', 'popular',
        'how to use', 'how does', 'guide',
        'for beginners', 'for professionals',
        'benefits of', 'why choose',
        'what is', 'types', 'kinds',
        'difference between', 'comparison',
      ],
      de: [
        'kaufen', 'bestellen', 'online kaufen',
        'günstig', 'angebot', 'rabatt', 'sale',
        'beste', 'top marken',
        'wie benutzen', 'anleitung',
      ],
      fr: [
        'acheter', 'commander',
        'pas cher', 'promo', 'soldes',
        'meilleur', 'guide',
      ],
      es: [
        'comprar', 'pedir',
        'barato', 'oferta', 'descuento',
        'mejor', 'guía',
      ],
    },
    contentTypes: ['product-guide', 'how-to', 'buying-guide', 'category-page', 'comparison'],
    focusAreas: ['producten', 'categorieën', 'gebruik', 'onderhoud', 'tips', 'trends'],
  },
  blog: {
    type: 'blog',
    typeName: 'Blog/Content Website',
    modifiers: {
      nl: [
        'hoe', 'wat is', 'waarom', 'wanneer', 'waar', 'wie',
        'uitleg', 'betekenis', 'definitie',
        'tips', 'trucs', 'advies',
        'handleiding', 'gids', 'stappenplan',
        'beginners', 'gevorderden', 'experts',
        'voordelen', 'nadelen', 'risico\'s',
        'voorbeelden', 'inspiratie', 'ideeën',
        'trends', 'ontwikkelingen', 'toekomst',
      ],
      en: [
        'how', 'what is', 'why', 'when', 'where', 'who',
        'explained', 'meaning', 'definition',
        'tips', 'tricks', 'advice',
        'guide', 'tutorial', 'step by step',
        'beginners', 'advanced', 'experts',
        'benefits', 'drawbacks', 'risks',
        'examples', 'inspiration', 'ideas',
        'trends', 'future',
      ],
      de: [
        'wie', 'was ist', 'warum', 'wann',
        'erklärung', 'bedeutung',
        'tipps', 'tricks', 'ratschläge',
        'anleitung', 'schritt für schritt',
      ],
      fr: [
        'comment', 'qu\'est-ce que', 'pourquoi', 'quand',
        'conseils', 'astuces',
        'guide', 'étape par étape',
      ],
      es: [
        'cómo', 'qué es', 'por qué', 'cuándo',
        'consejos', 'trucos',
        'guía', 'paso a paso',
      ],
    },
    contentTypes: ['how-to', 'guide', 'listicle', 'explainer', 'tutorial', 'opinion'],
    focusAreas: ['educatie', 'tips', 'handleidingen', 'achtergrond', 'trends', 'best practices'],
  },
  general: {
    type: 'general',
    typeName: 'Algemene Website',
    modifiers: {
      nl: [
        'hoe', 'wat is', 'waarom', 'wanneer', 'welke', 'hoeveel',
        'vs', 'versus', 'of', 'beste', 'top 10', 'top 5', 'vergelijking',
        'tips', 'handleiding', 'checklist', 'gids',
      ],
      en: [
        'how to', 'what is', 'why', 'when', 'which', 'how much',
        'vs', 'versus', 'or', 'best', 'top 10', 'top 5', 'comparison',
        'tips', 'guide', 'checklist',
      ],
      de: [
        'wie', 'was ist', 'warum', 'wann', 'welche',
        'tipps', 'anleitung', 'checkliste',
      ],
      fr: [
        'comment', 'qu\'est-ce que', 'pourquoi', 'quand',
        'conseils', 'guide',
      ],
      es: [
        'cómo', 'qué es', 'por qué', 'cuándo',
        'consejos', 'guía',
      ],
    },
    contentTypes: ['guide', 'how-to', 'list', 'comparison', 'faq'],
    focusAreas: ['algemeen', 'tips', 'handleidingen'],
  },
};

// Language configuration
const LANGUAGE_CONFIG: Record<string, {
  name: string;
  locationCode: number;
}> = {
  nl: {
    name: 'Nederlands',
    locationCode: 2528,
  },
  en: {
    name: 'English',
    locationCode: 2840,
  },
  de: {
    name: 'Deutsch',
    locationCode: 2276,
  },
  fr: {
    name: 'Français',
    locationCode: 2250,
  },
  es: {
    name: 'Español',
    locationCode: 2724,
  },
};

// Detect website language with improved timeout and error handling
async function detectWebsiteLanguage(websiteUrl: string): Promise<{ language: string; languageName: string }> {
  // Helper function to detect language from TLD
  const detectFromTLD = (url: URL): { language: string; languageName: string } | null => {
    const hostname = url.hostname.toLowerCase();
    const tld = hostname.split('.').pop()?.toLowerCase();

    // Strong TLD signals - these should be prioritized
    if (hostname.endsWith('.nl') || tld === 'nl') {
      return { language: 'nl', languageName: 'Nederlands' };
    }
    if (hostname.endsWith('.de') || tld === 'de' || tld === 'at' || hostname.endsWith('.at')) {
      return { language: 'de', languageName: 'Deutsch' };
    }
    if (hostname.endsWith('.fr') || tld === 'fr') {
      return { language: 'fr', languageName: 'Français' };
    }
    if (hostname.endsWith('.es') || tld === 'es') {
      return { language: 'es', languageName: 'Español' };
    }

    return null;
  };

  try {
    const url = new URL(websiteUrl);

    // First, check TLD (most reliable signal)
    const tldLanguage = detectFromTLD(url);
    if (tldLanguage) {
      console.log(`Language detected from TLD: ${tldLanguage.languageName} for ${websiteUrl}`);
    }

    // Try to fetch HTML for additional validation (with shorter 10s timeout)
    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 10000); // 10 second timeout

      const response = await fetch(websiteUrl, {
        headers: {
          'User-Agent': 'Mozilla/5.0 (compatible; WritGoBot/1.0)',
          'Accept': 'text/html',
        },
        signal: controller.signal,
        redirect: 'follow',
      });

      clearTimeout(timeoutId);

      if (response.ok) {
        const html = await response.text();
        const langMatch = html.match(/<html[^>]*lang=["']([a-z]{2})/i);

        if (langMatch) {
          const htmlLang = langMatch[1].toLowerCase();

          // If TLD indicates a specific language, prioritize that over HTML lang
          // (e.g., purepflege.de should be German even if HTML says lang="en")
          if (tldLanguage) {
            console.log(`TLD language (${tldLanguage.language}) takes priority over HTML lang (${htmlLang}) for ${websiteUrl}`);
            return tldLanguage;
          }

          // No strong TLD signal, use HTML lang attribute
          if (LANGUAGE_CONFIG[htmlLang]) {
            console.log(`Language detected from HTML: ${LANGUAGE_CONFIG[htmlLang].name} for ${websiteUrl}`);
            return { language: htmlLang, languageName: LANGUAGE_CONFIG[htmlLang].name };
          }
        }
      } else {
        console.warn(`HTTP ${response.status} when fetching ${websiteUrl}`);
      }
    } catch (fetchError: any) {
      const errorMsg = fetchError.name === 'AbortError'
        ? 'Request timed out after 10 seconds'
        : fetchError.message;
      console.warn(`HTML fetch failed for ${websiteUrl}:`, errorMsg);
    }

    // If we have TLD signal, use it as fallback
    if (tldLanguage) {
      console.log(`Using TLD language as fallback: ${tldLanguage.languageName}`);
      return tldLanguage;
    }
  } catch (e: any) {
    console.error('Language detection failed:', e.message);
  }

  // Default to English if no language detected
  console.log(`No language detected for ${websiteUrl}, using English as default`);
  return { language: 'en', languageName: 'English' };
}

// Detect website type based on content and structure
async function detectWebsiteType(
  websiteUrl: string,
  html: string,
  contentSignals: { products: string[]; categories: string[]; keywords: string[] }
): Promise<{ type: WebsiteType; typeName: string; confidence: number; reasoning: string }> {
  const url = new URL(websiteUrl);
  const scores = {
    local_seo: 0,
    affiliate: 0,
    webshop: 0,
    blog: 0,
    general: 0,
  };

  const reasoning: string[] = [];

  // URL pattern analysis
  const urlPath = url.pathname.toLowerCase();
  const hostname = url.hostname.toLowerCase();

  // Local SEO indicators
  const localPatterns = [
    /\/(contact|locaties|locations|standorten|vestigingen|werkgebied|service-area)/i,
    /\/(over-ons|about|uber-uns|notre-equipe)/i,
    /\/(diensten|services|leistungen)/i,
  ];
  if (localPatterns.some(p => p.test(urlPath) || p.test(html))) {
    scores.local_seo += 3;
    reasoning.push('Bevat lokale SEO pagina\'s (contact, locaties, diensten)');
  }

  // Look for local business schema
  if (html.includes('"@type":"LocalBusiness"') || html.includes('schema.org/LocalBusiness')) {
    scores.local_seo += 5;
    reasoning.push('LocalBusiness schema markup gevonden');
  }

  // Look for address/location info
  if (/(?:adres|address|standort|adresse):/i.test(html) ||
      /\d{4}\s*[A-Z]{2}\s+[A-Z]/i.test(html)) {
    scores.local_seo += 2;
    reasoning.push('Adres informatie gevonden');
  }

  // Webshop indicators
  const shopPatterns = [
    /\/(shop|winkel|store|produkte|productos)/i,
    /\/(cart|winkelmand|warenkorb|panier|carrito)/i,
    /\/(checkout|bestellen|kasse|commander)/i,
    /\/(product|artikel|item)/i,
  ];
  if (shopPatterns.some(p => p.test(urlPath) || p.test(html))) {
    scores.webshop += 3;
    reasoning.push('Webshop URL patronen gevonden');
  }

  // Look for e-commerce platforms
  const ecommercePlatforms = ['shopify', 'woocommerce', 'magento', 'prestashop', 'lightspeed'];
  if (ecommercePlatforms.some(platform => html.toLowerCase().includes(platform))) {
    scores.webshop += 4;
    reasoning.push('E-commerce platform gedetecteerd');
  }

  // Look for product schema
  if (html.includes('"@type":"Product"') || html.includes('schema.org/Product')) {
    scores.webshop += 3;
    reasoning.push('Product schema markup gevonden');
  }

  // Check for shopping cart or checkout buttons
  if (/add to cart|toevoegen aan winkelwagen|in den warenkorb|ajouter au panier/i.test(html)) {
    scores.webshop += 5;
    reasoning.push('Winkelwagen functionaliteit gevonden');
  }

  // Affiliate indicators
  const affiliatePatterns = [
    /amazon(-|\.)(com|nl|de|fr|co\.uk)/i,
    /bol\.com/i,
    /coolblue/i,
    /affiliate|partner|ref=/i,
    /awin|tradedoubler|daisycon/i,
  ];
  if (affiliatePatterns.some(p => p.test(html))) {
    scores.affiliate += 4;
    reasoning.push('Affiliate links gevonden');
  }

  // Look for review patterns (strong affiliate signal)
  const reviewCount = (html.match(/review|beoordeling|bewertung|test|ervaringen/gi) || []).length;
  if (reviewCount > 5) {
    scores.affiliate += Math.min(reviewCount / 3, 5);
    reasoning.push(`${reviewCount} review gerelateerde termen gevonden`);
  }

  // Look for comparison tables (affiliate signal)
  if (html.includes('<table') && /vergelijk|comparison|vergleich|vs|versus/i.test(html)) {
    scores.affiliate += 3;
    reasoning.push('Vergelijkingstabellen gevonden');
  }

  // Blog indicators
  const blogPatterns = [
    /\/(blog|artikel|article|beitrag|post)/i,
    /\/(category|categorie|kategorie)/i,
    /\/(author|auteur|autor)/i,
  ];
  if (blogPatterns.some(p => p.test(urlPath) || p.test(html))) {
    scores.blog += 3;
    reasoning.push('Blog structuur gevonden');
  }

  // Look for article/blog schema
  if (html.includes('"@type":"BlogPosting"') || html.includes('"@type":"Article"')) {
    scores.blog += 4;
    reasoning.push('Blog/Article schema markup gevonden');
  }

  // Content signals analysis
  if (contentSignals.products.length > 5) {
    scores.webshop += 3;
    scores.affiliate += 2;
    reasoning.push(`${contentSignals.products.length} producten gevonden`);
  }

  if (contentSignals.categories.length > 3) {
    scores.webshop += 2;
    scores.blog += 1;
  }

  // Keyword analysis for intent
  const commercialKeywords = contentSignals.keywords.filter(k =>
    /kopen|koop|buy|shop|bestellen|order|kaufen|acheter/i.test(k)
  ).length;
  if (commercialKeywords > 0) {
    scores.webshop += commercialKeywords;
    reasoning.push('Commerciële keywords gevonden');
  }

  const informationalKeywords = contentSignals.keywords.filter(k =>
    /hoe|how|wat|what|waarom|why|was|wie|who/i.test(k)
  ).length;
  if (informationalKeywords > 3) {
    scores.blog += 2;
    reasoning.push('Informatieve keywords gevonden');
  }

  // Determine website type based on scores
  const sortedTypes = Object.entries(scores)
    .sort(([, a], [, b]) => b - a) as [WebsiteType, number][];

  const topType = sortedTypes[0][0];
  const topScore = sortedTypes[0][1];
  const secondScore = sortedTypes[1][1];

  // If top score is too low or difference is too small, mark as general
  if (topScore < 3 || (topScore - secondScore) < 2) {
    return {
      type: 'general',
      typeName: WEBSITE_TYPE_CONFIGS.general.typeName,
      confidence: 0.5,
      reasoning: 'Geen duidelijke website type signalen. ' + reasoning.join('; '),
    };
  }

  const confidence = Math.min(topScore / 15, 1);

  return {
    type: topType,
    typeName: WEBSITE_TYPE_CONFIGS[topType].typeName,
    confidence,
    reasoning: reasoning.join('; '),
  };
}

// Start background job
export async function POST(request: Request) {
  try {
    const { website_url, project_id, user_id } = await request.json();

    if (!website_url) {
      return NextResponse.json({ error: 'Website URL is required' }, { status: 400 });
    }

    // Get user from session if not provided
    let userId = user_id;
    if (!userId) {
      const supabase = createServerClient();
      const { data: { user } } = await supabase.auth.getUser();
      userId = user?.id;
    }

    // Create job in database
    const { data: job, error: insertError } = await getSupabaseAdmin()
      .from('content_plan_jobs')
      .insert({
        user_id: userId,
        project_id,
        website_url,
        status: 'processing',
        progress: 0,
        current_step: 'Initialiseren...',
      })
      .select()
      .single();

    if (insertError) {
      console.error('Failed to create job:', insertError);
      return NextResponse.json({ error: 'Failed to create job' }, { status: 500 });
    }

    // Start background processing (don't await - fire and forget)
    processContentPlan(job.id, website_url).catch(err => {
      console.error('Background job error:', err);
      getSupabaseAdmin()
        .from('content_plan_jobs')
        .update({ 
          status: 'failed', 
          error: err.message,
          updated_at: new Date().toISOString()
        })
        .eq('id', job.id)
        .then(() => {});
    });

    return NextResponse.json({ jobId: job.id, status: 'processing' });
  } catch (error: any) {
    console.error('POST error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

// Get job status
export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const jobId = searchParams.get('jobId');
    const userId = searchParams.get('userId');
    const projectId = searchParams.get('projectId');
    const status = searchParams.get('status');

    if (jobId) {
      // Get specific job
      const { data: job, error } = await getSupabaseAdmin()
        .from('content_plan_jobs')
        .select('*')
        .eq('id', jobId)
        .single();

      if (error || !job) {
        return NextResponse.json({ error: 'Job not found' }, { status: 404 });
      }

      return NextResponse.json(job);
    } else if (projectId) {
      // Get active/processing job for project (exclude cancelled jobs)
      let query = getSupabaseAdmin()
        .from('content_plan_jobs')
        .select('*')
        .eq('project_id', projectId)
        .neq('status', 'cancelled') // FIX: use .neq() instead of .not()
        .neq('status', 'failed')
        .order('created_at', { ascending: false })
        .limit(1);
      
      // Filter by status if provided (e.g., 'processing')
      if (status === 'processing') {
        query = query.in('status', ['processing', 'pending']);
      }

      const { data: jobs, error } = await query;

      if (error) {
        console.error('Query error:', error);
        return NextResponse.json({ error: 'Database error', details: error.message }, { status: 500 });
      }

      if (!jobs || jobs.length === 0) {
        return NextResponse.json({ error: 'No jobs found' }, { status: 404 });
      }

      return NextResponse.json(jobs[0]);
    } else if (userId) {
      // Get latest job for user
      const { data: jobs, error } = await getSupabaseAdmin()
        .from('content_plan_jobs')
        .select('*')
        .eq('user_id', userId)
        .order('created_at', { ascending: false })
        .limit(1);

      if (error || !jobs || jobs.length === 0) {
        return NextResponse.json({ error: 'No jobs found' }, { status: 404 });
      }

      return NextResponse.json(jobs[0]);
    }

    return NextResponse.json({ error: 'Job ID, Project ID, or User ID is required' }, { status: 400 });
  } catch (error: any) {
    console.error('GET error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

// DELETE - Cancel a job
export async function DELETE(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const jobId = searchParams.get('jobId');

    if (!jobId) {
      return NextResponse.json({ error: 'Job ID is required' }, { status: 400 });
    }

    // FIXED: Better error handling
    const { data, error } = await getSupabaseAdmin()
      .from('content_plan_jobs')
      .update({ 
        status: 'cancelled',
        current_step: 'Geannuleerd door gebruiker',
        updated_at: new Date().toISOString()
      })
      .eq('id', jobId)
      .in('status', ['pending', 'processing'])
      .select(); // FIX: Add .select() to get updated data

    if (error) {
      console.error('Failed to cancel job:', error);
      return NextResponse.json({ 
        error: 'Failed to cancel job', 
        details: error.message 
      }, { status: 500 });
    }

    if (!data || data.length === 0) {
      return NextResponse.json({ 
        error: 'Job not found or already completed' 
      }, { status: 404 });
    }

    return NextResponse.json({ success: true, message: 'Job cancelled', job: data[0] });
  } catch (error: any) {
    console.error('DELETE error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

// Update job in database
async function updateJob(jobId: string, updates: any) {
  // Check first if job is cancelled - if so, don't update
  // This prevents unnecessary database writes and log spam
  // Note: Adds one SELECT per update (N+1 pattern), but necessary for correctness
  // in concurrent environment. Trade-off: ~1-2 seconds total overhead over 5-minute
  // generation vs preventing race conditions and status overwrites.
  const { data: currentJob } = await getSupabaseAdmin()
    .from('content_plan_jobs')
    .select('status')
    .eq('id', jobId)
    .single();
  
  if (currentJob?.status === 'cancelled') {
    console.log(`Job ${jobId} is cancelled, skipping update`);
    return;
  }
  
  const { error } = await getSupabaseAdmin()
    .from('content_plan_jobs')
    .update({ ...updates, updated_at: new Date().toISOString() })
    .eq('id', jobId)
    .not('status', 'eq', 'cancelled'); // Extra safeguard against race conditions
  
  if (error) {
    console.error('Failed to update job:', error);
  }
}

// Check if job is cancelled
async function isJobCancelled(jobId: string): Promise<boolean> {
  const { data: job } = await getSupabaseAdmin()
    .from('content_plan_jobs')
    .select('status')
    .eq('id', jobId)
    .single();
  
  return job?.status === 'cancelled';
}

// Background processing function
async function processContentPlan(jobId: string, websiteUrl: string) {
  try {
    const now = new Date();
    const currentYear = now.getFullYear();

    // Check if already cancelled before starting
    if (await isJobCancelled(jobId)) {
      console.log(`Job ${jobId} was cancelled before processing`);
      return;
    }

    // Step 1: Detect language with timeout protection
    await updateJob(jobId, { progress: 5, current_step: '🌍 Taal detecteren...' });

    let language = 'en';
    let languageName = 'English';

    try {
      // Wrap language detection with additional timeout safety
      const detectPromise = detectWebsiteLanguage(websiteUrl);
      const timeoutPromise = new Promise<never>((_, reject) => {
        setTimeout(() => reject(new Error('Language detection timed out after 20 seconds')), 20000);
      });

      const result = await Promise.race([detectPromise, timeoutPromise]);
      language = result.language;
      languageName = result.languageName;

      console.log(`✓ Language detected for ${websiteUrl}: ${languageName} (${language})`);
    } catch (error: any) {
      console.error(`⚠ Language detection failed for ${websiteUrl}:`, error.message);
      console.log('Using fallback: English');
      // Fallback to English already set above
    }

    const langConfig = LANGUAGE_CONFIG[language] || LANGUAGE_CONFIG['en'];

    await updateJob(jobId, {
      progress: 10,
      current_step: `🌍 Taal gedetecteerd: ${languageName}`,
      language,
    });

    const languageInstructions: Record<string, string> = {
      nl: 'Schrijf ALLES in het Nederlands. Gebruik "je" en "jij" (informeel).',
      en: 'Write EVERYTHING in English.',
      de: 'Schreibe ALLES auf Deutsch. Verwende "du" (informell).',
      fr: 'Écrivez TOUT en français. Utilisez "tu" (informel).',
      es: 'Escribe TODO en español. Usa "tú" (informal).',
    };

    // Step 2: Scrape website content for better niche detection with timeout protection
    await updateJob(jobId, { progress: 15, current_step: '🔍 Website content analyseren...' });

    let websiteContent = '';
    let htmlContent = ''; // Store HTML for type detection
    let contentSignals = {
      products: [] as string[],
      categories: [] as string[],
      keywords: [] as string[],
    };

    try {
      // Wrap fetch with timeout protection
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 12000); // 12 second timeout

      const response = await fetch(websiteUrl, {
        headers: {
          'User-Agent': 'Mozilla/5.0 (compatible; WritGoBot/1.0)',
          'Accept': 'text/html',
        },
        signal: controller.signal,
        redirect: 'follow',
      });

      clearTimeout(timeoutId);

      if (response.ok) {
        const html = await response.text();
        htmlContent = html; // Save for type detection
        
        // Extract title
        const titleMatch = html.match(/<title[^>]*>([^<]+)<\/title>/i);
        const title = titleMatch ? titleMatch[1].trim() : '';
        
        // Extract meta description
        const metaDescMatch = html.match(/<meta[^>]*name=["']description["'][^>]*content=["']([^"']+)["']/i);
        const metaDesc = metaDescMatch ? metaDescMatch[1].trim() : '';
        
        // Extract meta keywords if available
        const metaKeywordsMatch = html.match(/<meta[^>]*name=["']keywords["'][^>]*content=["']([^"']+)["']/i);
        const metaKeywords = metaKeywordsMatch ? metaKeywordsMatch[1].trim() : '';
        
        // Extract Open Graph metadata
        const ogTitleMatch = html.match(/<meta[^>]*property=["']og:title["'][^>]*content=["']([^"']+)["']/i);
        const ogTitle = ogTitleMatch ? ogTitleMatch[1].trim() : '';
        const ogDescMatch = html.match(/<meta[^>]*property=["']og:description["'][^>]*content=["']([^"']+)["']/i);
        const ogDesc = ogDescMatch ? ogDescMatch[1].trim() : '';
        
        // Extract headings (prioritize article/post titles for better niche detection)
        const h1Matches = html.match(/<h1[^>]*>([^<]+)<\/h1>/gi) || [];
        const h2Matches = html.match(/<h2[^>]*>([^<]+)<\/h2>/gi) || [];
        const h3Matches = html.match(/<h3[^>]*>([^<]+)<\/h3>/gi) || [];

        // Extract more article titles (common blog patterns)
        const articleTitlePatterns = [
          /<h2[^>]*class=["'][^"']*entry-title[^"']*["'][^>]*>.*?<a[^>]*>([^<]+)<\/a>.*?<\/h2>/gi,
          /<h2[^>]*class=["'][^"']*post-title[^"']*["'][^>]*>.*?<a[^>]*>([^<]+)<\/a>.*?<\/h2>/gi,
          /<h3[^>]*class=["'][^"']*entry-title[^"']*["'][^>]*>.*?<a[^>]*>([^<]+)<\/a>.*?<\/h3>/gi,
        ];

        const articleTitles: string[] = [];
        articleTitlePatterns.forEach(pattern => {
          const matches = Array.from(html.matchAll(pattern));
          for (const match of matches) {
            if (match[1] && match[1].trim().length > 5) {
              articleTitles.push(match[1].trim());
            }
          }
        });

        const headings = [...h1Matches, ...h2Matches, ...h3Matches]
          .map(h => h.replace(/<[^>]+>/g, '').trim())
          .filter(h => h.length > 3)
          .slice(0, 40); // Increased from 30 to 40 for better context
        
        // Extract product titles (common e-commerce patterns)
        const productTitlePatterns = [
          /<h2[^>]*class=["'][^"']*product[^"']*["'][^>]*>([^<]+)<\/h2>/gi,
          /<h3[^>]*class=["'][^"']*product[^"']*["'][^>]*>([^<]+)<\/h3>/gi,
          /<div[^>]*class=["'][^"']*product[^"']*title[^"']*["'][^>]*>([^<]+)<\/div>/gi,
          /<a[^>]*class=["'][^"']*product[^"']*["'][^>]*>([^<]+)<\/a>/gi,
          /<span[^>]*class=["'][^"']*product[^"']*name[^"']*["'][^>]*>([^<]+)<\/span>/gi,
        ];
        
        productTitlePatterns.forEach(pattern => {
          const matches = Array.from(html.matchAll(pattern));
          for (const match of matches) {
            if (match[1] && match[1].trim().length > CONTENT_EXTRACTION_CONFIG.MIN_PRODUCT_NAME_LENGTH) {
              contentSignals.products.push(match[1].trim());
            }
          }
        });
        
        // Extract category information
        const categoryPatterns = [
          /<nav[^>]*class=["'][^"']*categor[^"']*["'][^>]*>([\s\S]*?)<\/nav>/gi,
          /<ul[^>]*class=["'][^"']*categor[^"']*["'][^>]*>([\s\S]*?)<\/ul>/gi,
          /<div[^>]*class=["'][^"']*categor[^"']*["'][^>]*>([\s\S]*?)<\/div>/gi,
        ];
        
        categoryPatterns.forEach(pattern => {
          const matches = Array.from(html.matchAll(pattern));
          for (const match of matches) {
            const categoryHtml = match[1];
            const links = categoryHtml.match(/<a[^>]*>([^<]+)<\/a>/gi) || [];
            links.forEach(link => {
              const text = link.replace(/<[^>]+>/g, '').trim();
              if (text.length > CONTENT_EXTRACTION_CONFIG.MIN_CATEGORY_NAME_LENGTH && 
                  text.length < CONTENT_EXTRACTION_CONFIG.MAX_CATEGORY_NAME_LENGTH) {
                contentSignals.categories.push(text);
              }
            });
          }
        });
        
        // Extract main text content (remove scripts, styles, etc.)
        // SECURITY NOTE: This HTML is scraped from external websites for ANALYSIS ONLY.
        // The extracted text is never rendered as HTML or inserted into the DOM.
        // It is only used for:
        // 1. Word frequency analysis to identify main topics
        // 2. Passing context to AI models for niche detection
        // The simple regex-based cleaning is sufficient for this use case.
        let textContent = html
          .replace(/<script[^>]*>[\s\S]*?<\/script>/gi, '')
          .replace(/<style[^>]*>[\s\S]*?<\/style>/gi, '')
          .replace(/<nav[^>]*>[\s\S]*?<\/nav>/gi, '')
          .replace(/<footer[^>]*>[\s\S]*?<\/footer>/gi, '')
          .replace(/<header[^>]*>[\s\S]*?<\/header>/gi, '')
          .replace(/<[^>]+>/g, ' ')
          .replace(/\s+/g, ' ')
          .trim()
          .slice(0, CONTENT_EXTRACTION_CONFIG.MAX_TEXT_CONTENT_LENGTH);
        
        // Extract frequently appearing keywords from text (simple word frequency analysis)
        const words = textContent.toLowerCase().split(/\s+/);
        const wordFreq = new Map<string, number>();
        
        words.forEach(word => {
          if (word.length > CONTENT_EXTRACTION_CONFIG.MIN_KEYWORD_LENGTH && 
              !STOP_WORDS.has(word) && 
              /^[a-zäöüß]+$/i.test(word)) {
            wordFreq.set(word, (wordFreq.get(word) || 0) + 1);
          }
        });
        
        // Get top keywords
        const topWords = Array.from(wordFreq.entries())
          .sort((a, b) => b[1] - a[1])
          .slice(0, CONTENT_EXTRACTION_CONFIG.MAX_KEYWORDS)
          .map(([word]) => word);
        
        contentSignals.keywords = topWords;
        
        // Deduplicate products and categories
        contentSignals.products = [...new Set(contentSignals.products)].slice(0, CONTENT_EXTRACTION_CONFIG.MAX_PRODUCTS);
        contentSignals.categories = [...new Set(contentSignals.categories)].slice(0, CONTENT_EXTRACTION_CONFIG.MAX_CATEGORIES);
        
        websiteContent = `
Titel: ${title}
Meta beschrijving: ${metaDesc}
${metaKeywords ? `Meta keywords: ${metaKeywords}` : ''}
${ogTitle ? `OG titel: ${ogTitle}` : ''}
${ogDesc ? `OG beschrijving: ${ogDesc}` : ''}
${articleTitles.length > 0 ? `\nARTIKEL TITELS (belangrijkste content op de site):\n${articleTitles.slice(0, 15).join('\n- ')}` : ''}
Koppen: ${headings.slice(0, 20).join(', ')}
${contentSignals.products.length > 0 ? `\nProducten: ${contentSignals.products.join(', ')}` : ''}
${contentSignals.categories.length > 0 ? `\nCategorieën: ${contentSignals.categories.join(', ')}` : ''}
${contentSignals.keywords.length > 0 ? `\nVeelvoorkomende woorden: ${contentSignals.keywords.join(', ')}` : ''}
Content preview: ${textContent.slice(0, 2000)}
`.trim();
      }
      await updateJob(jobId, { progress: 18, current_step: '🔍 Website content verzameld' });
      console.log(`✓ Successfully scraped content from ${websiteUrl}`);
    } catch (e: any) {
      const errorMsg = e.name === 'AbortError'
        ? 'Request timed out after 12 seconds'
        : e.message;
      console.warn(`⚠ Website scraping failed for ${websiteUrl}:`, errorMsg);
      console.log('Continuing with AI-only niche detection (no website content)');
      await updateJob(jobId, { progress: 18, current_step: '🔍 Website analyse (fallback)' });
    }

    // Step 2b: Detect website type based on scraped content
    await updateJob(jobId, { progress: 19, current_step: '🏷️ Website type detecteren...' });

    let websiteType: WebsiteType = 'general';
    let websiteTypeName = 'Algemene Website';
    let websiteTypeConfidence = 0.5;
    let websiteTypeReasoning = 'Standaard';

    try {
      // Only detect type if we have HTML content
      if (htmlContent && htmlContent.length > 100) {
        const typeDetection = await detectWebsiteType(websiteUrl, htmlContent, contentSignals);

        websiteType = typeDetection.type;
        websiteTypeName = typeDetection.typeName;
        websiteTypeConfidence = typeDetection.confidence;
        websiteTypeReasoning = typeDetection.reasoning;

        console.log(`✓ Website type detected: ${websiteTypeName} (confidence: ${Math.round(websiteTypeConfidence * 100)}%)`);
        console.log(`  Reasoning: ${websiteTypeReasoning}`);
      }
    } catch (typeError: any) {
      console.warn('⚠ Website type detection failed:', typeError.message);
      console.log('Using fallback: general website type');
    }

    await updateJob(jobId, {
      progress: 20,
      current_step: `✅ Type: ${websiteTypeName}`,
      website_type: websiteType,
      website_type_confidence: websiteTypeConfidence,
      website_type_reasoning: websiteTypeReasoning,
    });

    await updateJob(jobId, { progress: 22, current_step: '🎯 Niche detecteren met AI...' });

    const currentMonth = now.toLocaleString(language === 'nl' ? 'nl-NL' : 'en-US', { month: 'long' });

    // Use Perplexity Sonar Pro for accurate niche detection with real-time web access
    const websiteTypeConfig = WEBSITE_TYPE_CONFIGS[websiteType];

    const nichePrompt = `Analyseer de website ${websiteUrl} en bepaal de EXACTE niche op basis van de producten, diensten en content.

Bezoek de website LIVE en analyseer de daadwerkelijke content, producten en diensten die worden aangeboden.

GEDETECTEERD WEBSITE TYPE: ${websiteTypeName}
${websiteTypeReasoning ? `Reden: ${websiteTypeReasoning}` : ''}

Dit betekent dat de content strategie moet focussen op: ${websiteTypeConfig.focusAreas.join(', ')}

${websiteContent ? `\nHier is extra context die ik heb verzameld van de website:\n${websiteContent}\n` : ''}

${languageInstructions[language]}

KRITIEKE INSTRUCTIES VOOR ${websiteTypeName.toUpperCase()}:
- Kijk naar ALLE artikel titels en de VOLLEDIGE RANGE van onderwerpen op de website
- Bepaal de OVERKOEPELENDE niche op basis van ALLE content, niet alleen het eerste artikel
- Focus op WAT de website verkoopt of over schrijft (producten, diensten, hoofdonderwerpen)
- Als de website MEERDERE gerelateerde onderwerpen behandelt, kies de BREDE niche
- NOOIT een enkel subtopic kiezen als niche (bijv. "Virusscanner" terwijl site over alle computer onderwerpen gaat)
- NOOIT generieke termen zoals "Content Marketing", "E-commerce" of "Online Shop" gebruiken
- Bepaal de niche op basis van de PRODUCTEN/DIENSTEN/CONTENT, niet op basis van de technologie of het platform

VOORBEELDEN van GOEDE niche analyse:
- Als site artikelen heeft over: RAM, SSD, virusscanners, wachtwoordmanagers, PC bouwen → niche is "Computer Tutorials" of "Computer Hardware & Software", NIET "Virusscanner"
- Als site artikelen heeft over: yoga poses, meditatie, mindfulness, yoga kleding → niche is "Yoga & Welzijn", NIET alleen "Yoga Poses"
- Als site shampoos, conditioners, haarmaskers verkoopt → niche is "Haarverzorging", NIET alleen "Shampoo"
- Als site recepten deelt voor: vlees, vis, vegetarisch, desserts → niche is "Koken & Recepten", NIET alleen "Vleesgerechten"

VOORBEELDEN van SLECHTE niches (NOOIT gebruiken):
- "Virusscanner" (als site over algemene computer onderwerpen gaat)
- "E-commerce" (te generiek)
- "Online Shop" (te generiek)
- "Content Marketing" (tenzij de site SPECIFIEK over marketing gaat)
- "Digital Products" (te generiek)

Output als JSON (ALLEEN JSON, geen markdown):
{
  "niche": "Specifieke, concrete niche gebaseerd op producten/diensten (bijv. Natuurlijke Haarverzorging, Biologische Cosmetica, Yoga, Software)",
  "competitionLevel": "low|medium|high|very_high",
  "pillarTopics": [
    {
      "topic": "Pillar topic naam die relevant is voor de PRODUCTEN/DIENSTEN",
      "estimatedArticles": 30,
      "subtopics": ["subtopic1", "subtopic2", "subtopic3"]
    }
  ],
  "totalArticlesNeeded": 500,
  "reasoning": "Uitleg waarom deze specifieke niche is gekozen op basis van de producten/diensten/content"
}`;

    let nicheData: any = {
      niche: 'Algemeen',
      competitionLevel: 'medium',
      pillarTopics: [],
      totalArticlesNeeded: 500,
      reasoning: 'Default'
    };

    try {
      // Use Perplexity Sonar Pro for real-time website analysis (with 60s timeout)
      console.log('Analyzing website with Perplexity:', websiteUrl);
      nicheData = await analyzeWithPerplexityJSON<any>(nichePrompt, 60000); // 60s timeout
      console.log('Perplexity niche result:', nicheData.niche);
    } catch (e: any) {
      console.warn('Perplexity niche detection failed, using Claude fallback:', e.message);

      // Fallback to Claude if Perplexity fails/times out - with same improved instructions
      try {
        const fallbackPrompt = `Analyseer deze website en bepaal de EXACTE niche op basis van producten, diensten en content:

Website URL: ${websiteUrl}
${websiteContent ? `\n--- WEBSITE CONTENT (producten, categorieën, keywords, artikel titels) ---\n${websiteContent}\n--- EINDE CONTENT ---\n` : ''}

${languageInstructions[language]}

KRITIEKE INSTRUCTIES:
- Kijk naar ALLE artikel titels en de VOLLEDIGE RANGE van onderwerpen
- Bepaal de OVERKOEPELENDE niche op basis van ALLE content, niet alleen het eerste artikel
- Focus op WAT de website verkoopt of over schrijft (producten, diensten, hoofdonderwerpen)
- Als de website MEERDERE gerelateerde onderwerpen behandelt, kies de BREDE niche
- NOOIT een enkel subtopic kiezen als niche
- NOOIT generieke termen zoals "E-commerce", "Online Shop" of "Content Marketing"
- Gebruik de artikel titels, productnamen, categorieën en veelvoorkomende woorden als bewijs

VOORBEELDEN van GOEDE niche analyse:
- Als je artikelen ziet over: RAM, SSD, virusscanners, wachtwoordmanagers, PC bouwen → niche is "Computer Tutorials" of "Computer Hardware & Software", NIET "Virusscanner"
- Als je artikelen ziet over: yoga poses, meditatie, mindfulness → niche is "Yoga & Welzijn", NIET alleen "Yoga Poses"
- Als je shampoos, conditioners, haarmaskers ziet → niche is "Haarverzorging", NIET alleen "Shampoo"

Output als JSON (ALLEEN JSON, geen tekst ervoor of erna):
{
  "niche": "Specifieke niche gebaseerd op producten/diensten",
  "competitionLevel": "medium",
  "pillarTopics": [],
  "totalArticlesNeeded": 500,
  "reasoning": "Uitleg op basis van producten/content die je ziet"
}`;

        const nicheResponse = await generateAICompletion({
          task: 'content',
          systemPrompt: `Je bent een SEO expert die websites analyseert op basis van hun PRODUCTEN en DIENSTEN. Je kijkt naar ALLE content op een website om de OVERKOEPELENDE niche te bepalen, niet alleen het eerste artikel. ${languageInstructions[language]} Output ALLEEN valide JSON.`,
          userPrompt: fallbackPrompt,
          maxTokens: 2000,
          temperature: 0.3,
          timeout: 45000, // 45s timeout for fallback
        });

        const jsonMatch = nicheResponse.match(/\{[\s\S]*\}/);
        if (jsonMatch) {
          nicheData = { ...nicheData, ...JSON.parse(jsonMatch[0]) };
          console.log('Fallback niche result:', nicheData.niche);
        }
      } catch (fallbackError) {
        console.warn('Fallback niche detection also failed:', fallbackError);
      }
    }

    const targetCount = Math.min(Math.max(nicheData.totalArticlesNeeded || 500, 100), 2000);

    await updateJob(jobId, {
      progress: 25,
      current_step: `✅ Niche: ${nicheData.niche}`,
      niche: nicheData.niche,
      target_count: targetCount,
      competition_level: nicheData.competitionLevel,
      reasoning: nicheData.reasoning,
    });

    // Step 3: Competitor Analysis
    await updateJob(jobId, { progress: 27, current_step: '🔍 Top concurrenten analyseren...' });

    let competitorInsights = {
      competitors: [] as Array<{name: string; url: string; strengths: string[]}>,
      contentGaps: [] as string[],
      opportunities: [] as string[],
      topTopics: [] as string[],
    };

    try {
      const competitorPrompt = `Analyseer de top 5 concurrenten van ${websiteUrl} in de niche "${nicheData.niche}".

WEBSITE TYPE: ${websiteTypeName}
${websiteContent ? `\nContext van de website:\n${websiteContent.substring(0, 1000)}...\n` : ''}

Zoek naar de grootste concurrenten door:
1. Te zoeken naar top rankende websites voor belangrijke keywords in deze niche
2. Websites te vinden die vergelijkbare ${websiteType === 'local_seo' ? 'diensten' : websiteType === 'affiliate' ? 'productreviews' : websiteType === 'webshop' ? 'producten' : 'content'} aanbieden
3. Hun content strategie te analyseren

Voor elke concurrent:
- Identificeer hun sterkste content onderwerpen
- Wat voor type content maken zij veel (reviews, gidsen, tutorials, etc.)
- Welke keywords/topics domineren zij

Identificeer ook:
- Content gaps: Onderwerpen die concurrenten NIET goed behandelen
- Opportunities: Waar kan ${websiteUrl} beter/anders presteren
- Top topics: Welke hoofdonderwerpen zijn essentieel in deze niche

${languageInstructions[language]}

Output als JSON:
{
  "competitors": [
    {"name": "Concurrent naam", "url": "https://...", "strengths": ["sterke punt 1", "sterke punt 2"]}
  ],
  "contentGaps": ["gap 1", "gap 2"],
  "opportunities": ["opportunity 1", "opportunity 2"],
  "topTopics": ["essentieel topic 1", "essentieel topic 2"]
}`;

      console.log('Analyzing top competitors with Perplexity...');
      const competitorData = await analyzeWithPerplexityJSON<typeof competitorInsights>(
        competitorPrompt,
        45000 // 45s timeout
      );

      if (competitorData) {
        competitorInsights = {
          competitors: competitorData.competitors || [],
          contentGaps: competitorData.contentGaps || [],
          opportunities: competitorData.opportunities || [],
          topTopics: competitorData.topTopics || [],
        };

        console.log(`✓ Found ${competitorInsights.competitors.length} competitors`);
        console.log(`✓ Identified ${competitorInsights.contentGaps.length} content gaps`);
        console.log(`✓ Found ${competitorInsights.opportunities.length} opportunities`);
      }
    } catch (e: any) {
      console.warn('Competitor analysis failed:', e.message);
      console.log('Continuing without competitor insights');
    }

    await updateJob(jobId, {
      progress: 29,
      current_step: `✅ ${competitorInsights.competitors.length} concurrenten geanalyseerd`,
      competitors: competitorInsights.competitors,
      content_gaps: competitorInsights.contentGaps,
      opportunities: competitorInsights.opportunities,
    });

    // Step 4: Generate pillar topics if needed
    if (!nicheData.pillarTopics || nicheData.pillarTopics.length < 5) {
      await updateJob(jobId, { progress: 30, current_step: '📊 Pillar topics genereren...' });

      try {
        // Type-specific pillar topic examples and instructions
        const typeSpecificInstructions: Record<WebsiteType, string> = {
          local_seo: `
VOOR LOKALE SEO SITES - Focus op DIENSTEN en LOCATIES:

✓ GOED - Dienst-gebaseerde topics:
- "Dakdekker Diensten" (met subtopics: dakisolatie, dakreparatie, nieuw dak)
- "Loodgieter Werkzaamheden" (met subtopics: lekkage, cv-ketel, riool)
- "Tuinonderhoud Prijzen" (met subtopics: kosten, offertes, tarieven)
- "Schilderwerk Binnen" (met subtopics: muren, plafonds, houtwerk)

✗ FOUT - Generieke informatieve topics:
- "Wat is een dakdekker" (te algemeen)
- "Waarom tuinonderhoud" (niet dienst-gericht)
- "Hoe werkt schilderen" (niet relevant voor dienstverlener)

MAAK TOPICS OVER:
- Specifieke diensten die je aanbiedt
- Werkgebieden en locaties
- Kosten en tarieven
- Wanneer klanten je nodig hebben
- Problemen die je oplost`,

          affiliate: `
VOOR AFFILIATE SITES - Focus op PRODUCT REVIEWS en VERGELIJKINGEN:

✓ GOED - Product categorie topics:
- "Beste Noise Cancelling Koptelefoons" (met subtopics: Sony WH-1000XM5, Bose QC45, AirPods Max)
- "Gaming Laptop Reviews" (met subtopics: budget, mid-range, high-end)
- "Smartwatch Vergelijkingen" (met subtopics: Apple Watch vs Galaxy Watch, features, prijzen)
- "Draadloze Oordopjes Test" (met subtopics: geluidskwaliteit, batterij, comfort)

✗ FOUT - Algemene info topics:
- "Wat zijn koptelefoons" (geen review/vergelijking)
- "Hoe werkt een smartwatch" (te basic)
- "Geschiedenis van gaming" (niet product-gericht)

MAAK TOPICS OVER:
- Specifieke productcategorieën
- Product vergelijkingen (A vs B)
- Beste [product] voor [doelgroep]
- Review roundups (Top 10, Beste van 2025)
- Koopgidsen en alternatieven`,

          webshop: `
VOOR WEBSHOPS - Focus op PRODUCT CATEGORIEËN en GEBRUIK:

✓ GOED - Product en gebruik topics:
- "Hardloopschoenen Gids" (met subtopics: voor beginners, trail running, marathon)
- "Yogamat Kiezen" (met subtopics: materialen, dikte, grip)
- "Supplementen voor Spieropbouw" (met subtopics: proteïne, creatine, BCAA)
- "Sportkleding Onderhoud" (met subtopics: wassen, drogen, opbergen)

✗ FOUT - Te algemeen of niet product-gericht:
- "Wat is hardlopen" (te basic)
- "Waarom sporten" (niet product-gericht)
- "Geschiedenis van yoga" (niet relevant)

MAAK TOPICS OVER:
- Productcategorieën die je verkoopt
- Hoe producten te gebruiken
- Voor wie welk product
- Onderhoud en verzorging
- Trends en nieuwe producten`,

          blog: `
VOOR BLOGS - Focus op EDUCATIEVE en INFORMATIEVE CONTENT:

✓ GOED - Brede educatieve topics:
- "SEO voor Beginners" (met subtopics: keywords, on-page, backlinks)
- "Content Marketing Strategie" (met subtopics: planning, creatie, distributie)
- "WordPress Tutorials" (met subtopics: installatie, themes, plugins)
- "Social Media Tips" (met subtopics: Instagram, LinkedIn, strategie)

✗ FOUT - Te specifiek of product-gericht:
- "SEMrush vs Ahrefs" (meer affiliate-achtig)
- "Beste SEO tools kopen" (te commercieel)

MAAK TOPICS OVER:
- Brede thema's in je niche
- How-to handleidingen
- Tips en best practices
- Trends en ontwikkelingen
- Achtergrond en uitleg`,

          general: `
MAAK BREDE TOPICS die relevant zijn voor de niche.
Mix van informatief, praktisch en vergelijkend.`
        };

        const competitorContext = competitorInsights.competitors.length > 0 ? `

📊 CONCURRENT ANALYSE (${competitorInsights.competitors.length} concurrenten):

Top concurrenten:
${competitorInsights.competitors.slice(0, 5).map(c => `- ${c.name}: ${c.strengths.join(', ')}`).join('\n')}

${competitorInsights.topTopics.length > 0 ? `
✅ ESSENTIËLE TOPICS (gebaseerd op concurrenten):
${competitorInsights.topTopics.map(t => `- ${t}`).join('\n')}

BELANGRIJKE INSTRUCTIE: Zorg dat deze essentiële topics ALLEMAAL in je pillar topics lijst komen!
` : ''}

${competitorInsights.contentGaps.length > 0 ? `
🎯 CONTENT GAPS (kansen om te scoren):
${competitorInsights.contentGaps.map(g => `- ${g}`).join('\n')}

BELANGRIJKE INSTRUCTIE: Maak pillar topics voor deze gaps - dit zijn gebieden waar concurrenten ZWAK zijn!
` : ''}

${competitorInsights.opportunities.length > 0 ? `
💡 OPPORTUNITIES:
${competitorInsights.opportunities.map(o => `- ${o}`).join('\n')}
` : ''}

STRATEGIE:
1. Dek EERST alle essentiële topics af die concurrenten ook behandelen (table stakes)
2. Focus dan op content gaps waar concurrenten zwak zijn (differentiatie)
3. Combineer beide voor een compleet contentplan
` : '';

        const topicsPrompt = `Genereer 15-20 pillar topics voor de niche: "${nicheData.niche}"

WEBSITE TYPE: ${websiteTypeName}
CONTENT FOCUS: ${websiteTypeConfig.focusAreas.join(', ')}
${competitorContext}

${typeSpecificInstructions[websiteType]}

${languageInstructions[language]}

BELANGRIJKE REGELS:
1. Maak topics die RELEVANT zijn voor ${websiteTypeName}
2. Elk topic moet leiden tot 20-40 concrete artikelen
3. Gebruik subtopics die SPECIFIEK en ACTIONABLE zijn
4. VERMIJD generieke "wat is" of "waarom" topics tenzij dat past bij het website type
5. Denk aan wat bezoekers op dit type website zoeken
${competitorInsights.topTopics.length > 0 ? `6. INCLUDE alle essentiële topics uit de concurrent analyse
7. PRIORITIZE content gaps voor differentiatie` : ''}

Output als JSON array (ALLEEN JSON, geen tekst ervoor of erna):
[
  {
    "topic": "Concrete topic naam die past bij ${websiteTypeName}",
    "estimatedArticles": 30,
    "subtopics": ["specifiek subtopic 1", "specifiek subtopic 2", "specifiek subtopic 3"]
  }
]`;

        const topicsResponse = await generateAICompletion({
          task: 'content',
          systemPrompt: `Je bent een SEO content strategist gespecialiseerd in ${websiteTypeName}. ${languageInstructions[language]} Output ALLEEN valide JSON array.`,
          userPrompt: topicsPrompt,
          maxTokens: 3000,
          temperature: 0.7,
          timeout: 60000, // 60s timeout for topics generation
        });

        const jsonMatch = topicsResponse.match(/\[[\s\S]*\]/);
        if (jsonMatch) {
          const parsedTopics = JSON.parse(jsonMatch[0]);
          if (parsedTopics && parsedTopics.length > 0) {
            nicheData.pillarTopics = parsedTopics;
            console.log(`✓ Generated ${parsedTopics.length} ${websiteTypeName}-specific pillar topics`);
          }
        }
      } catch (e) {
        console.warn('Topics generation failed:', e);
      }

      // Fallback: generate type-specific default topics if still empty
      if (!nicheData.pillarTopics || nicheData.pillarTopics.length === 0) {
        console.log('Using fallback pillar topics for:', nicheData.niche, websiteType);

        // Type-specific fallback topics
        if (websiteType === 'local_seo') {
          nicheData.pillarTopics = [
            { topic: `${nicheData.niche} Diensten`, estimatedArticles: 30, subtopics: ['basis diensten', 'specialisaties', 'spoedopdrachten'] },
            { topic: `${nicheData.niche} Prijzen`, estimatedArticles: 25, subtopics: ['kosten overzicht', 'offertes', 'tarieven vergelijken'] },
            { topic: `${nicheData.niche} Werkgebied`, estimatedArticles: 20, subtopics: ['locaties', 'regio\'s', 'bereik'] },
            { topic: `Waarom ${nicheData.niche} Inhuren`, estimatedArticles: 20, subtopics: ['voordelen', 'wanneer nodig', 'zelf doen vs professional'] },
            { topic: `${nicheData.niche} Checklist`, estimatedArticles: 20, subtopics: ['controle punten', 'onderhoud', 'preventie'] },
          ];
        } else if (websiteType === 'affiliate') {
          nicheData.pillarTopics = [
            { topic: `Beste ${nicheData.niche} Products`, estimatedArticles: 35, subtopics: ['budget opties', 'premium keuzes', 'best value'] },
            { topic: `${nicheData.niche} Reviews`, estimatedArticles: 35, subtopics: ['top merken', 'nieuwe producten', 'user ervaringen'] },
            { topic: `${nicheData.niche} Vergelijkingen`, estimatedArticles: 30, subtopics: ['feature comparison', 'prijs vergelijking', 'alternatieven'] },
            { topic: `${nicheData.niche} Koopgids`, estimatedArticles: 25, subtopics: ['waar op letten', 'specificaties', 'voor wie'] },
            { topic: `${nicheData.niche} Deals`, estimatedArticles: 20, subtopics: ['kortingen', 'aanbiedingen', 'waar te koop'] },
          ];
        } else if (websiteType === 'webshop') {
          nicheData.pillarTopics = [
            { topic: `${nicheData.niche} Categorieën`, estimatedArticles: 30, subtopics: ['product types', 'voor beginners', 'voor gevorderden'] },
            { topic: `${nicheData.niche} Gebruik`, estimatedArticles: 30, subtopics: ['handleidingen', 'tips', 'technieken'] },
            { topic: `${nicheData.niche} Kiezen`, estimatedArticles: 25, subtopics: ['maat kiezen', 'materiaal kiezen', 'voor wie geschikt'] },
            { topic: `${nicheData.niche} Onderhoud`, estimatedArticles: 20, subtopics: ['verzorging', 'opslag', 'levensduur verlengen'] },
            { topic: `${nicheData.niche} Trends`, estimatedArticles: 20, subtopics: ['nieuwe producten', 'populair', 'innovaties'] },
          ];
        } else {
          // blog or general
          nicheData.pillarTopics = [
            { topic: `${nicheData.niche} Basis`, estimatedArticles: 30, subtopics: ['introductie', 'beginnen', 'fundamentals'] },
            { topic: `${nicheData.niche} Gids`, estimatedArticles: 30, subtopics: ['handleiding', 'stappenplan', 'voorbeelden'] },
            { topic: `${nicheData.niche} Tips`, estimatedArticles: 30, subtopics: ['beste praktijken', 'fouten vermijden', 'optimaliseren'] },
            { topic: `${nicheData.niche} Trends`, estimatedArticles: 20, subtopics: ['ontwikkelingen', 'toekomst', 'innovaties'] },
            { topic: `${nicheData.niche} Tools`, estimatedArticles: 20, subtopics: ['resources', 'software', 'hulpmiddelen'] },
          ];
        }
      }
    }

    await updateJob(jobId, { progress: 35, current_step: `✅ ${nicheData.pillarTopics?.length || 0} pillar topics` });

    // NEW: Generate specific products/items for affiliate/webshop websites
    let specificItems: string[] = [];
    if ((websiteType === 'affiliate' || websiteType === 'webshop') && nicheData.niche && nicheData.niche !== 'Algemeen') {
      try {
        await updateJob(jobId, { progress: 38, current_step: `🔍 Specifieke ${nicheData.niche} producten genereren...` });

        const itemsPrompt = `Genereer een lijst van 20-30 SPECIFIEKE, CONCRETE en POPULAIRE producten/items voor de niche: "${nicheData.niche}"

${languageInstructions[language]}

BELANGRIJKE REGELS:
1. Alleen ECHTE, BESTAANDE producten/items die mensen zoeken
2. Gebruik BEKENDE merknamen en productnamen waar mogelijk
3. Mix van populaire en niche producten
4. Varieer in prijsklasse (budget, mid-range, premium)
5. Voor spellen: alleen de NAAM, geen generieke termen
6. Voor producten: alleen de PRODUCTNAAM, geen categorieën

VOORBEELDEN:
✅ GOED (Bordspel): ["Catan", "Ticket to Ride", "Wingspan", "Azul", "7 Wonders", "Pandemic", "Carcassonne"]
❌ FOUT (Bordspel): ["Bordspel Reviews", "Beste Bordspellen", "Familie Spellen"]

✅ GOED (Haarverzorging): ["Olaplex No. 3", "Redken All Soft Shampoo", "Kerastase Nutritive", "Paul Mitchell Tea Tree"]
❌ FOUT (Haarverzorging): ["Shampoo", "Conditioner", "Haarmasker"]

Output als JSON array (ALLEEN JSON, geen tekst):
["Product 1", "Product 2", "Product 3", ...]`;

        const itemsResponse = await generateAICompletion({
          task: 'content',
          systemPrompt: `Je bent een product expert gespecialiseerd in ${nicheData.niche}. ${languageInstructions[language]} Output ALLEEN valide JSON array.`,
          userPrompt: itemsPrompt,
          maxTokens: 2000,
          temperature: 0.8,
          timeout: 45000,
        });

        const jsonMatch = itemsResponse.match(/\[[\s\S]*?\]/);
        if (jsonMatch) {
          const parsedItems = JSON.parse(jsonMatch[0]);
          if (parsedItems && Array.isArray(parsedItems) && parsedItems.length > 0) {
            specificItems = parsedItems.filter(item => typeof item === 'string' && item.length > 0);
            console.log(`✓ Generated ${specificItems.length} specific items for ${nicheData.niche}:`, specificItems.slice(0, 5));
          }
        }
      } catch (e) {
        console.warn('Specific items generation failed:', e);
      }
    }

    // Step 5: Generate content clusters IN PARALLEL (massive speed improvement)
    await updateJob(jobId, { progress: 40, current_step: '📝 Content clusters voorbereiden...' });

    const clusters: any[] = [];
    const allArticles: any[] = [];
    const pillarCount = nicheData.pillarTopics.length;

    // Generate clusters in parallel batches of 5 for better performance
    const BATCH_SIZE = 5;
    const batches = [];
    for (let i = 0; i < pillarCount; i += BATCH_SIZE) {
      batches.push(nicheData.pillarTopics.slice(i, i + BATCH_SIZE));
    }

    let completedClusters = 0;

    for (let batchIndex = 0; batchIndex < batches.length; batchIndex++) {
      // Check if job was cancelled
      if (await isJobCancelled(jobId)) {
        console.log(`Job ${jobId} was cancelled during cluster generation`);
        return;
      }

      const batch = batches[batchIndex];
      const batchProgress = 40 + Math.round((completedClusters / pillarCount) * 35);
      await updateJob(jobId, {
        progress: batchProgress,
        current_step: `📝 Clusters genereren (${completedClusters}/${pillarCount})...`
      });

      // Generate all clusters in this batch in parallel
      const batchPromises = batch.map(async (pillarData: string | { topic: string; estimatedArticles: number; subtopics: string[] }) => {
        const pillarTopic = typeof pillarData === 'string' ? pillarData : pillarData.topic;
        const subtopics = typeof pillarData === 'object' ? pillarData.subtopics : [];
        const estimatedArticles = typeof pillarData === 'object' ? pillarData.estimatedArticles : Math.ceil(targetCount / pillarCount);

        try {
          const allowedContentTypes = websiteTypeConfig.contentTypes.join('|');
          const clusterPrompt = `Genereer content cluster voor: "${pillarTopic}"
Niche: ${nicheData.niche}
Website Type: ${websiteTypeName}
Content Focus: ${websiteTypeConfig.focusAreas.join(', ')}
Subtopics: ${subtopics.join(', ')}
Aantal artikelen: ${estimatedArticles}
${languageInstructions[language]}

BELANGRIJKE INSTRUCTIES VOOR ${websiteTypeName.toUpperCase()}:
${websiteType === 'local_seo' ? `
- Focus op lokale dienstverlening en expertise
- Gebruik "diensten", "locaties", "werkgebied" thema's
- Denk aan: "kosten", "wanneer nodig", "checklist", "specialist"
- Vermijd productvergelijkingen en reviews
` : ''}
${websiteType === 'affiliate' ? `
- Focus op productreviews, vergelijkingen en koopadvies
- Gebruik "review", "test", "vergelijking", "beste" thema's
- Denk aan: "vs", "voordelen/nadelen", "is het de moeite waard"
- Commerciële intent is belangrijk
` : ''}
${websiteType === 'webshop' ? `
- Focus op productinformatie, gebruik en koopadvies
- Gebruik "hoe te gebruiken", "handleiding", "voor wie geschikt" thema's
- Denk aan: "soorten", "verschillen", "beste keuze"
- Mix van informatief en commercieel
` : ''}
${websiteType === 'blog' ? `
- Focus op educatieve en informatieve content
- Gebruik "hoe", "waarom", "wat is", "tips" thema's
- Denk aan: "uitleg", "handleiding", "voorbeelden", "trends"
- Voornamelijk informatieve intent
` : ''}

Output als JSON:
{
  "pillarTitle": "Complete Gids: ${pillarTopic}",
  "pillarDescription": "Beschrijving",
  "pillarKeywords": ["kw1", "kw2"],
  "supportingContent": [
    {"title": "Titel", "description": "Beschrijving", "keywords": ["kw1"], "contentType": "${allowedContentTypes}", "difficulty": "beginner|intermediate|advanced", "searchIntent": "informational|commercial|transactional"}
  ]
}`;

          const clusterResponse = await generateAICompletion({
            task: 'content',
            systemPrompt: `Je bent een SEO content strategist gespecialiseerd in ${websiteTypeName}. ${languageInstructions[language]} Output JSON.`,
            userPrompt: clusterPrompt,
            maxTokens: 8000,
            temperature: 0.8,
            timeout: 90000, // 90 second timeout per cluster
          });

          const jsonMatch = clusterResponse.match(/\{[\s\S]*\}/);
          if (jsonMatch) {
            const cluster = JSON.parse(jsonMatch[0]);

            const clusterResult = {
              pillarTopic,
              pillarTitle: cluster.pillarTitle,
              articleCount: (cluster.supportingContent?.length || 0) + 1,
            };

            const articles = [
              {
                title: cluster.pillarTitle,
                category: pillarTopic,
                description: cluster.pillarDescription,
                keywords: cluster.pillarKeywords || [],
                contentType: 'pillar',
                cluster: pillarTopic,
                priority: 'high',
              },
              ...(cluster.supportingContent || []).map((article: any) => ({
                title: article.title,
                category: pillarTopic,
                description: article.description,
                keywords: article.keywords || [],
                contentType: article.contentType || 'guide',
                cluster: pillarTopic,
                priority: article.contentType === 'how-to' ? 'high' : 'medium',
                difficulty: article.difficulty || 'intermediate',
                searchIntent: article.searchIntent || 'informational',
              }))
            ];

            return { success: true, cluster: clusterResult, articles };
          }
          return { success: false, error: 'No JSON match' };
        } catch (e: any) {
          console.error(`Cluster generation error for ${pillarTopic}:`, e.message);
          return { success: false, error: e.message };
        }
      });

      // Wait for all clusters in this batch to complete
      const batchResults = await Promise.allSettled(batchPromises);

      // Process results
      for (const result of batchResults) {
        if (result.status === 'fulfilled' && result.value.success) {
          clusters.push(result.value.cluster);
          allArticles.push(...result.value.articles);
        }
        completedClusters++;
      }

      // Update progress after batch
      const progress = 40 + Math.round((completedClusters / pillarCount) * 35);
      await updateJob(jobId, {
        progress,
        current_step: `✅ ${completedClusters}/${pillarCount} clusters voltooid (${allArticles.length} artikelen)`
      });

      // Check cancellation after each batch
      if (await isJobCancelled(jobId)) {
        console.log(`Job ${jobId} was cancelled after batch ${batchIndex + 1}`);
        return;
      }
    }

    await updateJob(jobId, { progress: 76, current_step: `✅ ${clusters.length} clusters met ${allArticles.length} artikelen` });

    // Check cancellation before long-tail
    if (await isJobCancelled(jobId)) {
      console.log(`Job ${jobId} was cancelled before long-tail generation`);
      return;
    }

    // Step 6: Generate long-tail variations with type-specific modifiers
    await updateJob(jobId, { progress: 80, current_step: '🔄 Long-tail variaties genereren...' });

    if (allArticles.length < targetCount) {
      // Use type-specific modifiers and content types
      const modifiers = websiteTypeConfig.modifiers[language as keyof typeof websiteTypeConfig.modifiers] || websiteTypeConfig.modifiers['en'];
      const contentTypes = websiteTypeConfig.contentTypes;

      console.log(`Using ${modifiers.length} ${websiteTypeName} modifiers for ${language} language`);

      // IMPROVED: Use specific items if available (for affiliate/webshop), otherwise use pillar topics
      const itemsToExpand = specificItems.length > 0 ? specificItems : nicheData.pillarTopics.map((p: any) => typeof p === 'string' ? p : p.topic);

      console.log(`Expanding ${itemsToExpand.length} items with modifiers (${specificItems.length > 0 ? 'specific products' : 'pillar topics'})`);

      for (const item of itemsToExpand) {
        // Determine cluster name (use pillar topic if available, otherwise use item)
        const clusterName = nicheData.pillarTopics.length > 0
          ? (typeof nicheData.pillarTopics[0] === 'string' ? nicheData.pillarTopics[0] : nicheData.pillarTopics[0].topic)
          : item;

        for (const modifier of modifiers) {
          if (allArticles.length >= targetCount) break;

          // Check if modifier is already in the item name to prevent duplicates
          const itemLower = item.toLowerCase();
          const modifierLower = modifier.toLowerCase();

          // Skip if the item already contains the modifier word (prevents "Review Bordspel Reviews")
          if (itemLower.includes(modifierLower) ||
              (modifierLower.includes('review') && itemLower.includes('review')) ||
              (modifierLower.includes('vergelijk') && itemLower.includes('vergelijk')) ||
              (modifierLower.includes('best') && itemLower.includes('best'))) {
            continue;
          }

          const title = `${modifier.charAt(0).toUpperCase() + modifier.slice(1)} ${item}`;

          allArticles.push({
            title,
            category: clusterName,
            description: `${title} - Uitgebreide informatie.`,
            keywords: [`${item.toLowerCase()} ${modifier}`.trim(), item.toLowerCase()],
            contentType: contentTypes[Math.floor(Math.random() * contentTypes.length)],
            cluster: clusterName,
            priority: 'low',
            websiteType: websiteType, // Add website type for filtering/sorting
          });
        }
      }
    }

    // Check cancellation before DataForSEO
    if (await isJobCancelled(jobId)) {
      console.log(`Job ${jobId} was cancelled before DataForSEO enrichment`);
      return;
    }

    // Step 7: DataForSEO enrichment (85-95%)
    await updateJob(jobId, { progress: 85, current_step: '📊 SEO data ophalen (DataForSEO)...' });

    const hasDataForSEO = process.env.DATAFORSEO_LOGIN && process.env.DATAFORSEO_PASSWORD;
    let enrichedArticles = [...allArticles];

    if (hasDataForSEO) {
      try {
        // Get seed keywords from pillar topics
        const seedKeywords = nicheData.pillarTopics
          .map((p: any) => typeof p === 'string' ? p : p.topic)
          .slice(0, 10);

        await updateJob(jobId, { progress: 87, current_step: '📊 Keyword data ophalen...' });

        const dataForSEOResults = await getRelatedKeywords(
          seedKeywords,
          langConfig.locationCode,
          language,
          45000 // 45 second timeout for DataForSEO
        );

        if (dataForSEOResults && dataForSEOResults.length > 0) {
          // Create a map of keywords to their data
          const keywordMap = new Map<string, any>();
          for (const kw of dataForSEOResults) {
            if (kw.keyword) {
              keywordMap.set(kw.keyword.toLowerCase(), kw);
            }
          }

          await updateJob(jobId, { progress: 90, current_step: `📊 ${dataForSEOResults.length} keywords verrijkt` });

          // Enrich articles with SEO data
          enrichedArticles = allArticles.map(article => {
            const titleLower = article.title.toLowerCase();
            const keywordLower = (article.keywords[0] || '').toLowerCase();

            // Try to find matching keyword data
            let matchedData = keywordMap.get(keywordLower) || keywordMap.get(titleLower);

            // If no direct match, try partial matching
            if (!matchedData) {
              for (const [key, data] of Array.from(keywordMap.entries())) {
                if (titleLower.includes(key) || key.includes(keywordLower)) {
                  matchedData = data;
                  break;
                }
              }
            }

            if (matchedData) {
              return {
                ...article,
                searchVolume: matchedData.searchVolume || null,
                competition: matchedData.competition || null,
                cpc: matchedData.cpc || null,
                competitionIndex: matchedData.competitionIndex || null,
              };
            }

            return article;
          });

          await updateJob(jobId, { progress: 93, current_step: '✅ SEO data toegevoegd' });
        } else {
          await updateJob(jobId, { progress: 93, current_step: '⚠️ Geen DataForSEO data beschikbaar' });
        }
        
        // Check cancellation after DataForSEO enrichment
        if (await isJobCancelled(jobId)) {
          console.log(`Job ${jobId} was cancelled after DataForSEO enrichment`);
          return;
        }
      } catch (dataForSEOError) {
        console.warn('DataForSEO enrichment failed:', dataForSEOError);
        await updateJob(jobId, { progress: 93, current_step: '⚠️ DataForSEO overgeslagen' });
      }
    } else {
      await updateJob(jobId, { progress: 93, current_step: '⏭️ DataForSEO niet geconfigureerd' });
    }

    await updateJob(jobId, { progress: 95, current_step: '🎯 Afronden...' });

    // Final cancellation check before saving
    if (await isJobCancelled(jobId)) {
      console.log(`Job ${jobId} was cancelled before final save`);
      return;
    }

    // Deduplicate
    const seen = new Set<string>();
    const uniqueArticles = enrichedArticles.filter(article => {
      const key = article.title.toLowerCase().replace(/[^a-z0-9]/g, '').substring(0, 50);
      if (seen.has(key)) return false;
      seen.add(key);
      return true;
    });

    // Filter out articles with forbidden words
    const filteredArticles: any[] = [];
    const forbiddenFiltered: Array<{ title: string; keywords: string[]; reason: string }> = [];

    for (const article of uniqueArticles) {
      // Check title for forbidden words
      const titleForbidden = checkForbiddenWords(article.title);

      // Check all keywords for forbidden words
      let keywordsForbidden: string[] = [];
      if (article.keywords && Array.isArray(article.keywords)) {
        for (const keyword of article.keywords) {
          const found = checkForbiddenWords(keyword);
          keywordsForbidden = [...keywordsForbidden, ...found];
        }
      }

      // If forbidden words found, filter out and log
      if (titleForbidden.length > 0 || keywordsForbidden.length > 0) {
        const allForbidden = [...new Set([...titleForbidden, ...keywordsForbidden])];
        forbiddenFiltered.push({
          title: article.title,
          keywords: article.keywords || [],
          reason: `Verboden woorden gevonden: ${allForbidden.join(', ')}`
        });
      } else {
        filteredArticles.push(article);
      }
    }

    // Log filtered articles
    if (forbiddenFiltered.length > 0) {
      console.log(`🚫 ${forbiddenFiltered.length} artikelen gefilterd wegens verboden woorden:`);
      forbiddenFiltered.forEach((filtered, index) => {
        console.log(`  ${index + 1}. "${filtered.title}" - ${filtered.reason}`);
      });
      await updateJob(jobId, {
        progress: 96,
        current_step: `🚫 ${forbiddenFiltered.length} artikelen gefilterd (verboden woorden)`
      });
    }

    // Calculate stats
    const stats = {
      totalArticles: filteredArticles.length,
      pillarPages: filteredArticles.filter(a => a.contentType === 'pillar').length,
      clusters: clusters.length,
      byContentType: {
        pillar: filteredArticles.filter(a => a.contentType === 'pillar').length,
        'how-to': filteredArticles.filter(a => a.contentType === 'how-to').length,
        guide: filteredArticles.filter(a => a.contentType === 'guide').length,
        comparison: filteredArticles.filter(a => a.contentType === 'comparison').length,
        list: filteredArticles.filter(a => a.contentType === 'list').length,
        faq: filteredArticles.filter(a => a.contentType === 'faq').length,
      },
      forbiddenWordsFiltered: forbiddenFiltered.length,
    };

    // Complete - save everything to database
    await updateJob(jobId, {
      status: 'completed',
      progress: 100,
      current_step: '✅ Content plan voltooid!',
      plan: filteredArticles,
      clusters,
      stats,
    });

    console.log(`Job ${jobId} completed with ${filteredArticles.length} articles (${forbiddenFiltered.length} filtered)`);

  } catch (error: any) {
    console.error('Content plan generation error:', error);
    await updateJob(jobId, {
      status: 'failed',
      error: error.message || 'Er is een fout opgetreden',
    });
  }
}
