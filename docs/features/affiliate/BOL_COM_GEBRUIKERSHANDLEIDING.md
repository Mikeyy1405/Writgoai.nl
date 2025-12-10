
# 📘 BOL.COM INTEGRATIE - COMPLETE GEBRUIKERSHANDLEIDING

## ✅ Wat is al Geïmplementeerd

De volledige Bol.com Marketing Catalog API integratie is **LIVE en werkend** op WritgoAI.nl!

### ✨ Functionaliteit
- ✅ OAuth 2.0 authenticatie
- ✅ Product zoeken via AI
- ✅ Product details automatisch ophalen
- ✅ Affiliate links automatisch genereren
- ✅ Real-time prijzen en ratings
- ✅ Hoge kwaliteit product afbeeldingen
- ✅ Veilige opslag van credentials per project

## 📋 Hoe Gebruik Je Het?

### Stap 1: Verkrijg Bol.com API Credentials

1. **Log in** op [Bol.com Affiliate Partner Platform](https://partnerplatform.bol.com)
   
2. **Navigeer naar API credentials**:
   - Klik op **Account** (rechtsboven)
   - Scroll naar beneden naar **Open API** sectie
   
3. **Maak nieuwe credentials aan**:
   - Klik op **Toevoegen**
   - Geef een naam: "WritgoAI Integration"
   - Klik **Opslaan**

4. **Kopieer credentials**:
   - **Client ID**: Direct zichtbaar (kopieer icoon rechtsboven)
   - **Client Secret**: Klik **Toon secret** → kopieer de geheime code
   
5. **Bewaar veilig** (je hebt deze maar 1x nodig per project)

### Stap 2: Configureer in WritgoAI Project

1. **Ga naar je Project**:
   ```
   WritgoAI.nl → Client Portal → Projects → [Selecteer Project]
   ```

2. **Vul Bol.com gegevens in**:
   - **Bol.com Client ID**: Plak de Client ID
   - **Bol.com Client Secret**: Plak de Client Secret
   - **Bol.com Affiliate ID** (optioneel): Voor commissie tracking
   - **Bol.com Enabled**: Schakel IN ✅

3. **Test de verbinding**:
   - Klik **Test Credentials**
   - Wacht op bevestiging: "Credentials zijn geldig! ✅"

4. **Sla op**:
   - Klik **Opslaan**
   - Credentials worden veilig opgeslagen in database

### Stap 3: Gebruik in Content Generatie

**Automatische Integratie:**

Wanneer je een blog, review of top lijst genereert:

1. **Kies je project** (met Bol.com ingeschakeld)

2. **Typ je onderwerp**, bijvoorbeeld:
   ```
   "Top 5 beste laptops voor studenten"
   "Review: HP Pavilion 15"
   "Beste draadloze koptelefoons onder €100"
   ```

3. **Klik Genereer Content**

4. **AI doet automatisch**:
   - ✅ Detecteert product keywords
   - ✅ Zoekt relevante producten op Bol.com
   - ✅ Haalt product details op (prijs, rating, specs)
   - ✅ Voegt affiliate links toe
   - ✅ Voegt product afbeeldingen toe

5. **Resultaat**:
   ```
   Blog met:
   - Product links naar Bol.com (met jouw affiliate ID)
   - Actuele prijzen
   - Ratings en reviews
   - Professionele product afbeeldingen
   ```

## 🎯 Voorbeelden

### Voorbeeld 1: Product Review
```
Onderwerp: "HP Pavilion 15 review 2024"

AI detecteert:
→ Type: Product Review
→ Product: HP Pavilion 15
→ Zoekt op Bol.com
→ Vindt: HP Pavilion 15-eg2100nd
→ Haalt op: Prijs (€599), Rating (4.5⭐), Specs
→ Genereert: Complete review met affiliate link
```

### Voorbeeld 2: Top Lijst
```
Onderwerp: "Top 10 beste smartphones 2024"

AI detecteert:
→ Type: Top Lijst  
→ Categorie: Smartphones
→ Zoekt populairste producten
→ Haalt top 10 op met prijzen en ratings
→ Genereert: Complete vergelijking met alle links
```

### Voorbeeld 3: Vergelijking
```
Onderwerp: "iPhone 15 vs Samsung Galaxy S24"

AI detecteert:
→ Type: Vergelijking
→ Producten: 2 smartphones
→ Zoekt beide producten
→ Haalt specs en prijzen op
→ Genereert: Uitgebreide vergelijking met pro's/con's
```

## 🔧 API Endpoints (voor developers)

### 1. Zoek Producten
```typescript
POST /api/client/bolcom/search-products
Body: {
  projectId: "project_id",
  query: "laptop",
  maxProducts: 5,
  mode: "full" | "quick"
}

Response: {
  success: true,
  products: [...],
  researchData: {...}
}
```

### 2. Test Credentials
```typescript
POST /api/client/bolcom/test-credentials
Body: {
  clientId: "...",
  clientSecret: "..."
}

Response: {
  success: true,
  message: "Credentials zijn geldig!"
}
```

## 📊 Beperkingen & Best Practices

### Beperkingen
- ❌ **Geen WordPress tracking code nodig** - Pure API integratie
- ✅ **Rate limits** - Bol.com heeft API rate limits (normaal geen probleem)
- ✅ **Cache** - Access tokens worden 5 minuten ge-cached
- ✅ **NL & BE** - Alleen Nederlandse en Belgische markt

### Best Practices
1. **Test credentials eerst** voordat je content genereert
2. **Gebruik specifieke product namen** voor betere resultaten
3. **Check affiliate ID** voor commissie tracking
4. **Update credentials** als je nieuwe krijgt van Bol.com

## 🐛 Troubleshooting

### "Bol.com integratie is niet ingeschakeld"
**Oplossing:**
1. Ga naar Project Settings
2. Vul Client ID + Client Secret in
3. Schakel "Bol.com Enabled" IN ✅
4. Klik Opslaan

### "Credentials zijn ongeldig"
**Oplossing:**
1. Check of Client ID correct is (geen spaties)
2. Check of Client Secret correct is (hoofdlettergevoelig!)
3. Log in op Bol.com Partner Platform
4. Maak nieuwe credentials aan indien nodig

### "Geen producten gevonden"
**Oplossing:**
1. Gebruik specifiekere zoektermen
2. Check of product beschikbaar is in NL/BE
3. Probeer andere keywords

### "API error 401 Unauthorized"
**Oplossing:**
- Token expired → wordt automatisch vernieuwd
- Check credentials opnieuw
- Wacht 1 minuut en probeer opnieuw

## 💰 Commissie & Verdienmodel

### Hoe verdien je commissie?

1. **Affiliate ID invullen** in Project Settings
2. **Content genereren** met product links
3. **Publiceren** naar WordPress
4. **Bezoekers klikken** op Bol.com links
5. **Commissie ontvangen** via Bol.com Partner Program

### Commissie Tracking
- Bol.com tracked automatisch via je Affiliate ID
- Bekijk je inkomsten in Bol.com Partner Dashboard
- Uitbetaling volgens Bol.com voorwaarden

## 📈 Tips voor Maximale Conversie

1. **Gebruik actuele prijzen** - API haalt real-time data op
2. **Toon ratings** - Sociale bewijskracht verhoogt conversie
3. **Meerdere producten** - Vergelijkingen werken goed
4. **Seizoensgebonden** - Black Friday, Sinterklaas, etc.
5. **Niche specifiek** - Focus op specifieke categorieën

## 🔒 Beveiliging & Privacy

✅ **Credentials veilig opgeslagen** in database (encrypted)
✅ **Niet zichtbaar in frontend** - Alleen server-side
✅ **Per project** - Elk project eigen credentials
✅ **Token cache** - Veilig in server memory (5 min)
✅ **HTTPS only** - Alle API calls via encrypted verbinding

## 📚 Documentatie & Hulp

### Officiële Bol.com Docs
- [Bol.com Marketing API](https://api.bol.com/marketing/catalog/docs/)
- [Partner Platform](https://partnerplatform.bol.com)

### WritgoAI Documentatie
- `/BOLCOM_INTEGRATION.md` - Technische documentatie
- `/lib/bolcom-api.ts` - API library code
- `/lib/bolcom-product-finder.ts` - AI product research

### Support
- Email: [je support email]
- Chat: WritgoAI.nl chatbot
- FAQ: [link naar FAQ]

---

## ✅ Checklist: Klaar voor Gebruik

Gebruik deze checklist om te controleren of alles correct is ingesteld:

- [ ] Bol.com Partner Account aangemaakt
- [ ] API Credentials verkregen (Client ID + Secret)
- [ ] Credentials ingevuld in WritgoAI Project
- [ ] "Bol.com Enabled" aangezet
- [ ] Credentials getest (groene vinkje ✅)
- [ ] Affiliate ID ingevuld (voor commissie)
- [ ] Test content gegenereerd
- [ ] Product links klikbaar in content
- [ ] Links bevatten Affiliate ID

**Als alle items ✅ zijn: Je bent klaar om te verdienen! 💰**

---

**Laatst bijgewerkt:** 3 november 2024  
**Versie:** 1.0  
**Status:** ✅ Live op WritgoAI.nl
