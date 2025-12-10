
# Autopilot - Automatische Content Generatie & Publicatie

## Overzicht

De Autopilot functie is een krachtige automatiseringstool die automatisch content genereert en publiceert op basis van keyword research onderwerpen. Het systeem gebruikt de artikelideeën uit je keyword research om op regelmatige basis nieuwe artikelen te schrijven, op te slaan in de bibliotheek en te publiceren naar WordPress.

## Belangrijkste Functies

### 🤖 Automatische Content Generatie
- Selecteert automatisch onderwerpen uit je keyword research (ArticleIdea tabel)
- Gebruikt de blog generator API om professionele artikelen te schrijven
- Respecteert alle content types: normale blogs, product reviews, listicles, etc.
- Houdt rekening met forbidden words en schrijfstijl

### 📅 Flexibele Planning
- **Dagelijks** - Elke dag een nieuw artikel
- **2x per week** - Om de 3-4 dagen
- **Wekelijks** - Elke 7 dagen
- **Om de 2 weken** - Elke 14 dagen
- **Maandelijks** - Elke maand

### 💾 Bibliotheek Integratie
- Alle gegenereerde artikelen worden automatisch opgeslagen in de Content Bibliotheek
- Status wordt gezet op "gepubliceerd" als auto-publicatie aan staat
- Status "concept" als alleen opslaan is ingeschakeld

### 📤 WordPress Auto-Publicatie
- Publiceert direct naar je WordPress website als ingeschakeld
- Behoudt alle metadata (SEO titel, beschrijving, keywords)
- Voegt correct categorieën en tags toe
- Update WordPressPostId en URL in SavedContent

### 📊 Statistieken & Monitoring
- Totaal aantal gegenereerde artikelen
- Totaal aantal gepubliceerde artikelen
- Laatste run datum
- Volgende geplande publicatie

## Database Schema

### AutopilotConfig Model

```prisma
model AutopilotConfig {
  id                    String   @id @default(cuid())
  clientId              String   @unique
  client                Client   @relation(fields: [clientId], references: [id], onDelete: Cascade)
  
  // Status
  isActive              Boolean  @default(false)
  
  // Content settings
  keywords              String[] // Keywords voor content generatie
  contentInterval       String   // daily, twice_weekly, weekly, bi_weekly, monthly
  
  // Generatie instellingen
  contentType           String   @default("mixed") // normal, product_review, listicle, mixed
  targetWordCount       Int      @default(1500)
  includeImages         Boolean  @default(true)
  includeYoutubeVideos  Boolean  @default(true)
  
  // Publicatie instellingen
  autoPublish           Boolean  @default(true)
  saveToLibrary         Boolean  @default(true)
  
  // Planning
  preferredPublishTime  String?  // "09:00" (UTC)
  lastRunDate           DateTime?
  nextRunDate           DateTime?
  
  // Statistieken
  totalArticlesGenerated Int     @default(0)
  totalArticlesPublished Int     @default(0)
  
  createdAt             DateTime @default(now())
  updatedAt             DateTime @updatedAt
}
```

## Content Generatie Flow

### 1. Artikel Selectie
```typescript
// Kies het eerste beschikbare artikel idee met hoogste prioriteit
const articleIdea = await prisma.articleIdea.findFirst({
  where: {
    clientId: clientId,
    status: "idea", // Alleen nieuwe ideeën
  },
  orderBy: {
    priority: "desc", // Hoogste prioriteit eerst
  },
});
```

### 2. Content Type Mapping
```typescript
// Map ArticleIdea contentType naar blog generator type
const typeMap = {
  listicle: "listicle",
  comparison: "product_review",
  review: "product_review",
  howto: "normal",
  guide: "normal",
  commercial: "normal",
};
```

### 3. Artikel Generatie
```typescript
const response = await fetch("/api/client/generate-article", {
  method: "POST",
  body: JSON.stringify({
    topic: articleIdea.title,
    keywords: articleIdea.focusKeyword,
    additionalKeywords: articleIdea.secondaryKeywords,
    contentType: blogType,
    wordCount: config.targetWordCount,
    includeImages: config.includeImages,
    includeYoutubeVideos: config.includeYoutubeVideos,
    contentTypeInfo: articleIdea.contentType, // Voor specifieke instructies
    autopilot: true,
  }),
});
```

