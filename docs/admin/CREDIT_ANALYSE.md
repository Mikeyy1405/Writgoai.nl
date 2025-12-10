
# 💰 WritgoAI Credits Analyse & Optimalisatie

## 📊 Huidige Situatie

### Credit Kosten per Actie

```typescript
CREDIT_COSTS = {
  BLOG_POST: 1.0 credit          // Long-form content
  SOCIAL_POST: 0.3 credits       // Short-form content
  WEB_SEARCH: 0.2 credits        // Research
  CHAT_MESSAGE_BASIC: 0.1        // Gemini, GPT-3.5
  CHAT_MESSAGE_ADVANCED: 0.5     // GPT-4o, Claude Sonnet
  IMAGE_STANDARD: 0.5            // Flux Schnell
  VIDEO_SHORT: 5.0               // < 5 sec video
}
```

### Typische Content Generatie Kosten

**Een SEO Blog genereren:**
- Web research: 0.2 credits
- Blog generatie: 1.0 credits
- Afbeeldingen (Pixabay): 0 credits (gratis API)
- **TOTAAL: 1.2 credits**

**Een Social Media Post:**
- Post generatie: 0.3 credits
- Afbeelding: 0 credits (Pixabay)
- **TOTAAL: 0.3 credits**

**Een Video:**
- Script: 0.3 credits
- Video generatie: 5.0 credits
- **TOTAAL: 5.3 credits**

---

## 💵 Echte API Kosten

### Wat kost het jou daadwerkelijk?

**Per Blog (1000-1500 woorden):**
- Web research (Brave/Tavily): $0.01
- GPT-4o generatie (~15K input + 5K output): $0.09
- Afbeeldingen (Pixabay): $0.00
- **Werkelijke kosten: ~$0.10 per blog**

**Per Social Post:**
- GPT-4o generatie (~2K input + 500 output): $0.01
- Afbeeldingen (Pixabay): $0.00
- **Werkelijke kosten: ~$0.01 per post**

**Per Video (AI Story):**
- Script generatie: $0.01
- ElevenLabs voice: ~$0.05
- FFmpeg rendering: $0.00 (server kosten)
- **Werkelijke kosten: ~$0.06 per video**

---

## 🎯 Credit → Euro Waarde

### Als 1 credit = X euro

**Scenario A: 1 credit = €0.10**
- 10 gratis credits = €1.00 waarde
- Klant kan maken:
  - ✅ 8 blogs (8.3 × 1.2 = ~10 credits)
  - ✅ 33 social posts (33 × 0.3 = ~10 credits)
  - ✅ 1 video + 4 blogs
- **Jouw kosten voor 10 credits:**
  - 8 blogs × $0.10 = $0.80 (~€0.75)
  - **Winstmarge: ~25%**

**Scenario B: 1 credit = €0.20**
- 10 gratis credits = €2.00 waarde
- Klant kan maken: hetzelfde aantal items
- **Jouw kosten voor 10 credits:**
  - 8 blogs × $0.10 = $0.80 (~€0.75)
  - **Winstmarge: ~62%**

**Scenario C: 1 credit = €0.50**
- 10 gratis credits = €5.00 waarde
- Klant kan maken: hetzelfde aantal items
- **Jouw kosten voor 10 credits:**
  - 8 blogs × $0.10 = $0.80 (~€0.75)
  - **Winstmarge: ~85%**

---

## 🚨 Het Probleem

### Waarom 10 gratis credits "te weinig" lijkt

1. **Psychologie**: Mensen denken in hele getallen
   - "10 credits" klinkt klein
   - "1000 credits" klinkt groot

2. **Verwarring**: Klanten weten niet wat ze kunnen maken
   - Denken: "10 credits = 1 blog?"
   - Realiteit: "10 credits = 8+ blogs!"

3. **Geen context**: Geen vergelijking met andere platforms
   - Jasper AI: ~$40/maand voor 35K words
   - Copy.ai: ~$36/maand voor onbeperkt
   - Jouw systeem: veel goedkoper!

---

## ✅ Oplossingen

### Optie 1: Verhoog gratis credits (cosmetisch)

**Multipliceer alles met 10:**
```typescript
CREDIT_COSTS = {
  BLOG_POST: 10 credits          // Was 1.0
  SOCIAL_POST: 3 credits         // Was 0.3
  WEB_SEARCH: 2 credits          // Was 0.2
}

FREE_CREDITS = 100                // Was 10
```

