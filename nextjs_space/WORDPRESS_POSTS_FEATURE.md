# WordPress Posts Beheren - Feature Documentation

## Overzicht

Deze feature voegt uitgebreide WordPress posts management functionaliteit toe aan de Content Hub. Gebruikers kunnen nu:

1. **Bestaande WordPress posts ophalen en bekijken** in een overzichtelijk dashboard
2. **Posts direct bewerken** vanuit de app met een intuïtieve editor
3. **Posts herschrijven met AI** (Claude 4.5 Sonnet) met verschillende opties

## Functionaliteiten

### 1. WordPress Posts Overzicht

**Locatie**: Content Hub → WordPress Posts tab

**Features**:
- Haal alle gepubliceerde posts op van WordPress
- Toon posts in een overzichtelijk lijst formaat
- Zoekfunctionaliteit op titel, content en categorieën
- Statistieken dashboard met:
  - Totaal aantal posts
  - Aantal gepubliceerde posts
  - Gemiddeld woordenaantal
  - Filtered resultaten
- Post informatie per item:
  - Titel
  - Publicatiedatum
  - Woordenaantal
  - Status (gepubliceerd/concept/privé)
  - Auteur
  - Categorieën
  - Featured image

**Acties per post**:
- ✏️ **Bewerken** - Open editor modal
- ✨ **AI Herschrijven** - Start AI rewrite flow
- 👁️ **Bekijken** - Open post op de live website
- 🔗 **WordPress** - Open post in WordPress admin

### 2. Post Editor

**Toegang**: Klik op "Bewerken" knop bij een post

**Bewerkbare velden**:
- **Titel** - Post titel (verplicht)
- **Content** - Volledige HTML content (verplicht)
- **Samenvatting** (Excerpt) - Korte beschrijving
- **Meta Description** - SEO meta description (max 160 karakters)

**Features**:
- HTML syntax highlighting
- Karakter teller voor meta description
- Real-time validatie
- Direct opslaan naar WordPress
- Error handling met duidelijke foutmeldingen

### 3. AI Herschrijven met Claude 4.5 Sonnet

**Toegang**: Klik op "AI Herschrijven" knop bij een post

#### Herschrijf Opties:

1. **SEO Optimaliseren** 🔍
   - Optimaliseer voor zoekwoorden
   - Verbeter structuur met H2/H3 koppen
   - Voeg semantisch gerelateerde termen toe
   - Betere internal linking mogelijkheden
   - Verbeterde meta description

2. **Leesbaarheid Verbeteren** 📖
   - Kortere, duidelijkere zinnen
   - Eenvoudigere woordkeuze
   - Meer witruimte en bullet points
   - Actieve in plaats van passieve zinnen
   - Logische flow tussen alinea's

3. **Uitbreiden** 📈
   - Meer diepgang en details
   - Praktische voorbeelden
   - Extra secties (FAQ, tips)
   - Aanvullende context
   - Streef naar +50-100% lengte

4. **Inkorten** 📉
   - Verwijder overbodige informatie
   - Compactere zinnen
   - Focus op kernboodschap
   - Combineer gerelateerde secties
   - Streef naar -30-40% lengte

5. **Professionele Toon** 💼
   - Formele, zakelijke taal
   - Objectief en feitelijk
   - Correcte grammatica
   - Data en bronnen
   - Neutrale, gezaghebbende toon

6. **Casual Toon** 😊
   - Vriendelijke, conversationele stijl
   - Direct aanspreken (je/jij)
   - Persoonlijke voorbeelden
   - Begrijpelijk Nederlands
   - Engaging en menselijk

#### Extra Functionaliteit:

- **Custom Instructies** - Voeg specifieke instructies toe
- **Preview Functie** - Zie het resultaat voordat je publiceert
- **Vergelijking** - Zie origineel vs. herschreven versie naast elkaar
- **Verbeteringen Overzicht** - AI legt uit wat er is verbeterd
- **Word Count Tracking** - Zie het verschil in lengte

#### Workflow:

1. Klik op "AI Herschrijven" bij een post
2. Kies een herschrijf optie (of voeg custom instructies toe)
3. Klik op "Preview Genereren"
4. Review de voorgestelde wijzigingen:
   - Originele vs. nieuwe titel
   - Nieuwe meta description
   - Content preview
   - Verbeteringen samenvatting
   - Word count vergelijking
5. Klik op "Publiceren naar WordPress" om de wijzigingen door te voeren

## Technische Implementatie

### API Routes

