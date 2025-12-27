# Credits Opgelost - Het Werkte 2 Uur Geleden

## 🔴 Situatie

- ✅ Werkte 2 uur geleden perfect
- ✅ 41M credits ($20) op account
- ✅ Image generation (Flux) werkt NOG STEEDS
- ❌ Claude Sonnet 4.5 werkt NIET MEER sinds 2 uur
- ❌ Error: "Your credit balance is too low to access the Anthropic API"

## 🔍 Meest Waarschijnlijke Oorzaak

**AIML API heeft waarschijnlijk APARTE credit pools:**

1. **Algemene Credits** (41M) → Voor Flux image generation ✅
2. **Anthropic Credits** (0?) → Voor Claude models ❌

Of:

3. **Alle credits zijn opgeraakt** en de 41M die je ziet is een oud getal
4. **Rate limit** bereikt voor vandaag

## ✅ Directe Oplossing

### Stap 1: Check Exacte Credit Balance

Ga naar: **https://aimlapi.com/app/billing**

Kijk naar:
- 📊 **Total Credits**: Hoeveel heb je echt over?
- 📊 **Anthropic/Claude Credits**: Aparte pool?
- 📊 **Usage Today**: Hoeveel verbruikt vandaag?
- 📊 **Usage Last 2 Hours**: Wat is er gebeurd?

### Stap 2: Run Credit Check Script

```bash
npx tsx scripts/check-credit-balance.ts
```

Dit script:
- Probeert je credit balance op te halen
- Test een Claude API call
- Toont de exacte error
- Geeft je de volgende stappen

### Stap 3: Bekijk Usage History

Op AIML dashboard:
1. Kijk naar **Usage** of **History**
2. Sorteer op **Last 2 Hours**
3. Check hoeveel requests er zijn gedaan
4. Kijk of er veel Claude calls waren die credits hebben opgebruikt

## 💰 Mogelijk Probleem: Credits Verbruikt

Als je veel artikelen hebt gegenereerd:

**Per artikel worden gebruikt:**
- Outline generatie: ~500 tokens
- Intro: ~200 tokens
- Hoofdcontent (3-5 secties): ~3000 tokens
- Conclusie: ~200 tokens
- Social media post: ~100 tokens
- **TOTAAL per artikel: ~4000 tokens**

**Claude Sonnet 4.5 kosten (ongeveer):**
- Input: $3 per 1M tokens
- Output: $15 per 1M tokens
- **Gemiddeld: ~$0.06 per artikel** (4000 tokens output)

**Als je 41M credits had:**
- En je hebt bijv. 100 artikelen gegenereerd vandaag
- Dan kost dat: 100 × 4000 tokens = 400,000 tokens
- Ongeveer $6 aan credits
- Maar AIML credits ≠ dollars, dus dit kan sneller gaan

## 🔧 Mogelijke Fixes

### Fix 1: Credits Bijvullen

Ga naar: https://aimlapi.com/app/billing

Klik op **"Add Credits"** of **"Top Up"**

Voor pay-as-you-go:
- Voeg $10-$20 credits toe
- Dit zou genoeg moeten zijn voor duizenden artikelen

### Fix 2: Check of Aparte Anthropic Credits Nodig Zijn

Sommige AIML plannen hebben:
- Algemene credits voor alle models
- **Aparte Anthropic credits** voor Claude

Als dit zo is:
1. Koop specifiek "Anthropic Credits"
2. Of upgrade je plan naar één die Claude bevat

### Fix 3: Tijdelijk Terugvallen op GPT-4o

Als je DIRECT artikelen moet genereren terwijl je wacht:

Pas `/lib/ai-client.ts` aan:

```typescript
export const BEST_MODELS = {
  CONTENT: 'gpt-4o',        // Tijdelijk - werkt met algemene credits
  TECHNICAL: 'gpt-4o',
  QUICK: 'gpt-4o-mini',
  BUDGET: 'gpt-4o-mini',
  // CONTENT: 'anthropic/claude-sonnet-4.5',  // Terug naar Claude als credits er zijn
}
```

Commit en push → Render deploy automatisch → artikelen werken weer

### Fix 4: Rate Limit Check

Als het een rate limit is:
- Wacht 1 uur
- Probeer opnieuw
- Als het dan werkt → het was een rate limit
- Voeg rate limiting toe aan je code

## 📊 Monitoring

Check op AIML dashboard:
- **Huidige balance** (real-time)
- **Usage graph** (zie pieken)
- **Alerts** (stel in: "waarschuw bij < 1M credits")

## 🚨 Wat NU Te Doen

**Optie A: Credits Toevoegen (BESTE)**
```
1. https://aimlapi.com/app/billing
2. Add Credits → $20
3. Wacht 1-2 minuten
4. Test: npx tsx scripts/test-claude-model.ts
5. Als het werkt → klaar!
```

**Optie B: Tijdelijk GPT-4o (SNEL)**
```
1. Verander BEST_MODELS naar gpt-4o
2. git commit -m "Temp: switch to GPT-4o"
3. git push
4. Artikelen werken in 2 minuten
5. Switch terug naar Claude als credits er zijn
```

## 🎯 Preventie

Om dit in de toekomst te voorkomen:

1. **Credit Alerts Instellen**
   - AIML dashboard → Settings → Alerts
   - Stel in: "Email me bij < 5M credits"

2. **Usage Monitoring**
   - Check dagelijks je usage
   - Bereken: credits per artikel
   - Plan je budget

3. **Auto Top-Up**
   - Als AIML dit ondersteunt
   - Stel in: "Auto add $20 bij < 2M credits"

## 📞 Support

Als credits toevoegen niet helpt:

```
Subject: Claude werkte 2u geleden, nu credit error ondanks 41M credits

Hi AIML Support,

2 uur geleden werkten Claude models perfect.
Nu krijg ik: "credit balance too low"

Details:
- Account toont: 41M credits
- Image generation (Flux) werkt NOG STEEDS
- Alleen Claude models falen
- Model: anthropic/claude-sonnet-4.5

Zijn Anthropic credits een aparte pool?
Graag uitleg en oplossing.

Account: [je email]
```

## ✅ Success Check

Na het toevoegen van credits, test met:

```bash
npx tsx scripts/test-claude-model.ts
```

Als je ziet:
```
✅ Testing: anthropic/claude-sonnet-4.5
   ✅ SUCCESS!
   Response: "SUCCESS"
```

Dan is het **opgelost**! 🎉

---

**TL;DR:** Check https://aimlapi.com/app/billing en voeg credits toe. Waarschijnlijk zijn ze opgeraakt of is er een aparte Anthropic credit pool.
