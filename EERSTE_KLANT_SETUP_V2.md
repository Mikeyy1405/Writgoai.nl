# 🚀 Writgo AI - Setup Guide voor Eerste Klant (UPDATED)

**Datum**: 11 december 2025  
**Status**: Ready for Production  
**Repository**: https://github.com/Mikeyy1405/Writgoai.nl  
**Laatste Update**: Invisible Project Layer implementatie

---

## 📋 Executive Summary

De Writgo AI applicatie is **volledig gebouwd en operationeel**. Alle features zijn geïmplementeerd:
- ✅ Content generatie met AIML API (400+ AI modellen)
- ✅ Social media posting via GetLate.dev
- ✅ WordPress integratie met Gutenberg blocks
- ✅ Credit systeem en facturatie
- ✅ Admin dashboard en client portal
- ✅ **NIEUW:** Vereenvoudigde architectuur met invisible project layer

**Recente Updates:**
1. ✅ Invisible Project Layer geïmplementeerd
2. ✅ Auto-create default project bij klant aanmaken
3. ✅ Admin navigatie vereenvoudigd (Projecten verwijderd)
4. ✅ WordPress URL direct zichtbaar per klant
5. ✅ Project helper functies voor developers

**Status van de 3 kritieke flows:**
1. ✅ **Content Generatie**: Volledig operationeel via AIML API
2. ✅ **Social Media Posting**: Implementatie compleet, API key nodig
3. ✅ **WordPress Integratie**: Volledig operationeel, per-client configuratie

## 🆕 Wat is Nieuw? (December 2025)

### Invisible Project Layer Architectuur

**Probleem Opgelost:**
- ❌ Oude flow: Admin moest handmatig project aanmaken per klant
- ❌ Verwarrend: "Wat is een project?" voor lokale ondernemers
- ❌ Dubbele data entry: client info + project info

**Nieuwe Flow:**
- ✅ Automatisch: Project wordt aangemaakt bij klant creatie
- ✅ Verborgen: Klanten zien geen "projecten" in UI
- ✅ Simpel: 1 Klant = 1 Bedrijf = 1 Default Project = Meerdere Platforms

**Voordelen:**
- ⚡ Sneller: Klant direct klaar voor content
- 🎯 Duidelijker: Geen project complexity voor admins
- 🚀 Aligned met businessmodel: Lokale dienstverleners hebben 1 website

Zie `IMPLEMENTATION_SUMMARY.md` voor volledige details.

---

## 🔧 Vereiste Setup (Voor Productie)

### 1. Environment Variables Configureren

Kopieer `.env.example` naar `.env` en vul de volgende **kritieke** variabelen in:

```bash
cd /home/ubuntu/github_repos/writgoai_nl/nextjs_space
cp .env.example .env
nano .env
```

#### ⚠️ KRITIEKE VARIABELEN (Minimaal vereist)

```env
# Database - Supabase (al ingesteld op Render?)
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key

# NextAuth
NEXTAUTH_SECRET=your-super-secret-key-minimum-32-characters
NEXTAUTH_URL=https://writgo.nl  # Of je production URL

# AIML API - Voor content generatie (ESSENTIEEL)
AIML_API_KEY=your-aiml-api-key
AIML_API_URL=https://api.aimlapi.com/v1
AIML_API_BASE_URL=https://api.aimlapi.com

# GetLate.dev - Voor social media posting (ESSENTIEEL)
LATE_DEV_API_KEY=your-getlate-api-key
GETLATE_API_KEY=your-getlate-api-key  # Alternatieve naam
```

#### 🔐 OPTIONELE MAAR AANBEVOLEN VARIABELEN

```env
# Moneybird - Facturatie
MONEYBIRD_ACCESS_TOKEN=your-token
MONEYBIRD_ADMINISTRATION_ID=your-admin-id

# OpenAI - Extra AI functionaliteit
OPENAI_API_KEY=your-openai-key

# ElevenLabs - Voice-overs
ELEVENLABS_API_KEY=your-elevenlabs-key

# Luma AI - Video generatie
LUMA_API_KEY=your-luma-key

# Pixabay - Stock afbeeldingen
PIXABAY_API_KEY=your-pixabay-key

# JWT Secret
JWT_SECRET=your-jwt-secret-minimum-32-characters

# SMTP Email
SMTP_HOST=writgoai.nl
SMTP_PORT=587
SMTP_USER=info@writgoai.nl
SMTP_PASS=your-smtp-password
```

