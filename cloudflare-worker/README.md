# Cloudflare Worker - WordPress REST API Proxy

Deze Cloudflare Worker fungeert als proxy voor WordPress REST API calls.

## Quick Deploy

1. Ga naar [workers.cloudflare.com](https://workers.cloudflare.com)
2. Log in / Sign up (gratis)
3. Klik **Create a Worker**
4. Geef een naam: `wordpress-proxy` (of een andere naam)
5. Kopieer de code uit `wordpress-proxy.js`
6. Plak in de Cloudflare Worker editor
7. Klik **Deploy**
8. Kopieer je worker URL (bijv: `https://wordpress-proxy.jouw-account.workers.dev`)

## Configureer in WritGo

Voeg de worker URL toe aan je `.env`:

```env
CLOUDFLARE_WORKER_URL=https://wordpress-proxy.jouw-account.workers.dev
```

Herstart de applicatie:
```bash
npm run dev
```

## Gebruik

De worker wordt automatisch gebruikt door alle WordPress API calls als `CLOUDFLARE_WORKER_URL` geconfigureerd is.

### Voorbeeld Request

**Direct naar WordPress (oude manier):**
```
https://klantsite.nl/wp-json/wp/v2/posts
```

**Via Cloudflare Worker (nieuwe manier):**
```
https://wordpress-proxy.jouw-account.workers.dev?target=https://klantsite.nl/wp-json/wp/v2/posts
```

## Features

- ✅ **CORS Support** - Automatische CORS headers
- ✅ **Security** - Alleen WordPress endpoints toegestaan
- ✅ **Fast** - Cloudflare's edge network
- ✅ **Reliable** - Omzeilt IP blocking
- ✅ **Free** - 100.000 requests/dag gratis

## Testing

Test de worker met curl:

```bash
curl "https://jouw-worker.workers.dev?target=https://klantsite.nl/wp-json/wp/v2/posts"
```

Met authenticatie:
```bash
curl "https://jouw-worker.workers.dev?target=https://klantsite.nl/wp-json/wp/v2/posts" \
  -H "Authorization: Basic $(echo -n 'username:password' | base64)"
```

## Deployment via CLI (Advanced)

1. Installeer Wrangler:
```bash
npm install -g wrangler
```

2. Login:
```bash
wrangler login
```

3. Deploy:
```bash
wrangler deploy wordpress-proxy.js
```

## Monitoring

Bekijk metrics in je Cloudflare dashboard:
- Request volume
- Error rate
- Response times
- CPU usage

## Limits (Free Plan)

- **100.000 requests/dag**
- **10ms CPU time per request**
- Onbeperkte bandwidth

Voor grotere volumes → $5/maand voor 10 miljoen requests.

## Troubleshooting

**400 Error - Missing target**
```
✗ https://worker.workers.dev
✓ https://worker.workers.dev?target=https://example.com/wp-json/...
```

**403 Error - Not a WordPress endpoint**
```
✗ ?target=https://example.com/some/path
✓ ?target=https://example.com/wp-json/wp/v2/posts
```

## Meer Info

Zie [CLOUDFLARE_WORKER_SETUP.md](../CLOUDFLARE_WORKER_SETUP.md) voor gedetailleerde setup instructies.
