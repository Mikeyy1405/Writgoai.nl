import { anthropicClient } from '@/lib/ai-client';

interface ContentOpportunity {
  title: string;
  source_url: string;
  metadata?: {
    description?: string;
    published?: string;
    author?: string;
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

export async function generateAdvancedContent(
  opportunity: ContentOpportunity,
  relatedArticles: Array<{ title: string; slug: string }> = []
): Promise<GeneratedContent> {
  
  // Build internal links section
  const internalLinksHtml = relatedArticles.length > 0
    ? `\n<h3>Gerelateerde artikelen</h3>\n<ul>\n${relatedArticles.slice(0, 3).map(a => 
        `  <li><a href="/blog/${a.slug}">${a.title}</a></li>`
      ).join('\n')}\n</ul>\n`
    : '';

  const prompt = `Je bent een expert SEO content writer voor WritGo.nl, een WordPress SEO automatisering platform.

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

8. **Bronnen & Verder Lezen**
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
- ⭐ Dates: Gebruik exacte datums ("Op 15 december 2024...")
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
Begin direct met de eerste <p> van de intro.`;

  try {
    const message = await anthropicClient.messages.create({
      model: 'claude-sonnet-4-5',
      max_tokens: 8000,
      temperature: 0.7,
      messages: [
        {
          role: 'user',
          content: prompt,
        },
      ],
    });

    const textContent = message.content.find((block) => block.type === 'text');
    let content = textContent?.type === 'text' ? textContent.text : '';
    
    // Clean up markdown code blocks if AI added them
    content = content.replace(/```html\n?/g, '').replace(/```\n?/g, '').trim();

    // Generate metadata
    const titleMatch = opportunity.title.match(/^(.+?)[\:\-\|]/);
    const cleanTitle = titleMatch ? titleMatch[1].trim() : opportunity.title;
    
    const focusKeyword = cleanTitle.split(' ').slice(0, 3).join(' ').toLowerCase();
    const articleTitle = `${cleanTitle}: Complete Gids voor 2025`;
    const metaDescription = `Ontdek alles over ${cleanTitle}. Praktische tips, actie-items en impact op WordPress SEO. ✓ Uitgebreide gids ✓ Expert advies ✓ 2025 updates`;
    
    const excerpt = opportunity.metadata?.description?.substring(0, 160) || 
                   `Uitgebreide gids over ${cleanTitle} en de impact op WordPress SEO. Inclusief praktische tips en actie-items voor 2025.`;

    // Generate schema markup
    const schema = generateSchemaMarkup(articleTitle, excerpt, content, opportunity);

    // Extract internal links
    const internalLinks = extractInternalLinks(content);

    // Count words (rough estimate)
    const wordCount = content.split(/\s+/).length;

    return {
      title: articleTitle,
      content,
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