---

## 🎯 De 3 Kritieke Flows - Setup Instructies

### Flow 1: Content Generatie 📝

**Status**: ✅ Volledig operationeel  
**Vereisten**: AIML API key

#### Setup Stappen:

1. **Verkrijg AIML API Key**
   - Ga naar https://aimlapi.com
   - Registreer en verkrijg API key
   - Voeg toe aan `.env`: `AIML_API_KEY=your-key`

2. **Test de Content Generatie**
   ```bash
   # In de nextjs_space directory
   node test_aiml_setup.mjs
   ```

3. **Genereer Test Blog**
   - Log in op https://writgo.nl
   - Ga naar "Content Generator" of "AI Agent Terminal"
   - Klik "Genereer Blog"
   - Vul in:
     - Topic: "Waarom lokale SEO belangrijk is"
     - Lengte: 1000 woorden
     - Tone: Professional
     - Model: gpt-4o
   - Klik "Genereren"

#### Hoe het werkt:

```typescript
// API Endpoint: /api/ai-agent/generate-seo-blog
// - Checkt credits (via lib/credits.ts)
// - Haalt SOP op uit database (customInstructions)
// - Roept AIML API aan met system + user prompt
// - Slaat content op in database
// - Trekt credits af
```

**Credit Kosten**:
- Blog (GPT-4o): 50 credits
- Blog (GPT-3.5): 20 credits
- Social post: 10 credits

---

### Flow 2: Social Media Posting via GetLate.dev 📱

**Status**: ✅ Implementatie compleet  
**Vereisten**: GetLate.dev API key

#### Setup Stappen:

1. **Verkrijg GetLate.dev API Key**
   - Ga naar https://getlate.dev
   - Registreer en verkrijg API key
   - Voeg toe aan `.env`: `LATE_DEV_API_KEY=your-key`

2. **Configureer GetLate Webhook (Optioneel)**
   ```
   Webhook URL: https://writgo.nl/api/admin/distribution/getlatedev/webhook
   Events: post.published, post.failed
   ```

3. **Verbind Social Media Accounts**
   - Client logt in op https://writgo.nl/client-portal
   - Gaat naar "Social Media"
   - Klikt "Connect Account"
   - Kiest platform (LinkedIn, Instagram, Facebook, TikTok, etc.)
   - Volgt OAuth flow

4. **Test Social Posting**
   ```bash
   # In de nextjs_space directory
   node -e "
   require('dotenv').config();
   const { getAccounts } = require('./lib/getlate');
   getAccounts().then(accounts => {
     console.log('Connected accounts:', accounts);
   }).catch(err => {
     console.error('Error:', err.message);
   });
   "
   ```

#### Hoe het werkt:

```typescript
// API Endpoint: /api/social-media/publish
// - Haalt ContentCalendarItem op uit database
// - Roept GetLate.dev API aan via lib/getlate.ts
// - Post naar ALLE verbonden platforms
// - Update status in database (scheduled/published/failed)
```

**Ondersteunde Platforms**:
- LinkedIn (Personal + Company Pages)
- Instagram
- Facebook (Personal + Pages)
- Twitter/X
- TikTok
- Pinterest
- Reddit

---

### Flow 3: WordPress Integratie 🌐

**Status**: ✅ Volledig operationeel  
**Vereisten**: WordPress site met Application Password

#### Setup Stappen:

1. **Configureer WordPress Site (Per Client)**
   
   De client moet een WordPress Application Password aanmaken:
   
   ```
   WordPress Admin → Users → Profile → Application Passwords
   
   1. Scroll naar beneden naar "Application Passwords"
   2. Naam: "Writgo AI"
   3. Klik "Add New Application Password"
   4. Kopieer het gegenereerde wachtwoord
   ```

2. **Voeg WordPress Credentials toe in Writgo**
   
   Als admin:
   ```
   Admin Dashboard → Clients → [Selecteer Client] → Edit
   
   WordPress Settings:
   - WordPress URL: https://client-website.nl
   - WordPress Username: admin
   - WordPress App Password: [gegenereerde password]
   
   Save
   ```

