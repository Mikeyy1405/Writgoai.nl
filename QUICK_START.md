# 🚀 Quick Start Guide - WritGo.nl

**Status:** ✅ Build errors gefixed | ✅ €20 AIML credits toegevoegd | ⏳ Configuratie nodig

---

## ✅ WAT WERKT AL

- ✅ Dependencies geïnstalleerd (387 packages)
- ✅ Build succesvol (166 routes)
- ✅ AIML API account heeft €20 credits
- ✅ Code gebruikt AIML API voor Claude, Perplexity & Flux

---

## 🎯 STAP 1: VERZAMEL JE CREDENTIALS

### A. Supabase Credentials

1. Ga naar https://supabase.com/dashboard
2. Selecteer je project: **utursgxvfhhfheeoewfn**
3. Klik op **Settings** (tandwiel links) → **API**
4. Kopieer deze 2 keys:
   - **anon / public key** (Project API keys sectie)
   - **service_role key** (Project API keys sectie, klik "Reveal")

### B. AIML API Key

1. Ga naar https://aimlapi.com/app/keys (of https://aimlapi.com/dashboard)
2. Login met je account (waar je net €20 hebt toegevoegd)
3. Kopieer je **API Key**

---

## 🎯 STAP 2: CREËER .env.local

### Optie A: Via de terminal (snelst)

```bash
# Kopieer de template
cp .env.local.TEMPLATE_TO_FILL .env.local

# Open in je editor
nano .env.local
# of
code .env.local
# of
vim .env.local
```

### Optie B: Handmatig

1. Creëer een nieuw bestand `.env.local` in de root folder
2. Kopieer de inhoud van `.env.local.TEMPLATE_TO_FILL`
3. Vul de waarden in (zie hieronder)

---

## 🎯 STAP 3: VULT DE VERPLICHTE WAARDEN IN

Open `.env.local` en vul **minimaal** deze in:

```bash
# Supabase (vul je eigen keys in!)
NEXT_PUBLIC_SUPABASE_URL=https://utursgxvfhhfheeoewfn.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhb...  # ← Plak hier je anon key
SUPABASE_SERVICE_ROLE_KEY=eyJhb...      # ← Plak hier je service role key

# AIML API (vul je eigen key in!)
AIML_API_KEY=                            # ← Plak hier je AIML API key

# App URLs (deze zijn goed voor lokaal)
NEXT_PUBLIC_APP_URL=http://localhost:3000
NEXT_PUBLIC_SITE_URL=http://localhost:3000
```

**Let op:**
- De Supabase keys beginnen met `eyJ...`
- Geen spaties voor of na het `=` teken
- Geen aanhalingstekens nodig

---

## 🎯 STAP 4: TEST DE CONFIGURATIE

### A. Test AIML Credits

```bash
npx tsx scripts/check-aiml-credits.ts
```

**Verwachte output:**
```
✅ AIML_API_KEY is set
✅ API call successful!
   Your AIML API is working correctly!
```

Als je een error ziet, check:
- Is je AIML_API_KEY correct ingevuld?
- Heeft je account nog credits? (ga naar https://aimlapi.com/app/billing)

---

### B. Test de Build

```bash
npm run build
```

**Verwachte output:**
```
✓ Compiled successfully
✓ Generating static pages (42/42)
```

---

### C. Start Development Server

```bash
npm run dev
```

**Verwachte output:**
```
▲ Next.js 14.2.35
- Local:        http://localhost:3000
✓ Ready in 2.5s
```

Open je browser op: http://localhost:3000

---

## 🎯 STAP 5: EERSTE TEST

### A. Test Authenticatie

1. Ga naar http://localhost:3000/register
2. Maak een test account aan
3. Login met je credentials

**Als dit werkt:** ✅ Supabase connectie werkt!

---

### B. Test AI Generatie

1. Ga naar het Writer dashboard
2. Probeer een kort artikel te genereren
3. Kies een onderwerp en klik "Generate"

**Als dit werkt:** ✅ AIML API werkt!

---

## ❌ TROUBLESHOOTING

### "Missing Supabase environment variables"

- Check of `.env.local` bestaat in de root folder
- Check of de Supabase variabelen ingevuld zijn
- Restart de dev server (`Ctrl+C` en dan `npm run dev`)

---

### "Missing AI API key"

- Check of `AIML_API_KEY` in `.env.local` staat
- Check of de key correct is (geen spaties, volledig gekopieerd)
- Restart de dev server

---

### "Your credit balance is too low"

- Ga naar https://aimlapi.com/app/billing
- Check je credit balance
- Koop meer credits als nodig (je hebt net €20 toegevoegd, dit zou genoeg moeten zijn!)

---

### "Database error" / "relation does not exist"

Je moet de database migrations draaien:

```bash
# Check of de Supabase connectie werkt
npm run migrate
```

Of draai de migrations handmatig via Supabase SQL Editor.

---

## 📊 CREDIT USAGE (met €20)

**Bij AIML API:**
- Claude Sonnet 4.5: ~$3 per 1M tokens
- €20 = ongeveer 6-7M tokens
- 1 artikel (2000 woorden) ≈ 3000-5000 tokens
- **Je kunt ongeveer 1000-1500 artikelen genereren!**

**Tip:** Monitor je usage op https://aimlapi.com/app/usage

---

## 🎉 SUCCESS!

Als je dit ziet, werkt alles:
- ✅ Build succeeds
- ✅ Dev server draait
- ✅ Je kunt inloggen
- ✅ AI generatie werkt
- ✅ Supabase connectie werkt

**Volgende stappen:**
- Configureer WordPress integratie (zie `WORDPRESS_SETUP.md`)
- Setup Social Media (zie `SOCIAL_MEDIA_SETUP.md`)
- Configureer Stripe credits (zie `CREDIT_SYSTEM_SETUP.md`)
- Setup cron jobs voor autopilot (zie `AUTOPILOT_README.md`)

---

## 📚 MEER DOCUMENTATIE

- `PROJECT_STATUS_REPORT.md` - Volledige status van het project
- `SUPABASE_SETUP.md` - Gedetailleerde Supabase setup
- `WORDPRESS_SETUP.md` - WordPress connectie
- `SOCIAL_MEDIA_SETUP.md` - Social media integratie
- `AI_AGENT_SETUP.md` - AI Agent module
- `.env.example` - Alle mogelijke environment variabelen

---

## 🆘 HULP NODIG?

Als je vastloopt:
1. Check `PROJECT_STATUS_REPORT.md` voor gedetailleerde info
2. Run `npx tsx scripts/check-aiml-credits.ts` voor AIML diagnostics
3. Check de console logs voor specifieke errors
4. Vraag hulp met de exacte error message

---

**Made with ❤️ by WritGo.nl**
