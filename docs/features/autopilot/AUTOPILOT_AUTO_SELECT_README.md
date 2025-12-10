# Autopilot - Automatische Artikel Selectie

## 🎯 Overzicht

De **Automatische Selectie** functie maakt het mogelijk om Autopilot planningen aan te maken **zonder handmatig artikelen te selecteren**. De AI kiest automatisch de beste artikelen op basis van:

- ⭐ **Prioriteit** (Hoog → Gemiddeld → Laag)
- 🎯 **AI Score** (hoe goed past het artikel in je strategie)
- 📈 **Trending Topics** (actuele en populaire onderwerpen)
- 🔄 **Competitie Gap** (onderwerpen waar je concurrentie nog niet over schrijft)

## 🚀 Hoe Het Werkt

### 1. Open de Autopilot Pagina
Ga naar: **https://WritgoAI.nl/client-portal/autopilot**

### 2. Klik op "Plan Automatisch"
Je ziet nu altijd een knop **"Plan Automatisch"** beschikbaar, zelfs zonder handmatige selectie.

### 3. Configureer Je Planning

In het planning dialoog zie je bovenaan een **paarse balk** met:

```
🤖 Automatische selectie
   AI kiest automatisch de beste artikelen zonder handmatige selectie
   [✓] (checkbox)
```

**Standaard staat deze AAN** - je hoeft niets te doen!

### 4. Stel Je Instellingen In

Configureer gewoon je planning zoals normaal:

- **Naam planning**: Bijv. "Dagelijkse blog content"
- **Frequentie**: 1x per dag, 2x per dag, wekelijks, etc.
- **Tijd van dag**: Wanneer content gegenereerd moet worden
- **Content type**: Blog posts, social media, of beide
- **Artikelen per run**: Hoeveel artikelen per keer
- **Content instellingen**:
  - ✅ Affiliate links uit project
  - ✅ Bol.com producten zoeken
  - ✅ Afbeeldingen genereren
  - ✅ Automatisch publiceren naar WordPress

### 5. Klik "Planning Aanmaken"

Dat's alles! De Autopilot start automatisch op de ingestelde tijden en kiest zelf de beste artikelen.

## 🎨 Handmatige Selectie (Optioneel)

Wil je toch specifieke artikelen selecteren? Dat kan ook:

1. Schakel **"Automatische selectie"** uit in het planning dialoog
2. Selecteer handmatig je gewenste artikelen in de lijst
3. Maak de planning aan

## 📋 Voorbeeld Scenario

**Situatie**: Je wilt elke ochtend om 9:00 automatisch 1 blog artikel laten genereren.

**Stappen**:
1. Klik op "Plan Automatisch"
2. Naam: "Dagelijkse blog"
3. Frequentie: "1x per dag"
4. Tijd: "09:00"
5. Artikelen per run: "1"
6. Klik "Planning aanmaken"

**Resultaat**: 
- Elke dag om 09:00 genereert de AI automatisch het beste artikel uit je content kalender
- Artikel wordt gegenereerd met bol.com producten en afbeeldingen
- Automatisch gepubliceerd naar je WordPress
- Je hoeft NIETS te doen! 🎉

## 🤖 AI Selectie Logica

De AI kiest artikelen op basis van deze volgorde:

1. **Status**: Alleen "Idee" status artikelen (nog niet gegenereerd)
2. **Prioriteit**: Hoog → Gemiddeld → Laag
3. **AI Score**: Artikelen met de hoogste score eerst
4. **Trending**: Actuele en populaire onderwerpen krijgen voorrang
5. **Competitie Gap**: Unieke onderwerpen waar concurrentie niet over schrijft

## 💡 Tips

✅ **Automatische selectie is ideaal voor**:
- Dagelijkse content generatie zonder tussenkomst
- Wanneer je een grote content kalender hebt
- Continue flow van verse content

⚠️ **Handmatige selectie is beter voor**:
- Specifieke campagnes
- Seizoensgebonden content
- Wanneer je exact wilt bepalen wat gepubliceerd wordt

## 🔧 Technische Details

### Database
Het `autoSelectMode` veld wordt opgeslagen in de `AutopilotSchedule` tabel:

```typescript
{
  autoSelectMode: Boolean,  // true = automatisch, false = handmatig
  articleIds: String[],     // Leeg array bij auto-select
  articlesPerRun: Int,      // Hoeveel artikelen per keer
}
```

### API Endpoint
```
POST /api/client/autopilot/schedule
{
  "autoSelectMode": true,
  "articleIds": [],  // Leeg bij auto-select
  "articlesPerRun": 1
}
```

## 🎉 Voordelen

1. **Zero-Touch Content Generatie** - Stel één keer in, werkt automatisch
2. **Intelligente Selectie** - AI kiest altijd de beste artikelen
3. **Tijdsbesparing** - Geen handmatige selectie meer nodig
4. **Strategische Keuzes** - Gebaseerd op data en AI analyse
5. **Schaalbaarheid** - Werkt met kleine én grote content kalenders

## 📞 Hulp Nodig?

Heb je vragen of problemen met de automatische selectie? Neem contact op via de feedback knop in WritgoAI!
