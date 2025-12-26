# VPS AI Agent Platform Setup Guide

## Wat Kunnen Deze Agents Doen?

Deze setup transformeert je VPS in een compleet AI agent platform, vergelijkbaar met Manus.im of Abacus DeepAgent, maar volledig onder jouw controle.

### Capabilities:
- ✅ Browser automation (inloggen, formulieren invullen, navigeren)
- ✅ Email management (Gmail lezen, antwoorden, categoriseren)
- ✅ WordPress automation (artikelen publiceren, updates checken)
- ✅ Social media posting (Later.dev, LinkedIn, etc.)
- ✅ SEO monitoring (rankings, analytics gathering)
- ✅ Multi-site management (meerdere WordPress sites beheren)
- ✅ Content workflow automation (van idee tot publicatie)

---

## Stap 1: VPS Basis Setup

```bash
# SSH naar je VPS
ssh root@your-vps-ip

# Update systeem
apt update && apt upgrade -y

# Installeer Node.js 20.x
curl -fsSL https://deb.nodesource.com/setup_20.x | bash -
apt install -y nodejs

# Installeer dependencies voor Playwright
apt install -y \
  libnss3 \
  libnspr4 \
  libatk1.0-0 \
  libatk-bridge2.0-0 \
  libcups2 \
  libdrm2 \
  libdbus-1-3 \
  libxkbcommon0 \
  libxcomposite1 \
  libxdamage1 \
  libxfixes3 \
  libxrandr2 \
  libgbm1 \
  libpango-1.0-0 \
  libcairo2 \
  libasound2 \
  fonts-liberation

# Installeer Redis voor queue
apt install -y redis-server
systemctl enable redis-server
systemctl start redis-server

# Installeer Squid (proxy - als je dat nog niet hebt)
apt install -y squid apache2-utils
```

---

## Stap 2: Agent Project Setup

```bash
# Maak directory voor agent platform
mkdir -p /opt/writgo-agents
cd /opt/writgo-agents

# Initialiseer Node.js project
npm init -y

# Installeer dependencies
npm install \
  playwright \
  puppeteer-extra \
  puppeteer-extra-plugin-stealth \
  @anthropic-ai/sdk \
  googleapis \
  bullmq \
  ioredis \
  dotenv \
  express \
  winston

# Installeer TypeScript
npm install -D typescript @types/node

# Installeer Playwright browsers
npx playwright install chromium

# TypeScript config
cat > tsconfig.json << 'EOF'
{
  "compilerOptions": {
    "target": "ES2022",
    "module": "commonjs",
    "outDir": "./dist",
    "rootDir": "./src",
    "strict": true,
    "esModuleInterop": true,
    "skipLibCheck": true,
    "forceConsistentCasingInFileNames": true
  },
  "include": ["src/**/*"],
  "exclude": ["node_modules"]
}
EOF
```

---

## Stap 3: Agent Code Structure

```bash
# Maak directory structuur
mkdir -p src/{agents,queue,utils,api}

# Maak environment file
cat > .env << 'EOF'
# VPS Agent Configuration
NODE_ENV=production
PORT=3000

# Redis Queue
REDIS_URL=redis://localhost:6379

# AI API Keys
ANTHROPIC_API_KEY=your-claude-api-key
OPENAI_API_KEY=your-openai-key

# Gmail API (optioneel)
GMAIL_CLIENT_ID=your-gmail-client-id
GMAIL_CLIENT_SECRET=your-gmail-client-secret
GMAIL_REFRESH_TOKEN=your-refresh-token

# WordPress Credentials (encrypted!)
WP_CREDENTIALS_SECRET=your-encryption-key

# Render.com API (voor communicatie met main app)
RENDER_API_KEY=your-render-api-key
RENDER_WEBHOOK_SECRET=your-webhook-secret

# Proxy (localhost squid)
PROXY_URL=http://localhost:3128
EOF
```

---

## Stap 4: Base Agent Code

### src/agents/base-agent.ts
```typescript
import { chromium, Browser, Page } from 'playwright';
import { createLogger } from '../utils/logger';

export interface AgentTask {
  id: string;
  type: string;
  data: any;
  retries?: number;
}

export abstract class BaseAgent {
  protected browser?: Browser;
  protected logger = createLogger(this.constructor.name);

  async initialize() {
    this.browser = await chromium.launch({
      headless: true,
      proxy: { server: process.env.PROXY_URL || 'http://localhost:3128' },
      args: [
        '--no-sandbox',
        '--disable-setuid-sandbox',
        '--disable-dev-shm-usage',
        '--disable-blink-features=AutomationControlled'
      ]
    });
    this.logger.info('Browser initialized');
  }

  async cleanup() {
    if (this.browser) {
      await this.browser.close();
      this.logger.info('Browser closed');
    }
  }

  abstract execute(task: AgentTask): Promise<any>;

  async run(task: AgentTask): Promise<any> {
    try {
      await this.initialize();
      const result = await this.execute(task);
      return { success: true, result };
    } catch (error: any) {
      this.logger.error('Agent execution failed', error);
      return { success: false, error: error.message };
    } finally {
      await this.cleanup();
    }
  }
}
```

