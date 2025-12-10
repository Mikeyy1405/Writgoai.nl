
# Keyword Research Autopilot Functionaliteit

## Overzicht

De Keyword Research & Content Planning tool heeft nu een geïntegreerde **autopilot functionaliteit** waarmee gebruikers direct vanuit hun content ideeën automatische content generatie kunnen instellen.

## Nieuwe Functionaliteit

### 1. Posting Frequentie per Content Idee

Gebruikers kunnen nu voor elk content idee een posting frequentie instellen:

- **Eenmalig**: Genereer het artikel één keer
- **Dagelijks**: Genereer automatisch elke dag
- **Wekelijks**: Genereer automatisch elke week
- **Maandelijks**: Genereer automatisch elke maand

### 2. Directe Integratie met Blog Generator

Elk content idee heeft twee acties:

#### "Nu Schrijven" Button
- Opens de blog generator met alle relevante informatie pre-filled
- Keywords, titel, content type, en andere metadata worden automatisch overgenomen
- Gebruiker kan direct beginnen met schrijven

#### "Automatiseren" Dropdown
- Selecteer een posting frequentie
- Artikel wordt automatisch gegenereerd volgens het schema
- Content wordt opgeslagen in de bibliotheek
- Automatische publicatie naar WordPress (indien geconfigureerd)

## Database Schema Updates

### ArticleIdea Model - Nieuwe Velden

```prisma
model ArticleIdea {
  // ... bestaande velden
  
  // Autopilot instellingen
  isScheduledForAutopilot Boolean   @default(false)
  autopilotFrequency     String?    // once, daily, weekly, monthly
  autopilotNextRun       DateTime?  // Volgende geplande generatie
  autopilotLastRun       DateTime?  // Laatste keer gegenereerd
  
  @@index([isScheduledForAutopilot])
  @@index([autopilotNextRun])
}
```

## API Endpoints

### POST /api/client/article-ideas/schedule

Schakel autopilot in/uit voor een specifiek article idea.

**Request Body:**
```json
{
  "ideaId": "clxx...",
  "isScheduled": true,
  "frequency": "weekly"  // once, daily, weekly, monthly
}
```

**Response:**
```json
{
  "success": true,
  "idea": { ... },
  "message": "Autopilot ingeschakeld: artikel wordt wekelijks gegenereerd"
}
```

### GET /api/client/article-ideas/schedule

Haal alle geplande article ideas op voor de ingelogde client.

**Response:**
```json
{
  "success": true,
  "scheduledIdeas": [...],
  "count": 5
}
```

## Cron Job Updates

De bestaande `autopilot-content` cron job is uitgebreid met twee stappen:

### STAP 1: Individueel Geplande Ideas
- Controleert alle ArticleIdea records met `isScheduledForAutopilot = true`
- Genereert artikelen die gepland staan (`autopilotNextRun <= now`)
- Slaat content op in SavedContent
- Publiceert naar WordPress (indien geconfigureerd)
- Update status naar 'published'
- Bereken volgende run voor herhalende schedules
- Schakel uit voor eenmalige runs

### STAP 2: Autopilot Configuraties
- Bestaande logica voor AutopilotConfig records
- Selecteert artikel ideeën uit keyword research
- Genereert content volgens configuratie

## UI Components

### ContentIdeasList Component

Locatie: `/app/client-portal/content-research/content-ideas-list.tsx`

**Features:**
- Toont alle content ideeën met metadata
- "Nu Schrijven" knop voor directe artikel generatie
- "Automatiseren" dropdown voor scheduling
- Real-time status updates (volgende run tijd)
- Visual indicators voor:
  - Trending topics
  - Competitor gaps
  - High priority items
  - Scheduled autopilot status

**Props:**
```typescript
interface ContentIdeasListProps {
  ideas: ArticleIdea[];
  onRefresh: () => void;
}
```

## Workflow

### 1. Content Research Flow

```
Keyword Research Tool
  ↓
Generate Content Ideas (30-50 ideas)
  ↓
Voor elk idee:
  → "Nu Schrijven" → Blog Generator (pre-filled)
  → "Automatiseren" → Autopilot Schedule
```

### 2. Autopilot Flow

```
Gebruiker selecteert frequentie
  ↓
ArticleIdea.isScheduledForAutopilot = true
  ↓
Cron job draait elk uur
  ↓
Check autopilotNextRun <= now
  ↓
Genereer artikel via /api/client/generate-article
  ↓
Sla op in SavedContent
  ↓
Publiceer naar WordPress
  ↓
Update ArticleIdea status
  ↓
Bereken volgende run (of schakel uit)
```

## Frequentie Berekening

```typescript
// Eenmalig
nextRun = now + 5 minuten (directe uitvoering)
na uitvoering: isScheduledForAutopilot = false

// Dagelijks
nextRun = now + 1 dag

// Wekelijks
nextRun = now + 7 dagen

// Maandelijks
nextRun = now + 1 maand
```

## Content Type Mapping

De content types van keyword research worden automatisch gemapped naar blog generator types:

```typescript
const typeMap = {
  'listicle': 'listicle',
  'comparison': 'product_review',
  'review': 'product_review',
  'howto': 'normal',
  'guide': 'normal',
  'commercial': 'normal'
};
```

## Features

### ✅ Geïmplementeerd

