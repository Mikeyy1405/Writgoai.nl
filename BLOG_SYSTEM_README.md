# WritGo Blog System - Implementatie Documentatie

## Overzicht

Dit document beschrijft de volledige implementatie van het blog systeem voor WritGo.nl. Het systeem biedt WordPress-achtige functionaliteit voor het beheren van blog content, inclusief posts, categorieën, tags, en SEO-optimalisatie.

## Architectuur

### Database Schema

Het blog systeem gebruikt de volgende PostgreSQL tabellen:

#### articles (Blog Posts)
```sql
- id (UUID, primary key)
- title (text, required)
- slug (text, unique, required) - Auto-gegenereerd van title
- content (text, required)
- excerpt (text, optional)
- featured_image (text, optional) - URL naar featured image
- author_id (UUID, foreign key naar users)
- status (enum: 'draft', 'published', 'scheduled')
- published_at (timestamp, optional)
- created_at (timestamp)
- updated_at (timestamp)
- meta_title (text, optional) - SEO meta title
- meta_description (text, optional) - SEO meta description
- focus_keyword (text, optional) - Hoofd SEO keyword
- seo_keywords (text[], optional) - Array van SEO keywords
- views (integer, default 0) - View counter
```

#### article_categories
```sql
- id (UUID, primary key)
- name (text, required, unique)
- slug (text, unique, required)
- description (text, optional)
- created_at (timestamp)
```

#### article_tags
```sql
- id (UUID, primary key)
- name (text, required, unique)
- slug (text, unique, required)
- created_at (timestamp)
```

#### article_category_mapping (Many-to-Many)
```sql
- article_id (UUID, foreign key)
- category_id (UUID, foreign key)
- PRIMARY KEY (article_id, category_id)
```

#### article_tag_mapping (Many-to-Many)
```sql
- article_id (UUID, foreign key)
- tag_id (UUID, foreign key)
- PRIMARY KEY (article_id, tag_id)
```

### Database Features

- **Auto-slug generation**: Automatische slug generatie van title met uniqueness check
- **RLS (Row Level Security)**: Public read voor published posts, authenticated users kunnen alles beheren
- **Indexes**: Optimalisatie voor status, published_at, slug, seo_keywords
- **Triggers**: Auto-update van updated_at timestamp
- **Views**: Article count per categorie en tag

## API Endpoints

### Blog Posts

#### GET /api/blog/posts
Lijst van posts met filtering, paginatie en sorting.

**Query Parameters:**
- `page` (number): Pagina nummer (default: 1)
- `per_page` (number): Resultaten per pagina (default: 10, max: 100)
- `status` (string): Filter op status ('draft', 'published', 'scheduled')
- `category` (string): Filter op category slug
- `tag` (string): Filter op tag slug
- `author` (string): Filter op author_id
- `search` (string): Zoeken in title, content, excerpt
- `sort_by` (string): Sorteer veld (default: 'published_at')
- `sort_order` (string): Sorteer richting ('asc' of 'desc', default: 'desc')
- `slug` (string): Haal specifieke post op via slug

**Response:**
```json
{
  "posts": [...],
  "pagination": {
    "page": 1,
    "per_page": 10,
    "total": 50,
    "total_pages": 5
  }
}
```

#### POST /api/blog/posts
Maak nieuwe post aan (authentication required).

**Body:**
```json
{
  "title": "Post Title",
  "slug": "post-slug",
  "content": "<p>HTML content</p>",
  "excerpt": "Short summary",
  "featured_image": "https://...",
  "status": "draft",
  "published_at": "2024-01-01T00:00:00Z",
  "meta_title": "SEO Title",
  "meta_description": "SEO Description",
  "focus_keyword": "main keyword",
  "seo_keywords": ["keyword1", "keyword2"],
  "categories": ["category-uuid-1", "category-uuid-2"],
  "tags": ["tag-uuid-1", "tag-uuid-2"]
}
```

#### PUT /api/blog/posts/:id
Update bestaande post (authentication required).

#### DELETE /api/blog/posts/:id
Verwijder post (authentication required).

#### PATCH /api/blog/posts/:id/publish
Publiceer post direct (authentication required).

### Categories

#### GET /api/blog/categories
Lijst van alle categorieën met post counts.