### src/agents/wordpress-agent.ts
```typescript
import { BaseAgent, AgentTask } from './base-agent';
import { Page } from 'playwright';

interface WordPressTask {
  action: 'login' | 'publish' | 'update' | 'check-updates';
  site: string;
  credentials: {
    username: string;
    password: string;
  };
  data?: any;
}

export class WordPressAgent extends BaseAgent {
  async execute(task: AgentTask): Promise<any> {
    const wpTask = task.data as WordPressTask;

    switch (wpTask.action) {
      case 'login':
        return await this.login(wpTask);
      case 'publish':
        return await this.publishArticle(wpTask);
      case 'check-updates':
        return await this.checkUpdates(wpTask);
      default:
        throw new Error(`Unknown action: ${wpTask.action}`);
    }
  }

  private async login(task: WordPressTask): Promise<boolean> {
    const page = await this.browser!.newPage();

    try {
      this.logger.info(`Logging into ${task.site}`);

      await page.goto(`${task.site}/wp-admin`);
      await page.fill('#user_login', task.credentials.username);
      await page.fill('#user_pass', task.credentials.password);
      await page.click('#wp-submit');

      // Wait for redirect to dashboard
      await page.waitForURL('**/wp-admin/**', { timeout: 10000 });

      this.logger.info('Login successful');
      return true;
    } catch (error: any) {
      this.logger.error('Login failed', error);
      throw error;
    } finally {
      await page.close();
    }
  }

  private async publishArticle(task: WordPressTask): Promise<string> {
    const page = await this.browser!.newPage();

    try {
      // Login first
      await this.login(task);

      this.logger.info('Publishing article');

      await page.goto(`${task.site}/wp-admin/post-new.php`);

      // Fill in title
      await page.fill('#title', task.data.title);

      // Fill in content (Gutenberg editor)
      await page.click('.editor-post-title');
      await page.keyboard.type(task.data.title);
      await page.keyboard.press('Tab');
      await page.keyboard.type(task.data.content);

      // Set featured image if provided
      if (task.data.featuredImage) {
        await page.click('button[aria-label="Set featured image"]');
        // Upload logic here
      }

      // Publish
      await page.click('button.editor-post-publish-panel__toggle');
      await page.click('button.editor-post-publish-button');

      // Wait for publish to complete
      await page.waitForSelector('.post-publish-panel__postpublish-header', {
        timeout: 30000
      });

      // Get published URL
      const url = await page.locator('.post-publish-panel__postpublish-post-address input').inputValue();

      this.logger.info(`Article published: ${url}`);
      return url;
    } finally {
      await page.close();
    }
  }

  private async checkUpdates(task: WordPressTask): Promise<any> {
    const page = await this.browser!.newPage();

    try {
      await this.login(task);

      await page.goto(`${task.site}/wp-admin/update-core.php`);

      const updates = {
        core: await page.locator('.update-nag').count() > 0,
        plugins: await page.locator('#update-plugins-table tr').count(),
        themes: await page.locator('#update-themes-table tr').count()
      };

      // Take screenshot
      await page.screenshot({ path: `/tmp/${task.site.replace(/https?:\/\//, '')}-updates.png` });

      return updates;
    } finally {
      await page.close();
    }
  }
}
```

### src/agents/gmail-agent.ts
```typescript
import { BaseAgent, AgentTask } from './base-agent';
import { google } from 'googleapis';
import Anthropic from '@anthropic-ai/sdk';

interface GmailTask {
  action: 'read' | 'reply' | 'categorize';
  filters?: {
    unread?: boolean;
    from?: string;
    subject?: string;
  };
}

export class GmailAgent extends BaseAgent {
  private gmail: any;
  private anthropic: Anthropic;