3. **Test WordPress Verbinding**
   ```bash
   # In de nextjs_space directory
   node -e "
   const { verifyWordPressConnection } = require('./lib/wordpress-publisher');
   
   verifyWordPressConnection({
     siteUrl: 'https://client-website.nl',
     username: 'admin',
     applicationPassword: 'xxxx xxxx xxxx xxxx'
   }).then(result => {
     console.log('WordPress test:', result);
   });
   "
   ```

4. **Test WordPress Publishing**
   - Genereer een blog via Content Generator
   - Klik "Publish to WordPress"
   - Controleer of artikel verschijnt op WordPress site

#### Hoe het werkt:

```typescript
// API Endpoint: /api/ai-agent/wordpress-publish (of via distribution center)
// - Haalt WordPress config op uit database (per client/project)
// - Converteert HTML naar Gutenberg blocks
// - Upload featured image naar WordPress
// - Converteert tags naar IDs
// - Publiceert artikel via WordPress REST API
// - Ondersteunt Yoast SEO en RankMath meta fields
```

**Features**:
- ✅ Gutenberg blocks conversie
- ✅ Featured image upload
- ✅ SEO meta fields (Yoast + RankMath)
- ✅ Categories & tags
- ✅ Affiliate product boxes (custom HTML blocks)
- ✅ Tables, images, lists, quotes
- ✅ Direct publish of draft status

---

## 👤 Eerste Klant Onboarding - Stap voor Stap

### Stap 1: Maak Client Account Aan

**Via Admin Dashboard:**

```
1. Log in als admin op https://writgo.nl/dashboard
2. Ga naar "Clients" → "Add New Client"
3. Vul in:
   - Naam: [Bedrijfsnaam]
   - Email: [client@email.nl]
   - Pakket: [Kies pakket]
   - Credits: [Bijv. 1000 voor Starter pakket]
   - WordPress URL: [https://client-site.nl]
   - WordPress Username: [admin]
   - WordPress App Password: [xxxx xxxx xxxx xxxx]
4. Klik "Create Client"
5. Stuur welkomst email met login gegevens
```

**Client ontvangt:**
- Login link: https://writgo.nl/client-portal
- Tijdelijk wachtwoord (via email)
- Instructies voor eerste login

---

### Stap 2: Client Onboarding Proces

**Client doet:**

1. **Eerste Login**
   - Ga naar https://writgo.nl/client-portal
   - Log in met email + wachtwoord
   - Verander wachtwoord (verplicht)

2. **Profiel Invullen**
   ```
   Dashboard → Profile Settings
   
   - Bedrijfsinfo
   - Branche
   - Doelgroep
   - Unique Selling Points
   - Brand Voice / Tone
   - Keywords lijst
   ```

3. **Social Media Accounts Verbinden**
   ```
   Dashboard → Social Media → Connect Accounts
   
   Voor elk gewenst platform:
   - Klik "Connect [Platform]"
   - Volg OAuth flow
   - Geef permissies
   - Bevestig verbinding
   
   Ondersteunde platforms:
   ✅ LinkedIn (Personal + Company)
   ✅ Instagram
   ✅ Facebook (Personal + Pages)
   ✅ Twitter/X
   ✅ TikTok
   ✅ Pinterest
   ✅ Reddit
   ```

4. **WordPress Verbinding Testen** (Als admin dit nog niet deed)
   ```
   Dashboard → WordPress Settings → Test Connection
   
   Zie groene checkmark? ✅ Klaar!
   Zie rode error? ❌ Controleer credentials
   ```

---

### Stap 3: Eerste Content Genereren

**Client kan nu:**

#### A. Handmatig Content Genereren

```
Dashboard → Content Generator

1. Kies content type:
   - Blog artikel
   - Social media post
   - Product beschrijving
   
2. Vul parameters in:
   - Topic/onderwerp
   - Keywords
   - Lengte
   - Tone
   
3. Klik "Genereer"

4. Review en edit content

5. Publiceer:
   - Direct naar WordPress
   - Schedule voor social media
   - Download als PDF
```

#### B. Autopilot Instellen (Fully Managed)