#### POST /api/blog/categories
Maak nieuwe categorie (authentication required).

**Body:**
```json
{
  "name": "Category Name",
  "slug": "category-slug",
  "description": "Optional description"
}
```

#### PUT /api/blog/categories/:id
Update categorie (authentication required).

#### DELETE /api/blog/categories/:id
Verwijder categorie (authentication required).

### Tags

#### GET /api/blog/tags
Lijst van alle tags met post counts.

#### POST /api/blog/tags
Maak nieuwe tag (authentication required).

**Body:**
```json
{
  "name": "Tag Name",
  "slug": "tag-slug"
}
```

## Dashboard Interface

### Toegang
Dashboard is toegankelijk via `/dashboard/blog` (authentication required).

### Blog Overzicht (/dashboard/blog)

Features:
- Tabel met alle posts
- Filters: status, zoeken
- Sorteerbare kolommen
- Bulk acties: publiceren, draft maken, verwijderen
- Status badges (Draft, Gepubliceerd, Gepland)
- View counts
- Quick links naar Categories en Tags beheer

### Post Editor (/dashboard/blog/new, /dashboard/blog/edit/:id)

Features:
- **Title input** met auto-slug generatie
- **Content editor** (HTML textarea, ondersteunt alle HTML tags)
- **Excerpt** voor korte samenvatting
- **Featured Image** URL input met preview
- **Status selectie** (Draft, Gepubliceerd, Gepland)
- **Categorieën** multi-select met checkboxes
- **Tags** multi-select met checkboxes
- **SEO sectie** (uitklapbaar):
  - Meta Title (max 60 karakters)
  - Meta Description (max 160 karakters)
  - Focus Keyword
- **Acties**: Opslaan als Draft, Publiceren, Annuleren

### Categorieën Beheer (/dashboard/blog/categories)

Features:
- Lijst van alle categorieën
- Post count per categorie
- Add/Edit/Delete functionaliteit
- Modal interface voor aanmaken/bewerken

### Tags Beheer (/dashboard/blog/tags)

Features:
- Lijst van alle tags
- Post count per tag
- Add functionaliteit
- Modal interface voor aanmaken

## Frontend Blog Pagina's

### Blog Overzicht (/blog)

Features:
- Grid layout van posts (3 kolommen op desktop)
- Featured images
- Title, excerpt, publicatiedatum
- View counts
- Focus keyword badges
- Responsive design
- Empty state met call-to-action

### Blog Post Pagina (/blog/:slug)

Features:
- Volledige post content (HTML rendering)
- Featured image
- Meta informatie (datum, views)
- Table of Contents (sidebar)
- Author Box
- Social Share buttons
- Gerelateerde posts
- SEO geoptimaliseerd (meta tags, Open Graph, Twitter Cards, Schema.org)
- Breadcrumbs
- CTA sectie

### Categorie Pagina (/blog/category/:slug)

Features:
- Categorie beschrijving
- Gefilterde posts voor specifieke categorie
- Zelfde post grid layout als blog overzicht
- Breadcrumb navigatie

## SEO Implementatie

### Meta Tags
- Dynamische meta title en description per post
- Automatic fallback naar post title/excerpt
- Character limits conform best practices

### Open Graph & Twitter Cards
Automatisch gegenereerd per post:
- og:title, og:description, og:image
- twitter:card, twitter:title, twitter:description, twitter:image
- Locale: nl_NL

### Schema.org Structured Data
- **BlogPosting** schema voor posts
- **BreadcrumbList** voor navigatie
- **Author** schema
- **Organization** schema

### Sitemap (/sitemap.xml)
Automatisch gegenereerd met:
- Alle gepubliceerde blog posts
- Categorie pagina's
- Static pages
- lastModified timestamps
- Priority en changeFrequency per type

### RSS Feed (/blog/rss.xml)
Features:
- Laatste 50 gepubliceerde posts
- CDATA voor HTML content
- Categories per post
- Caching (1 uur)

### URL Structure
- Clean URLs: `/blog/:slug`
- Category URLs: `/blog/category/:slug`
- Automatische slug generatie
- Uniqueness validation

## Workflows & Best Practices

### Post Creëren