  async initialize() {
    // No browser needed for Gmail API
    this.anthropic = new Anthropic({
      apiKey: process.env.ANTHROPIC_API_KEY
    });

    const oauth2Client = new google.auth.OAuth2(
      process.env.GMAIL_CLIENT_ID,
      process.env.GMAIL_CLIENT_SECRET
    );

    oauth2Client.setCredentials({
      refresh_token: process.env.GMAIL_REFRESH_TOKEN
    });

    this.gmail = google.gmail({ version: 'v1', auth: oauth2Client });

    this.logger.info('Gmail API initialized');
  }

  async execute(task: AgentTask): Promise<any> {
    const gmailTask = task.data as GmailTask;

    switch (gmailTask.action) {
      case 'read':
        return await this.readEmails(gmailTask);
      case 'reply':
        return await this.replyToEmails(gmailTask);
      case 'categorize':
        return await this.categorizeEmails(gmailTask);
      default:
        throw new Error(`Unknown action: ${gmailTask.action}`);
    }
  }

  private async readEmails(task: GmailTask): Promise<any[]> {
    let query = '';

    if (task.filters?.unread) query += 'is:unread ';
    if (task.filters?.from) query += `from:${task.filters.from} `;
    if (task.filters?.subject) query += `subject:${task.filters.subject}`;

    const response = await this.gmail.users.messages.list({
      userId: 'me',
      q: query.trim(),
      maxResults: 10
    });

    const emails = [];

    for (const msg of response.data.messages || []) {
      const email = await this.gmail.users.messages.get({
        userId: 'me',
        id: msg.id,
        format: 'full'
      });

      emails.push({
        id: email.data.id,
        subject: this.getHeader(email.data, 'Subject'),
        from: this.getHeader(email.data, 'From'),
        body: this.getBody(email.data)
      });
    }

    return emails;
  }

  private async replyToEmails(task: GmailTask): Promise<number> {
    const emails = await this.readEmails(task);
    let replied = 0;

    for (const email of emails) {
      // Use Claude to generate response
      const response = await this.anthropic.messages.create({
        model: 'claude-3-5-sonnet-20241022',
        max_tokens: 1024,
        messages: [{
          role: 'user',
          content: `Generate a professional email response to this email:

From: ${email.from}
Subject: ${email.subject}
Body: ${email.body}

Keep it concise and helpful.`
        }]
      });

      const replyText = response.content[0].type === 'text'
        ? response.content[0].text
        : '';

      // Send reply
      await this.sendReply(email.id, replyText);
      replied++;

      this.logger.info(`Replied to email: ${email.subject}`);
    }

    return replied;
  }

  private async categorizeEmails(task: GmailTask): Promise<any> {
    const emails = await this.readEmails(task);
    const categories = {
      urgent: [],
      customer_support: [],
      marketing: [],
      other: []
    };

    for (const email of emails) {
      // Use Claude to categorize
      const response = await this.anthropic.messages.create({
        model: 'claude-3-5-sonnet-20241022',
        max_tokens: 100,
        messages: [{
          role: 'user',
          content: `Categorize this email as: urgent, customer_support, marketing, or other.

Subject: ${email.subject}
From: ${email.from}

Reply with only the category name.`
        }]
      });

      const category = response.content[0].type === 'text'
        ? response.content[0].text.trim().toLowerCase()
        : 'other';

      if (category in categories) {
        categories[category as keyof typeof categories].push(email);
      }
    }

    return categories;
  }

  private getHeader(message: any, name: string): string {
    const header = message.payload.headers.find((h: any) => h.name === name);
    return header?.value || '';
  }

  private getBody(message: any): string {
    if (message.payload.body.data) {
      return Buffer.from(message.payload.body.data, 'base64').toString();
    }

    if (message.payload.parts) {
      const part = message.payload.parts.find((p: any) => p.mimeType === 'text/plain');
      if (part?.body.data) {
        return Buffer.from(part.body.data, 'base64').toString();
      }
    }

    return '';
  }

  private async sendReply(messageId: string, body: string) {
    const email = [
      'Content-Type: text/plain; charset=utf-8',
      'MIME-Version: 1.0',
      '',
      body
    ].join('\n');

    const encodedEmail = Buffer.from(email).toString('base64url');

    await this.gmail.users.messages.send({
      userId: 'me',
      requestBody: {
        raw: encodedEmail,
        threadId: messageId
      }
    });
  }

  async cleanup() {
    // No browser to close
    this.logger.info('Gmail agent cleanup complete');
  }
}
```

---

## Stap 5: Queue System

### src/queue/worker.ts
```typescript
import { Worker, Job } from 'bullmq';
import { WordPressAgent } from '../agents/wordpress-agent';
import { GmailAgent } from '../agents/gmail-agent';
import { createLogger } from '../utils/logger';