#### 1. GET `/api/content-hub/wordpress-posts`
Haal alle WordPress posts op

**Query Parameters**:
- `siteId` (required) - ContentHubSite ID

**Response**:
```json
{
  "success": true,
  "posts": [
    {
      "id": 123,
      "title": "Post Titel",
      "slug": "post-titel",
      "link": "https://example.com/post-titel",
      "status": "publish",
      "date": "2025-12-05T10:00:00",
      "modified": "2025-12-05T12:00:00",
      "excerpt": "Korte samenvatting...",
      "content": "<p>Volledige HTML content...</p>",
      "wordCount": 1500,
      "featuredImage": "https://example.com/image.jpg",
      "author": "Admin",
      "categories": ["Categorie 1", "Categorie 2"]
    }
  ],
  "total": 50
}
```

#### 2. GET `/api/content-hub/wordpress-posts/[id]`
Haal specifieke post op

**Query Parameters**:
- `siteId` (required) - ContentHubSite ID

**Response**: Dezelfde structuur als één post object hierboven

#### 3. PUT `/api/content-hub/wordpress-posts/[id]`
Update een WordPress post

**Request Body**:
```json
{
  "siteId": "site_123",
  "title": "Nieuwe Titel",
  "content": "<p>Nieuwe HTML content...</p>",
  "excerpt": "Nieuwe samenvatting",
  "metaDescription": "Nieuwe meta description"
}
```

**Response**:
```json
{
  "success": true,
  "message": "Post succesvol bijgewerkt",
  "post": { /* post object */ }
}
```

#### 4. POST `/api/content-hub/wordpress-posts/[id]/rewrite`
Herschrijf post met AI

**Request Body**:
```json
{
  "siteId": "site_123",
  "rewriteOption": "seo-optimize",
  "customInstructions": "Focus op beginners",
  "previewOnly": true
}
```

**Rewrite Options**:
- `seo-optimize` - SEO Optimaliseren
- `readability` - Leesbaarheid Verbeteren
- `expand` - Uitbreiden
- `shorten` - Inkorten
- `tone-professional` - Professionele Toon
- `tone-casual` - Casual Toon

**Response (Preview)**:
```json
{
  "success": true,
  "preview": true,
  "rewrittenPost": {
    "title": "Verbeterde Titel",
    "content": "<p>Herschreven content...</p>",
    "metaDescription": "Nieuwe meta description",
    "improvements": "Belangrijkste verbeteringen...",
    "wordCount": 1750,
    "originalTitle": "Originele Titel",
    "originalContent": "...",
    "originalWordCount": 1500
  }
}
```

**Response (Publish)**:
```json
{
  "success": true,
  "message": "Post succesvol herschreven en gepubliceerd naar WordPress",
  "rewrittenPost": {
    "id": "123",
    "title": "Verbeterde Titel",
    "content": "<p>Herschreven content...</p>",
    "metaDescription": "Nieuwe meta description",
    "improvements": "Belangrijkste verbeteringen...",
    "wordCount": 1750,
    "link": "https://example.com/post-titel"
  }
}
```

### Frontend Components

#### 1. `WordPressPostsList.tsx`
**Props**:
- `siteId: string` - ContentHubSite ID
- `wordpressUrl: string` - WordPress site URL

**Features**:
- Fetch en display posts
- Search functionaliteit
- Statistics dashboard
- Action buttons per post
- Refresh button

#### 2. `WordPressPostEditor.tsx`
**Props**:
- `post: WordPressPost` - Post object om te bewerken
- `siteId: string` - ContentHubSite ID
- `onClose: () => void` - Callback om modal te sluiten
- `onSave: () => void` - Callback na succesvolle save

**Features**:
- Form validatie
- Character counting
- Save naar WordPress
- Error handling

#### 3. `AIRewriteModal.tsx`
**Props**:
- `post: WordPressPost` - Post object om te herschrijven
- `siteId: string` - ContentHubSite ID
- `onClose: () => void` - Callback om modal te sluiten
- `onComplete: () => void` - Callback na succesvolle rewrite

**Features**:
- 6 rewrite opties
- Custom instructies
- Preview functionaliteit
- Vergelijking origineel vs. nieuw
- Improvements overzicht
- Publish naar WordPress

### Utility Functions

**Bestand**: `/lib/wordpress-helpers.ts`

```typescript
// Count words in HTML content
countWords(htmlContent: string): number

// Build WordPress admin edit URL
getWordPressEditUrl(wordpressUrl: string, postId: number): string

// Sanitize HTML to plain text
sanitizeHtml(html: string): string

// Truncate text with ellipsis
truncateText(text: string, maxLength: number): string
```

