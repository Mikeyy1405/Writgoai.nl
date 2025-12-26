# Cloudflare Worker Setup voor WordPress REST API

Deze gids legt uit hoe je de Cloudflare Worker configureert om WordPress API calls te proxyen. Dit lost IP blocking issues op die veel Nederlandse hosting providers hebben met cloud providers.

## Waarom een Cloudflare Worker?

Veel hosting providers (vooral in Nederland) blokkeren IP ranges van:
- Render.com
- Vercel
- AWS
- Google Cloud
- Andere cloud providers

Door je WordPress API calls via een Cloudflare Worker te routeren, gebruik je Cloudflare's IP ranges die normaal niet geblokkeerd worden.

## Voordelen

✅ Omzeilt IP blocking van hosting providers
✅ Betere uptime en connectiviteit
✅ Gratis Cloudflare plan is voldoende (100.000 requests/dag)
✅ Automatische CORS headers
✅ Extra beveiligingslaag
✅ Werkt met zowel WritGo plugin als Application Password auth

## Setup Instructies

### Stap 1: Deploy de Cloudflare Worker

1. Ga naar [Cloudflare Workers Dashboard](https://dash.cloudflare.com/?to=/:account/workers)
2. Klik op **Create Worker**
3. Geef de worker een naam (bijv: `wordpress-proxy`)
4. Vervang de default code met de code uit `cloudflare-worker/wordpress-proxy.js`
5. Klik op **Deploy**

### Stap 2: Kopieer de Worker URL

Na deployment krijg je een URL zoals:
```
https://wordpress-proxy.jouw-account.workers.dev
```

Kopieer deze URL.

### Stap 3: Configureer de Environment Variable

Voeg de worker URL toe aan je `.env` bestand:

```env
CLOUDFLARE_WORKER_URL=https://wordpress-proxy.jouw-account.workers.dev
```

### Stap 4: Herstart je applicatie

Herstart je Next.js applicatie om de nieuwe environment variable te laden:

```bash
npm run dev
# of in productie
pm2 restart writgo
```

## Hoe het werkt

Zonder Cloudflare Worker:
```
Writgo → https://klantsite.nl/wp-json/wp/v2/posts
          ❌ Geblokkeerd door hosting provider
```

Met Cloudflare Worker:
```
Writgo → https://worker.workers.dev?target=https://klantsite.nl/wp-json/...
         ↓
Cloudflare → https://klantsite.nl/wp-json/wp/v2/posts
             ✅ Succesvol (Cloudflare IP wordt niet geblokkeerd)
```

## WordPress Authenticatie

De Cloudflare Worker werkt met beide authenticatie methodes:

### Optie 1: WritGo Plugin (Aanbevolen)

De WritGo plugin gebruikt API key authenticatie:

```typescript
headers: {
  'X-Writgo-API-Key': 'jouw-api-key'
}
```

### Optie 2: Application Password (WordPress Core)

WordPress Application Passwords gebruiken Basic authentication:

```typescript
headers: {
  'Authorization': 'Basic ' + base64(username:password)
}
```

## Code Voorbeeld

De Cloudflare Worker wordt automatisch gebruikt als `CLOUDFLARE_WORKER_URL` is geconfigureerd:

```typescript
import { getWordPressEndpoint } from '@/lib/wordpress-endpoints';

// Deze functie gebruikt automatisch de Cloudflare Worker als geconfigureerd
const endpoint = getWordPressEndpoint(
  'https://klantsite.nl',
  '/wp-json/wp/v2/posts'
);

// endpoint = https://worker.workers.dev?target=https://klantsite.nl/wp-json/wp/v2/posts

const response = await fetch(endpoint, {
  method: 'POST',
  headers: {
    'Authorization': 'Basic ' + btoa(`${username}:${appPassword}`),
    'Content-Type': 'application/json',
  },
  body: JSON.stringify({
    title: 'Mijn Post',
    content: 'Content hier...',
    status: 'publish'
  })
});
```

## Application Password Aanmaken

Als je WordPress Application Passwords wilt gebruiken in plaats van de WritGo plugin:

1. Log in op je WordPress site
2. Ga naar **Gebruikers → Profiel**
3. Scroll naar **Application Passwords**
4. Voer een naam in (bijv: "WritGo")
5. Klik op **Add New Application Password**
6. **Kopieer het wachtwoord** (je kunt het maar 1x zien!)
7. Gebruik dit wachtwoord met je WordPress gebruikersnaam

Voorbeeld:
```env
WP_USERNAME=admin
WP_APP_PASSWORD=xxxx xxxx xxxx xxxx xxxx xxxx
```

Het wachtwoord bevat spaties - deze worden automatisch verwijderd door de `buildAuthHeader` functie.

## Worker Beveiliging

De worker heeft ingebouwde security features:

- ✅ Alleen WordPress endpoints (`/wp-json/` of `/wp-admin/`) toegestaan
- ✅ CORS headers voor cross-origin requests
- ✅ URL validatie
- ✅ Error handling

## Monitoring

Je kunt de worker requests monitoren in het Cloudflare Dashboard:

1. Ga naar je Worker
2. Klik op **Metrics**
3. Bekijk:
   - Request volume
   - Success rate
   - Errors
   - CPU time

## Kosten

Cloudflare Workers Free plan:
- **100.000 requests per dag** (gratis)
- **10ms CPU time per request**
- Meer dan genoeg voor de meeste websites

Voor grotere volumes:
- Workers Paid: $5/maand voor 10 miljoen requests

## Troubleshooting

### Worker geeft 400 error

Controleer of de `target` parameter correct is:
```
https://worker.workers.dev?target=https://klantsite.nl/wp-json/wp/v2/posts
```

### Worker geeft 403 error

Controleer of de endpoint een WordPress endpoint is:
- ✅ `/wp-json/wp/v2/posts`
- ✅ `/wp-json/writgo/v1/posts`
- ❌ `/some/other/path`

### Authentication faalt

De worker stuurt alle headers door, inclusief `Authorization`. Controleer:
1. Application Password is correct
2. Username is correct
3. Basic auth header is correct geformatteerd

### CORS errors

De worker voegt automatisch CORS headers toe. Als je nog steeds CORS errors ziet:
1. Check of de worker correct deployed is
2. Check of de worker URL in `.env` correct is
3. Check browser console voor details

## Custom Domain (Optioneel)

Je kunt een custom domain gebruiken voor je worker:

1. Ga naar je Worker
2. Klik op **Triggers** tab
3. Klik op **Add Custom Domain**
4. Voer je domain in (bijv: `wp-api.jouwdomein.nl`)
5. Cloudflare configureert automatisch DNS

Dan gebruik je:
```env
CLOUDFLARE_WORKER_URL=https://wp-api.jouwdomein.nl
```

## Support

Voor vragen of problemen:
- Check de Cloudflare Worker logs in het dashboard
- Check de Next.js logs voor endpoint routing
- Open een issue op GitHub

## Advanced: Worker Routes

Als je een custom domain hebt, kun je ook Worker Routes gebruiken:

1. Ga naar **Websites** in Cloudflare
2. Selecteer je domain
3. Ga naar **Workers Routes**
4. Add route: `api.jouwdomein.nl/wp-proxy/*`

Dit geeft nog meer controle over routing en caching.
