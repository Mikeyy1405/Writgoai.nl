# WordPress REST API Troubleshooting Guide

## Snelle Diagnose

### Stap 1: Test je WordPress connectie

```bash
npm install  # Installeer tsx als het nog niet geïnstalleerd is
npm run test:wordpress -- --url https://jouwsite.nl --username admin --password "xxxx xxxx xxxx"
```

Of met environment variables:
```bash
WP_URL=https://jouwsite.nl \
WP_USERNAME=admin \
WP_PASSWORD="xxxx xxxx xxxx" \
npm run test:wordpress
```

Dit script test automatisch:
- ✅ Site bereikbaarheid
- ✅ REST API beschikbaarheid
- ✅ WordPress v2 API
- ✅ Posts endpoint
- ✅ Authenticatie (als credentials opgegeven)

---

## Meest Voorkomende Problemen & Oplossingen

### ❌ Probleem 1: "Site niet bereikbaar" / "Connection refused"

**Oorzaak:** Firewall of hosting provider blokkeert je server IP (vooral bij Render, Vercel, AWS)

**Oplossing:**

1. **Check je server IP:**
   ```bash
   curl https://api.ipify.org
   ```

2. **Test de WordPress site in een browser** - werkt de site normaal?

3. **Voor Nederlandse hosting** (TransIP, Antagonist, Byte, Vimexx):
   - Contact hosting support
   - Vraag om je server IP te whitelisten
   - Veel Nederlandse hosters blokkeren AWS/GCP/Azure IPs standaard

4. **Wordfence whitelist** (als je Wordfence gebruikt):
   - WordPress Admin → Wordfence → Firewall
   - Ga naar "Blocking" → "Advanced Blocking"
   - Voeg je server IP toe aan de whitelist

5. **Gebruik een proxy** (als whitelisting niet werkt):
   - Huur een kleine VPS in Nederland (TransIP ~€5/mnd, DigitalOcean AMS ~$4/mnd)
   - Configureer als HTTP proxy voor WordPress requests

---

### ❌ Probleem 2: "REST API niet gevonden" / 404 op /wp-json/

**Oorzaak:** REST API is uitgeschakeld of geblokkeerd

**Oplossing:**

1. **Test in browser:** Bezoek `https://jouwsite.nl/wp-json/`
   - Verwacht: JSON response met namespaces
   - Als 404: REST API is geblokkeerd

2. **Permalink instellingen:**
   - WordPress Admin → Settings → Permalinks
   - Kies "Post name" of een andere optie
   - Klik "Save Changes" (zelfs als niets gewijzigd)
   - Dit regenereert .htaccess regels

3. **Security plugins:**
   - iThemes Security: Settings → WordPress Tweaks → Filter Suspicious Query Strings in the URL → Uitschakelen of /wp-json/ toevoegen aan whitelist
   - All In One WP Security: Settings → Firewall → Basic Firewall Rules → Check REST API instellingen
   - Wordfence: Firewall → Firewall Options → Whitelist /wp-json/

4. **.htaccess check:**
   Open `.htaccess` in de WordPress root en controleer of er geen regels zijn die `/wp-json/` blokkeren:
   ```apache
   # NIET dit:
   RewriteRule ^wp-json/ - [F,L]

   # WEL dit (WordPress standaard):
   RewriteRule ^wp-json/ - [L]
   ```

---

### ❌ Probleem 3: "401 Unauthorized" / Authenticatie mislukt

**Oorzaak:** Ongeldige of incorrecte Application Password

**Oplossing:**

1. **Genereer een NIEUW Application Password:**
   - Log in op WordPress Admin
   - Ga naar **Gebruikers** → **Profiel**
   - Scroll naar **"Application Passwords"** (onderaan)
   - Vul een naam in: bijv. "Writgo API"
   - Klik **"Add New"**
   - Kopieer het password **EXACT** zoals getoond (inclusief spaties)

2. **Gebruik Application Password in Writgo:**
   - Ga naar Project Settings in Writgo
   - Vul in:
     - WordPress URL: `https://jouwsite.nl` (ZONDER /wp-json/)
     - Username: Je WordPress admin gebruikersnaam
     - App Password: Het zojuist gekopieerde password (mag spaties bevatten)

3. **NIET gebruiken:**
   - ❌ Je normale WordPress login wachtwoord
   - ❌ Een oud Application Password (maak altijd nieuw aan)

4. **Controleer gebruikersrechten:**
   - Gebruiker moet **Administrator** of **Editor** rol hebben
   - Minimaal vereiste capability: `edit_posts`

---

### ❌ Probleem 4: "403 Forbidden" / Toegang geweigerd

**Oorzaak:** Onvoldoende rechten of security plugin blokkeert

**Oplossing:**

1. **Check gebruikersrol:**
   - WordPress Admin → Gebruikers
   - Controleer of de gebruiker **Administrator** of **Editor** is

2. **Disable REST API authentication plugins tijdelijk:**
   - Ga naar Plugins → Installed Plugins
   - Deactiveer tijdelijk:
     - "Disable REST API"
     - "REST API Authentication"
     - Andere REST API gerelateerde plugins
   - Test opnieuw
   - Als het werkt: configureer de plugin correct i.p.v. deactiveren