1. **Per-idee scheduling**: Elk content idee kan individueel worden gepland
2. **Flexibele frequenties**: Eenmalig, dagelijks, wekelijks, maandelijks
3. **Auto-generatie**: Volledige artikel generatie met AI
4. **Auto-publicatie**: Directe publicatie naar WordPress
5. **Library storage**: Automatisch opslaan in Content Library
6. **Status tracking**: Real-time status en volgende run informatie
7. **Credit check**: Controleert beschikbare credits voor uitvoering
8. **Error handling**: Robuuste foutafhandeling met logging
9. **Repeat scheduling**: Automatische herplanning voor herhalende schedules
10. **One-time execution**: Auto-disable na eenmalige uitvoering

### 🔄 Integratie met Bestaande Features

- ✅ Keyword Research & Content Planning
- ✅ Blog Generator (alle content types)
- ✅ Content Library
- ✅ WordPress Publisher
- ✅ Credit System
- ✅ Project Management

## Gebruik

### Voor Gebruikers

1. **Keyword Research Uitvoeren**
   - Ga naar "Content Research"
   - Klik op "Start Research"
   - Wacht tot 30-50 content ideeën zijn gegenereerd

2. **Direct Schrijven**
   - Klik op "Nu Schrijven" bij een idee
   - Blog generator opent met pre-filled data
   - Begin direct met schrijven/genereren

3. **Automatiseren**
   - Selecteer een frequentie in de dropdown
   - Artikel wordt automatisch gegenereerd volgens schema
   - Check status in de Content Library

4. **Beheren**
   - Zie volgende run tijd bij elk gepland idee
   - Schakel uit door "Niet automatisch" te selecteren
   - Wijzig frequentie op elk moment

### Voor Developers

1. **Database Migration**
   ```bash
   cd nextjs_space
   yarn prisma generate
   ```

2. **Cron Job Setup**
   - Cron job draait automatisch elk uur
   - Endpoint: `/api/cron/autopilot-content`
   - Beveiligd met `CRON_SECRET`

3. **Testing**
   ```bash
   # Manual trigger voor testing
   curl -X POST http://localhost:3000/api/cron/autopilot-content \
     -H "Authorization: Bearer $CRON_SECRET"
   ```

## Technische Details

### Credit Usage

Elk automatisch gegenereerd artikel gebruikt:
- ~30-50 credits voor artikel generatie (afhankelijk van lengte)
- Extra credits voor afbeeldingen en video's (indien ingeschakeld)

### WordPress Integration

Autopilot gebruikt de bestaande WordPress publisher:
- Respecteert forbidden words
- Past blog styling toe
- Voegt tags en categorieën toe
- Publiceert direct of als draft (configureerbaar)

### Performance

- Batch processing: Meerdere ideas kunnen tegelijk worden verwerkt
- Async execution: Geen blocking van andere processen
- Error recovery: Failed generations worden opnieuw geprobeerd
- Rate limiting: Respecteert API limits

## Monitoring

### Logs

Alle autopilot activiteiten worden gelogd:
```
🤖 Autopilot cron job gestart...
📋 STAP 1: Controleren individueel geplande article ideas...
📊 Gevonden 3 individueel geplande article ideas
🚀 Verwerken individueel gepland idee: [titel]
✍️ Start generatie van listicle artikel...
✅ Artikel gegenereerd: [titel]
💾 Opslaan in bibliotheek...
🌐 Publiceren naar WordPress...
✅ Gepubliceerd naar WordPress: [URL]
🔄 Volgende run gepland voor: [datum]
```

### Response Format

```json
{
  "success": true,
  "individualIdeas": {
    "processed": 3,
    "results": [
      {
        "ideaId": "clxx...",
        "success": true,
        "articleTitle": "...",
        "published": true,
        "repeating": true
      }
    ]
  },
  "autopilotConfigs": {
    "processed": 2,
    "results": [...]
  },
  "totalProcessed": 5
}
```

## Troubleshooting

### Content wordt niet gegenereerd

1. Check credits: Voldoende credits beschikbaar?
2. Check schedule: Is `autopilotNextRun` in het verleden?
3. Check status: Is `isScheduledForAutopilot` = true?
4. Check logs: Bekijk cron job output

### WordPress publicatie mislukt

1. Check WordPress credentials
2. Check WordPress URL
3. Check verbinding met WordPress site
4. Content wordt wel opgeslagen in bibliotheek

### Frequentie werkt niet

1. Check `autopilotFrequency` waarde
2. Check `autopilotNextRun` datum
3. Check of cron job draait
4. Manual trigger voor testing

## Future Enhancements

Mogelijke uitbreidingen:
- [ ] Batch scheduling voor meerdere ideas tegelijk
- [ ] Custom tijden voor publicatie (bijvoorbeeld altijd 9:00)
- [ ] A/B testing voor verschillende content varianten
- [ ] Analytics integratie voor performance tracking
- [ ] Smart scheduling op basis van beste publicatie tijden
- [ ] Priority-based queue voor high-priority items
- [ ] Email notificaties bij successful/failed generations

## Changelog

### Version 1.0.0 (2024-11-02)

**Added:**
- Individual article idea scheduling
- Flexible frequency options (once, daily, weekly, monthly)
- Auto-generation and auto-publication
- Integration with blog generator
- ContentIdeasList component
- Schedule API endpoints
- Cron job enhancements
- Real-time status tracking

**Updated:**
- ArticleIdea model with autopilot fields
- Content Research UI with new component
- Cron job to handle individual schedules
- Documentation

---

**Live op:** [https://WritgoAI.nl](https://WritgoAI.nl)

**Contact:** Voor vragen of issues, neem contact op via de client portal.
