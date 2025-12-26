import { chromium, Browser, Page } from 'playwright';
import Anthropic from '@anthropic-ai/sdk';

const anthropic = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY
});

interface PublishTask {
  topic: string;
  site: string;
  instructions?: string;
  category?: string;
  tags?: string[];
  publishImmediately?: boolean;
}

interface SiteCredentials {
  url: string;
  username: string;
  password: string;
}

// Get site credentials from environment
function getSiteCredentials(siteDomain: string): SiteCredentials | null {
  // Find matching site in env vars
  const envVars = process.env;

  for (let i = 1; i <= 10; i++) {
    const url = envVars[`WP_SITE_${i}_URL`];
    if (url && url.includes(siteDomain)) {
      return {
        url,
        username: envVars[`WP_SITE_${i}_USERNAME`] || '',
        password: envVars[`WP_SITE_${i}_PASSWORD`] || ''
      };
    }
  }

  return null;
}

// Generate article with Claude
async function generateArticle(topic: string, instructions?: string): Promise<{ title: string; content: string }> {
  console.log(`📝 Generating article about: ${topic}`);

  const prompt = `Schrijf een uitgebreid, SEO-geoptimaliseerd artikel over: "${topic}"

${instructions ? `Extra instructies: ${instructions}` : ''}

Vereisten:
- Minimaal 1500 woorden
- Gebruik H2 en H3 headers
- Voeg een inleiding en conclusie toe
- Maak het boeiend en informatief
- Gebruik bullet points waar relevant
- SEO-vriendelijk (gebruik het keyword natuurlijk)

Format:
TITLE: [De titel van het artikel]

CONTENT:
[De volledige artikel content in HTML formaat, klaar voor WordPress]

Gebruik HTML tags zoals <h2>, <h3>, <p>, <ul>, <li>, <strong>, <em>`;

  const message = await anthropic.messages.create({
    model: 'claude-3-5-sonnet-20241022',
    max_tokens: 4096,
    messages: [{
      role: 'user',
      content: prompt
    }]
  });

  const response = message.content[0].type === 'text'
    ? message.content[0].text
    : '';

  // Parse title and content
  const titleMatch = response.match(/TITLE:\s*(.+)/);
  const contentMatch = response.match(/CONTENT:\s*([\s\S]+)/);

  const title = titleMatch ? titleMatch[1].trim() : topic;
  const content = contentMatch ? contentMatch[1].trim() : response;

  console.log(`✓ Article generated: "${title}" (${content.length} characters)`);

  return { title, content };
}

// Login to WordPress
async function loginToWordPress(page: Page, credentials: SiteCredentials): Promise<void> {
  console.log(`🔐 Logging into ${credentials.url}...`);

  await page.goto(`${credentials.url}/wp-admin`, { waitUntil: 'networkidle' });

  // Check if already logged in
  const isLoggedIn = await page.url().includes('wp-admin') && !page.url().includes('wp-login');

  if (isLoggedIn) {
    console.log('✓ Already logged in');
    return;
  }

  // Fill login form
  await page.fill('#user_login', credentials.username);
  await page.fill('#user_pass', credentials.password);
  await page.click('#wp-submit');

  // Wait for redirect
  await page.waitForURL('**/wp-admin/**', { timeout: 15000 });

  console.log('✓ Login successful');
}

