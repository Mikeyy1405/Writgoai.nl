# VPS Agent - Quick Start (15 minuten setup)

## Wat Je Krijgt

**Voor:** Je moet handmatig inloggen en publiceren
**Na:** Je zegt "publiceer dit artikel" → VPS doet alles automatisch

```
Je: "Publiceer artikel over yoga voor beginners"
  ↓
VPS Agent:
  1. ✓ Genereert artikel met AI (Claude)
  2. ✓ Logt in op je WordPress site
  3. ✓ Publiceert het artikel
  4. ✓ Stuurt je de URL

Klaar in 2-3 minuten, volledig automatisch!
```

---

## Stap 1: VPS Setup (5 minuten)

```bash
# SSH naar je VPS
ssh root@your-vps-ip

# Run één command - doet alles automatisch
curl -fsSL https://raw.githubusercontent.com/Mikeyy1405/Writgoai.nl/main/scripts/setup-vps-agent.sh | bash

# Of handmatig:
apt update && apt install -y nodejs npm redis-server squid

# Clone dit project op VPS
git clone https://github.com/Mikeyy1405/Writgoai.nl.git /opt/writgo-vps
cd /opt/writgo-vps/vps-agent

# Installeer dependencies
npm install

# Configureer
cp .env.example .env
nano .env  # Vul je credentials in (zie hieronder)
```

### .env configuratie:
```bash
# AI API
ANTHROPIC_API_KEY=sk-ant-xxx

# WordPress Sites (voeg meer toe indien nodig)
WP_SITE_1_URL=https://yogastartgids.nl
WP_SITE_1_USERNAME=admin
WP_SITE_1_PASSWORD=xxxx

# Security
VPS_API_SECRET=jouw-random-secret-hier

# Redis (default werkt meestal)
REDIS_URL=redis://localhost:6379
```

```bash
# Start de agent
npm run start

# Of als systemd service (auto-restart)
npm run install-service
systemctl start writgo-agent
```

---

## Stap 2: Render.com Configuratie (2 minuten)

Voeg environment variabele toe in Render dashboard:

```bash
VPS_AGENT_URL=http://your-vps-ip:3001
VPS_API_SECRET=jouw-random-secret-hier
```

---

## Stap 3: Gebruik (Direct!)

### Vanuit je Next.js app:

```typescript
// app/api/publish/route.ts
import { publishToWordPress } from '@/lib/vps-client';

export async function POST(request: Request) {
  const { topic, site } = await request.json();

  // Dat's it! VPS doet de rest
  const result = await publishToWordPress({
    topic: topic,
    site: site || 'yogastartgids.nl'
  });

  return Response.json(result);
}
```

### Vanuit je dashboard:

```typescript
// Een button click:
async function handlePublish() {
  const response = await fetch('/api/publish', {
    method: 'POST',
    body: JSON.stringify({
      topic: 'Yoga voor beginners - top 10 tips',
      site: 'yogastartgids.nl'
    })
  });

  const result = await response.json();
  // result.url = "https://yogastartgids.nl/yoga-voor-beginners-top-10-tips"
}
```

### Of via command line (voor testing):

```bash
curl -X POST http://your-vps-ip:3001/publish \
  -H "X-API-Secret: jouw-secret" \
  -H "Content-Type: application/json" \
  -d '{
    "topic": "Yoga voor beginners",
    "site": "yogastartgids.nl"
  }'
```

---

## Wat De VPS Agent Doet (automatisch)

```javascript
// Je stuurt:
{
  topic: "Yoga voor beginners - 10 tips",
  site: "yogastartgids.nl"
}

// VPS Agent:
Step 1: Generate artikel met Claude
  ↓ "Yoga voor Beginners: 10 Essentiële Tips om Te Starten"
  ↓ [2000 woorden SEO-geoptimaliseerd artikel]

Step 2: Open browser (headless)
  ↓ Playwright chromium browser

Step 3: Login op WordPress
  ↓ goto yogastartgids.nl/wp-admin
  ↓ fill username + password
  ↓ click login

Step 4: Maak nieuw artikel
  ↓ goto wp-admin/post-new.php
  ↓ fill title
  ↓ fill content
  ↓ add categories (AI suggests based on content)
  ↓ add tags (AI suggests)

Step 5: Publiceer
  ↓ click publish button
  ↓ wait for success

Step 6: Return URL
  → "https://yogastartgids.nl/yoga-voor-beginners-10-tips"
```

