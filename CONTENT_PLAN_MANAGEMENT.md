
# Content Plan Management - Toevoegen & Verwijderen

**Datum:** 3 november 2025
**Functie:** Beheer content ideeën - toevoegen en verwijderen
**Status:** ✅ LIVE

## Overzicht

Gebruikers kunnen nu:
1. **Eigen content ideeën toevoegen** - AI vult automatisch alle details in
2. **Content ideeën verwijderen** - Eenvoudig ongewenste ideeën verwijderen

## Nieuwe Features

### 1. Voeg Nieuw Idee Toe ✨

**Locatie:** Bovenaan de content ideeën lijst in Content Research

**Hoe het werkt:**
1. Gebruiker klikt op "Voeg nieuw idee toe" knop
2. Dialog opent met input veld voor artikel titel
3. AI vult automatisch in:
   - Focus keyword en secondary keywords
   - Content type (guide, listicle, howto, review, etc.)
   - Search intent (informational, commercial, transactional, navigational)
   - Artikel outline met H2 koppen
   - SEO moeilijkheid (0-100)
   - Prioriteit (high, medium, low)
   - Beschrijving

**Technische implementatie:**
- **API Route:** `/api/client/article-ideas/add` (POST)
- **AI Model:** Claude 3.5 Sonnet via AIML API
- **Functie:** `generateContentIdea()` in `lib/intelligent-content-planner.ts`

**Prompt:**
```
CONTENT TITEL: "{user_title}"
NICHE: {project_niche}
DOELGROEP: {target_audience}

Werk dit content idee volledig uit met:
- Focus keyword (het belangrijkste zoekwoord)
- Secondary keywords (5-8 gerelateerde keywords)
- Content type (guide, listicle, howto, review, comparison, news, opinion)
- Search intent (informational, commercial, transactional, navigational)
- Prioriteit (high, medium, low)
- Beschrijving (1-2 zinnen over de inhoud)
- Outline (6-8 H2 koppen voor de structuur)
- Geschatte SEO moeilijkheid (0-100)
```

### 2. Verwijder Content Idee 🗑️

**Locatie:** Bij elk content idee in de lijst (rode prullenbak icoon)

**Hoe het werkt:**
1. Gebruiker klikt op prullenbak icoon
2. Confirm dialog toont: "Weet je zeker dat je "{titel}" wilt verwijderen?"
3. Bij bevestiging wordt het idee verwijderd
4. Lijst wordt automatisch ververst

**Technische implementatie:**
- **API Route:** `/api/client/article-ideas/[id]` (DELETE)
- **Security:** Controleert of idee eigendom is van huidige client
- **Cascade:** Geen cascade deletes - alleen het idee wordt verwijderd

## Gewijzigde Bestanden

### Nieuwe API Routes
1. `/app/api/client/article-ideas/[id]/route.ts` - DELETE endpoint
2. `/app/api/client/article-ideas/add/route.ts` - POST endpoint (met AI processing)

### Library Updates
- `/lib/intelligent-content-planner.ts`
  - Nieuwe functie: `generateContentIdea()` - Vult single idee in met AI
  - Content type mapping naar valid types

### Frontend Updates
- `/app/client-portal/content-research/content-ideas-list.tsx`
  - Nieuwe state: `showAddDialog`, `newIdeaTitle`, `isAddingIdea`, `deletingId`
  - Nieuwe functies: `handleAddIdea()`, `handleDeleteIdea()`
  - Nieuwe UI: "Voeg nieuw idee toe" dialog met input field
  - Nieuwe UI: Delete knop bij elk idee (prullenbak icoon)
  - Props uitgebreid met `projectId` voor project-specifieke ideeën

- `/app/client-portal/content-research/page.tsx`
  - ContentIdeasList krijgt nu `projectId` prop

## UI/UX

### "Voeg Toe" Dialog
```
✨ Nieuw Content Idee
-------------------
Voer een titel in en de AI vult automatisch keywords, outline en andere details in.

[Input field: "Bijv: De beste yogalessen in Amsterdam"]

ℹ️ De AI vult automatisch in:
   - Focus keyword en secondary keywords
   - Content type en search intent
   - Artikel outline met H2 koppen
   - SEO moeilijkheid en prioriteit

[Annuleren]  [Voeg toe]
```

### Delete Knop
- Rode prullenbak icoon naast "Nu schrijven" knop
- Tooltip: "Verwijder dit content idee"
- Loading state tijdens verwijderen (spinner)
- Confirm dialog voor bevestiging

## Content Types

De AI kan de volgende content types kiezen:
- `guide` - Complete gids/handleiding
- `listicle` - Top X lijst
- `howto` - Hoe-te artikel
- `review` - Product/service review
- `comparison` - Vergelijkingsartikel
- `news` - Nieuwsartikel
- `opinion` - Opinie/meningsstuk

## Security & Validatie

### Toevoegen
- ✅ Titel mag niet leeg zijn
- ✅ Project moet bestaan (als projectId opgegeven)
- ✅ Client authenticatie via session
- ✅ Duplicate slug handling via upsert

### Verwijderen
- ✅ Idee moet bestaan
- ✅ Idee moet eigendom zijn van client
- ✅ Client authenticatie via session
- ✅ Confirm dialog in UI

## Error Handling

### Frontend
- Toast melding bij succes: "✅ Content idee succesvol toegevoegd en ingevuld door AI"
- Toast melding bij verwijdering: "🗑️ Content idee verwijderd"
- Toast melding bij fouten met specifieke error message
- Loading states tijdens operaties

### Backend
- Try-catch blokken om alle API calls
- Fallback naar defaults als AI parsing faalt
- Clear error messages terug naar frontend

## Testing

✅ Nieuw idee toevoegen zonder project (keyword mode)
✅ Nieuw idee toevoegen met project
✅ AI vult alle velden correct in
✅ Verwijderen van eigen idee
✅ Verwijderen met confirm dialog
✅ Lijst wordt correct ververst na add/delete
✅ Loading states werken correct
✅ Error handling werkt correct

## Credits

**AI Processing:**
- Toevoegen van nieuw idee: ~5-10 credits (Claude 3.5 Sonnet call)
- Verwijderen: 0 credits (database operatie)

## Toekomstige Verbeteringen

Mogelijke uitbreidingen:
- Bulk delete voor meerdere ideeën tegelijk
- Bulk import van CSV met titels
- Duplicate detection met suggesties
- Bewerk functie voor bestaande ideeën
- History/undo functionaliteit
- Export naar CSV/Excel
