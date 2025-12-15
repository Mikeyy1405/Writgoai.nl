import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth-options';

export const dynamic = 'force-dynamic';

// Simple SEO scoring function
function calculateSEOScore(data: {
  title: string;
  content: string;
  metaDescription?: string;
  focusKeyword?: string;
  slug: string;
}): {
  score: number;
  issues: string[];
  suggestions: string[];
} {
  let score = 100;
  const issues: string[] = [];
  const suggestions: string[] = [];

  // Title length check
  if (data.title.length < 30 || data.title.length > 60) {
    score -= 10;
    issues.push('Title should be between 30-60 characters');
  }

  // Meta description check
  if (!data.metaDescription || data.metaDescription.length < 120) {
    score -= 15;
    issues.push('Meta description should be at least 120 characters');
  } else if (data.metaDescription.length > 160) {
    score -= 10;
    issues.push('Meta description is too long (max 160 characters)');
  }

  // Content length check
  const wordCount = data.content.split(/\s+/).length;
  if (wordCount < 300) {
    score -= 20;
    issues.push('Content is too short (minimum 300 words recommended)');
  } else if (wordCount > 2500) {
    suggestions.push('Consider splitting this into multiple posts');
  }

  // Focus keyword checks
  if (data.focusKeyword) {
    const keyword = data.focusKeyword.toLowerCase();
    const titleLower = data.title.toLowerCase();
    const contentLower = data.content.toLowerCase();

    if (!titleLower.includes(keyword)) {
      score -= 15;
      issues.push('Focus keyword not found in title');
    }

    if (!contentLower.includes(keyword)) {
      score -= 15;
      issues.push('Focus keyword not found in content');
    }

    const keywordCount = (contentLower.match(new RegExp(keyword, 'g')) || []).length;
    const keywordDensity = (keywordCount / wordCount) * 100;

    if (keywordDensity < 0.5) {
      score -= 10;
      suggestions.push('Increase keyword density (aim for 0.5-2.5%)');
    } else if (keywordDensity > 2.5) {
      score -= 10;
      issues.push('Keyword density too high (risk of keyword stuffing)');
    }
  } else {
    score -= 10;
    issues.push('No focus keyword specified');
  }

  // Slug check
  if (data.slug.length > 50) {
    score -= 5;
    suggestions.push('Slug is quite long, consider shortening it');
  }

  // Check for headings
  const hasH1 = /<h1/i.test(data.content);
  const hasH2 = /<h2/i.test(data.content);

  if (!hasH1) {
    score -= 10;
    issues.push('Missing H1 heading in content');
  }

  if (!hasH2) {
    score -= 5;
    suggestions.push('Add H2 headings to structure your content');
  }

  // Check for images
  const hasImages = /<img/i.test(data.content);
  if (!hasImages) {
    score -= 5;
    suggestions.push('Add images to make content more engaging');
  }

  // Ensure score doesn't go below 0
  score = Math.max(0, score);

  return { score, issues, suggestions };
}

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session || session.user?.role !== 'admin') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { title, content, metaDescription, focusKeyword, slug } = body;

    if (!title || !content || !slug) {
      return NextResponse.json(
        { error: 'Title, content, and slug are required' },
        { status: 400 }
      );
    }

    const analysis = calculateSEOScore({
      title,
      content,
      metaDescription,
      focusKeyword,
      slug,
    });

    // Calculate word count and reading time
    const wordCount = content.split(/\s+/).length;
    const readingTimeMinutes = Math.ceil(wordCount / 200);

    // Extract internal and external links
    const linkRegex = /<a\s+(?:[^>]*?\s+)?href=(["'])(.*?)\1/gi;
    const links: string[] = [];
    let match;
    while ((match = linkRegex.exec(content)) !== null) {
      links.push(match[2]);
    }

    const internalLinks = links.filter(link => 
      link.startsWith('/') || link.includes('writgo.nl')
    );
    const externalLinks = links.filter(link => 
      !link.startsWith('/') && !link.includes('writgo.nl')
    );

    return NextResponse.json({
      seoScore: analysis.score,
      issues: analysis.issues,
      suggestions: analysis.suggestions,
      wordCount,
      readingTimeMinutes,
      internalLinks,
      externalLinks,
    });
  } catch (error) {
    console.error('Error calculating SEO score:', error);
    return NextResponse.json({ error: 'Server error' }, { status: 500 });
  }
}