```
Dashboard → Autopilot Settings

1. Content Frequentie:
   - Blogs per week: [2-4]
   - Social posts per dag: [1-3]
   
2. Content Topics:
   - Automatisch op basis van SEO research
   - Of: vaste topic lijst
   
3. Publishing Schedule:
   - Beste tijden voor social media
   - WordPress: direct publish of draft
   
4. Activeer Autopilot ✅

Nu genereert het systeem automatisch content!
```

---

## 🔄 Autopilot Workflow (Fully Managed)

Voor clients die **zero-touch** willen (zoals in het businessplan):

### Hoe Autopilot Werkt:

```
1. CRON JOB TRIGGER (dagelijks 09:00)
   ↓
2. SYSTEM ANALYSEERT:
   - Client's niche & keywords
   - Trending topics in branche
   - SEO opportunities
   - Content calendar gaps
   ↓
3. CONTENT GENERATIE:
   - Genereert blog artikel (1000-1500 woorden)
   - Maakt 3-5 social media posts
   - Creëert featured images
   ↓
4. QUALITY CHECK:
   - Plagiaatcontrole (Originality.AI)
   - SEO score check
   - Readability check
   ↓
5. AUTOMATISCH PUBLICEREN:
   - Blog → WordPress (direct publish of draft)
   - Social posts → GetLate.dev (schedule voor optimale tijden)
   ↓
6. CREDITS AFTREKKEN:
   - Blog: -50 credits
   - Social posts: -10 credits each
   ↓
7. CLIENT NOTIFICATIE:
   - Email: "Nieuwe content gepubliceerd"
   - Dashboard update
```

### Autopilot Activeren:

**Via Admin Dashboard:**
```bash
# Zet autopilot aan voor een client
UPDATE clients 
SET autopilot_enabled = true,
    autopilot_frequency = 'daily',
    autopilot_blog_per_week = 3,
    autopilot_social_per_day = 2
WHERE email = 'client@email.nl';
```

**CRON Job URL:**
```
https://writgo.nl/api/cron/daily-content-generation?secret=CRON_SECRET

Voeg toe aan Render cron jobs of externe cron service (bijv. cron-job.org)
```

---

## 📊 Monitoring & Analytics

### Client Dashboard Widgets

Client ziet op dashboard:

```
📈 OVERVIEW
- Total content pieces: 47
- Published this month: 12
- Credits remaining: 850
- Next scheduled post: Tomorrow 14:00

📝 RECENT CONTENT
- Blog: "10 SEO Tips voor Lokale Bedrijven" (WordPress ✅)
- Social: "Nieuwe dienst gelanceerd!" (LinkedIn ✅, Instagram ⏰)
- Video: "Tutorial: Onze werkwijze" (Rendering... 80%)

💳 CREDITS USAGE
- Blogs generated: 15 (-750 credits)
- Social posts: 32 (-320 credits)
- Videos: 5 (-250 credits)
- Remaining: 850 credits

🌐 WORDPRESS STATS
- Total posts: 23
- Published this week: 3
- Average SEO score: 87/100
```

### Admin Dashboard Analytics

Admin ziet:

```
👥 CLIENTS OVERVIEW
- Total clients: 6
- Active clients: 5
- MRR: €2,400
- Total credits consumed: 12,450

📊 CONTENT STATS
- Blogs generated: 87
- Social posts: 234
- Videos: 15
- WordPress publishes: 76

💰 REVENUE
- This month: €2,400
- Last month: €1,800
- Growth: +33%

⚠️ ALERTS
- Client "ABC BV" - Low credits (120 remaining)
- Client "XYZ BV" - WordPress connection failed
```

---

## 🧪 Testing Checklist

Voordat je de eerste klant onboardt, test alle flows:

### ✅ Content Generatie Test

```bash
cd /home/ubuntu/github_repos/writgoai_nl/nextjs_space

# Test AIML API
node test_aiml_setup.mjs

# Test blog generatie (via API)
curl -X POST http://localhost:3000/api/ai-agent/generate-seo-blog \
  -H "Content-Type: application/json" \
  -H "Cookie: [your-session-cookie]" \
  -d '{
    "topic": "Test blog over lokale SEO",
    "length": 500,
    "tone": "professional",
    "model": "gpt-4o"
  }'
```

**Expected Result**: JSON met gegenereerde blog content

---

### ✅ Social Media Posting Test