### 4. Opslaan in Bibliotheek
```typescript
const savedContent = await prisma.savedContent.create({
  data: {
    clientId: config.clientId,
    projectId: primaryProject.id,
    title: articleData.title,
    content: articleData.content,
    contentType: blogType,
    seoTitle: articleData.seoTitle,
    metaDescription: articleData.metaDescription,
    focusKeyword: articleIdea.focusKeyword,
    keywords: articleIdea.secondaryKeywords,
    status: config.autoPublish ? "published" : "concept",
    wordCount: articleData.content.length,
  },
});
```

### 5. WordPress Publicatie
```typescript
if (config.autoPublish && client.wordpressUrl) {
  const publishResponse = await fetch("/api/client/publish-to-wordpress", {
    method: "POST",
    body: JSON.stringify({
      clientEmail: client.email,
      title: articleData.title,
      content: articleData.content,
      excerpt: articleData.metaDescription,
      status: "publish",
      categories: [articleIdea.category],
      tags: articleIdea.secondaryKeywords,
    }),
  });
  
  // Update SavedContent met WordPress info
  await prisma.savedContent.update({
    where: { id: savedContentId },
    data: {
      wordpressPostId: publishData.postId,
      wordpressUrl: publishData.postUrl,
      publishedAt: new Date(),
    },
  });
}
```

### 6. Status Updates
```typescript
// Update ArticleIdea status
await prisma.articleIdea.update({
  where: { id: articleIdea.id },
  data: {
    status: config.autoPublish ? "published" : "completed",
    hasContent: true,
    contentId: savedContentId,
    generatedAt: new Date(),
    publishedAt: config.autoPublish ? new Date() : null,
  },
});

// Update Autopilot statistieken
await prisma.autopilotConfig.update({
  where: { id: config.id },
  data: {
    totalArticlesGenerated: { increment: 1 },
    totalArticlesPublished: config.autoPublish ? { increment: 1 } : undefined,
    lastRunDate: new Date(),
  },
});
```

## Cron Job Setup

### API Endpoint
`/api/cron/autopilot-content`

### Schedule
De cron job moet elk uur worden uitgevoerd om te controleren of er autopilot taken moeten worden uitgevoerd.

### Beveiliging
```typescript
const authHeader = request.headers.get("authorization");
if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
  return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
}
```

### Environment Variable
```env
CRON_SECRET=your_secure_random_string_here
```

### Vercel Cron Configuration
In `vercel.json`:
```json
{
  "crons": [
    {
      "path": "/api/cron/autopilot-content",
      "schedule": "0 * * * *"
    }
  ]
}
```

Of gebruik externe cron service (zoals cron-job.org):
- URL: `https://WritgoAI.nl/api/cron/autopilot-content`
- Method: GET
- Headers: `Authorization: Bearer YOUR_CRON_SECRET`
- Schedule: Every hour

## Gebruikershandleiding

### Autopilot Configureren

1. **Ga naar Autopilot**
   - Klik op "Autopilot" in het client portal
   - Je ziet een prominente kaart op het dashboard

2. **Voeg Keywords Toe**
   - Voeg minimaal 1 keyword toe
   - Deze worden gebruikt om relevant content ideeën te matchen
   - Je kunt meerdere keywords toevoegen

3. **Kies Planning**
   - Selecteer hoe vaak nieuwe content moet worden gegenereerd
   - Kies de gewenste publicatie tijd (UTC)
   - Conversie: NL tijd - 1 uur (winter) of - 2 uur (zomer)

4. **Configureer Content Instellingen**
   - **Content Type**: Normal, Product Review, Listicle of Mixed
   - **Aantal woorden**: 500-5000 (default: 1500)
   - **Afbeeldingen**: Automatisch relevante afbeeldingen toevoegen
   - **YouTube video's**: Relevante video's embedden

5. **Publicatie Instellingen**
   - **Auto Publiceren**: Direct naar WordPress publiceren
   - **Bibliotheek**: Opslaan in Content Bibliotheek

6. **Opslaan & Activeren**
   - Klik op "Instellingen Opslaan"
   - Klik op "Start Autopilot" om te activeren

### Autopilot Pauzeren
- Klik op "Pauzeer Autopilot" om tijdelijk te stoppen
- Alle instellingen blijven bewaard
- Klik opnieuw op "Start Autopilot" om te hervatten

