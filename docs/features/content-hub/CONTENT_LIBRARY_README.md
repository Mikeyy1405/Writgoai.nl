# 📚 WritgoAI Content Library

## Overzicht

De Content Library is een centraal systeem waar alle gegenereerde content wordt opgeslagen, georganiseerd en beheerd. Het biedt een complete oplossing voor content management met mogelijkheden voor opslaan, categoriseren, bewerken, archiveren en verwijderen.

## ✨ Functies

### 1. **Content Opslaan**
- 📝 Alle gegenereerde content wordt automatisch opgeslagen
- 💾 Handmatig content toevoegen via API
- 🏷️ Ondersteunt meerdere content types: blog, social, video, code, other

### 2. **Organiseren & Categoriseren**
- 📁 Categorieën toewijzen aan content
- 🏷️ Tags toevoegen voor betere filtering
- ⭐ Favorieten markeren voor snelle toegang
- 📦 Content archiveren wanneer niet meer actief nodig

### 3. **Zoeken & Filteren**
- 🔍 Zoek in titel, beschrijving en content
- 🎯 Filter op type (blog, social, video, etc.)
- 📂 Filter op categorie
- ⭐ Toon alleen favorieten
- 📦 Bekijk gearchiveerde content

### 4. **Bewerken & Bijwerken**
- ✏️ Edit content met rich text editor (voor blogs)
- 📝 Update titel en beschrijving
- 🎨 Wijzig categorieën en tags
- 💾 Auto-save functionaliteit

### 5. **Content Management**
- 🗑️ Verwijder content permanent
- 📦 Archiveer content voor later
- ♻️ Herstel gearchiveerde content
- 🔄 Dupliceer content (toekomstige feature)

### 6. **Statistieken**
- 📊 Totaal aantal content items
- ⭐ Aantal favorieten
- 📦 Aantal gearchiveerde items
- 📝 Totaal aantal woorden
- 📈 Content per type breakdown

## 🚀 Gebruik

### Toegang tot Content Library

Navigeer naar de Content Library via:
- **Sidebar menu** → "Content Bibliotheek"
- **Direct URL**: `/client-portal/content-library-new`

### Content Opslaan (via API)

```typescript
// POST /api/client/content-library
const response = await fetch('/api/client/content-library', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    type: 'blog',                    // 'blog', 'social', 'video', 'code', 'other'
    title: 'Mijn Blog Post',
    content: 'De volledige content...',
    contentHtml: '<h1>Mijn Blog</h1>...',
    category: 'SEO',
    tags: ['marketing', 'tips'],
    description: 'Een korte beschrijving',
    keywords: ['seo', 'content'],
    metaDesc: 'Meta description voor SEO',
    thumbnailUrl: 'https://...',
    imageUrls: ['https://...'],
    projectId: 'project_id',         // Optioneel: koppel aan project
  }),
});
```

### Content Ophalen

```typescript
// GET /api/client/content-library?type=blog&category=SEO&favorite=true
const response = await fetch('/api/client/content-library?type=blog');
const { content } = await response.json();
```

### Content Updaten

```typescript
// PATCH /api/client/content-library/[id]
const response = await fetch(`/api/client/content-library/${contentId}`, {
  method: 'PATCH',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    title: 'Nieuwe titel',
    isFavorite: true,
    category: 'Marketing',
  }),
});
```

### Content Verwijderen

```typescript
// DELETE /api/client/content-library/[id]
const response = await fetch(`/api/client/content-library/${contentId}`, {
  method: 'DELETE',
});
```

### Statistieken Ophalen

```typescript
// GET /api/client/content-library/stats
const response = await fetch('/api/client/content-library/stats');
const { stats } = await response.json();
// stats = { total, favorites, archived, totalWords, byType: {...} }
```

## 📊 Database Schema

### SavedContent Model

```prisma
model SavedContent {
  id             String   @id @default(cuid())
  clientId       String
  type           String   // 'blog', 'social', 'video', 'code', 'other'
  title          String
  content        String   @db.Text
  contentHtml    String?  @db.Text
  category       String?
  tags           String[]
  description    String?  @db.Text
  keywords       String[]
  metaDesc       String?
  slug           String?
  thumbnailUrl   String?
  imageUrls      String[]
  isFavorite     Boolean  @default(false)
  isArchived     Boolean  @default(false)
  publishedUrl   String?
  publishedAt    DateTime?
  wordCount      Int?
  characterCount Int?
  projectId      String?
  createdAt      DateTime @default(now())
  updatedAt      DateTime @updatedAt
}
```

### ContentCategory Model

```prisma
model ContentCategory {
  id          String   @id @default(cuid())
  clientId    String
  name        String
  description String?
  color       String?  // Hex color for UI
  icon        String?  // Emoji or icon name
  createdAt   DateTime @default(now())
  updatedAt   DateTime @updatedAt
  
  @@unique([clientId, name])
}
```

## 🎨 UI Components

### Content Card
Elke content item wordt getoond als een card met:
- Type badge (met kleur en icon)
- Titel en beschrijving
- Tags
- Project koppeling (als van toepassing)
- Statistieken (woorden, datum)
- Favorieten knop
- Actions menu (bekijken, bewerken, archiveren, verwijderen)

### Filters
- Zoekbalk voor full-text search
- Type dropdown (all, blog, social, video, code, other)
- Categorie dropdown
- Quick filters: Favorieten, Archief

### Stats Cards
- Totaal Content
- Favorieten
- Gearchiveerd
- Totaal Woorden

## 🔗 API Endpoints

| Endpoint | Method | Beschrijving |
|----------|--------|--------------|
| `/api/client/content-library` | GET | Haal alle content op (met filters) |
| `/api/client/content-library` | POST | Sla nieuwe content op |
| `/api/client/content-library/[id]` | GET | Haal specifieke content op |
| `/api/client/content-library/[id]` | PATCH | Update content |
| `/api/client/content-library/[id]` | DELETE | Verwijder content |
| `/api/client/content-library/stats` | GET | Haal statistieken op |
| `/api/client/content-library/categories` | GET | Haal categorieën op |
| `/api/client/content-library/categories` | POST | Maak nieuwe categorie |

## 📝 To-Do / Roadmap

- [ ] Automatisch opslaan vanuit Blog Generator
- [ ] Automatisch opslaan vanuit Video Generator
- [ ] Automatisch opslaan vanuit Social Media Generator
- [ ] Bulk acties (meerdere items tegelijk archiveren/verwijderen)
- [ ] Export functionaliteit (meerdere items als ZIP)
- [ ] Content dupliceren functionaliteit
- [ ] Geavanceerde filters (datum range, word count range)
- [ ] Sortering opties (nieuwste, oudste, meeste woorden)
- [ ] Content templates (herbruikbare templates maken)
- [ ] Versie geschiedenis (track wijzigingen)
- [ ] Collaborative editing (meerdere gebruikers tegelijk)

## 🎯 Best Practices

1. **Categorieën**: Gebruik consistente categorieën voor betere organisatie
2. **Tags**: Voeg relevante tags toe voor eenvoudiger zoeken
3. **Favorieten**: Markeer belangrijke content als favoriet
4. **Archiveren**: Archiveer oude content in plaats van verwijderen
5. **Beschrijving**: Voeg altijd een beschrijving toe voor betere context
6. **Keywords**: Gebruik keywords voor SEO-optimalisatie

## 🆘 Support

Bij vragen of problemen:
- Check de documentatie
- Open een issue op GitHub
- Contact support@WritgoAI.nl