```bash
# Test GetLate.dev verbinding
node -e "
require('dotenv').config();
const { getAccounts, getUsageStats } = require('./lib/getlate');

(async () => {
  try {
    console.log('Testing GetLate.dev connection...');
    
    const accounts = await getAccounts();
    console.log('✅ Connected accounts:', accounts);
    
    const stats = await getUsageStats();
    console.log('✅ Usage stats:', stats);
    
  } catch (error) {
    console.error('❌ Error:', error.message);
  }
})();
"
```

**Expected Result**: Lijst van verbonden social media accounts

---

### ✅ WordPress Integratie Test

```bash
# Test WordPress verbinding
node -e "
const { verifyWordPressConnection } = require('./lib/wordpress-publisher');

(async () => {
  const result = await verifyWordPressConnection({
    siteUrl: 'https://your-test-site.nl',
    username: 'admin',
    applicationPassword: 'xxxx xxxx xxxx xxxx'
  });
  
  console.log('WordPress connection test:', result);
  
  if (result.success) {
    console.log('✅ WordPress connected!');
    console.log('Site info:', result.info);
  } else {
    console.error('❌ WordPress connection failed:', result.error);
  }
})();
"
```

**Expected Result**: `{ success: true, info: {...} }`

---

### ✅ End-to-End Flow Test

**Scenario**: Genereer blog, publiceer naar WordPress, maak social posts

```
1. Log in als test client
2. Ga naar Content Generator
3. Genereer blog:
   - Topic: "Test: Waarom lokale SEO belangrijk is"
   - Klik "Genereer"
   - Wait for completion
4. Publiceer naar WordPress:
   - Klik "Publish to WordPress"
   - Controleer op WordPress site
5. Genereer social posts:
   - Klik "Create Social Posts from Blog"
   - Review posts
6. Schedule social posts:
   - Klik "Schedule All"
   - Kies tijden
   - Klik "Confirm"
7. Controleer resultaten:
   - Dashboard → Content Calendar
   - Zie scheduled posts
```

**Expected Result**: Blog op WordPress + Social posts scheduled in GetLate.dev

---

## 🚨 Troubleshooting

### Probleem 1: AIML API Errors

**Symptoom**: `Error: AI API error: 401`

**Oplossing**:
```bash
# Check API key
echo $AIML_API_KEY

# Test key
curl -X POST https://api.aimlapi.com/chat/completions \
  -H "Authorization: Bearer $AIML_API_KEY" \
  -H "Content-Type: application/json" \
  -d '{
    "model": "gpt-3.5-turbo",
    "messages": [{"role": "user", "content": "Hello"}]
  }'
```

**Fix**: Zorg dat `AIML_API_KEY` correct is in `.env`

---

### Probleem 2: GetLate.dev Connection Failed

**Symptoom**: `Error: GetLate API error: Unauthorized`

**Oplossing**:
```bash
# Check beide variabelen
echo $LATE_DEV_API_KEY
echo $GETLATE_API_KEY

# Test connection
node -e "
require('dotenv').config();
const { getAccounts } = require('./lib/getlate');
getAccounts().then(r => console.log(r));
"
```

**Fix**: 
1. Zorg dat `LATE_DEV_API_KEY` in `.env` staat
2. Verkrijg nieuwe key op https://getlate.dev
3. Restart de applicatie

---

### Probleem 3: WordPress Connection Failed

**Symptoom**: `Error: Invalid WordPress credentials`

**Oplossing**:
```bash
# Test credentials
curl -u "username:app-password" \
  https://client-site.nl/wp-json/wp/v2/users/me
```

**Mogelijke oorzaken**:
1. ❌ Wrong username
2. ❌ Wrong application password (spaties vergeten?)
3. ❌ WordPress REST API disabled
4. ❌ SSL certificate issues
5. ❌ Firewall blocking requests

**Fix**:
1. Genereer nieuw Application Password in WordPress
2. Check of REST API enabled is: `https://site.nl/wp-json/`
3. Update credentials in admin dashboard

---

### Probleem 4: Credits Niet Afgetrokken

**Symptoom**: Content gegenereerd maar credits blijven gelijk

