# Internal Blog System Implementation

## Overzicht

Een volledig intern blog systeem voor WritgoAI marketing content, gescheiden van het bestaande client content systeem.

## Database Schema

### Tabel: `blog_posts`

Nieuwe Supabase tabel voor interne blog posts:

```sql
- id (UUID, primary key)
- title (TEXT, not null)
- slug (TEXT, unique, not null)
- content (TEXT) - HTML content
- excerpt (TEXT) - Korte samenvatting
- featured_image (TEXT) - URL naar afbeelding
- author_id (UUID, foreign key naar auth.users)
- status (TEXT: 'draft' of 'published')
- published_at (TIMESTAMP WITH TIME ZONE)
- created_at (TIMESTAMP WITH TIME ZONE)
- updated_at (TIMESTAMP WITH TIME ZONE)
- meta_title (TEXT) - SEO titel
- meta_description (TEXT) - SEO beschrijving
- category (TEXT)
- tags (TEXT ARRAY)
```

**Indexes:**
- Status (voor filtering)
- Slug (voor URL lookups)
- Published_at (voor sortering)
- Category (voor filtering)
- Tags (GIN index voor array searches)

**Row Level Security (RLS):**
- Publiek kan gepubliceerde posts lezen
- Authenticated users kunnen alle posts lezen/schrijven/updaten/verwijderen

## API Routes

### Publieke Routes

#### `GET /api/blog`
Haal alle gepubliceerde blog posts op (met paginering en filtering)

**Query Parameters:**
- `page` - Paginanummer (default: 1)
- `limit` - Items per pagina (default: 12)
- `category` - Filter op categorie
- `tag` - Filter op tag
- `status` - Admin filter op status (draft/published/all)

**Response:**
```json
{
  "posts": [...],
  "pagination": {
    "total": 10,
    "page": 1,
    "limit": 12,
    "pages": 1
  }
}
```

#### `GET /api/blog/[slug]`
Haal specifieke gepubliceerde blog post op via slug

**Response:**
```json
{
  "post": {
    "id": "...",
    "title": "...",
    "content": "...",
    ...
  }
}
```

### Admin Routes (Authenticated)

#### `POST /api/blog`
Maak nieuwe blog post aan

**Request Body:**
```json
{
  "title": "Titel",
  "slug": "url-slug",
  "content": "<p>HTML content</p>",
  "excerpt": "Korte samenvatting",
  "featured_image": "https://...",
  "status": "draft",
  "category": "AI & Content Marketing",
  "tags": ["ai", "content"],
  "meta_title": "SEO titel",
  "meta_description": "SEO beschrijving"
}
```

#### `GET /api/blog/id/[id]`
Haal specifieke blog post op via ID (alle statussen)

#### `PUT /api/blog/id/[id]`
Update blog post via ID

#### `DELETE /api/blog/id/[id]`
Verwijder blog post via ID

#### `PUT /api/blog/[slug]`
Update blog post via slug

#### `DELETE /api/blog/[slug]`
Verwijder blog post via slug

## Admin Portal Routes

### `/admin-portal/blog`
Overzichtspagina met alle blog posts

**Features:**
- Tabel met alle posts (draft & gepubliceerd)
- Filter op status (alle/concepten/gepubliceerd)
- Acties: Bewerken, Bekijken (als gepubliceerd), Verwijderen
- Metadata: titel, status, categorie, laatste update, publicatie datum

### `/admin-portal/blog/new`
Nieuwe blog post maken

**Features:**
- TipTap rich text editor voor content
- Basis informatie: titel, slug (auto-genereerd), samenvatting
- SEO metadata: meta titel, meta beschrijving
- Uitgelichte afbeelding (URL)
- Categorie selectie
- Tags (komma-gescheiden)
- Opslaan als concept of direct publiceren

### `/admin-portal/blog/[id]/edit`
Bestaande blog post bewerken

