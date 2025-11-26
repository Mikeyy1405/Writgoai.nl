# Project-Specifieke Content Research & URL Analyse

## 📋 Overzicht

Grote upgrade van het content research systeem naar **project-specifieke analyse**:
- ✅ Elke project krijgt zijn eigen gedegen website URL analyse
- ✅ Per project opgeslagen in database (niet vermengd met andere projecten)
- ✅ Altijd volledige analyse wanneer een project wordt geanalyseerd
- ✅ Content ideeën gekoppeld aan specifiek project

## 🔄 Belangrijkste Wijzigingen

### 1. Database Schema Updates

**ArticleIdea Model - NIEUW veld:**
```prisma
model ArticleIdea {
  // ... bestaande velden ...
  
  // NIEUW: Project koppeling
  projectId   String?
  project     Project? @relation("ArticleIdeas", fields: [projectId], references: [id])
  
  @@index([projectId])  // Voor snelle project-specifieke queries
}
```

**Project Model - NIEUWE relatie:**
```prisma
model Project {
  // ... bestaande velden ...
  
  articleIdeas  ArticleIdea[]  @relation("ArticleIdeas")
}
```

### 2. Diepgaande Website Analyse

**Nieuwe functie: `analyzeWebsiteDeep()`**

Verbeteringen:
- 🔍 **Diepere scan** - Gebruikt meerdere search queries per website
- 📊 **Specifiekere topics** - Niet alleen "SEO tips" maar "hoe je long-tail keywords vindt met gratis tools"  
- 🎯 **Project-specifiek** - Elk project krijgt zijn eigen analyse
- 💾 **Opgeslagen per project** - In `project.contentAnalysis`

**Search queries gebruikt:**
```javascript
- site:domain blog
- site:domain artikel
- site:domain gids
- site:domain how to
- site:domain tips
- site:domain {niche}
```

### 3. Project-Specifieke Data Opslag

**Bij elke content research worden opgeslagen:**

```javascript
// In project.contentAnalysis
{
  websiteAnalysis: {
    existingTopics: [...],      // Wat staat er AL op de website
    contentGaps: [...],          // Wat ONTBREEKT er
    topPerformingPages: [...],   // Beste pagina's
    categories: [...],           // Categorieën
    totalPages: number
  },
  competitorAnalysis: {...},
  trendingTopics: {...}
}

// In project.contentStrategy
{
  // Volledige content plan
  contentIdeas: [...],
  summary: {...}
}
```

### 4. Content Ideeën Koppeling

**Voorheen:** Alle content ideeën onder één client
**Nu:** Elke content idee gekoppeld aan specifiek project

```javascript
ArticleIdea {
  clientId: "...",
  projectId: "...",  // 🆕 NIEUW!
  title: "...",
  // ...
}
```

**Voordelen:**
- ✅ Per project verschillende content strategieën
- ✅ Geen vermenging van yoga content met marketing content
- ✅ Beter overzicht per project
- ✅ Cleanup alleen binnen project (niet cross-project)

## 📁 Gewijzigde Bestanden

### Backend Logic
1. `/nextjs_space/lib/intelligent-content-planner.ts`
   - Nieuwe `analyzeWebsiteDeep()` functie
   - `performCompleteContentResearch()` nu met projectName parameter
   - Betere logging per project

2. `/nextjs_space/app/api/client/content-research/route.ts`
   - Project name doorgeven aan research functie
   - ProjectId opslaan bij ArticleIdea records
   - Project-specifieke cleanup van oude content
   - GET route filtert nu op projectId

### Database Schema
3. `/nextjs_space/prisma/schema.prisma`
   - ArticleIdea: `projectId` veld toegevoegd
   - Project: `articleIdeas` relatie toegevoegd
   - Nieuwe index op `ArticleIdea.projectId`

## 🔧 Hoe Het Werkt

### Scenario 1: Project-Specifieke Research

```
1. User selecteert "YogaStartGids" project
2. System start research:
   ├─ 🌐 Diepgaande scan van yogastartgids.nl
   ├─ 🔍 Competitor analyse (yoga niche)
   ├─ 📈 Trending topics (yoga related)
   └─ 💡 Genereert 25 yoga content ideeën
3. Alles opgeslagen onder "YogaStartGids" project
4. Content ideeën hebben projectId = "yogastartgids_id"
```

### Scenario 2: Andere Project