**Oplossing**:
```bash
# Check credits in database
cd /home/ubuntu/github_repos/writgoai_nl/nextjs_space

node -e "
const { prisma } = require('./lib/db');
(async () => {
  const client = await prisma.client.findUnique({
    where: { email: 'client@email.nl' }
  });
  console.log('Credits:', client.credits);
})();
"
```

**Fix**: Check `lib/credits.ts` implementation

---

## 📝 Environment Variables Checklist

Gebruik deze checklist om te zorgen dat alle environment variables correct ingesteld zijn:

```
✅ DATABASE
[ ] NEXT_PUBLIC_SUPABASE_URL
[ ] NEXT_PUBLIC_SUPABASE_ANON_KEY
[ ] SUPABASE_SERVICE_ROLE_KEY

✅ AUTHENTICATION
[ ] NEXTAUTH_SECRET (min. 32 characters)
[ ] NEXTAUTH_URL (production URL)
[ ] JWT_SECRET

✅ CONTENT GENERATION (ESSENTIEEL)
[ ] AIML_API_KEY
[ ] AIML_API_URL
[ ] AIML_API_BASE_URL
[ ] OPENAI_API_KEY (optioneel)

✅ SOCIAL MEDIA (ESSENTIEEL)
[ ] LATE_DEV_API_KEY
[ ] GETLATE_API_KEY

✅ FACTURATIE
[ ] MONEYBIRD_ACCESS_TOKEN
[ ] MONEYBIRD_ADMINISTRATION_ID
[ ] MONEYBIRD_PRODUCT_BASIS_ID
[ ] MONEYBIRD_PRODUCT_PROFESSIONAL_ID
[ ] MONEYBIRD_PRODUCT_BUSINESS_ID
[ ] MONEYBIRD_PRODUCT_ENTERPRISE_ID

✅ EXTRA FEATURES
[ ] ELEVENLABS_API_KEY (voice-overs)
[ ] LUMA_API_KEY (video generatie)
[ ] PIXABAY_API_KEY (stock images)

✅ EMAIL
[ ] SMTP_HOST
[ ] SMTP_PORT
[ ] SMTP_USER
[ ] SMTP_PASS

✅ CRON JOBS
[ ] CRON_SECRET

✅ GOOGLE
[ ] GOOGLE_SEARCH_CONSOLE_CLIENT_ID (optioneel)
[ ] GOOGLE_SEARCH_CONSOLE_CLIENT_SECRET (optioneel)
```

---

## 🎯 Quick Start Commands

### Development

```bash
cd /home/ubuntu/github_repos/writgoai_nl/nextjs_space

# Install dependencies
npm install
# of
yarn install

# Run development server
npm run dev
# of
yarn dev

# Open http://localhost:3000
```

### Production (Render)

```bash
# Build
npm run build

# Start
npm start
```

---

## 📞 Support & Contact

Voor vragen of problemen:

**Technische Support:**
- GitHub Issues: https://github.com/Mikeyy1405/Writgoai.nl/issues
- Email: info@writgo.nl

**Render Deployment:**
- Dashboard: https://dashboard.render.com
- Logs: https://dashboard.render.com/[your-service]/logs
- Environment variables: https://dashboard.render.com/[your-service]/env-vars

**API Providers:**
- AIML API: https://aimlapi.com/support
- GetLate.dev: https://getlate.dev/docs
- Moneybird: https://developer.moneybird.com

---

## ✨ Volgende Stappen

Nu je de setup hebt voltooid:

1. ✅ **Test alle flows** met test client
2. ✅ **Onboard eerste echte klant** (volg stappen hierboven)
3. ✅ **Monitor performance** via admin dashboard
4. ✅ **Verzamel feedback** van eerste klant
5. ✅ **Optimize autopilot** op basis van resultaten
6. ✅ **Scale naar volgende klanten**

**Success Criteria Eerste Klant:**
- [ ] Client kan inloggen en dashboard zien
- [ ] Content generatie werkt (blogs + social posts)
- [ ] WordPress publishing werkt
- [ ] Social media posting via GetLate.dev werkt
- [ ] Credits systeem functioneert correct
- [ ] Client is tevreden met resultaten

---

## 📚 Aanvullende Documentatie

In de repository vind je meer documentatie:

- `README.md` - Algemeen overzicht
- `DEPLOYMENT_CHECKLIST.md` - Production deployment
- `DEVELOPMENT_GUIDE.md` - Development setup
- `docs/` - Uitgebreide feature documentatie

