
import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth-options';
import { prisma } from '@/lib/db';

export const dynamic = 'force-dynamic';

/**
 * Download article as Word document
 */
export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session || session.user.role !== 'client') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const articleId = searchParams.get('id');

    if (!articleId) {
      return NextResponse.json(
        { error: 'Article ID required' },
        { status: 400 }
      );
    }

    // Get published article
    const article = await prisma.publishedArticle.findUnique({
      where: { id: articleId },
      include: {
        Client: true,
        MasterArticle: true,
      },
    });

    if (!article) {
      return NextResponse.json({ error: 'Article not found' }, { status: 404 });
    }

    if (article.clientId !== session.user.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
    }

    // Convert Markdown to HTML (basic conversion)
    const htmlContent = markdownToHtml(article.content);

    // Create HTML document
    const docContent = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <title>${article.title}</title>
  <style>
    body {
      font-family: Arial, sans-serif;
      line-height: 1.6;
      max-width: 800px;
      margin: 0 auto;
      padding: 20px;
      color: #333;
    }
    h1 {
      color: #FF6B35;
      font-size: 32px;
      margin-bottom: 10px;
    }
    h2 {
      color: #004E89;
      font-size: 24px;
      margin-top: 30px;
      margin-bottom: 15px;
    }
    h3 {
      color: #004E89;
      font-size: 20px;
      margin-top: 25px;
      margin-bottom: 12px;
    }
    p {
      margin-bottom: 15px;
    }
    ul, ol {
      margin-bottom: 15px;
      padding-left: 30px;
    }
    li {
      margin-bottom: 8px;
    }
    strong {
      color: #FF6B35;
    }
    .meta {
      color: #666;
      font-size: 14px;
      margin-bottom: 30px;
      padding-bottom: 20px;
      border-bottom: 2px solid #FF6B35;
    }
    .excerpt {
      background: #f5f5f5;
      padding: 15px;
      border-left: 4px solid #FF6B35;
      margin-bottom: 30px;
      font-style: italic;
    }
    .keywords {
      background: #e8f4f8;
      padding: 15px;
      margin-top: 30px;
      border-radius: 5px;
    }
    .keywords strong {
      color: #004E89;
    }
  </style>
</head>
<body>
  <h1>${article.title}</h1>
  
  <div class="meta">
    <strong>SEO Titel:</strong> ${article.seoTitle}<br>
    <strong>Meta Beschrijving:</strong> ${article.metaDescription}<br>
    <strong>Gepubliceerd:</strong> ${new Date(article.publishedAt).toLocaleDateString('nl-NL')}<br>
    ${article.wordpressUrl ? `<strong>WordPress URL:</strong> <a href="${article.wordpressUrl}">${article.wordpressUrl}</a><br>` : ''}
  </div>

  ${article.excerpt ? `<div class="excerpt">${article.excerpt}</div>` : ''}

  <div class="content">
    ${htmlContent}
  </div>

  ${
    article.keywords.length > 0
      ? `
  <div class="keywords">
    <strong>Keywords:</strong> ${article.keywords.join(', ')}
  </div>
  `
      : ''
  }
</body>
</html>
`;

    // Return as downloadable file
    return new NextResponse(docContent, {
      headers: {
        'Content-Type': 'text/html; charset=utf-8',
        'Content-Disposition': `attachment; filename="${sanitizeFilename(article.title)}.html"`,
      },
    });
  } catch (error) {
    console.error('Error downloading article:', error);
    return NextResponse.json(
      { error: 'Failed to download article' },
      { status: 500 }
    );
  }
}

/**
 * Basic Markdown to HTML converter
 */
function markdownToHtml(markdown: string): string {
  let html = markdown;

  // Headers
  html = html.replace(/^### (.+)$/gm, '<h3>$1</h3>');
  html = html.replace(/^## (.+)$/gm, '<h2>$1</h2>');
  html = html.replace(/^# (.+)$/gm, '<h1>$1</h1>');

  // Bold
  html = html.replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>');

  // Italic
  html = html.replace(/\*(.+?)\*/g, '<em>$1</em>');

  // Links
  html = html.replace(/\[([^\]]+)\]\(([^)]+)\)/g, '<a href="$2">$1</a>');

  // Lists
  html = html.replace(/^- (.+)$/gm, '<li>$1</li>');
  html = html.replace(/(<li>.*<\/li>)/s, '<ul>$1</ul>');
  html = html.replace(/^(\d+)\. (.+)$/gm, '<li>$2</li>');

  // Paragraphs
  const lines = html.split('\n');
  const paragraphs: string[] = [];
  let currentParagraph = '';

  for (const line of lines) {
    const trimmed = line.trim();
    
    if (
      trimmed === '' ||
      trimmed.startsWith('<h') ||
      trimmed.startsWith('<ul') ||
      trimmed.startsWith('<ol') ||
      trimmed.startsWith('<li') ||
      trimmed.startsWith('</ul') ||
      trimmed.startsWith('</ol')
    ) {
      if (currentParagraph) {
        paragraphs.push(`<p>${currentParagraph}</p>`);
        currentParagraph = '';
      }
      if (trimmed) {
        paragraphs.push(trimmed);
      }
    } else {
      currentParagraph += (currentParagraph ? ' ' : '') + trimmed;
    }
  }

  if (currentParagraph) {
    paragraphs.push(`<p>${currentParagraph}</p>`);
  }

  return paragraphs.join('\n');
}

/**
 * Sanitize filename
 */
function sanitizeFilename(filename: string): string {
  return filename
    .replace(/[^a-z0-9]/gi, '-')
    .replace(/-+/g, '-')
    .replace(/^-|-$/g, '')
    .substring(0, 100);
}