**Totaal: 2-3 minuten** (afhankelijk van artikel lengte)

---

## Advanced: Meer Opties

```typescript
// Met meer controle:
await publishToWordPress({
  topic: "Yoga voor beginners",
  site: "yogastartgids.nl",

  // Optioneel:
  instructions: "Maak het artikel humoristisch en gebruik emoji's",
  category: "Beginners",
  tags: ["yoga", "tips", "beginners"],
  featured_image: "auto", // AI genereert met DALL-E
  publish_immediately: true, // of false voor draft
  seo_optimize: true
});
```

---

## Multiple Sites

```typescript
// Publiceer op meerdere sites tegelijk
const sites = [
  'yogastartgids.nl',
  'fitness-blog.nl',
  'wellness-tips.nl'
];

for (const site of sites) {
  await publishToWordPress({
    topic: "Yoga voor beginners",
    site: site,
    // AI past content aan per site!
  });
}
```

---

## Monitoring

```bash
# Check logs op VPS
journalctl -u writgo-agent -f

# Of via web interface
curl http://your-vps-ip:3001/status

# Response:
{
  "status": "running",
  "queue": {
    "waiting": 2,
    "active": 1,
    "completed": 45,
    "failed": 0
  },
  "uptime": "2 days"
}
```

---

## Troubleshooting

### Agent niet bereikbaar
```bash
# Check of service draait
systemctl status writgo-agent

# Restart
systemctl restart writgo-agent
```

### Login faalt
```bash
# Test credentials handmatig
curl -X POST http://your-vps-ip:3001/test-login \
  -H "X-API-Secret: jouw-secret" \
  -d '{"site": "yogastartgids.nl"}'
```

### Artikel wordt niet gepubliceerd
```bash
# Check logs
tail -f /var/log/writgo-agent/error.log
```

---

## Kosten

| Component | Maandelijks |
|-----------|-------------|
| VPS (Hetzner CX21) | €5 |
| Claude API (100 artikelen) | ~€10-20 |
| **Totaal** | **€15-25** |

**VS** handmatig publiceren: 10 min per artikel × 100 = **16+ uur/maand**

---

## Next Level: Chat Interface

Wil je het nóg simpeler? Voeg chat toe:

```typescript
// In je dashboard
<Chat>
  You: "Publiceer artikel over yoga ademhalingsoefeningen"

  Agent: "✓ Artikel gegenereerd (1847 woorden)
          ✓ Ingelogd op yogastartgids.nl
          ✓ Gepubliceerd!

          URL: yogastartgids.nl/yoga-ademhalingsoefeningen

          Wil je het op social media delen?"

  You: "Ja!"

  Agent: "✓ Gepost op Later.dev
          ✓ LinkedIn post scheduled

          Klaar!"
</Chat>
```

Dit is mogelijk met:
- Stream API (real-time updates)
- WebSocket verbinding met VPS
- Claude conversational interface

---

## Veiligheid

✅ **API Secret** - Alleen jij kan commands sturen
✅ **Encrypted Credentials** - WordPress passwords encrypted opgeslagen
✅ **Rate Limiting** - Max 10 publish requests/min
✅ **Firewall** - Alleen jouw Render IP kan VPS bereiken
✅ **Logs** - Alle acties worden gelogd

---

## Ready to Start?

1. Setup VPS (5 min)
2. Configure Render.com (2 min)
3. Test publish (1 min)
4. **Done!** 🎉

Zal ik de volledige code voor je schrijven? Dan heb je binnen een uur een werkend systeem!