**Tech Stack Details:**
- Framework: Next.js 14 (App Router)
- Database: Supabase (PostgreSQL)
- ORM: Prisma
- Auth: NextAuth.js
- Styling: Tailwind CSS + shadcn/ui
- API's: AIML, GetLate.dev, Moneybird, WordPress REST

---

**Document versie**: 1.0  
**Laatste update**: 11 december 2025  
**Status**: ✅ Ready for Production

---

## 🔥 TL;DR - Snelle Start

```bash
# 1. Clone & setup
cd /home/ubuntu/github_repos/writgoai_nl/nextjs_space
cp .env.example .env
nano .env  # Vul API keys in

# 2. Minimaal vereist in .env:
# - AIML_API_KEY
# - LATE_DEV_API_KEY
# - Supabase credentials
# - NEXTAUTH_SECRET

# 3. Test
npm install
npm run dev

# 4. Maak eerste client aan via admin dashboard

# 5. Test alle 3 flows:
#    ✅ Content generatie
#    ✅ Social media posting
#    ✅ WordPress publishing

# 6. Activeer autopilot (optioneel)

# 7. Monitor & optimize
```

**Je bent nu klaar om de eerste klant te onboarden! 🚀**



---

## 🆕 NIEUWE KLANT ONBOARDING FLOW (December 2025)

### Vereenvoudigde 3-Stappen Setup

Met de nieuwe invisible project layer is klant onboarding **drastisch vereenvoudigd**:

#### Stap 1: Klant Aanmaken (1 minuut)

1. Log in als admin op `/admin`
2. Ga naar **Klanten** (in sidebar)
3. Klik **Nieuwe Klant**
4. Vul formulier in:
   ```
   Naam: Mike van der Berg
   Email: mike@computerstartgids.nl
   Wachtwoord: [genereer veilig wachtwoord]
   Bedrijfsnaam: Computer Start Gids
   Website: https://computerstartgids.nl
   Pakket: STARTER (of INSTAPPER/GROEI/DOMINANT)
   Credits: 0 (of unlimited)
   ```
5. Klik **Aanmaken**

**Wat gebeurt er automatisch:**
- ✅ Client account wordt aangemaakt
- ✅ Default project wordt aangemaakt met bedrijfsnaam
- ✅ WordPress URL wordt uit website gehaald
- ✅ Klant kan direct inloggen op `/client-login`
- ✅ Project is klaar voor content generatie

**Geen extra stappen nodig!** De klant heeft nu:
- Account om in te loggen
- Default project (onzichtbaar voor hen)
- Systeem klaar voor WordPress koppeling

---

#### Stap 2: WordPress Verbinden (2 minuten)

**Klant doet dit zelf:**

1. Klant logt in op `/client-login`
2. Gaat naar **Platforms** (of **Instellingen**)
3. Vult WordPress credentials in:
   ```
   Website URL: https://computerstartgids.nl
   Username: admin (of speciale username)
   Application Password: [uit WordPress]
   ```
4. Test verbinding
5. Sla op

**WordPress Application Password aanmaken:**
```
WP Admin → Gebruikers → Profiel → Application Passwords
Naam: "Writgo Content Manager"
→ Nieuw wachtwoord toevoegen
→ Kopieer: xxxx xxxx xxxx xxxx xxxx xxxx
```

**Verificatie:**
- ✅ Groene checkmark bij WordPress status
- ✅ WordPress posts zichtbaar in Writgo dashboard
- ✅ Categorieën worden geladen

---

#### Stap 3: Social Media Platforms Koppelen (5 minuten)

**Klant koppelt via GetLate.dev:**

1. Klant gaat naar **Platforms** tab
2. Klikt **Verbind Social Media**
3. Wordt doorgestuurd naar GetLate.dev
4. Logt in bij gewenste platforms:
   - ✅ LinkedIn (persoonlijk of bedrijfspagina)
   - ✅ Instagram (business account)
   - ✅ Facebook (pagina)
   - ✅ TikTok (optional)
   - ✅ Twitter/X (optional)
5. Keert terug naar Writgo
6. Platforms zijn nu gekoppeld en zichtbaar in dashboard