// Publish article to WordPress
async function publishToWordPress(
  page: Page,
  article: { title: string; content: string },
  options: { category?: string; tags?: string[]; publishImmediately?: boolean }
): Promise<string> {
  console.log(`📤 Publishing article: "${article.title}"...`);

  // Go to new post
  await page.goto(`${page.url().split('/wp-admin')[0]}/wp-admin/post-new.php`, {
    waitUntil: 'networkidle'
  });

  // Wait for editor to load
  await page.waitForSelector('.editor-post-title__input, #title', { timeout: 10000 });

  // Check if using Gutenberg or Classic editor
  const isGutenberg = await page.locator('.editor-post-title__input').count() > 0;

  if (isGutenberg) {
    console.log('Using Gutenberg editor');

    // Fill title
    await page.fill('.editor-post-title__input', article.title);

    // Click into content area
    await page.click('.block-editor-default-block-appender__content');

    // Type content (Gutenberg converts HTML)
    await page.keyboard.type(article.content.slice(0, 200)); // Preview for safety

    // Better approach: Use code editor and paste HTML
    // Open code editor
    try {
      await page.click('button[aria-label="Options"]');
      await page.click('button:has-text("Code editor")');

      // Find the textarea and fill it
      const textarea = page.locator('.editor-post-text-editor');
      await textarea.fill(article.content);

      // Switch back to visual editor
      await page.click('button[aria-label="Options"]');
      await page.click('button:has-text("Visual editor")');
    } catch (e) {
      console.warn('Could not use code editor, using block insertion');
    }

    // Add category if specified
    if (options.category) {
      try {
        await page.click('button[aria-label="Settings"]');
        await page.fill('input[placeholder="Search categories"]', options.category);
        // Check first match
        await page.click('.editor-post-taxonomies__hierarchical-terms-choice:first-child input');
      } catch (e) {
        console.warn('Could not set category');
      }
    }

    // Add tags if specified
    if (options.tags && options.tags.length > 0) {
      try {
        const tagsInput = page.locator('input.components-form-token-field__input');
        for (const tag of options.tags) {
          await tagsInput.fill(tag);
          await page.keyboard.press('Enter');
        }
      } catch (e) {
        console.warn('Could not set tags');
      }
    }

    // Publish or save as draft
    if (options.publishImmediately !== false) {
      // Open publish panel
      await page.click('button.editor-post-publish-panel__toggle');

      // Wait a bit for the panel to open
      await page.waitForTimeout(500);

      // Click final publish button
      await page.click('button.editor-post-publish-button');

      // Wait for success
      await page.waitForSelector('.components-snackbar', { timeout: 30000 });

      console.log('✓ Article published!');
    } else {
      // Save as draft
      await page.click('button.editor-post-save-draft');
      console.log('✓ Article saved as draft');
    }

  } else {
    console.log('Using Classic editor');

    // Fill title
    await page.fill('#title', article.title);

    // Switch to text mode and fill content
    await page.click('#content-html');
    await page.fill('#content', article.content);

    // Publish or save
    if (options.publishImmediately !== false) {
      await page.click('#publish');
      await page.waitForSelector('.updated.notice', { timeout: 30000 });
      console.log('✓ Article published!');
    } else {
      await page.click('#save-post');
      console.log('✓ Article saved as draft');
    }
  }

  // Get published URL
  let publishedUrl = '';
  try {
    // Try to get permalink
    const permalink = await page.locator('.components-clipboard-button, #sample-permalink a').first();
    publishedUrl = await permalink.getAttribute('href') || '';

    if (!publishedUrl) {
      // Fallback: construct URL from title
      const slug = article.title
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, '-')
        .replace(/(^-|-$)/g, '');
      publishedUrl = `${page.url().split('/wp-admin')[0]}/${slug}`;
    }
  } catch (e) {
    console.warn('Could not get permalink');
  }

  console.log(`✓ Published URL: ${publishedUrl}`);

  return publishedUrl;
}

// Main publish function
export async function publishArticle(task: PublishTask): Promise<{ success: boolean; url?: string; error?: string }> {
  const credentials = getSiteCredentials(task.site);

  if (!credentials) {
    return {
      success: false,
      error: `No credentials found for site: ${task.site}. Add WP_SITE_X_URL, WP_SITE_X_USERNAME, WP_SITE_X_PASSWORD to .env`
    };
  }

  let browser: Browser | null = null;

  try {
    // Generate article
    const article = await generateArticle(task.topic, task.instructions);

    // Launch browser
    console.log('🌐 Starting browser...');
    browser = await chromium.launch({
      headless: true,
      args: [
        '--no-sandbox',
        '--disable-setuid-sandbox',
        '--disable-dev-shm-usage',
        '--disable-blink-features=AutomationControlled'
      ]
    });

    const page = await browser.newPage({
      viewport: { width: 1920, height: 1080 },
      userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36'
    });

    // Login
    await loginToWordPress(page, credentials);

    // Publish
    const url = await publishToWordPress(page, article, {
      category: task.category,
      tags: task.tags,
      publishImmediately: task.publishImmediately
    });

    await browser.close();

    return {
      success: true,
      url
    };

  } catch (error: any) {
    console.error('❌ Publish failed:', error);

    if (browser) {
      await browser.close();
    }

    return {
      success: false,
      error: error.message
    };
  }
}

// Test login function
export async function testLogin(siteDomain: string): Promise<{ success: boolean; error?: string }> {
  const credentials = getSiteCredentials(siteDomain);

  if (!credentials) {
    return {
      success: false,
      error: `No credentials found for site: ${siteDomain}`
    };
  }

  let browser: Browser | null = null;

  try {
    console.log('🌐 Starting browser...');
    browser = await chromium.launch({ headless: true });
    const page = await browser.newPage();

    await loginToWordPress(page, credentials);

    await browser.close();

    return { success: true };

  } catch (error: any) {
    console.error('❌ Login test failed:', error);

    if (browser) {
      await browser.close();
    }

    return {
      success: false,
      error: error.message
    };
  }
}
