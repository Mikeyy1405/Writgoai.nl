
# Autopilot SEO Opties - Feature Documentatie

## Overzicht
Gebruikers kunnen nu per project configureren welke SEO-elementen automatisch in de gegenereerde content moeten worden opgenomen. Deze feature geeft granulaire controle over de content structuur en SEO-optimalisatie.

## Nieuwe Functionaliteit

### SEO Elementen
De volgende SEO-elementen kunnen nu aan/uit worden gezet per project:

#### 1. **FAQ Sectie** (standaard: AAN)
- Voegt automatisch 5-7 veelgestelde vragen en antwoorden toe
- Geoptimaliseerd voor "People Also Ask" in Google
- Natuurlijke vragen met uitgebreide antwoorden
- Verbetert engagement en dwell time

#### 2. **Direct Answer Box** (standaard: AAN)
- Featured snippet optimization
- Highlighted answer box bovenaan artikel
- Oranje styling voor extra aandacht
- Perfect voor "hoe", "wat is", "waarom" queries
- Verhoogt kans op positie 0 in Google

#### 3. **YouTube Video** (standaard: UIT)
- Embed relevante YouTube video in artikel
- Verhoogt engagement en tijd op pagina
- Responsive iframe implementatie
- Automatische selectie van relevante video

## Technische Implementatie

### Database Schema
Drie nieuwe velden toegevoegd aan `Project` model:
```prisma
autopilotIncludeFAQ      Boolean @default(true)
autopilotIncludeDirectAnswer Boolean @default(true)
autopilotIncludeYouTube  Boolean @default(false)
```

### API Endpoints

#### GET `/api/client/autopilot/settings`
Haalt project-specifieke autopilot instellingen op, inclusief SEO opties.

**Response:**
```json
{
  "success": true,
  "settings": {
    "projectId": "...",
    "enabled": true,
    "includeFAQ": true,
    "includeDirectAnswer": true,
    "includeYouTube": false,
    // ... andere settings
  }
}
```

#### PUT `/api/client/autopilot/settings`
Slaat project-specifieke autopilot instellingen op.

**Request:**
```json
{
  "projectId": "...",
  "enabled": true,
  "includeFAQ": true,
  "includeDirectAnswer": true,
  "includeYouTube": false,
  // ... andere settings
}
```

### Cron Job Integratie
De autopilot cron job (`/api/cron/autopilot-projects`) geeft deze instellingen automatisch door:

```typescript
const generateResponse = await fetch(`${process.env.NEXTAUTH_URL}/api/client/autopilot/generate`, {
  method: 'POST',
  body: JSON.stringify({
    articleId: article.id,
    projectId: project.id,
    clientId: project.clientId,
    jobId: job.id,
    includeFAQ: project.autopilotIncludeFAQ ?? true,
    includeDirectAnswer: project.autopilotIncludeDirectAnswer ?? true,
    includeYouTube: project.autopilotIncludeYouTube ?? false,
  }),
});
```

## Gebruikersinterface

### Locatie
**Autopilot Instellingen Dialog** → **SEO Elementen** sectie

### UI Componenten
- Duidelijke toggle switches voor elke optie
- Beschrijvende labels met uitleg
- Visuele scheiding met border-top
- Responsive design voor mobiel en desktop

### Layout
```
┌─────────────────────────────────────────┐
│ Autopilot Instellingen                  │
├─────────────────────────────────────────┤
│ [Basisinstellingen...]                  │
│                                         │
│ ─────── SEO Elementen ───────           │
│                                         │
│ □ FAQ Sectie                            │
│   Voegt 5-7 vragen/antwoorden toe       │
│                                         │
│ □ Direct Answer Box                     │
│   Featured snippet optimization         │
│                                         │
│ □ YouTube Video                         │
│   Relevante video embed                 │
└─────────────────────────────────────────┘
```

## Gebruik

### Stap 1: Autopilot Openen
1. Ga naar **Client Portal → Autopilot**
2. Selecteer een project
3. Klik op **"⚙️ Autopilot Instellingen"**

### Stap 2: SEO Opties Configureren
1. Scroll naar **"SEO Elementen"** sectie
2. Toggle de gewenste opties aan/uit:
   - ✅ **FAQ Sectie** - Voor FAQ-optimalisatie
   - ✅ **Direct Answer Box** - Voor featured snippets
   - ☐ **YouTube Video** - Voor video content

### Stap 3: Opslaan
1. Klik op **"Opslaan"**
2. Instellingen worden direct toegepast op nieuwe autopilot runs

## Best Practices

### Wanneer FAQ Inschakelen?
✅ **Gebruik bij:**
- Informationele content ("hoe", "wat", "waarom")
- Tutorial/guide artikelen
- Product uitleg
- Veelgestelde onderwerpen

❌ **Vermijd bij:**
- Korte nieuws updates
- Product reviews (al FAQ in template)
- Landing pages met specifieke CTA focus

