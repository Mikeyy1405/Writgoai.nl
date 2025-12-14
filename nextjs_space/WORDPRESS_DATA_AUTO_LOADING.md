# Automatisch WordPress Gegevens Laden

## Overzicht

Deze feature laadt automatisch WordPress gegevens wanneer een gebruiker een project selecteert. De gegevens worden gecached en zijn beschikbaar in de hele applicatie.

## Architectuur

### 1. WordPressDataContext (`lib/contexts/WordPressDataContext.tsx`)

Context die WordPress data opslaat en beheert:
- **Categories**: Alle WordPress categorieën
- **Posts**: Bestaande posts op de site
- **Pages**: Bestaande pagina's
- **Tags**: Alle WordPress tags
- **Sitemap**: Volledige sitemap met URLs

**Features:**
- Automatische caching (5 minuten)
- Loading en error states
- Hergebruikbare `useWordPressData()` hook

### 2. API Endpoint (`/api/client/wordpress/site-data`)

Laadt alle WordPress data in één keer:
```typescript
POST /api/client/wordpress/site-data
Body: { projectId: string }

Response: {
  categories: Array<{ id, name, slug }>,
  posts: Array<{ id, title, link, excerpt, status }>,
  pages: Array<{ id, title, link, excerpt, status }>,
  tags: Array<{ id, name, slug }>,
  sitemap: SitemapData
}
```

### 3. Automatische Synchronisatie

**WordPressDataSync Component:**
- Mounted in `DashboardLayoutClient`
- Luistert naar project switches
- Laadt automatisch WordPress data bij project wissel

## Gebruik in Componenten

### Basis gebruik

```tsx
import { useWordPressData } from '@/lib/contexts/WordPressDataContext';

function MyComponent() {
  const { data, loading, error } = useWordPressData();
  
  if (loading) return <div>Laden...</div>;
  if (error) return <div>Error: {error}</div>;
  
  return (
    <div>
      <h2>Categorieën: {data.categories.length}</h2>
      <h2>Posts: {data.posts.length}</h2>
      <h2>Pages: {data.pages.length}</h2>
    </div>
  );
}
```

### Gebruik in WordPress Publisher Dialog

De `WordPressPublisherDialog` gebruikt nu automatisch de gecachte data:
- Categorieën worden direct uit de context geladen
- Geen extra API call nodig als data al beschikbaar is
- Fallback naar API als context data niet beschikbaar

```tsx
// Voorbeeld uit wordpress-publisher-dialog.tsx
const { data: wpData, loading: wpLoading } = useWordPressData();

// Gebruik wpData.categories voor categorie selectie
if (wpData?.categories && wpData.categories.length > 0) {
  setCategories(wpData.categories);
}
```

### Project Selector met Status

De `ProjectSelector` toont nu WordPress data status:
```tsx
// Geeft weer:
// - Loading indicator tijdens laden
// - Aantal categories, posts, pages als geladen
// - Error bericht als WordPress niet beschikbaar
```

## Cache Strategie

**Opslag:** LocalStorage per project
**Key:** `wp_data_${projectId}`
**Expiry:** 5 minuten
**Invalidatie:** Automatisch bij project switch

## Data Flow

```
User selecteert project
    ↓
ProjectContext.switchProject()
    ↓
WordPressDataSync detecteert change
    ↓
useWordPressData().loadWordPressData()
    ↓
Check cache → Valid? → Gebruik cache
    ↓                    
Cache expired/missing
    ↓
API call /api/client/wordpress/site-data
    ↓
Parallel laden van:
  - Categories (WordPress REST API)
  - Posts (WordPress REST API)  
  - Pages (WordPress REST API)
  - Tags (WordPress REST API)
  - Sitemap (loadWordPressSitemap)
    ↓
Data beschikbaar in hele app via context
    ↓
Cache data voor 5 minuten
```

## Toekomstige Uitbreidingen

### Interne Link Suggesties

De sitemap data kan gebruikt worden voor:
- Automatische interne link suggesties tijdens schrijven
- Tonen van gerelateerde content
- SEO optimalisatie

**Voorbeeld implementatie:**
```tsx
import { findRelevantInternalLinks } from '@/lib/sitemap-loader';

function BlogEditor() {
  const { data } = useWordPressData();
  
  // Zoek relevante interne links
  const internalLinks = data?.sitemap 
    ? findRelevantInternalLinks(data.sitemap, articleTopic, 3)
    : [];
    
  return (
    <div>
      <h3>Suggesties voor interne links:</h3>
      {internalLinks.map(link => (
        <a key={link.url} href={link.url}>{link.title}</a>
      ))}
    </div>
  );
}
```

### Content Gap Analysis

Met posts/pages data:
- Identificeer ontbrekende content
- Suggereer nieuwe onderwerpen
- Voorkom dubbele content

## Error Handling

De context handelt fouten gracefully:
- Toont error message aan gebruiker
- Zet lege data arrays (geen crashes)
- Componenten blijven werken zonder WordPress data

```tsx
// Error handling voorbeeld
if (error) {
  return (
    <div className="text-red-600">
      WordPress niet beschikbaar. Sommige features zijn beperkt.
    </div>
  );
}
```

## Performance

**Optimalisaties:**
- Parallel fetching van alle data
- 5 minuten caching per project
- Lazy loading - alleen laden bij project switch
- Context prevents prop drilling

**Timing:**
- Eerste load: ~2-3 seconden (afhankelijk van WordPress site)
- Cached load: < 100ms
- Project switch: Automatisch (background)

## Testing

Om de feature te testen:

1. **Login als client** met WordPress configuratie
2. **Selecteer een project** met WordPress credentials
3. **Check console logs:**
   ```
   [WordPress Site Data] Loading data for project: [name]
   [WordPress Site Data] Loaded: X categories, Y posts, Z pages, ...
   ```
4. **Open WordPress Publisher Dialog** - categorieën moeten direct beschikbaar zijn
5. **Switch project** - nieuwe data moet automatisch laden

## Troubleshooting

**Data laadt niet:**
- Check of project WordPress credentials heeft
- Verifieer `/api/client/wordpress/site-data` endpoint
- Check browser console voor errors

**Cache werkt niet:**
- Check LocalStorage permissies
- Verwijder cache manueel: `localStorage.removeItem('wp_data_[projectId]')`

**Oude data wordt getoond:**
- Cache expiry is 5 minuten
- Force refresh: herlaad pagina of switch naar ander project en terug
