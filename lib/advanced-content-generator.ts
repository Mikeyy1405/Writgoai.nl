import { generateAICompletion } from '@/lib/ai-client';
import { getProjectContext, buildContextPrompt } from '@/lib/project-context';
import { BolClient, createBolClientFromConfig } from '@/lib/bol-client';

interface ContentOpportunity {
  title: string;
  source_url: string;
  metadata?: {
    description?: string;
    published?: string;
    author?: string;
    topic?: string;
  };
}

interface GeneratedContent {
  title: string;
  content: string;
  excerpt: string;
  focusKeyword: string;
  metaTitle: string;
  metaDescription: string;
  schema: any;
  internalLinks: string[];
  wordCount: number;
}

// Get current date info for dynamic content
function getCurrentDateInfo() {
  const now = new Date();
  const months = ['januari', 'februari', 'maart', 'april', 'mei', 'juni', 
                  'juli', 'augustus', 'september', 'oktober', 'november', 'december'];
  return {
    day: now.getDate(),
    month: months[now.getMonth()],
    year: now.getFullYear(),
    nextYear: now.getFullYear() + 1,
    fullDate: now.toLocaleDateString('nl-NL', { 
      day: 'numeric', 
      month: 'long', 
      year: 'numeric' 
    })
  };
}

// Helper function to clean HTML content from AI response
function cleanHTMLContent(content: string): string {
  let cleaned = content;
  
  // Remove markdown code blocks (various formats)
  cleaned = cleaned.replace(/```html\s*/gi, '');
  cleaned = cleaned.replace(/```HTML\s*/gi, '');
  cleaned = cleaned.replace(/```\s*/g, '');
  
  // Remove any leading/trailing whitespace
  cleaned = cleaned.trim();
  
  // If content starts with a newline after removing code blocks, trim it
  cleaned = cleaned.replace(/^\n+/, '');
  
  // Remove any "Here is" or similar AI preambles
  cleaned = cleaned.replace(/^(Here is|Here's|Below is|The following|Hier is|Hieronder)[^<]*</i, '<');
  
  // Remove any trailing AI comments (without /s flag for ES5 compatibility)
  cleaned = cleaned.replace(/\n*---[\s\S]*$/, '');
  
  return cleaned;
}

// Helper function to generate slug from keyword
function generateSlugFromKeyword(keyword: string): string {
  return keyword
    .toLowerCase()
    .trim()
    // Replace Dutch characters
    .replace(/[àáâãäå]/g, 'a')
    .replace(/[èéêë]/g, 'e')
    .replace(/[ìíîï]/g, 'i')
    .replace(/[òóôõö]/g, 'o')
    .replace(/[ùúûü]/g, 'u')
    .replace(/[ñ]/g, 'n')
    // Replace spaces and special chars with hyphens
    .replace(/[^a-z0-9]+/g, '-')
    // Remove leading/trailing hyphens
    .replace(/^-+|-+$/g, '')
    // Limit length
    .substring(0, 60);
}

export async function generateAdvancedContent(
  opportunity: ContentOpportunity,
  relatedArticles: Array<{ title: string; slug: string }> = [],
  projectId?: string
): Promise<GeneratedContent> {
  const dateInfo = getCurrentDateInfo();

  // Get project context for internal links, backlinks, and affiliate links
  let contextPrompt = '';
  let bolProducts: any[] = [];

  if (projectId) {
    try {
      const context = await getProjectContext(projectId);
      contextPrompt = buildContextPrompt(context);

      // Search for relevant Bol.com products if affiliate is configured
      if (context.affiliateConfig?.isActive && context.affiliateConfig.clientId && context.affiliateConfig.clientSecret) {
        const bolClient = createBolClientFromConfig({
          clientId: context.affiliateConfig.clientId,
          clientSecret: context.affiliateConfig.clientSecret
        });

        // Extract keywords from title for product search
        const searchKeywords = opportunity.title.split(' ').slice(0, 3).join(' ');
        const productResults = await bolClient.searchProducts(searchKeywords, { pageSize: 3 });
        bolProducts = productResults.products || [];
      }
    } catch (error) {
      console.error('Error fetching project context:', error);
    }
  }

  // Build internal links section
  const internalLinksHtml = relatedArticles.length > 0
    ? `\n<h3>Gerelateerde artikelen</h3>\n<ul>\n${relatedArticles.slice(0, 3).map(a =>
        `  <li><a href="/blog/${a.slug}">${a.title}</a></li>`
      ).join('\n')}\n</ul>\n`
    : '';

  const prompt = `Je bent een expert SEO content writer voor WritGo.nl, een WordPress SEO automatisering platform.

HUIDIGE DATUM: ${dateInfo.fullDate}

BRON ARTIKEL:
Titel: ${opportunity.title}
URL: ${opportunity.source_url}
Beschrijving: ${opportunity.metadata?.description || 'Geen beschrijving'}
Publicatie datum: ${opportunity.metadata?.published || 'Onbekend'}
${opportunity.metadata?.author ? `Auteur: ${opportunity.metadata.author}` : ''}

TAAK:
Schrijf een uitgebreid, diepgaand Nederlands blog artikel over dit onderwerp voor WritGo.nl.

VEREISTEN:
- **Lengte**: 2500-3000 woorden (zeer uitgebreid!)
- **Toon**: Professioneel maar toegankelijk
- **Taal**: Nederlands (geen vertaling, originele content!)
- **SEO**: Geoptimaliseerd voor featured snippets
- **E-E-A-T**: Expertise, autoriteit, betrouwbaarheid
- **Actualiteit**: Gebruik ${dateInfo.year}-${dateInfo.nextYear} informatie

STRUCTUUR (AI OVERVIEW OPTIMIZED):

1. **Direct Answer (100 woorden)** ⭐ KRITIEK voor AI Overview!
   <h2>Wat is [Onderwerp]?</h2>
   <p><strong>DIRECT ANTWOORD in 40-60 woorden - clear, concise, factual</strong></p>
   - Beantwoord de vraag meteen
   - Gebruik simpele taal
   - Geen fluff, alleen facts

2. **Intro & Context (150 woorden)**
   - Waarom is dit belangrijk?
   - Wat is er gebeurd? (met datum!)
   - Wat leert de lezer?

3. **Belangrijkste Punten in Lijst (300 woorden)**
   <h2>5 Belangrijkste Dingen over [Onderwerp]</h2>
   <ol>
     <li><strong>Punt 1:</strong> Uitleg</li>
     <li><strong>Punt 2:</strong> Uitleg</li>
     ...
   </ol>
   - Gebruik numbered lists (AI Overview loves this!)
   - Elk punt = 1-2 zinnen

4. **Diepgaande Uitleg (600 woorden)**
   - H3 per aspect
   - Concrete voorbeelden
   - Data en cijfers waar mogelijk
   - Expert quotes ("Volgens Google...")

5. **Impact & Praktische Gevolgen (400 woorden)**
   <h2>Wat betekent dit voor jouw website?</h2>
   - Specifieke impact
   - Concrete gevolgen
   - Actie-items

6. **Step-by-Step Guide (500 woorden)**
   <h2>Hoe [Actie] uitvoeren: Stap-voor-stap</h2>
   <ol>
     <li><strong>Stap 1:</strong> Concrete actie met uitleg</li>
     <li><strong>Stap 2:</strong> Concrete actie met uitleg</li>
     ...
   </ol>
   - Numbered steps (AI Overview format!)
   - Actionable, specific

7. **FAQ Sectie (500 woorden)** ⭐ KRITIEK voor AI Overview!
   <h2>Veelgestelde Vragen over [Onderwerp]</h2>
   
   <h3>Vraag 1 met vraagteken?</h3>
   <p><strong>Kort antwoord in 1 zin.</strong> Uitgebreide uitleg in 2-3 zinnen.</p>
   
   - 7-10 vragen
   - Gebruik vraagwoorden: Wat, Hoe, Waarom, Wanneer
   - Eerste zin = direct antwoord
   - FAQ schema wordt automatisch gegenereerd!

8. **Comparison Table (indien relevant)**
   <table>
     <tr><th>Feature</th><th>Voor</th><th>Na</th></tr>
     <tr><td>...</td><td>...</td><td>...</td></tr>
   </table>
   - AI Overview loves tables!

9. **Slotgedachten (150 woorden)** - met inhoudelijke H2 heading (NIET "Conclusie", "Tot slot", "Ten slotte" of "Afsluiting")
   - Gebruik een inhoudelijke heading zoals "Aan de slag met [onderwerp]" of "Jouw volgende stappen"
   - Samenvatting in 3 bullets
   - Key takeaway
   - CTA naar WritGo

10. **Bronnen & Verder Lezen**
   - Link naar origineel artikel
   - 2-3 gerelateerde bronnen

HTML OPMAAK - GEBRUIK ALLEEN DEZE TAGS:
- <h2> voor hoofdsecties
- <h3> voor subsecties
- <h4> voor sub-subsecties
- <p> voor paragrafen (max 3-4 zinnen)
- <strong> voor belangrijke termen
- <em> voor nadruk
- <ul> en <li> voor lijsten
- <ol> en <li> voor genummerde stappen
- <blockquote> voor belangrijke quotes
- <table>, <tr>, <th>, <td> voor tabellen
- <a href="..."> voor links

⚠️ VERPLICHTE CONTENT VARIATIE - ABSOLUUT KRITIEK - DIT MOET JE DOEN:
- ✓ Gebruik MINIMAAL 5 <ul> of <ol> lijsten in het artikel (verplicht!)
- ✓ Voeg MINIMAAL 3 tabellen toe met <table> (vergelijkingen, voor/na, statistieken, features) (verplicht!)
- ✓ Gebruik MINIMAAL 4 <blockquote> voor belangrijke quotes, highlights of kernpunten (verplicht!)
- ✓ Wissel CONSTANT af: paragraaf → lijst → paragraaf → tabel → paragraaf → blockquote
- ✓ NOOIT meer dan 2-3 paragrafen achter elkaar zonder lijst, tabel of quote
- ✓ Maak het VISUEEL AANTREKKELIJK en makkelijk scanbaar
- ✓ ELKE H2 sectie moet MINIMAAL 1 lijst, tabel OF blockquote bevatten
- ✓ Als je dit niet doet, is het artikel ONACCEPTABEL

INTERNE LINKS & BACKLINKS (VERPLICHT!):
Voeg deze links natuurlijk toe in de content:
- <a href="/">WritGo</a> (homepage)
- <a href="/dashboard">WritGo dashboard</a>
- <a href="/dashboard/writgo-autopilot">WritGo AutoPilot</a>
- <a href="/blog">WritGo blog</a>
${internalLinksHtml}

${contextPrompt ? `\n${contextPrompt}\n` : ''}

EXTERNE LINKS (met bronvermelding):
- Link naar origineel artikel: <a href="${opportunity.source_url}" target="_blank" rel="noopener">${opportunity.title}</a>
- Voeg 2-3 relevante externe bronnen toe (officiële documentatie, studies)

${bolProducts.length > 0 ? `
BOL.COM AFFILIATE LINKS (VERPLICHT - Voeg minimaal 1 product toe!):
Gebruik deze mooie CTA box structuur voor elk product:

<div class="bol-product-cta" style="border: 2px solid #0000a4; border-radius: 12px; padding: 20px; margin: 30px 0; background: linear-gradient(135deg, #f8f9fa 0%, #ffffff 100%);">
  <h4 style="color: #0000a4; margin-top: 0;">📦 ${bolProducts[0].title}</h4>
  <p><strong>Titel:</strong> [Product naam]</p>
  <p><strong>Omschrijving:</strong> [Korte omschrijving waarom dit product relevant is]</p>
  <div style="margin: 15px 0;">
    <p><strong>✅ Voordelen:</strong></p>
    <ul>
      <li>[Voordeel 1]</li>
      <li>[Voordeel 2]</li>
      <li>[Voordeel 3]</li>
    </ul>
  </div>
  <div style="margin: 15px 0;">
    <p><strong>❌ Nadelen:</strong></p>
    <ul>
      <li>[Nadeel 1]</li>
      <li>[Nadeel 2]</li>
    </ul>
  </div>
  <a href="[BOL.COM AFFILIATE LINK]" target="_blank" rel="noopener sponsored" style="display: inline-block; background: #0000a4; color: white; padding: 12px 24px; border-radius: 8px; text-decoration: none; font-weight: bold; margin-top: 10px;">
    Bekijk meer en bestel →
  </a>
</div>

BELANGRIJK:
- Voeg MINIMAAL 1 en MAXIMAAL 3 van deze CTA boxes toe
- Plaats ze op strategische momenten in het artikel (na relevante secties)
- Vul de voordelen en nadelen in op basis van het product
- Gebruik de Bol.com partner link format
` : ''}

E-E-A-T SIGNALEN:
- Vermeld bronnen en data
- Gebruik "volgens [bron]" bij claims
- Voeg expertise toe: "Op basis van onze ervaring met WordPress SEO..."
- Geef concrete voorbeelden

AI OVERVIEW OPTIMALISATIE (KRITIEK!):
- ⭐ Eerste 100 woorden = DIRECT ANTWOORD op de hoofdvraag
- ⭐ Gebruik <strong> voor het directe antwoord
- ⭐ Numbered lists voor stappen/tips (AI loves this!)
- ⭐ FAQ sectie met H3 vragen + directe antwoorden
- ⭐ Tables voor vergelijkingen
- ⭐ Expert quotes: "Volgens [Bron]..."
- ⭐ Entities: Noem Google, OpenAI, etc. bij naam
- ⭐ Dates: Gebruik exacte datums ("Op ${dateInfo.day || 15} ${dateInfo.month} ${dateInfo.year}...")
- ⭐ Numbers: Gebruik cijfers en statistieken
- ⭐ Semantic richness: Gebruik synoniemen en gerelateerde termen

SEO OPTIMALISATIE:
- Focus keyword in eerste 100 woorden
- H2 met vraagformaat ("Wat is...", "Hoe werkt...")
- Gebruik LSI keywords (semantisch gerelateerd)
- Internal links naar pillar pages

BELANGRIJK - LEES DIT ZORGVULDIG:
- Schrijf ORIGINELE content, geen vertaling!
- Gebruik Nederlandse SEO best practices
- Maak het actionable en praktisch
- Focus op waarde voor de lezer
- GEEN markdown code blocks (\`\`\`html of \`\`\`)
- Begin DIRECT met de eerste <h2> of <p> tag
- GEEN uitleg of inleiding voor de HTML
- ⚠️ VERBODEN HEADINGS: "Conclusie", "Tot slot", "Ten slotte", "Afsluiting", "Samenvattend"
- ✓ WEL TOEGESTAAN: Inhoudelijke headings zoals "Aan de slag met [onderwerp]", "Jouw volgende stappen", "De toekomst van [onderwerp]"
- NOOIT hetzelfde woord of dezelfde frase meer dan 1x gebruiken in headings

OUTPUT:
Genereer ALLEEN de HTML content. Begin direct met de eerste <h2> of <p>.`;

  try {
    const content = await generateAICompletion({
      task: 'content',
      systemPrompt: 'Je bent een expert SEO content writer die uitgebreide, goed gestructureerde HTML artikelen schrijft in het Nederlands. Je output is ALLEEN clean HTML zonder markdown code blocks, uitleg of inleiding. Begin direct met de eerste HTML tag.',
      userPrompt: prompt,
      maxTokens: 8000,
      temperature: 0.7,
    });

    // Clean up markdown code blocks if AI added them
    let cleanContent = cleanHTMLContent(content);

    // Generate metadata
    const titleMatch = opportunity.title.match(/^(.+?)[\:\-\|]/);
    const cleanTitle = titleMatch ? titleMatch[1].trim() : opportunity.title;
    
    // Focus keyword = first 3 words of clean title (for slug)
    const focusKeyword = cleanTitle.split(' ').slice(0, 3).join(' ').toLowerCase();
    const articleTitle = `${cleanTitle}: Complete Gids voor ${dateInfo.nextYear}`;
    const metaDescription = `Ontdek alles over ${cleanTitle}. Praktische tips, actie-items en impact op WordPress SEO. ✓ Uitgebreide gids ✓ Expert advies ✓ ${dateInfo.year} updates`;
    
    const excerpt = opportunity.metadata?.description?.substring(0, 160) || 
                   `Uitgebreide gids over ${cleanTitle} en de impact op WordPress SEO. Inclusief praktische tips en actie-items voor ${dateInfo.nextYear}.`;

    // Generate schema markup
    const schema = generateSchemaMarkup(articleTitle, excerpt, cleanContent, opportunity);

    // Extract internal links
    const internalLinks = extractInternalLinks(cleanContent);

    // Count words (rough estimate)
    const wordCount = cleanContent.replace(/<[^>]*>/g, ' ').split(/\s+/).filter(w => w.length > 0).length;

    return {
      title: articleTitle,
      content: cleanContent,
      excerpt,
      focusKeyword,
      metaTitle: articleTitle,
      metaDescription,
      schema,
      internalLinks,
      wordCount
    };

  } catch (error) {
    console.error('Advanced content generation error:', error);
    throw error;
  }
}

function generateSchemaMarkup(title: string, excerpt: string, content: string, opportunity: ContentOpportunity): any[] {
  const publishDate = opportunity.metadata?.published || new Date().toISOString();
  
  // Extract FAQ questions from content
  const faqMatches = content.match(/<h3>([^<]+\?)<\/h3>\s*<p>([^<]+)<\/p>/g) || [];
  const faqItems = faqMatches.slice(0, 7).map(match => {
    const questionMatch = match.match(/<h3>([^<]+)<\/h3>/);
    const answerMatch = match.match(/<p>([^<]+)<\/p>/);
    return {
      "@type": "Question",
      "name": questionMatch ? questionMatch[1] : '',
      "acceptedAnswer": {
        "@type": "Answer",
        "text": answerMatch ? answerMatch[1] : ''
      }
    };
  });

  const schemas: any[] = [
    // Article schema
    {
      "@context": "https://schema.org",
      "@type": "Article",
      "headline": title,
      "description": excerpt,
      "author": {
        "@type": "Organization",
        "name": "WritGo",
        "url": "https://writgo.nl"
      },
      "publisher": {
        "@type": "Organization",
        "name": "WritGo",
        "logo": {
          "@type": "ImageObject",
          "url": "https://writgo.nl/logo.png"
        }
      },
      "datePublished": publishDate,
      "dateModified": new Date().toISOString(),
      "mainEntityOfPage": {
        "@type": "WebPage",
        "@id": "https://writgo.nl/blog"
      }
    }
  ];

  // Add FAQ schema if we found questions
  if (faqItems.length > 0) {
    schemas.push({
      "@context": "https://schema.org",
      "@type": "FAQPage",
      "mainEntity": faqItems
    });
  }

  // Add Breadcrumbs schema
  schemas.push({
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    "itemListElement": [
      {
        "@type": "ListItem",
        "position": 1,
        "name": "Home",
        "item": "https://writgo.nl"
      },
      {
        "@type": "ListItem",
        "position": 2,
        "name": "Blog",
        "item": "https://writgo.nl/blog"
      },
      {
        "@type": "ListItem",
        "position": 3,
        "name": title
      }
    ]
  });

  return schemas;
}

function extractInternalLinks(content: string): string[] {
  const linkMatches = content.match(/href="(\/[^"]+)"/g) || [];
  return linkMatches.map(match => match.replace(/href="|"/g, ''));
}

// Export the slug generator for use elsewhere
export { generateSlugFromKeyword };