const logger = createLogger('QueueWorker');

const worker = new Worker(
  'agent-tasks',
  async (job: Job) => {
    logger.info(`Processing job ${job.id}: ${job.data.type}`);

    let agent;

    switch (job.data.type) {
      case 'wordpress':
        agent = new WordPressAgent();
        break;
      case 'gmail':
        agent = new GmailAgent();
        break;
      default:
        throw new Error(`Unknown agent type: ${job.data.type}`);
    }

    const result = await agent.run(job.data);

    logger.info(`Job ${job.id} completed`, result);

    return result;
  },
  {
    connection: {
      host: 'localhost',
      port: 6379
    },
    concurrency: 3, // Run 3 agents in parallel
    limiter: {
      max: 10,
      duration: 60000 // Max 10 jobs per minute
    }
  }
);

worker.on('completed', (job) => {
  logger.info(`Job ${job.id} completed successfully`);
});

worker.on('failed', (job, err) => {
  logger.error(`Job ${job?.id} failed`, err);
});

export default worker;
```

### src/queue/producer.ts
```typescript
import { Queue } from 'bullmq';

export const agentQueue = new Queue('agent-tasks', {
  connection: {
    host: 'localhost',
    port: 6379
  },
  defaultJobOptions: {
    attempts: 3,
    backoff: {
      type: 'exponential',
      delay: 2000
    },
    removeOnComplete: 100,
    removeOnFail: 50
  }
});

// Helper functions
export async function addWordPressTask(task: any) {
  return await agentQueue.add('wordpress', {
    type: 'wordpress',
    ...task
  });
}

export async function addGmailTask(task: any) {
  return await agentQueue.add('gmail', {
    type: 'gmail',
    ...task
  });
}
```

---

## Stap 6: API Server (om taken te ontvangen van Render)

### src/api/server.ts
```typescript
import express from 'express';
import { addWordPressTask, addGmailTask } from '../queue/producer';
import { createLogger } from '../utils/logger';

const app = express();
const logger = createLogger('APIServer');

app.use(express.json());

// Webhook authentication
function authenticateWebhook(req: express.Request, res: express.Response, next: express.NextFunction) {
  const secret = req.headers['x-webhook-secret'];

  if (secret !== process.env.RENDER_WEBHOOK_SECRET) {
    return res.status(401).json({ error: 'Unauthorized' });
  }

  next();
}

app.use(authenticateWebhook);

// WordPress tasks endpoint
app.post('/api/tasks/wordpress', async (req, res) => {
  try {
    const job = await addWordPressTask(req.body);
    res.json({ success: true, jobId: job.id });
  } catch (error: any) {
    logger.error('Failed to add WordPress task', error);
    res.status(500).json({ error: error.message });
  }
});

// Gmail tasks endpoint
app.post('/api/tasks/gmail', async (req, res) => {
  try {
    const job = await addGmailTask(req.body);
    res.json({ success: true, jobId: job.id });
  } catch (error: any) {
    logger.error('Failed to add Gmail task', error);
    res.status(500).json({ error: error.message });
  }
});

// Health check
app.get('/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

const PORT = process.env.PORT || 3000;

app.listen(PORT, () => {
  logger.info(`Agent API server listening on port ${PORT}`);
});

export default app;
```

---

## Stap 7: Utilities

### src/utils/logger.ts
```typescript
import winston from 'winston';

export function createLogger(service: string) {
  return winston.createLogger({
    level: 'info',
    format: winston.format.combine(
      winston.format.timestamp(),
      winston.format.json()
    ),
    defaultMeta: { service },
    transports: [
      new winston.transports.File({ filename: '/var/log/writgo-agents/error.log', level: 'error' }),
      new winston.transports.File({ filename: '/var/log/writgo-agents/combined.log' }),
      new winston.transports.Console({
        format: winston.format.simple()
      })
    ]
  });
}
```

### src/index.ts
```typescript
import worker from './queue/worker';
import server from './api/server';
import { createLogger } from './utils/logger';

const logger = createLogger('Main');

logger.info('🤖 Writgo Agent Platform starting...');
logger.info('✓ Queue worker started');
logger.info('✓ API server started');
logger.info('Ready to process agent tasks!');

// Graceful shutdown
process.on('SIGTERM', async () => {
  logger.info('SIGTERM received, shutting down gracefully');
  await worker.close();
  process.exit(0);
});
```

---

## Stap 8: Systemd Service (Auto-start)

```bash
# Maak systemd service
cat > /etc/systemd/system/writgo-agents.service << 'EOF'
[Unit]
Description=Writgo AI Agent Platform
After=network.target redis.service

[Service]
Type=simple
User=root
WorkingDirectory=/opt/writgo-agents
ExecStart=/usr/bin/node dist/index.js
Restart=always
RestartSec=10
StandardOutput=journal
StandardError=journal

[Install]
WantedBy=multi-user.target
EOF

# Enable en start service
systemctl daemon-reload
systemctl enable writgo-agents
systemctl start writgo-agents

# Check status
systemctl status writgo-agents
```

---

## Stap 9: Build & Run

```bash
cd /opt/writgo-agents

# Build TypeScript
npm run build  # Add "build": "tsc" to package.json scripts

# Start service
systemctl start writgo-agents

# View logs
journalctl -u writgo-agents -f
```

---

## Stap 10: Integratie met Render.com

### In je Next.js app (Render):

```typescript
// lib/vps-agent-client.ts
export async function sendTaskToVPS(taskType: 'wordpress' | 'gmail', taskData: any) {
  const response = await fetch(`http://your-vps-ip:3000/api/tasks/${taskType}`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'X-Webhook-Secret': process.env.VPS_WEBHOOK_SECRET!
    },
    body: JSON.stringify(taskData)
  });

  return await response.json();
}

