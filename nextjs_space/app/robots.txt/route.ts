
import { NextResponse } from 'next/server';

export async function GET() {
  const robotsTxt = `# Writgo.nl robots.txt
# Optimized for SEO and search engine crawling

User-agent: *
Allow: /
Allow: /blog
Allow: /blog/*

# Sitemap
Sitemap: https://writgo.nl/sitemap.xml

# Disallow admin en client portals
Disallow: /admin
Disallow: /admin/*
Disallow: /client-portal
Disallow: /client-portal/*
Disallow: /project-view/*
Disallow: /api/*

# Crawl delay voor niet-Google bots
User-agent: *
Crawl-delay: 1

# Google crawlers geen delay
User-agent: Googlebot
Crawl-delay: 0

User-agent: Googlebot-Image
Allow: /

# Bing
User-agent: Bingbot
Crawl-delay: 0

# Allow social media crawlers voor Open Graph
User-agent: Twitterbot
Allow: /
Allow: /blog/*

User-agent: facebookexternalhit
Allow: /
Allow: /blog/*

User-agent: LinkedInBot
Allow: /
Allow: /blog/*`;

  return new NextResponse(robotsTxt, {
    headers: {
      'Content-Type': 'text/plain',
      'Cache-Control': 'public, max-age=86400, s-maxage=86400',
    },
  });
}