### Monitoring
- **Status**: Zie of Autopilot actief of gepauzeerd is
- **Artikelen gegenereerd**: Totaal aantal gegenereerde artikelen
- **Artikelen gepubliceerd**: Totaal aantal gepubliceerde artikelen
- **Volgende publicatie**: Wanneer het volgende artikel gepubliceerd wordt

## Belangrijke Aandachtspunten

### ⚠️ Keyword Research Vereist
De Autopilot gebruikt artikel ideeën uit je keyword research. Zorg ervoor dat je regelmatig keyword research uitvoert om voldoende ideeën te hebben.

### 💳 Credits
Elke gegenereerde artikel kost credits volgens het normale tarief. Zorg ervoor dat je voldoende credits hebt.

### 🔒 WordPress Configuratie
Voor auto-publicatie moet je WordPress credentials geconfigureerd hebben in je project instellingen.

### 📊 Content Kwaliteit
De Autopilot gebruikt dezelfde AI en content generatie als de handmatige blog generator, dus de kwaliteit blijft hetzelfde.

## API Endpoints

### GET /api/client/autopilot
Haal huidige autopilot configuratie op.

**Response:**
```json
{
  "config": {
    "id": "...",
    "isActive": true,
    "keywords": ["yoga", "meditatie"],
    "contentInterval": "weekly",
    "contentType": "mixed",
    "targetWordCount": 1500,
    "includeImages": true,
    "includeYoutubeVideos": true,
    "autoPublish": true,
    "saveToLibrary": true,
    "preferredPublishTime": "09:00",
    "totalArticlesGenerated": 5,
    "totalArticlesPublished": 5,
    "nextRunDate": "2025-11-08T09:00:00.000Z"
  }
}
```

### POST /api/client/autopilot
Maak of update autopilot configuratie.

**Request Body:**
```json
{
  "keywords": ["keyword1", "keyword2"],
  "contentInterval": "weekly",
  "contentType": "mixed",
  "targetWordCount": 1500,
  "includeImages": true,
  "includeYoutubeVideos": true,
  "autoPublish": true,
  "saveToLibrary": true,
  "preferredPublishTime": "09:00"
}
```

### POST /api/client/autopilot/toggle
Activeer of pauzeer autopilot.

**Request Body:**
```json
{
  "isActive": true
}
```

### GET /api/cron/autopilot-content
Cron job endpoint voor automatische content generatie.

**Headers:**
```
Authorization: Bearer YOUR_CRON_SECRET
```

## Troubleshooting

### Autopilot genereert geen content
1. Check of er artikel ideeën beschikbaar zijn (status: "idea")
2. Verifieer dat de cron job correct is ingesteld
3. Controleer of client voldoende credits heeft
4. Check logs voor error berichten

### Artikelen worden niet gepubliceerd
1. Verifieer WordPress credentials in project instellingen
2. Check WordPress API verbinding
3. Controleer of autoPublish is ingeschakeld

### Volgende publicatie datum klopt niet
1. Let op dat de tijd in UTC is
2. Herbereken: NL tijd - 1 uur (winter) of - 2 uur (zomer)
3. Na opslaan wordt nextRunDate automatisch herberekend

## Toekomstige Verbeteringen

- [ ] Email notificaties bij publicatie
- [ ] A/B testing van content types
- [ ] Intelligente keyword matching
- [ ] Content performance tracking
- [ ] Auto-optimalisatie op basis van performance
- [ ] Multi-project support
- [ ] Social media auto-sharing

## Credits & Costs

Elk gegenereerd artikel kost credits volgens het normale tarief:
- **Blog generatie**: ~30-50 credits (afhankelijk van lengte)
- **Afbeeldingen**: ~5-10 credits per afbeelding
- **YouTube zoeken**: ~2-5 credits

Totaal per artikel: ~40-70 credits (gemiddeld ~50 credits)

**Voorbeeldberekening:**
- Dagelijks: 30 artikelen/maand × 50 credits = 1500 credits/maand
- Wekelijks: 4 artikelen/maand × 50 credits = 200 credits/maand
- Maandelijks: 1 artikel/maand × 50 credits = 50 credits/maand

---

**Laatste update:** November 1, 2025
**Versie:** 1.0.0
**Status:** ✅ Live op WritgoAI.nl