3. **Security plugin whitelist:**
   - Wordfence: Firewall → Manage Firewall → Whitelist IP or allow /wp-json/
   - iThemes Security: Check "REST API" instellingen

4. **File permissions:**
   ```bash
   # WordPress files moeten leesbaar zijn voor webserver
   chmod 644 wp-config.php
   chmod 644 .htaccess
   ```

---

### ❌ Probleem 5: Timeout / Server reageert niet

**Oorzaak:** WordPress server is traag of overbelast

**Oplossing:**

1. **Check WordPress hosting performance:**
   - Test de site in browser - laadt deze snel?
   - Bekijk WordPress admin → Tools → Site Health

2. **Disable zware plugins tijdelijk:**
   - Page builders (Elementor, Divi)
   - Caching plugins met conflicts
   - Social media plugins die externe API's aanroepen

3. **Verhoog PHP memory limit:**
   In `wp-config.php`:
   ```php
   define('WP_MEMORY_LIMIT', '256M');
   ```

4. **Check server logs:**
   - cPanel: Metrics → Errors
   - Plesk: Logs → Error Log
   - Zoek naar PHP errors of timeouts

---

## Test Matrix

| Test | Verwacht Resultaat | Betekent wanneer het faalt |
|------|-------------------|----------------------------|
| Site HEAD | 200, 301, 302 | Site onbereikbaar / Firewall block |
| /wp-json/ | 200 + JSON | REST API uitgeschakeld / geblokkeerd |
| /wp-json/wp/v2/ | 200 + JSON | WordPress v2 API niet beschikbaar |
| /wp-json/wp/v2/posts | 200 + Array | Posts endpoint geblokkeerd |
| /wp-json/wp/v2/users/me | 200 + User object | Authenticatie faalt |

---

## Nederlandse Hosting Providers - Bekende Issues

### Antagonist / HostingOnDemand
- **Issue:** ModSecurity blokkeert cloud IPs (AWS, GCP, Azure)
- **Oplossing:** Contact support voor IP whitelist of gebruik Nederlandse VPS proxy

### TransIP
- **Issue:** Rate limiting op cloud IPs, bot detection
- **Oplossing:** IP whitelist aanvragen, of TransIP VPS als proxy gebruiken

### Byte
- **Issue:** Sucuri/Wordfence vaak geïnstalleerd, IP reputation filtering
- **Oplossing:** Wordfence whitelist configureren

### Vimexx
- **Issue:** Cloudflare protection, challenge pages
- **Oplossing:** Cloudflare Firewall Rules aanpassen, IP whitelisten

### Hostnet
- **Issue:** Custom WAF rules, geographic restrictions
- **Oplossing:** Contact support voor whitelist

---

## WAF/Firewall Detectie

Als je één van deze headers ziet in de response, zit er een firewall tussen:

```
cf-ray: xxxxx                    → Cloudflare
x-sucuri-id: xxxxx              → Sucuri Firewall
x-wordfence-blocked: 1          → Wordfence
x-mod-security: block           → ModSecurity
```

**Oplossing:**
1. Identificeer welke firewall het is
2. Voeg je server IP toe aan whitelist
3. Of gebruik realistischere User-Agent headers (Writgo doet dit al automatisch)

---

## Debug Logging

Als je meer detail wil zien, check de server logs:

### Render.com
```bash
# In Render Dashboard
Services → [Your Service] → Logs
```

Filter op: `WP-DIAGNOSE` om diagnostics te zien

### Supabase Edge Functions
```bash
supabase functions logs
```

---

## Hulp Nodig?

1. **Run diagnostics eerst:**
   ```bash
   npm run test:wordpress -- --url https://jouwsite.nl --username admin --password "xxxx"
   ```

2. **Kopieer de output**

3. **Check deze punten:**
   - Wat is je hosting provider?
   - Waar draait Writgo? (Render, Vercel, lokaal?)
   - Wat is het server IP? (`curl https://api.ipify.org`)
   - Welke security plugins gebruik je?

4. **Contact support** met bovenstaande info

---

## Quick Checklist

- [ ] WordPress URL klopt (zonder /wp-json/)
- [ ] WordPress site werkt in browser
- [ ] /wp-json/ geeft JSON response in browser
- [ ] Application Password gegenereerd (niet normaal password)
- [ ] Gebruiker is Administrator of Editor
- [ ] Security plugins configureren REST API niet uit te schakelen
- [ ] Server IP is niet geblokkeerd door hosting firewall
- [ ] Permalinks zijn opgeslagen
- [ ] .htaccess blokkeert /wp-json/ niet

---

## Advanced: Manual Testing met cURL

```bash
# Test 1: Basic connectivity
curl -I https://jouwsite.nl

# Test 2: REST API discovery
curl https://jouwsite.nl/wp-json/

# Test 3: WordPress v2 API
curl https://jouwsite.nl/wp-json/wp/v2/

# Test 4: Authenticated request
curl -H "Authorization: Basic $(echo -n 'username:password' | base64)" \
     https://jouwsite.nl/wp-json/wp/v2/users/me
```

Verwacht:
- Test 1: `200 OK` of `301/302` redirect
- Test 2: JSON met `namespaces` array
- Test 3: JSON met `routes` object
- Test 4: JSON met user data (naam, email, roles)
