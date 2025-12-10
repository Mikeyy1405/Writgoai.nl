# Autopilot Fixes - November 6, 2025

## Probleem
De Autopilot functie werkte niet correct:
1. **Jobs bleven steken** - Wanneer meerdere artikelen werden geselecteerd, werden sommige nooit gegenereerd
2. **Timeout problemen** - Artikelen werden sequentieel verwerkt binnen één API call met 5-minuten timeout
3. **Incomplete workflow** - De volledige flow (Keyword Research → Content Generatie → Publishing) was niet geïntegreerd

## Opgeloste Problemen

### 1. Independent Article Generation
**Probleem**: De oude implementatie verwerkte artikelen sequentieel in één lange API call. Als één artikel 5 minuten duurde, timede de functie uit voordat de volgende artikelen konden starten.

**Oplossing**: Elk artikel wordt nu **onafhankelijk** gestart:
```typescript
// ✅ NIEUWE AANPAK: Start elk artikel ONAFHANKELIJK
for (let i = 0; i < articlesToProcess.length; i++) {
  const article = articlesToProcess[i];
  const job = jobs[i];
  
  // Fire and forget - each article generates independently
  fetch(`${baseUrl}/api/client/autopilot/generate`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      articleId: article.id,
      projectId,
      clientId: client.id,
      settings: { ... }
    }),
  }).catch(error => {
    // Handle individual failures without affecting other articles
  });
}
```

**Voordelen**:
- Elk artikel start direct, onafhankelijk van andere artikelen
- Geen timeout problemen meer
- Alle geselecteerde artikelen worden verwerkt
- Betere parallelle verwerking

### 2. Keyword Research Integratie
**Probleem**: De keyword research functie had verkeerde parameters en return types.

**Oplossing**: Correcte integratie met `intelligent-content-planner`:
```typescript
const researchResult = await performCompleteContentResearch(
  project.websiteUrl || '',
  project.niche || project.description || '',
  project.targetAudience || 'Algemeen publiek',
  [], // primaryKeywords - will be discovered
  project.name || 'Project'
);

// Map ContentIdea to ArticleIdea correctly
for (const idea of researchResult.contentIdeas.slice(0, 10)) {
  await prisma.articleIdea.create({
    data: {
      clientId: client.id,
      projectId: projectId,
      title: idea.title,
      slug: generateSlug(idea.title),
      focusKeyword: idea.focusKeyword,
      // ... correct field mappings
    },
  });
}
```

### 3. TypeScript Fixes
- **Missing Search icon**: Toegevoegd aan lucide-react imports
- **Incorrect field mappings**: ContentIdea properties correct gemapped naar ArticleIdea
- **Required fields**: `clientId` en `slug` toegevoegd aan ArticleIdea creatie

## Complete Autopilot Workflow

### Optie 1: Direct Content Genereren (Nu Uitvoeren)
1. Selecteert automatisch artikel-ideeën uit het contentplan
2. Genereert content met AI (Claude Sonnet 4.5)
3. Voegt automatisch bol.com producten toe (indien geconfigureerd)
4. Voegt project affiliate links toe (indien beschikbaar)
5. Publiceert naar WordPress (indien geconfigureerd)

### Optie 2: Met Keyword Research (Met Research)
1. **Voert keyword research uit** - Analyseert website, concurrenten, en trends
2. **Genereert nieuwe artikel-ideeën** - Voegt 10 nieuwe topics toe aan contentplan
3. **Selecteert beste topics** - Kiest meest waardevol artikel(en)
4. **Genereert content** - Volledige AI blog post met SEO optimalisatie
5. **Publiceert** - Automatisch naar WordPress (indien geconfigureerd)

## Bestanden Aangepast

### Backend
- `/app/api/client/autopilot/run-now/route.ts`
  - ✅ Independent article processing
  - ✅ Correcte keyword research integratie
  - ✅ Proper field mappings

### Frontend
- `/app/client-portal/autopilot/page.tsx`
  - ✅ Search icon toegevoegd
  - ✅ UI unchanged (alleen import fix)

## Testing
- ✅ TypeScript compilatie succesvol
- ✅ Build succesvol
- ✅ Dev server start correct
- ✅ Geen runtime errors

## Gebruik

### Via UI (Autopilot Pagina)
1. Selecteer een project
2. Configureer Autopilot instellingen (optioneel)
3. Klik "Nu uitvoeren" voor directe generatie
4. Klik "Met Research" voor keyword research + generatie

### Automatische Runs
Autopilot kan ook automatisch draaien op basis van project-specifieke instellingen:
- Frequentie: daily, weekly, monthly
- Aantal artikelen per run
- Auto-publish naar WordPress
- Content type filtering
- Prioriteit filtering

## Verwachte Resultaten
- **Geen stuck jobs meer** - Alle artikelen starten onmiddellijk
- **Parallelle verwerking** - Meerdere artikelen worden gelijktijdig verwerkt
- **Volledige workflow** - Research → Content → Publishing
- **Betrouwbare progress tracking** - Real-time updates per artikel

## Monitoring
Jobs worden getrackt in de database met:
- Status (pending, generating, publishing, completed, failed)
- Progress percentage (0-100)
- Current step beschrijving
- Error messages (bij failures)
- Timestamps (started, completed)

De frontend toont deze informatie real-time en detecteert automatisch stuck jobs (>15 minuten).
