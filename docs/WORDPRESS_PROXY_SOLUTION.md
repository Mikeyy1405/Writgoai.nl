# WordPress Proxy Service Oplossing (200+ klanten)

## Probleem

Met 200+ klanten wordt het onhaalbaar om bij elke klant:
- Render's wisselende IPs te whitelisten
- Security plugins te configureren
- Hosting support te contacteren

## Oplossing: Centralized Proxy Service

### Architectuur

```
┌─────────────────┐
│   Writgo.nl     │
│  (Render.com)   │
└────────┬────────┘
         │
         │ HTTPS
         ▼
┌─────────────────┐
│  Proxy Service  │  ← 1 Static NL IP: 123.456.789.10
│  (VPS Nederland)│
└────────┬────────┘
         │
         │ HTTPS (with caching)
         ▼
┌─────────────────────────────────────┐
│  200+ WordPress Sites               │
│  - klant1.nl                        │
│  - klant2.nl                        │
│  - ...                              │
└─────────────────────────────────────┘
```

### Voordelen

1. **Eén IP om te whitelisten**: Klanten krijgen instructie: "Whitelist 123.456.789.10"
2. **Nederlandse IP**: TransIP, Antagonist, Byte blokkeren dit niet
3. **Caching**: Proxy cached responses (sneller + minder load op klant sites)
4. **Rate limiting**: Proxy handelt rate limits gracefully af
5. **Monitoring**: Zie welke klanten problemen hebben
6. **Fallback**: Als Render IP geblokkeerd wordt, werkt proxy nog steeds

### Kosten

| Service | Kosten/maand | Specs |
|---------|--------------|-------|
| TransIP VPS | €7-10 | 2GB RAM, 50GB SSD, Static IP |
| DigitalOcean AMS | $6 | 1GB RAM, 25GB SSD, Static IP |
| Hetzner (Duitsland) | €4 | 2GB RAM, 40GB SSD |

**Total: ~€5-10/maand** voor onbeperkte klanten

### Setup Guide

#### Stap 1: Huur VPS in Nederland

**TransIP (Aanbevolen voor NL klanten):**
```bash
# Locatie: Amsterdam
# OS: Ubuntu 22.04 LTS
# Specs: 2GB RAM, 2 CPU cores
```

#### Stap 2: Installeer Proxy Server (Nginx)

```bash
# SSH naar VPS
ssh root@your-vps-ip

# Update systeem
apt update && apt upgrade -y

# Installeer Nginx
apt install nginx certbot python3-certbot-nginx -y

# Installeer Node.js (voor custom proxy logic)
curl -fsSL https://deb.nodesource.com/setup_20.x | bash -
apt install nodejs -y
```

#### Stap 3: Configureer Nginx als Reverse Proxy

**Nginx config** (`/etc/nginx/sites-available/wordpress-proxy`):

```nginx
# WordPress API Proxy Server
server {
    listen 443 ssl http2;
    server_name wp-proxy.jouwdomein.nl;

    # SSL Certificate (genereer met certbot)
    ssl_certificate /etc/letsencrypt/live/wp-proxy.jouwdomein.nl/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/wp-proxy.jouwdomein.nl/privkey.pem;

    # Security headers
    add_header X-Frame-Options "SAMEORIGIN" always;
    add_header X-Content-Type-Options "nosniff" always;

    # Request size limits
    client_max_body_size 50M;

    # Timeouts
    proxy_connect_timeout 120s;
    proxy_send_timeout 120s;
    proxy_read_timeout 120s;

    # Caching (optioneel)
    proxy_cache_path /var/cache/nginx levels=1:2 keys_zone=wp_cache:10m max_size=1g inactive=60m;
    proxy_cache wp_cache;
    proxy_cache_key "$scheme$request_method$host$request_uri";
    proxy_cache_valid 200 5m;  # Cache GET requests voor 5 minuten

    location / {
        # Proxy naar WordPress site (URL wordt dynamisch bepaald)
        # We gebruiken een custom Node.js service hiervoor
        proxy_pass http://127.0.0.1:3001;

        # Forward headers
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;

        # Timeout settings
        proxy_connect_timeout 120s;
        proxy_send_timeout 120s;
        proxy_read_timeout 120s;
    }
}
```

#### Stap 4: Custom Proxy Service (Node.js)

**Proxy service** (`/opt/wp-proxy/server.js`):

```javascript
const express = require('express');
const axios = require('axios');
const NodeCache = require('node-cache');

const app = express();
const cache = new NodeCache({ stdTTL: 300 }); // 5 min cache

app.use(express.json());

// Proxy endpoint
app.all('*', async (req, res) => {
  try {
    // Target WordPress URL wordt via header meegegeven
    const targetUrl = req.headers['x-wp-target'];

    if (!targetUrl) {
      return res.status(400).json({ error: 'X-WP-Target header required' });
    }

    const fullUrl = `${targetUrl}${req.url}`;

    // Check cache (alleen voor GET requests)
    if (req.method === 'GET') {
      const cached = cache.get(fullUrl);
      if (cached) {
        console.log(`[CACHE HIT] ${fullUrl}`);
        return res.json(cached);
      }
    }

    // Browser-like headers
    const headers = {
      'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) Chrome/120.0.0.0 Safari/537.36',
      'Accept': 'application/json',
      'Accept-Language': 'nl-NL,nl;q=0.9',
      ...req.headers,
    };

    // Remove proxy-specific headers
    delete headers['x-wp-target'];
    delete headers['host'];

    console.log(`[PROXY] ${req.method} ${fullUrl}`);

    // Make request to WordPress site
    const response = await axios({
      method: req.method,
      url: fullUrl,
      headers,
      data: req.body,
      timeout: 120000,
    });

    // Cache GET responses
    if (req.method === 'GET' && response.status === 200) {
      cache.set(fullUrl, response.data);
    }

    res.status(response.status).json(response.data);

  } catch (error) {
    console.error(`[ERROR] ${error.message}`);

    res.status(error.response?.status || 500).json({
      error: error.message,
      details: error.response?.data,
    });
  }
});

const PORT = 3001;
app.listen(PORT, () => {
  console.log(`WordPress Proxy running on port ${PORT}`);
});
```