// Gebruik in je API routes
export async function POST(request: NextRequest) {
  // Generate article with AI
  const article = await generateArticle();

  // Send to VPS agent to publish
  const result = await sendTaskToVPS('wordpress', {
    action: 'publish',
    site: 'https://yogastartgids.nl',
    credentials: {
      username: process.env.WP_USERNAME,
      password: process.env.WP_PASSWORD
    },
    data: article
  });

  return NextResponse.json(result);
}
```

---

## Use Cases

### 1. **Daily Content Automation**
```
06:00 → Gmail agent checks for customer emails
07:00 → WordPress agent publishes scheduled content
08:00 → Social media agent posts to Later.dev
12:00 → Analytics agent gathers data
18:00 → Report generation and email summary
```

### 2. **Multi-Site Management**
```
→ Check all 10 WordPress sites for updates
→ Take screenshots of each dashboard
→ Send summary email with status
→ Auto-update safe plugins
```

### 3. **Customer Support**
```
→ Read support emails
→ Categorize: urgent vs non-urgent
→ Auto-reply to simple questions using AI
→ Create tickets for complex issues
```

---

## Monitoring & Debugging

```bash
# View agent logs
tail -f /var/log/writgo-agents/combined.log

# Check Redis queue
redis-cli
> LLEN bull:agent-tasks:waiting
> LLEN bull:agent-tasks:active
> LLEN bull:agent-tasks:completed

# Check systemd service
systemctl status writgo-agents

# View specific agent logs
journalctl -u writgo-agents --since "1 hour ago"
```

---

## Kosten Overzicht

| Component | Kosten |
|-----------|--------|
| VPS (Hetzner CX21) | €5/maand |
| Claude API | ~€10-50/maand (afhankelijk van gebruik) |
| Gmail API | Gratis |
| Totaal | €15-55/maand |

**Vergelijk met Manus.im**: €50-200+/maand voor vergelijkbare functionaliteit

---

## Security Checklist

- [ ] Environment variables encrypted
- [ ] Webhook secret configured
- [ ] Firewall configured (alleen port 3000 en 22)
- [ ] SSH key-based authentication
- [ ] Regular security updates
- [ ] Logs monitored
- [ ] Rate limiting enabled
- [ ] Fail-safes voor verdachte activiteit

---

## Volgende Stappen

1. Setup VPS met bovenstaande code
2. Test WordPress agent met één site
3. Test Gmail agent met test account
4. Voeg meer agents toe (social media, analytics, etc.)
5. Schaal op naar meerdere sites
6. Monitor en optimaliseer

---

## Support & Resources

**Documentatie:**
- [Playwright Docs](https://playwright.dev)
- [BullMQ Queue](https://docs.bullmq.io)
- [Gmail API](https://developers.google.com/gmail/api)

**Vergelijkbare Tools:**
- [Skyvern-AI](https://github.com/Skyvern-AI/skyvern) - Open source browser automation
- [Browserbase](https://www.browserbase.com) - Remote browsers for AI agents
- [Playwright MCP](https://medium.com/@bluudit/playwright-mcp-comprehensive-guide-to-ai-powered-browser-automation-in-2025-712c9fd6cffa) - AI-powered browser automation

Dit platform geeft je volledige controle over je automation, privacy, en kosten!
