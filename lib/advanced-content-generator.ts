import { generateAICompletion } from '@/lib/ai-client';

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

export async function generateAdvancedContent(
  opportunity: ContentOpportunity,
  relatedArticles: Array<{ title: string; slug: string }> = []
): Promise<GeneratedContent> {
  const dateInfo = getCurrentDateInfo();
  
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

9. **Conclusie (150 woorden)**
   - Samenvatting in 3 bullets
   - Key takeaway
   - CTA naar WritGo

10. **Bronnen & Verder Lezen**
   - Link naar origineel artikel
   - 2-3 gerelateerde bronnen

HTML OPMAAK:
- Gebruik <h2> voor hoofdsecties
- Gebruik <h3> voor subsecties
- Gebruik <h4> voor sub-subsecties
- Gebruik <p> voor paragrafen (max 3-4 zinnen)
- Gebruik <strong> voor belangrijke termen
- Gebruik <ul> en <li> voor lijsten
- Gebruik <ol> en <li> voor genummerde stappen
- Gebruik <blockquote> voor belangrijke quotes
- Voeg 3-4 placeholder images toe: <img src="/api/placeholder/800/400" alt="beschrijvende alt text" />

INTERNE LINKS:
Voeg deze links natuurlijk toe in de content:
- <a href="/">WritGo</a> (homepage)
- <a href="/dashboard">WritGo dashboard</a>
- <a href="/dashboard/writgo-autopilot">WritGo AutoPilot</a>
- <a href="/blog">WritGo blog</a>
${internalLinksHtml}

EXTERNE LINKS (met bronvermelding):
- Link naar origineel artikel: <a href="${opportunity.source_url}" target="_blank" rel="noopener">${opportunity.title}</a>
- Voeg 2-3 relevante externe bronnen toe (officiële documentatie, studies)

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

BELANGRIJK:
- Schrijf ORIGINELE content, geen vertaling!
- Gebruik Nederlandse SEO best practices
- Maak het actionable en praktisch
- Focus op waarde voor de lezer

OUTPUT:
Genereer ALLEEN de HTML content. Geen markdown code blocks, geen extra uitleg.
Begin direct met de eerste <h2> of <p> van de intro.`;

  try {
    const content = await generateAICompletion({
      task: 'content',
      systemPrompt: 'Je bent een expert SEO content writer die uitgebreide, goed gestructureerde HTML artikelen schrijft in het Nederlands. Genereer alleen HTML content zonder markdown formatting.',
      userPrompt: prompt,
      maxTokens: 8000,
      temperature: 0.7,
    });

    // Clean up markdown code blocks if AI added them
    let cleanContent = content.replace(/```html\n?/g, '').replace(/```\n?/g, '').trim();

    // Generate metadata
    const titleMatch = opportunity.title.match(/^(.+?)[\:\-\|]/);
    const cleanTitle = titleMatch ? titleMatch[1].trim() : opportunity.title;
    
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