**Verificatie:**
- ✅ Platform iconen tonen "Verbonden" status
- ✅ Platform limiet gebaseerd op pakket (bijv. STARTER = 3 platforms)
- ✅ Test post kan verstuurd worden

---

### ✅ Klaar voor Productie!

Na deze 3 stappen is de klant volledig operationeel:

**Admin kan nu:**
- 📝 Content genereren voor deze klant
- 📅 Content inplannen in kalender
- 📊 Analytics bekijken
- 💬 Communiceren via messaging

**Klant kan nu:**
- 👀 Geplande content zien
- ✏️ Wijzigingen aanvragen
- 📊 Hun statistieken bekijken
- 🔗 Extra platforms koppelen (binnen pakketlimiet)

**Systeem doet automatisch:**
- 🤖 Content generatie op basis van planning
- 📤 Publicatie naar WordPress + alle socials
- 📈 Analytics verzamelen
- 💳 Facturatie via Moneybird

---

## 🔧 Troubleshooting Nieuwe Flow

### Probleem: "Default project niet aangemaakt"

**Symptomen:**
- Console errors: "No project found for client"
- Content kalender blijft leeg
- WordPress verbinding mislukt

**Oplossing:**
```typescript
// Run helper functie om default project te forceren
import { getClientDefaultProject } from '@/lib/project-helpers';

const project = await getClientDefaultProject(clientId, true);
// true = createIfNotExists
```

### Probleem: "WordPress URL niet zichtbaar in admin lijst"

**Check:**
1. Is default project aangemaakt? Check database:
   ```sql
   SELECT * FROM projects WHERE "clientId" = 'xxx' AND "isPrimary" = true;
   ```
2. Is GET endpoint goed geüpdatet? Check API response:
   ```bash
   curl http://localhost:3000/api/admin/clients
   # Should include "websiteUrl" and "projectId" fields
   ```

### Probleem: "Klant heeft meerdere projecten (legacy)"

**Voor bestaande klanten met >1 project:**
```typescript
// Check of klant multi-project heeft
import { hasMultipleProjects } from '@/lib/project-helpers';

const hasMultiple = await hasMultipleProjects(clientId);
if (hasMultiple) {
  console.warn('Legacy client met meerdere projecten');
  // Toon waarschuwing in admin UI
  // Of: migreer naar single-project model
}
```

---

## 📊 Monitoring en Analytics

### Admin Dashboard Check
Na onboarding, check admin dashboard:
```
/admin
→ Moet tonen:
  - Nieuwe klant in "Recent Clients"
  - WordPress URL zichtbaar
  - 0 content pieces (nog geen content gemaakt)
  - Pakket status: Actief
```

### Client Dashboard Check
Als klant ingelogd:
```
/client-portal
→ Moet tonen:
  - Welkomstbericht met bedrijfsnaam
  - Platform status (WordPress + socials)
  - Lege content kalender (nog geen content)
  - Pakket info (aantal platforms, posts per maand)
```

---

## 🚀 Volgende Stappen Na Eerste Klant

1. **Content Maken**
   - Ga naar Content Kalender
   - Selecteer klant
   - Genereer eerste blog post
   - Plan social media posts

2. **Distributie Testen**
   - Publiceer naar WordPress (check Gutenberg blocks)
   - Post naar alle verbonden socials
   - Controleer GetLate.dev dashboard

3. **Analytics Verzamelen**
   - Check impressions, engagements
   - Toon resultaten aan klant
   - Optimize content strategie

4. **Facturatie**
   - Check Moneybird sync
   - Genereer eerste factuur
   - Test betaling flow

5. **Feedback Loop**
   - Vraag klant om feedback
   - Itereer op UI/UX
   - Documenteer learnings

---

## 📞 Support en Hulp

Bij vragen over de nieuwe architecture:
- 📖 Lees: `IMPLEMENTATION_SUMMARY.md`
- 📖 Lees: `DATABASE_SCHEMA_ANALYSIS.md`
- 📖 Lees: `PULL_REQUEST_INVISIBLE_PROJECTS.md`
- 💻 Check: `lib/project-helpers.ts` voor developer functies
- 🐛 Check console logs voor "Project Helper" berichten

---

**Updated by**: DeepAgent AI  
**Date**: December 11, 2025  
**Version**: 2.0 (Invisible Project Layer)