```
1. User selecteert "WritgoAI" project
2. System start research:
   ├─ 🌐 Diepgaande scan van WritgoAI.nl
   ├─ 🔍 Competitor analyse (content marketing niche)
   ├─ 📈 Trending topics (AI writing related)
   └─ 💡 Genereert 25 content marketing ideeën
3. Alles opgeslagen onder "WritgoAI" project
4. Content ideeën hebben projectId = "writgoai_id"
```

**Resultaat:** Yoga content en WritgoAI content zijn volledig gescheiden! ✅

## 🎯 Website Analyse - Hoe Het Werkt

### Fase 1: Deep Content Scan

AI gebruikt web search om te analyseren:
- Welke artikelen/pagina's bestaan er al?
- Welke onderwerpen zijn behandeld?
- Welke categorieën heeft de website?
- Wat zijn de best presterende pagina's?

### Fase 2: Content Gap Analysis  

AI identificeert wat ONTBREEKT:
- Onderwerpen die relevant zijn voor de niche
- Content die concurrenten WEL hebben
- Kansen voor nieuwe content
- Logische uitbreidingen van bestaande content

### Resultaat

Elk project heeft nu een **complete kaart** van:
- ✅ Wat er AL is
- ✅ Wat er ONTBREEKT  
- ✅ Waar de KANSEN liggen
- ✅ Hoe content aansluit bij bestaande structuur

## 📊 Logging & Monitoring

Nieuwe logging format:
```
🚀 ========================================
🚀 [CONTENT RESEARCH - YogaStartGids]
🚀 Mode: 📂 PROJECT
🚀 ========================================
   🌐 Website: https://yogastartgids.nl
   🎯 Niche/Keyword: yoga voor beginners
   👥 Doelgroep: Nederlandse yoga beginners

📊 STAP 1/4: DIEPGAANDE WEBSITE ANALYSE
   🔍 Scannen van https://yogastartgids.nl...
   
✅ [WEBSITE ANALYSE - YogaStartGids] VOLTOOID
   📊 47 bestaande topics
   🔍 18 content gaps
   📄 12 top pagina's
   📁 8 categorieën

// ... etc
```

## 🔐 Data Isolatie

**Belangrijke garanties:**

1. **Content ideeën per project**
   ```javascript
   // Alleen ideeën van HET gekozen project
   articleIdeas.filter(idea => idea.projectId === currentProjectId)
   ```

2. **Cleanup per project**
   ```javascript
   // Verwijder alleen oude content van DIT project
   deleteMany({
     where: {
       projectId: projectId,  // ✅ Niet van andere projecten
       status: 'published',
       createdAt: { lt: thirtyDaysAgo }
     }
   })
   ```

3. **Website analyse per project**
   ```javascript
   // Elke project heeft zijn eigen analyse
   project.contentAnalysis = {
     websiteAnalysis: {...},  // Specifiek voor DIT project
     competitorAnalysis: {...},
     trendingTopics: {...}
   }
   ```

## ✅ Voordelen van Deze Aanpak

1. **Schaalbaar**
   - Client kan 10+ projecten hebben, allemaal gescheiden
   - Geen conflicten tussen verschillende niches

2. **Accuraat**
   - Analyses zijn specifiek voor elke website
   - Content ideeën passen bij het project

3. **Overzichtelijk**  
   - Per project zie je alleen relevante content
   - Geen "ruis" van andere projecten

4. **Betrouwbaar**
   - Data wordt niet vermengd
   - Cleanup gebeurt alleen binnen project

## 🚀 Deployment Status

- ✅ Database schema updated (projectId toegevoegd)
- ✅ Prisma client gegenereerd
- ✅ API routes updated voor project-specifieke data
- ✅ Website analyse grondig verbeterd
- ✅ Logging en monitoring geïmplementeerd

**Klaar voor productie!** 🎉

## 📝 Gebruik

### Voor Developers

Bij het aanroepen van content research:
```typescript
// Altijd projectId meegeven voor project mode
const response = await fetch('/api/client/content-research', {
  method: 'POST',
  body: JSON.stringify({
    projectId: 'project_id_hier',  // VERPLICHT voor project mode
    // keyword: 'keyword'  // OF dit voor keyword mode
  })
});
```

### Voor Users

1. Selecteer een project in de UI
2. Klik op "Content Research"
3. System doet automatisch:
   - Diepgaande scan van jouw website
   - Competitor analyse in jouw niche
   - Trending topics in jouw vakgebied
   - Genereert 25 project-specifieke content ideeën

**Resultaat:** Content ideeën perfect afgestemd op JÍJ project! ✨

---

*Gemaakt: November 2025*
*Status: ✅ Production Ready*
