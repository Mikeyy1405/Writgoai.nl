# Writgo VPS Agent - Automated WordPress Publishing

## Wat Doet Dit?

**Voor:** Handmatig inloggen, artikel schrijven, publiceren (15+ minuten)

**Na:** Eén API call → VPS doet alles automatisch (2-3 minuten)

```
fetch('/api/vps/publish', {
  method: 'POST',
  body: JSON.stringify({
    topic: 'Yoga voor beginners',
    site: 'yogastartgids.nl'
  })
});

// VPS Agent:
// ✓ Genereert artikel met AI
// ✓ Logt in op WordPress
// ✓ Publiceert artikel
// → https://yogastartgids.nl/yoga-voor-beginners
```

---

## Quick Start (15 minuten)

### 1. VPS Setup

```bash
# SSH naar je VPS
ssh root@your-vps-ip

# Installeer dependencies
apt update && apt install -y nodejs npm redis-server git

# Clone project
git clone https://github.com/Mikeyy1405/Writgoai.nl.git /opt/writgo-vps
cd /opt/writgo-vps/vps-agent

# Install packages
npm install

# Install Playwright browsers
npx playwright install chromium --with-deps

# Configure
cp .env.example .env
nano .env  # Fill in your credentials

# Build
npm run build

# Start
npm start

# Or install as service (auto-start on boot)
npm run install-service
systemctl start writgo-agent
systemctl status writgo-agent
```

### 2. Configure .env

```bash
# AI
ANTHROPIC_API_KEY=sk-ant-your-key-here

# WordPress Site(s)
WP_SITE_1_URL=https://yogastartgids.nl
WP_SITE_1_USERNAME=admin
WP_SITE_1_PASSWORD=your-app-password

# API Security (generate random secret)
VPS_API_SECRET=$(openssl rand -base64 32)

# Redis (default usually works)
REDIS_URL=redis://localhost:6379
```

### 3. Render.com Environment Variables

Add in Render dashboard:

```
VPS_AGENT_URL=http://your-vps-ip:3001
VPS_API_SECRET=your-secret-from-vps-.env
```

### 4. Test!

```bash
# From your local machine:
curl -X POST http://your-vps-ip:3001/publish \
  -H "X-API-Secret: your-secret" \
  -H "Content-Type: application/json" \
  -d '{
    "topic": "Test artikel over yoga",
    "site": "yogastartgids.nl"
  }'

# Response:
{
  "success": true,
  "message": "Article queued for publishing",
  "jobId": "1",
  "estimatedTime": "2-3 minutes"
}
```

---

## Gebruik in Next.js App

### Simpel:

```typescript
import { publishToWordPress } from '@/lib/vps-client';

const result = await publishToWordPress({
  topic: 'Yoga voor beginners - 10 tips',
  site: 'yogastartgids.nl'
});

console.log(result.url);
// → https://yogastartgids.nl/yoga-voor-beginners-10-tips
```

### Met opties:

```typescript
const result = await publishToWordPress({
  topic: 'Yoga ademhalingsoefeningen',
  site: 'yogastartgids.nl',
  instructions: 'Maak het praktisch met stap-voor-stap uitleg',
  category: 'Ademhaling',
  tags: ['yoga', 'ademhaling', 'mindfulness'],
  publishImmediately: true
});
```

### Via API endpoint:

```typescript
// In je dashboard/component:
async function handlePublish() {
  const response = await fetch('/api/vps/publish', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      topic: 'Yoga voor beginners',
      project_id: projectId // or site: 'yogastartgids.nl'
    })
  });

  const result = await response.json();
  console.log(result.message);
}
```

---

## Monitoring

```bash
# Check logs
journalctl -u writgo-agent -f

# Check queue status
curl -H "X-API-Secret: your-secret" http://your-vps-ip:3001/status

# Redis queue (manual)
redis-cli
> LLEN bull:wordpress-publish:waiting
> LLEN bull:wordpress-publish:active
```

---

## Troubleshooting

### Service won't start

```bash
# Check logs
journalctl -u writgo-agent -xe

# Common issues:
# - Redis not running: systemctl start redis-server
# - Missing dependencies: npm install
# - TypeScript not compiled: npm run build
```

### Login fails

```bash
# Test credentials
curl -X POST http://your-vps-ip:3001/test-login \
  -H "X-API-Secret: your-secret" \
  -H "Content-Type: application/json" \
  -d '{"site": "yogastartgids.nl"}'

# Check .env file
cat /opt/writgo-vps/vps-agent/.env | grep WP_SITE
```

### Article not publishing

```bash
# Check error logs
tail -f /var/log/syslog | grep writgo

# Check if Playwright is installed
npx playwright --version

# Reinstall browsers
npx playwright install chromium --with-deps
```

---

## Kosten

| Item | Prijs/maand |
|------|-------------|
| VPS (Hetzner CX21) | €5 |
| Claude API (100 artikelen) | ~€15 |
| **Totaal** | **~€20** |

**VS** Handmatig: 100 artikelen × 15 min = 25 uur werk!

---

## Security

✅ API Secret authentication
✅ Only your Render IP can access (configure firewall)
✅ WordPress credentials encrypted at rest
✅ Rate limiting (max 10 articles/min)
✅ All actions logged

### Firewall Setup (Recommended):

```bash
# Only allow your Render IP and SSH
ufw allow 22/tcp
ufw allow from YOUR_RENDER_IP to any port 3001
ufw enable
```

---

## Wat Het Kan Doen

- ✅ Generate artikel met Claude (1500+ woorden, SEO-optimized)
- ✅ Automatisch inloggen op WordPress (Gutenberg + Classic editor support)
- ✅ Publiceren of save as draft
- ✅ Categorieën en tags toevoegen
- ✅ Meerdere WordPress sites ondersteunen
- ✅ Queue systeem (meerdere artikelen tegelijk)
- ✅ Retry logic bij failures
- ✅ Comprehensive logging

---

## Volgende Stappen

**Klaar om te gebruiken!**

Maar je kunt het uitbreiden met:
- Featured images (AI-generated met DALL-E)
- Social media posting (Later.dev, LinkedIn)
- Email notifications bij success/failure
- Dashboard met queue statistics
- Multi-site bulk publishing
- Content calendar integration

Zie `VPS_AGENT_SETUP.md` voor meer advanced features!
