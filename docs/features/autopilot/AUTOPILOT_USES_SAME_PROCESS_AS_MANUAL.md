
# ✅ Autopilot gebruikt nu hetzelfde generatieproces als Writgo Writer

**Datum:** 6 november 2025  
**Status:** ✅ Geïmplementeerd en getest

## 🎯 Probleem

De Autopilot gebruikte een ander generatieproces dan de manual Writgo Writer:
- **Manual Writer:** Gebruikte `aiml-agent.generateBlog()` → HTML met werkende afbeeldingen
- **Autopilot:** Gebruikte `isolated-blog-generator.generateSEOBlog()` → Markdown zonder werkende afbeeldingen
- **Resultaat:** Content genereren mislukt, geen afbeeldingen zichtbaar

## ✅ Oplossing

De Autopilot is nu volledig gesynchroniseerd met de manual Writgo Writer:

### Wijzigingen in `/app/api/client/autopilot/generate/route.ts`:

1. **Import gewijzigd:**
```typescript
// OUD: import { generateSEOBlog } from '@/lib/isolated-blog-generator';
// NIEUW: import { generateBlog } from '@/lib/aiml-agent';
```

2. **Generatie proces:**
```typescript
// OUD: Complexe setup met isolated-blog-generator
const blogResult = await generateSEOBlog(blogOptions);
let htmlContent = await marked(blogResult.content); // Markdown → HTML conversie

// NIEUW: Simpel en direct (zelfde als manual)
const htmlContent = await generateBlog(
  articleIdea.title,
  keywords,
  tone,
  brandInfo
);
```

3. **Metadata handling:**
- Automatische meta description generatie uit eerste paragraaf
- Keywords direct uit article idea
- Thumbnail is eerste afbeelding in content

## 🎨 Flow van Content Plan → Generatie → Publicatie

### Stap 1: Content Plan
- Artikel ideeën staan in database (`ArticleIdea`)
- Status: `idea` → wachtend op generatie

### Stap 2: Autopilot "Nu uitvoeren"
```typescript
POST /api/client/autopilot/run-now
{
  projectId: "xxx",
  articlesCount: 1
}
```

### Stap 3: Content Generatie (NIEUW PROCES)
```typescript
// Artikel selecteren
const article = articleIdeas.filter(priority, aiScore);

// Genereren met aiml-agent (zelfde als manual!)
const htmlContent = await generateBlog(
  article.title,
  keywords,
  tone,
  brandInfo
);

// Opslaan in SavedContent
const savedContent = await prisma.savedContent.create({
  title: article.title,
  content: htmlContent,      // Direct HTML
  contentHtml: htmlContent,   // Direct HTML
  imageUrls: [...],           // Afbeeldingen uit HTML
  wordCount: actualWordCount
});
```

### Stap 4: Automatisch Publiceren (optioneel)
```typescript
if (project.autopilotAutoPublish) {
  // Direct naar WordPress
  POST /api/client/autopilot/publish
}
```

## 📊 Resultaat

✅ **Autopilot genereert nu:**
- HTML met werkende opmaak (niet Markdown)
- Afbeeldingen die direct zichtbaar zijn
- Zelfde kwaliteit als manual Writgo Writer
- Bol.com producten als text-links
- Project affiliate links waar relevant
- Correcte metadata

✅ **Process Flow:**
```
Content Plan → Nu uitvoeren → aiml-agent.generateBlog() → HTML + Images → SavedContent → WordPress (auto)
                                    ↑
                            SAME AS MANUAL WRITER!
```

## 🔧 Technische Details

### Files aangepast:
- `/app/api/client/autopilot/generate/route.ts` - Volledige refactor naar aiml-agent

### Dependencies verwijderd:
- ~~`isolated-blog-generator`~~ - Niet meer nodig voor autopilot
- ~~`marked`~~ - Geen Markdown conversie meer nodig

### Progress Tracking:
- 0% - Initialiseren
- 15% - AI content genereren (zelfde proces als Writgo Writer)
- 50% - Content gegenereerd met afbeeldingen
- 70% - Content controleren en finaliseren
- 80% - Content opslaan in bibliotheek
- 100% - Succesvol voltooid!

## 🚀 Gebruik

### Via UI:
1. Ga naar **Autopilot** pagina
2. Selecteer een project
3. Klik op **"Nu uitvoeren"**
4. Content wordt gegenereerd met HTML + afbeeldingen
5. Automatisch naar WordPress als ingeschakeld

### API:
```typescript
// Start autopilot run
POST /api/client/autopilot/run-now
{
  "projectId": "project-id",
  "articlesCount": 1
}

// Response
{
  "success": true,
  "jobIds": ["job-1"],
  "articleIds": ["article-1"],
  "message": "1 artikel(en) worden gegenereerd"
}

// Check progress
GET /api/client/autopilot/jobs

// Response
{
  "jobs": [{
    "id": "job-1",
    "status": "completed",
    "progress": 100,
    "currentStep": "Succesvol voltooid!",
    "contentId": "content-id"
  }]
}
```

## ✨ Voordelen

1. **Consistentie:** Manual en Autopilot produceren exact dezelfde kwaliteit
2. **Betrouwbaarheid:** Geen Markdown conversie meer, HTML werkt direct
3. **Afbeeldingen:** Automatisch geïntegreerd en zichtbaar
4. **Eenvoud:** Minder code, minder complexiteit
5. **Onderhoud:** Één generatie proces = makkelijker te onderhouden

## 📝 Notities

- Autopilot gebruikt altijd Claude Sonnet 4.5 voor hoogste kwaliteit
- Text-only links voor Bol.com (geen product boxes om layout issues te voorkomen)
- Affiliate links worden intelligent geselecteerd op basis van relevantie
- Credits: 50 per artikel (zelfde als manual writer)