## Vereisten

### WordPress Setup
- WordPress 5.0 of hoger
- REST API enabled (standaard)
- Application Password voor authenticatie
- Yoast SEO plugin (optioneel, voor betere meta description support)

### Content Hub Setup
1. Ga naar Content Hub
2. Klik op "Website Toevoegen"
3. Vul WordPress URL in
4. Vul WordPress username in
5. Genereer en vul Application Password in
6. Klik op "Verbinden"

### Application Password Aanmaken
1. Log in op WordPress
2. Ga naar Gebruikers → Profiel
3. Scroll naar "Application Passwords"
4. Voer een naam in (bijv. "WritGo AI")
5. Klik op "Add New Application Password"
6. Kopieer het gegenereerde wachtwoord
7. Plak het in de Content Hub verbinding

## AI Model

**Model**: Claude 4.5 Sonnet (`claude-sonnet-4-5-20250514`)

**Waarom Claude 4.5 Sonnet?**
- Beste kwaliteit voor lange-form content
- Uitstekende Nederlandse taalvaardigheid
- Sterke SEO optimalisatie capabilities
- Consistente output kwaliteit
- Goede instructie following

**Model Parameters**:
- Temperature: 0.7 (balans tussen creativiteit en consistentie)
- Max Tokens: 12,000 (ruim genoeg voor lange posts)

## Beveiliging

Zie `WORDPRESS_POSTS_SECURITY_SUMMARY.md` voor gedetailleerde security documentatie.

**Highlights**:
- ✅ Proper authentication op alle routes
- ✅ Authorization checks voor resource ownership
- ✅ Input validatie en sanitization
- ✅ SQL injection preventie via Prisma ORM
- ✅ XSS preventie met HTML sanitization
- ✅ Secure credential handling

## Beperkingen

1. **SEO Plugin Afhankelijkheid**: Meta description updates werken het beste met Yoast SEO
2. **Pagination Limit**: Maximum 2000 posts worden opgehaald (20 pagina's × 100 posts)
3. **Content Preview**: Preview is beperkt tot 1500 karakters (volledige content na publicatie)
4. **WordPress Versie**: Vereist WordPress 5.0+ met REST API

## Toekomstige Verbeteringen

### Korte Termijn
- [ ] Bulk edit functionaliteit
- [ ] Schedule herschrijven op specifieke tijden
- [ ] Content backup voor rewrite
- [ ] Undo functionaliteit

### Lange Termijn
- [ ] Multi-site support
- [ ] A/B testing van herschreven content
- [ ] SEO score vergelijking
- [ ] Automatische categorisatie
- [ ] Image optimization en upload
- [ ] Custom fields support

## Troubleshooting

### Posts worden niet geladen
**Probleem**: "WordPress niet bereikbaar" foutmelding

**Oplossingen**:
1. Controleer of WordPress URL correct is (met https://)
2. Controleer of Application Password correct is ingevuld
3. Controleer of WordPress REST API bereikbaar is: `https://yoursite.com/wp-json/wp/v2/posts`
4. Controleer WordPress firewall settings
5. Controleer of user voldoende rechten heeft

### Rewrite duurt te lang
**Probleem**: AI rewrite neemt meer dan 1 minuut

**Oplossingen**:
1. Check je internetverbinding
2. Probeer het opnieuw (kan tijdelijke AI service issue zijn)
3. Gebruik "Inkorten" optie voor zeer lange posts
4. Split zeer lange posts in meerdere delen

### Post update faalt
**Probleem**: "Kon post niet bijwerken" foutmelding

**Oplossingen**:
1. Controleer of je voldoende WordPress rechten hebt
2. Controleer of de post niet is verwijderd in WordPress
3. Check WordPress error logs
4. Probeer de post direct in WordPress te bewerken om permission issues uit te sluiten

## Support

Voor vragen of problemen:
1. Check deze documentatie
2. Check `WORDPRESS_POSTS_SECURITY_SUMMARY.md` voor security gerelateerde vragen
3. Contact ontwikkelaar via GitHub issues

## Changelog

### Versie 1.0.0 (2025-12-05)
- ✨ Initiële release
- ✨ WordPress posts ophalen en tonen
- ✨ Posts bewerken functionaliteit
- ✨ AI herschrijven met 6 opties
- ✨ Preview functionaliteit
- ✨ Nederlandse UI
- ✨ Security best practices
- ✨ Responsive design