**Features:**
- Alle functionaliteit van "new" pagina
- Pre-filled met bestaande data
- Slug kan aangepast worden (met conflict check)
- Status kan gewijzigd worden (draft ↔ published)

## Publieke Blog Routes

### `/blog`
Publieke overzichtspagina met grid layout

**Features:**
- Grid layout met blog cards
- Featured images
- Categorie badges
- Excerpt
- Publicatie datum
- Category filtering
- Paginering

### `/blog/[slug]`
Individuele blog post pagina

**Features:**
- Volledige content weergave
- Featured image
- SEO metadata (dynamisch)
- Structured data (Schema.org BlogPosting)
- Share functionaliteit
- Category badge
- Tags met links
- Author info (WritgoAI Team)
- CTA voor free trial

## Beveiliging

### Authentication & Authorization
- Admin portal routes beveiligd via middleware
- Alleen users met role 'admin' of 'superadmin' hebben toegang
- Layout check op authentication en admin role

### API Security
- POST/PUT/DELETE routes vereisen authentication
- Session check via NextAuth
- Slug uniqueness validation
- Status parameter validation (draft/published/all)
- Proper error handling met maybeSingle() voor null checks

### RLS Policies
- Public users: read access voor published posts
- Authenticated users: full CRUD access
- Auto-managed via Supabase policies

## UI/UX

### Design System
- Tailwind CSS + Radix UI (consistent met bestaande app)
- Dark theme (zinc-900 backgrounds)
- Orange accent color (#FF9933)
- Responsive design (mobile-first)
- Toast notificaties voor feedback

### Editor
- TipTap WYSIWYG editor (reusable component)
- Rich formatting toolbar:
  - Text styling (bold, italic, underline)
  - Headers (H1, H2, H3)
  - Lists (bullet, ordered)
  - Alignment
  - Blockquotes
  - Code blocks
  - Links
  - Images
- Character & word count
- Auto-save functionaliteit (via manual save buttons)

### Nederlandse Interface
- Alle labels, buttons en meldingen in het Nederlands
- Nederlandse datum formatting (date-fns/locale/nl)
- Nederlandse foutmeldingen

## Integratie met Bestaand Systeem

### Componenten Hergebruik
- BlogEditor component (`/components/blog/blog-editor.tsx`)
- UI components van shadcn/ui
- Layout structure van admin area
- Toast systeem (react-hot-toast)

### Database Client
- Supabase client voor alle database operaties
- Supabase Admin client voor backend operations
- RLS policies voor security

### Middleware
- Admin-portal routes toegevoegd aan middleware matcher
- Authentication & authorization checks
- Redirect naar login als niet authenticated

## Migration Instructies

### Database Setup
1. Run migration: `supabase/migrations/20251213_internal_blog_posts.sql`
2. Verify table creation in Supabase dashboard
3. Check RLS policies zijn actief

### Eerste Blog Post
1. Login als admin
2. Navigeer naar `/admin-portal/blog`
3. Klik "Nieuwe Post"
4. Vul formulier in en publiceer
5. Bekijk op `/blog`

## Verschillen met Bestaand Blog Systeem

### Oude Systeem (`BlogPost` tabel)
- Voor client content generation
- Gekoppeld aan clients en projects
- WordPress integratie
- Autopilot features

### Nieuwe Systeem (`blog_posts` tabel)
- Voor WritgoAI marketing content
- Standalone posts zonder client koppeling
- Direct publicatie (geen WordPress)
- Manueel beheerd via admin portal

## Toekomstige Uitbreidingen

Mogelijke features voor later:
- Image upload naar storage bucket
- Draft preview functionaliteit
- Scheduling (publicatie op toekomstige datum)
- Analytics (views tracking)
- Comments systeem
- Related posts suggesties
- Search functionaliteit
- Multi-author support
- Revision history
- Bulk actions
- Import/export functionaliteit