**Voordeel:**
- ✅ "100 gratis credits!" klinkt veel beter
- ✅ Zelfde economie, betere psychologie
- ✅ Klanten kunnen nog steeds 8-10 blogs maken

**Nadeel:**
- ⚠️ Bestaande klanten moeten credits × 10 krijgen

---

### Optie 2: Geef meer gratis credits (echte waarde)

**Verhoog naar 25-50 gratis credits:**
- 25 credits = 20+ blogs
- 50 credits = 40+ blogs
- **Jouw kosten: €2-4** (nog steeds lage CAC)

**Voordeel:**
- ✅ Klanten krijgen echt meer waarde
- ✅ Betere conversie naar betaald
- ✅ Klanten kunnen je platform volledig testen

**Nadeel:**
- ⚠️ Hogere kosten per trial user

---

### Optie 3: Transparante calculator

**Voeg een "Credit Calculator" toe:**
```
┌─────────────────────────────────────┐
│  💡 Wat kun je maken met 10 credits? │
├─────────────────────────────────────┤
│  ✅ 8 SEO Blogs (1500 woorden)      │
│  ✅ 33 Social Media Posts           │
│  ✅ 1 Video + 4 Blogs               │
│  ✅ 100 Chat berichten              │
└─────────────────────────────────────┘
```

**Voordeel:**
- ✅ Klanten begrijpen de waarde beter
- ✅ Geen technical changes nodig
- ✅ Verhoogt perceived value

---

### Optie 4: "Onbeperkte Trial" (7 dagen)

**Eerste 7 dagen onbeperkt:**
- Geen credit telling tijdens trial
- Na 7 dagen: kies een plan
- **Jouw risico:** Max ~€5 per user (als ze 50 blogs maken)

**Voordeel:**
- ✅ Beste user experience
- ✅ Hoogste conversie rates
- ✅ "Risk reversal" marketing

**Nadeel:**
- ⚠️ Mogelijk misbruik (maar zeldzaam)
- ⚠️ Hogere kosten per trial user

---

## 📈 Aanbeveling

### 🏆 Best Practices: Combinatie

**1. Vermenigvuldig credits × 10 (psychologie)**
```typescript
BLOG_POST: 10 credits          // Was 1.0
FREE_TRIAL: 100 credits        // Was 10
STARTER_PLAN: 2000 credits/mo  // Was 200
PRO_PLAN: 5000 credits/mo      // Was 500
```

**2. Voeg calculator toe op homepage**
```
"100 GRATIS CREDITS = 80+ Blogs + 300+ Social Posts"
```

**3. Verhoog gratis trial naar 150-200 credits**
- Geeft klanten ruimte om écht te testen
- Kosten voor jou: €1.50-2.00 per trial
- Typische SaaS CAC: €20-50, dus dit is zeer laag

**4. Toon real-time credit gebruik**
```
✅ Blog gegenereerd! Gebruikt: 12 credits
💎 Nog 88 credits over (≈ 7 blogs)
```

---

## 💡 Vergelijking met Concurrentie

| Platform | Prijs | Wat krijg je? | Credits Equivalent |
|----------|-------|---------------|-------------------|
| Jasper AI | €39/mo | 35K words | ~35 blogs = 420 credits |
| Copy.ai | €36/mo | Onbeperkt* | ~500 credits |
| WritgoAI Starter | €29/mo | 2000 credits | **200 blogs** 🚀 |
| WritgoAI Pro | €99/mo | 5000 credits | **500 blogs** 🚀 |

*Copy.ai "onbeperkt" heeft vaak soft limits

---

## 🎯 Conclusie

### Huidige Situatie
- ✅ 10 gratis credits = 8-10 blogs (€0.80 kosten voor jou)
- ⚠️ Klinkt te weinig, maar is eigenlijk veel!
- ⚠️ Klanten begrijpen de waarde niet

### Actie Items

1. **Quick Win**: Multiply credits × 10 (100 gratis credits)
2. **UI Update**: Voeg credit calculator toe
3. **Marketing**: Communiceer duidelijk wat je kan maken
4. **Long Term**: Overweeg 7-dagen unlimited trial

### Economie Check
- Blog kost jou: ~$0.10
- Blog kost klant: 10 credits (€0.10-0.50 afhankelijk van pricing)
- **Winstmarge: 0-80%** ✅ Zeer gezond!

**Bottom Line:** Je pricing is economisch gezond. Het probleem is psychologie en communicatie, niet de daadwerkelijke waarde! 🎯