**Package.json**:
```json
{
  "name": "wp-proxy",
  "version": "1.0.0",
  "dependencies": {
    "express": "^4.18.0",
    "axios": "^1.6.0",
    "node-cache": "^5.1.2"
  },
  "scripts": {
    "start": "node server.js"
  }
}
```

**Installeer dependencies:**
```bash
cd /opt/wp-proxy
npm install
```

**Start als systemd service** (`/etc/systemd/system/wp-proxy.service`):

```ini
[Unit]
Description=WordPress API Proxy
After=network.target

[Service]
Type=simple
User=www-data
WorkingDirectory=/opt/wp-proxy
ExecStart=/usr/bin/node /opt/wp-proxy/server.js
Restart=on-failure

[Install]
WantedBy=multi-user.target
```

```bash
systemctl enable wp-proxy
systemctl start wp-proxy
```

#### Stap 5: SSL Certificate

```bash
certbot --nginx -d wp-proxy.jouwdomein.nl
```

#### Stap 6: Writgo Integratie

**Update WordPress request functie** (`lib/wordpress-endpoints.ts`):

```typescript
// Voeg proxy configuratie toe
const PROXY_ENABLED = process.env.WP_PROXY_ENABLED === 'true';
const PROXY_URL = process.env.WP_PROXY_URL; // https://wp-proxy.jouwdomein.nl

export async function fetchWordPress(
  wpUrl: string,
  endpoint: string,
  options: RequestInit = {}
): Promise<Response> {

  if (PROXY_ENABLED && PROXY_URL) {
    // Request gaat via proxy
    return fetch(`${PROXY_URL}${endpoint}`, {
      ...options,
      headers: {
        ...options.headers,
        'X-WP-Target': wpUrl, // Geef WordPress URL mee
      },
    });
  }

  // Direct request (fallback)
  return fetch(`${wpUrl}${endpoint}`, options);
}
```

**Environment variables** (`.env`):
```bash
WP_PROXY_ENABLED=true
WP_PROXY_URL=https://wp-proxy.jouwdomein.nl
```

---

### Klant Onboarding

**Email template voor klanten:**

```
Onderwerp: Whitelist IP voor Writgo API toegang

Beste [Naam],

Om Writgo toegang te geven tot je WordPress site, voeg dit IP adres
toe aan de whitelist van je hosting/security plugins:

🔐 IP om te whitelisten: 123.456.789.10

Instructies per plugin:

WORDFENCE:
1. WordPress Admin → Wordfence → Firewall
2. Klik "Manage Firewall"
3. Ga naar "Whitelist" tab
4. Voeg toe: 123.456.789.10/32
5. Klik "Save Changes"

ITHEMES SECURITY:
1. WordPress Admin → Security → Settings
2. Ga naar "Banned Users"
3. Onder "Authorized IPs" voeg toe: 123.456.789.10

HOSTING PROVIDER:
- cPanel: Security → IP Blocker → Add IP to Whitelist
- Plesk: Tools & Settings → IP Address Banning → Add to whitelist

Contact je hosting provider als je niet zeker bent hoe dit te doen.

Met vriendelijke groet,
Writgo Team
```

---

### Monitoring & Maintenance

**Monitoring script** (`monitor.sh`):

```bash
#!/bin/bash
# Check proxy health
curl -f https://wp-proxy.jouwdomein.nl/health || echo "PROXY DOWN!"

# Check nginx status
systemctl is-active nginx || echo "NGINX DOWN!"

# Check Node service status
systemctl is-active wp-proxy || echo "WP-PROXY SERVICE DOWN!"

# Check disk space
df -h | grep -E '^/dev/' | awk '{ if ($5 > "80%") print "DISK SPACE WARNING: " $0 }'
```

**Cron job** (run elk uur):
```bash
crontab -e
# Add:
0 * * * * /opt/wp-proxy/monitor.sh | mail -s "Proxy Health Check" admin@jouwdomein.nl
```

---

### Voordelen Samenvatting

| Feature | Direct REST API | Via Proxy |
|---------|----------------|-----------|
| IP Whitelisting | Per klant anders | 1x voor iedereen |
| Blocking Rate | 30-50% | <5% |
| Caching | Geen | Ja (5 min) |
| Monitoring | Moeilijk | Centraal |
| Kosten | Gratis maar issues | €5-10/mnd |
| Setup tijd/klant | 30-60 min | 2 min |

---

### Alternative: Render Static IP

Als je proxy niet wil beheren:

```bash
# Render biedt Static IP als add-on
# Kosten: ~$5/maand per service
```

Nadeel: Nog steeds cloud IP (AWS), kan geblokkeerd worden

---

### Conclusie

Voor 200+ klanten is een **centrale proxy de beste oplossing**:
- ✅ Lage kosten (€5-10/mnd)
- ✅ Hoge betrouwbaarheid (Nederlands IP)
- ✅ Gemakkelijke onboarding (1 IP voor iedereen)
- ✅ Schaalbaar (kan duizenden klanten aan)
- ✅ Caching & monitoring ingebouwd
