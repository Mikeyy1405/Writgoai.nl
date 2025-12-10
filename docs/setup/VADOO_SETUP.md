
# 🎬 Vadoo AI Video Generator - Setup Instructies

## ⚠️ Huidige Status

**Probleem:** De Vadoo API geeft een error: `"Generation limits over, upgrade for more"`

Dit betekent dat je Vadoo account **geen credits meer heeft** of de **generatie limiet heeft bereikt**.

---

## 📋 Oplossingen

### Optie 1: Vadoo Account Upgraden (Aanbevolen) ✅

1. **Ga naar Vadoo.tv**
   - Open [https://vadoo.tv](https://vadoo.tv)
   - Log in met je account

2. **Check je huidige plan**
   - Ga naar Account Settings / Billing
   - Bekijk je huidige credits en limiet

3. **Upgrade je plan**
   - Kies een hoger plan met meer credits
   - Of koop extra credits bij

4. **Prijzen** (indicatief):
   - **Free:** Beperkt aantal video's
   - **Starter:** ~$20/maand - 50 video's
   - **Pro:** ~$50/maand - 150 video's
   - **Business:** ~$100/maand - 500 video's

---

### Optie 2: Nieuwe API Key Genereren

Als je een nieuwe account hebt gemaakt of je plan hebt geupgrade:

1. **Genereer nieuwe API key** op Vadoo.tv
2. **Update de .env file:**
   ```bash
   cd /home/ubuntu/writgo_planning_app/nextjs_space
   nano .env
   ```
3. **Vervang de oude key:**
   ```
   VADOO_API_KEY=jouw_nieuwe_api_key_hier
   ```
4. **Restart de app:**
   ```bash
   yarn build
   ```

---

### Optie 3: Alternatieve Video Generator Gebruiken

Als Vadoo niet beschikbaar is, zijn er alternatieven:

**1. Runway ML** (Premium)
- Website: [runwayml.com](https://runwayml.com)
- Prijs: ~$12-$95/maand
- Voordeel: Hoogste kwaliteit AI video's

**2. Synthesia** (Business Video's)
- Website: [synthesia.io](https://synthesia.io)
- Prijs: ~$22-$67/maand
- Voordeel: Realistische AI avatars

**3. Pictory** (Content to Video)
- Website: [pictory.ai](https://pictory.ai)
- Prijs: ~$19-$99/maand
- Voordeel: Makkelijk script to video

**4. InVideo AI** (Budget Friendly)
- Website: [invideo.io](https://invideo.io)
- Prijs: ~$15-$30/maand
- Voordeel: Goede prijs/kwaliteit

---

## 🧪 Test je Vadoo Account

Run deze test om te checken of Vadoo weer werkt:

```bash
cd /home/ubuntu
node test_vadoo_ai_story.js
```

Als je een `vid` terugkrijgt, werkt Vadoo weer! ✅

---

## 📊 Huidige Implementatie

WritgoAI gebruikt Vadoo voor:

1. **AI Story Videos** (`/api/vadoo/generate-story`)
   - Random AI Story
   - Scary Stories
   - Motivational
   - Bedtime Stories
   - Interesting History
   - Custom prompts

2. **AI DeepAgent Video's** (`/api/ai-agent/generate-video`)
   - Automatische video generatie via chat
   - Custom prompts
   - Brand-specific content

3. **Video Features:**
   - ✅ Multiple voices (Charlie, George, Callum, Sarah, etc.)
   - ✅ Multiple themes (Hormozi_1, Beast, Tracy, etc.)
   - ✅ Multiple durations (30-60s, 60-90s, etc.)
   - ✅ Multiple aspect ratios (9:16, 16:9, 1:1)
   - ✅ Background music support
   - ✅ Custom instructions
   - ✅ Multi-language support (incl. Dutch)

---

## 🔧 Error Handling

De app heeft nu betere error handling:

- ✅ Duidelijke melding als Vadoo credits op zijn
- ✅ Geen credits worden afgetrokken van WritgoAI account
- ✅ Gebruikers krijgen instructies om Vadoo te upgraden
- ✅ Fallback voor wanneer video generatie faalt

---

## 💡 Beste Praktijken

1. **Monitor je Vadoo credits** regelmatig
2. **Gebruik video's alleen wanneer nodig** (niet voor elke vraag)
3. **Cache gegenereerde video's** om duplicaten te voorkomen
4. **Stel webhooks in** voor async video processing
5. **Implementeer rate limiting** om kosten te beheersen

---

## 📞 Support

- **Vadoo Support:** [support@vadoo.tv](mailto:support@vadoo.tv)
- **WritgoAI Support:** Mike Schonewille

---

## ✅ Checklist

- [ ] Vadoo account geupgrade
- [ ] Nieuwe API key gegenereerd (indien nodig)
- [ ] .env file bijgewerkt
- [ ] App opnieuw gebuild
- [ ] Test gedraaid (`test_vadoo_ai_story.js`)
- [ ] Video generatie succesvol getest in app

---

**Laatste update:** 25 oktober 2025  
**Status:** ⚠️ Wachten op Vadoo account upgrade