1. Ga naar Dashboard → Blog → Nieuwe Post
2. Vul Title in (slug wordt automatisch gegenereerd)
3. Schrijf content (HTML tags toegestaan)
4. Voeg excerpt toe voor overzichtspagina's
5. Upload featured image (voer URL in)
6. Selecteer categorieën en tags
7. Vul SEO informatie in:
   - Meta title (max 60 karakters)
   - Meta description (max 160 karakters)
   - Focus keyword
8. Kies status:
   - **Draft**: Niet zichtbaar voor publiek
   - **Published**: Direct live
   - **Scheduled**: Voor toekomstige publicatie
9. Klik "Opslaan als Draft" of "Publiceren"

### Content Organisatie

**Categorieën:**
- Gebruik voor hoofdonderwerpen (max 5-7 categorieën)
- Meerdere categorieën per post mogelijk
- Voorbeelden: "SEO", "WordPress", "AI & Automatisering"

**Tags:**
- Gebruik voor specifieke onderwerpen en keywords
- Onbeperkt aantal tags per post
- Voorbeelden: "Google Ranking", "Content Marketing", "Automatisering"

### SEO Optimalisatie

**Meta Title:**
- Houd onder 60 karakters
- Inclusief focus keyword
- Uniek per post

**Meta Description:**
- 150-160 karakters
- Bevat focus keyword
- Call-to-action indien mogelijk

**Content:**
- Gebruik H2 en H3 headers
- Focus keyword in eerste paragraaf
- Minimum 300 woorden voor SEO waarde
- Interne en externe links toevoegen

**Images:**
- Gebruik descriptieve alt teksten
- Optimaliseer bestandsgrootte
- Featured image verplicht voor social sharing

## Deployment

### Environment Variables
Zorg dat de volgende variabelen zijn ingesteld:
```
NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
SUPABASE_SERVICE_ROLE_KEY=your_service_key
NEXT_PUBLIC_SITE_URL=https://writgo.nl
```

### Database Migratie
1. Run `supabase_blog_migration.sql` voor initiële schema
2. Run `supabase_blog_migration_update.sql` voor updates

### Build & Deploy
```bash
npm run build
npm start
```

### Post-Deployment Checklist
- [ ] Test post aanmaken in dashboard
- [ ] Verifieer slug generatie
- [ ] Check public blog pagina's
- [ ] Test categorieën en tags
- [ ] Verifieer sitemap.xml werkt
- [ ] Check RSS feed
- [ ] Test SEO meta tags
- [ ] Verifieer responsive design

## Toekomstige Uitbreidingen

### Rich Text Editor
Huidige implementatie gebruikt HTML textarea. Voor betere UX:
- Integreer TipTap of Quill.js
- WYSIWYG interface
- Image upload direct in editor
- Markdown support

### Media Library
- Central media management
- Image upload functionaliteit
- Automatic image optimization
- Responsive image generation

### Auto-save
- Periodic auto-save (elke 30 seconden)
- Draft recovery
- Revision history

### Advanced Features
- Post scheduling met cron jobs
- Email notifications voor nieuwe posts
- Comments systeem
- Related posts algoritme verbetering
- Reading time calculator
- Reading progress indicator
- Social share count tracking

## Troubleshooting

### Posts worden niet weergegeven
- Check of status = 'published'
- Verifieer published_at is ingesteld
- Check RLS policies in Supabase

### Slug conflicts
- Systeem voegt automatisch nummer toe bij duplicates
- Handmatig aanpassen mogelijk in editor

### Categories/Tags niet zichtbaar in editor
- Verifieer categorieën/tags zijn aangemaakt
- Check API responses in browser console
- Verifieer authentication

### SEO features werken niet
- Check environment variables
- Verifieer NEXT_PUBLIC_SITE_URL
- Check meta tags in browser inspector

## Support & Contact

Voor vragen of problemen met het blog systeem:
- Check deze documentatie eerst
- Inspecteer browser console voor errors
- Verifieer API responses in Network tab
- Check Supabase logs voor database errors

## Changelog

### Version 1.0.0 (December 2024)
- Initial blog system implementatie
- Complete CRUD voor posts, categorieën, tags
- Dashboard interface
- SEO optimalisatie
- Sitemap en RSS feed
- Category filtering
