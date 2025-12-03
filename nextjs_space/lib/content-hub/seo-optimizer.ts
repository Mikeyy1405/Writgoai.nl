/**
 * SEO Optimizer for Content Hub
 * Generates SEO metadata and schema markup
 */

export interface SEOMetadata {
  metaTitle: string;
  metaDescription: string;
  focusKeyword: string;
  slug: string;
  canonical?: string;
}

export interface SchemaMarkup {
  '@context': string;
  '@type': string;
  [key: string]: any;
}

/**
 * Generate SEO-optimized meta title
 */
export function generateMetaTitle(
  articleTitle: string,
  keyword: string,
  siteName?: string
): string {
  let metaTitle = articleTitle;
  
  // Ensure keyword is in title
  if (!metaTitle.toLowerCase().includes(keyword.toLowerCase())) {
    metaTitle = `${keyword} - ${metaTitle}`;
  }
  
  // Add site name if provided and there's space
  if (siteName && metaTitle.length < 50) {
    metaTitle = `${metaTitle} | ${siteName}`;
  }
  
  // Truncate to 60 characters
  if (metaTitle.length > 60) {
    metaTitle = metaTitle.substring(0, 57) + '...';
  }
  
  return metaTitle;
}

/**
 * Generate SEO-optimized meta description
 */
export function generateMetaDescription(
  excerpt: string,
  keywords: string[]
): string {
  let metaDescription = excerpt;
  
  // Ensure primary keyword is in description
  const primaryKeyword = keywords[0];
  if (primaryKeyword && !metaDescription.toLowerCase().includes(primaryKeyword.toLowerCase())) {
    metaDescription = `${primaryKeyword}: ${metaDescription}`;
  }
  
  // Truncate to 160 characters
  if (metaDescription.length > 160) {
    metaDescription = metaDescription.substring(0, 157) + '...';
  }
  
  return metaDescription;
}

/**
 * Generate URL-friendly slug
 */
export function generateSlug(title: string): string {
  return title
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .substring(0, 100);
}

/**
 * Generate Article schema markup
 */
export function generateArticleSchema(
  article: {
    title: string;
    excerpt: string;
    content: string;
    author?: string;
    publishedDate?: string;
    modifiedDate?: string;
    imageUrl?: string;
    url?: string;
  },
  organization?: {
    name: string;
    url: string;
    logo?: string;
  }
): SchemaMarkup {
  const schema: SchemaMarkup = {
    '@context': 'https://schema.org',
    '@type': 'Article',
    headline: article.title,
    description: article.excerpt,
    datePublished: article.publishedDate || new Date().toISOString(),
    dateModified: article.modifiedDate || new Date().toISOString(),
  };
  
  if (article.imageUrl) {
    schema.image = article.imageUrl;
  }
  
  if (article.url) {
    schema.url = article.url;
    schema.mainEntityOfPage = {
      '@type': 'WebPage',
      '@id': article.url,
    };
  }
  
  if (article.author) {
    schema.author = {
      '@type': 'Person',
      name: article.author,
    };
  }
  
  if (organization) {
    schema.publisher = {
      '@type': 'Organization',
      name: organization.name,
      url: organization.url,
    };
    
    if (organization.logo) {
      schema.publisher.logo = {
        '@type': 'ImageObject',
        url: organization.logo,
      };
    }
  }
  
  return schema;
}

/**
 * Generate FAQ schema markup
 */
export function generateFAQSchema(
  faqs: Array<{ question: string; answer: string }>
): SchemaMarkup {
  return {
    '@context': 'https://schema.org',
    '@type': 'FAQPage',
    mainEntity: faqs.map(faq => ({
      '@type': 'Question',
      name: faq.question,
      acceptedAnswer: {
        '@type': 'Answer',
        text: faq.answer,
      },
    })),
  };
}

/**
 * Generate BreadcrumbList schema markup
 */
export function generateBreadcrumbSchema(
  breadcrumbs: Array<{ name: string; url: string }>
): SchemaMarkup {
  return {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: breadcrumbs.map((crumb, index) => ({
      '@type': 'ListItem',
      position: index + 1,
      name: crumb.name,
      item: crumb.url,
    })),
  };
}

/**
 * Calculate SEO score based on various factors
 */
export function calculateSEOScore(article: {
  title: string;
  content: string;
  metaTitle?: string;
  metaDescription?: string;
  keywords: string[];
  wordCount: number;
  hasImages: boolean;
  hasFAQ: boolean;
  internalLinks: number;
}): { score: number; suggestions: string[] } {
  let score = 0;
  const suggestions: string[] = [];
  
  // Title optimization (20 points)
  if (article.metaTitle && article.metaTitle.length >= 50 && article.metaTitle.length <= 60) {
    score += 20;
  } else {
    suggestions.push('Meta title should be 50-60 characters');
  }
  
  // Description optimization (15 points)
  if (article.metaDescription && article.metaDescription.length >= 140 && article.metaDescription.length <= 160) {
    score += 15;
  } else {
    suggestions.push('Meta description should be 140-160 characters');
  }
  
  // Keyword in title (10 points)
  const primaryKeyword = article.keywords[0]?.toLowerCase();
  if (primaryKeyword && article.title.toLowerCase().includes(primaryKeyword)) {
    score += 10;
  } else {
    suggestions.push('Include primary keyword in title');
  }
  
  // Word count (20 points)
  if (article.wordCount >= 1500 && article.wordCount <= 3000) {
    score += 20;
  } else if (article.wordCount >= 1000) {
    score += 10;
    suggestions.push('Optimal word count is 1500-3000 words');
  } else {
    suggestions.push('Article should be at least 1000 words');
  }
  
  // Images (10 points)
  if (article.hasImages) {
    score += 10;
  } else {
    suggestions.push('Add images to improve engagement');
  }
  
  // FAQ section (10 points)
  if (article.hasFAQ) {
    score += 10;
  } else {
    suggestions.push('Consider adding an FAQ section');
  }
  
  // Internal links (15 points)
  if (article.internalLinks >= 3 && article.internalLinks <= 10) {
    score += 15;
  } else if (article.internalLinks > 0) {
    score += 8;
    suggestions.push('Optimal internal links: 3-10 per article');
  } else {
    suggestions.push('Add internal links to improve SEO');
  }
  
  return { score, suggestions };
}

/**
 * Generate Yoast/RankMath compatible meta fields
 */
export function generateYoastMeta(
  article: {
    metaTitle: string;
    metaDescription: string;
    focusKeyword: string;
    schema?: SchemaMarkup;
  }
): Record<string, any> {
  return {
    _yoast_wpseo_title: article.metaTitle,
    _yoast_wpseo_metadesc: article.metaDescription,
    _yoast_wpseo_focuskw: article.focusKeyword,
    _yoast_wpseo_meta_robots_noindex: '0',
    _yoast_wpseo_meta_robots_nofollow: '0',
    ...(article.schema ? {
      _yoast_wpseo_schema_article_type: 'Article',
    } : {}),
  };
}