### Wanneer Direct Answer Box Inschakelen?
✅ **Gebruik bij:**
- Definitie artikelen ("wat is...")
- Quick answer queries
- Instructie content
- Comparison artikelen

❌ **Vermijd bij:**
- Narrative content
- Verhalen/casestudies
- Content waar je engagement wilt stimuleren

### Wanneer YouTube Video Inschakelen?
✅ **Gebruik bij:**
- Tutorial content
- Product reviews met video beschikbaar
- How-to guides
- Visual-heavy topics

❌ **Vermijd bij:**
- Text-only niches
- Snelle updates
- Content waar video afleidt van doel

## SEO Impact

### FAQ Sectie
- **Structured Data**: Automatisch schema.org markup
- **Featured Snippets**: Verhoogde kans op "People Also Ask"
- **Dwell Time**: Langere tijd op pagina
- **Internal Linking**: Meer context voor crawlers

### Direct Answer Box
- **Position Zero**: Optimaal voor featured snippets
- **CTR**: Hogere click-through rate
- **User Intent**: Direct antwoord op query
- **Authority**: Verhoogde perceived expertise

### YouTube Video
- **Engagement**: Langere sessie duur
- **Multi-media**: Verhoogde content waarde
- **Social Signals**: Meer shares/interaction
- **Accessibility**: Verschillende leer-stijlen

## Migratie & Backwards Compatibility

### Bestaande Projecten
Alle bestaande projecten krijgen automatisch de standaard waarden:
- `includeFAQ`: `true`
- `includeDirectAnswer`: `true`
- `includeYouTube`: `false`

### Database Migratie
```sql
-- Automatisch uitgevoerd via Prisma Migrate
ALTER TABLE "Project" 
  ADD COLUMN "autopilotIncludeFAQ" BOOLEAN DEFAULT true,
  ADD COLUMN "autopilotIncludeDirectAnswer" BOOLEAN DEFAULT true,
  ADD COLUMN "autopilotIncludeYouTube" BOOLEAN DEFAULT false;
```

## Troubleshooting

### FAQ's verschijnen niet in content
**Oplossing:**
1. Check of `includeFAQ` is ingeschakeld in project settings
2. Verifieer dat artikel niet al een FAQ sectie heeft
3. Controleer logs voor AI generation errors

### Direct Answer Box styling incorrect
**Oplossing:**
1. Check of WordPress theme CSS overschrijft
2. Verifieer HTML structure in gegenereerde content
3. Test met verschillende browsers

### YouTube video laadt niet
**Oplossing:**
1. Check of video URL valid is
2. Verifieer embed permissions
3. Test iframe op WordPress site

## Credits Gebruik

### Per Feature
- **FAQ Sectie**: +100 tokens (~0.001 credits)
- **Direct Answer Box**: +50 tokens (~0.0005 credits)
- **YouTube Video**: +150 tokens (~0.0015 credits)

### Totaal Impact
- Maximale overhead: ~300 tokens per artikel
- Verwaarloosbaar t.o.v. totale generatie cost
- ROI: Hogere SEO waarde compenseert kleine cost

## Toekomstige Uitbreidingen

### Geplande Features
1. **Table of Contents** - Automatische inhoudsopgave
2. **Related Articles** - Internal linking suggesties
3. **Key Takeaways** - Samenvatting bovenaan
4. **Expert Quotes** - Authority building
5. **Infographics** - Visual content generation

## Technische Details

### Gewijzigde Bestanden
```
prisma/schema.prisma                          # Database schema
prisma/migrations/[timestamp]_add_seo_options # Database migratie
app/api/client/autopilot/settings/route.ts   # Settings API
app/api/cron/autopilot-projects/route.ts     # Cron job
app/client-portal/autopilot/page.tsx          # UI component
```

### Code Voorbeelden

#### Settings Opslaan
```typescript
const response = await fetch('/api/client/autopilot/settings', {
  method: 'PUT',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    projectId: 'project_123',
    includeFAQ: true,
    includeDirectAnswer: true,
    includeYouTube: false,
  }),
});
```

#### Settings Ophalen
```typescript
const response = await fetch(`/api/client/autopilot/settings?projectId=${projectId}`);
const { settings } = await response.json();
console.log(settings.includeFAQ); // true
```

## Status

✅ **Geïmplementeerd en Live**
- Database schema: Compleet
- API endpoints: Werkend
- UI: Geïmplementeerd
- Cron job: Geïntegreerd
- Testing: Geslaagd
- Deployment: WritgoAI.nl
- Documentatie: Compleet

## Support & Vragen

Voor vragen of problemen:
1. Check deze documentatie
2. Test in development environment
3. Verifieer logs in admin panel
4. Neem contact op met support

---

**Laatste Update**: 8 November 2025  
**Versie**: 1.0.0  
**Status**: ✅ Production Ready
