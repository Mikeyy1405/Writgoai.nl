# WritGo Self-Promotion Feature

## 📖 Overzicht

De WritGo Self-Promotion feature is een volledig geautomatiseerd systeem dat WritGo zichzelf promoot door automatisch hoogwaardige blog posts en social media content te genereren. Het doel is om organisch meer klanten aan te trekken door waardevolle, SEO-geoptimaliseerde content te creëren die de mogelijkheden van WritGo demonstreert.

## 🎯 Wat doet het?

### Automatische Blog Generatie
- Genereert uitgebreide blog posts (2000+ woorden) over WritGo-gerelateerde topics
- SEO-geoptimaliseerd met focus keywords, meta titles en descriptions
- Automatische featured image generatie
- Verschillende content types:
  - **Feature Highlights**: "How WritGo's AI Content Writer Saves You 10+ Hours Per Week"
  - **Use Cases**: "How E-commerce Brands Use WritGo to Boost Product Descriptions"
  - **Tutorials**: "Getting Started with WritGo: Your First AI-Generated Blog Post"
  - **Comparisons**: "WritGo vs Jasper vs Copy.ai: Which AI Writer Is Best?"
  - **Success Stories**: "How Sarah Grew Her Blog Traffic 300% Using WritGo"
  - **Tips & Tricks**: "15 WritGo Hacks Every Content Creator Should Know"

### Automatische Social Media Posts
- Genereert social media posts voor Instagram, LinkedIn, Twitter, en meer
- Verschillende post types:
  - **Educational**: Tips en tricks voor content creators
  - **Promotional**: Highlight voordelen van WritGo
  - **Storytelling**: Success stories van gebruikers
  - **Engagement**: Vragen aan de community
- Automatische afbeelding generatie per post
- Platform-specifieke optimalisatie (character limits, hashtags)
- Variatie mechanisme om herhaling te voorkomen

## 🗄️ Database Schema

### `writgo_self_promotion_config`
Hoofdconfiguratie tabel (single row):
- **Blog settings**: `blog_enabled`, `blog_frequency` (daily/weekly/monthly)
- **Social settings**: `social_enabled`, `social_frequency`, `social_platforms`
- **Content types**: `use_case_studies`, `use_feature_highlights`, etc.
- **Scheduling**: `next_blog_run_at`, `next_social_run_at`
- **Stats**: `total_blogs_generated`, `total_social_posts_generated`

### `writgo_self_promotion_templates`
Content templates met topics en structuur:
- 15+ blog templates
- 10+ social media templates
- Tracking van gebruik (`times_used`, `last_used_at`)
- Categorieën: feature_highlight, use_case, tutorial, comparison, success_story, etc.

## 🚀 API Endpoints

### 1. Generate Blog
```bash
POST /api/writgo/self-promotion/generate-blog
```

**Body:**
```json
{
  "template_id": "optional-uuid",
  "auto_publish": false
}
```

**Response:**
```json
{
  "success": true,
  "article": {
    "id": "uuid",
    "title": "Generated title",
    "slug": "generated-slug",
    "status": "draft",
    "excerpt": "Blog excerpt",
    "featured_image": "https://...",
    "template_used": "Template name"
  }
}
```

### 2. Generate Social Post
```bash
POST /api/writgo/self-promotion/generate-social
```

**Body:**
```json
{
  "project_id": "required-uuid",
  "template_id": "optional-uuid",
  "platforms": ["instagram", "linkedin"],
  "auto_publish": false
}
```

**Response:**
```json
{
  "success": true,
  "post": {
    "id": "uuid",
    "content": "Post content with hashtags",
    "image_url": "https://...",
    "platforms": ["instagram", "linkedin"],
    "status": "draft",
    "template_used": "Template name"
  }
}
```

### 3. Cron Job (Automatic)
```bash
GET /api/cron/self-promotion
Authorization: Bearer CRON_SECRET
```

Draait automatisch elk uur (0 * * * *) en controleert of er content gegenereerd moet worden.

## ⚙️ Installatie & Setup

### 1. Database Migratie Uitvoeren

```bash
# Via Supabase Dashboard:
# 1. Ga naar SQL Editor
# 2. Kopieer de inhoud van supabase_writgo_self_promotion_migration.sql
# 3. Voer het script uit
```

Of via CLI:
```bash
psql -h db.xxx.supabase.co -U postgres -d postgres -f supabase_writgo_self_promotion_migration.sql
```

### 2. Cron Job is Actief

De cron job is al geconfigureerd in `vercel.json`:
```json
{
  "path": "/api/cron/self-promotion",
  "schedule": "0 * * * *"  // Elk uur
}
```

### 3. Configuratie Aanpassen (Optioneel)

De default configuratie is al actief na de migratie:
- Blogs: **Weekly** (elke week een blog)
- Social: **Daily** (elke dag 2 posts - 10:00 & 16:00)
- Platforms: Instagram, LinkedIn, Twitter

Om aan te passen, update de `writgo_self_promotion_config` tabel:
```sql
UPDATE writgo_self_promotion_config
SET
  blog_frequency = 'twice_weekly',
  social_frequency = 'three_times_daily',
  social_platforms = ARRAY['instagram', 'linkedin', 'twitter', 'facebook']
WHERE id = (SELECT id FROM writgo_self_promotion_config LIMIT 1);
```

## 📊 Monitoring & Stats

### Stats Bekijken
```sql
SELECT
  enabled,
  blog_enabled,
  social_enabled,
  total_blogs_generated,
  total_social_posts_generated,
  last_blog_generated_at,
  last_social_generated_at,
  next_blog_run_at,
  next_social_run_at
FROM writgo_self_promotion_config;
```

### Self-Promotion Content Bekijken
```sql
-- Blogs
SELECT id, title, status, created_at
FROM articles
WHERE is_self_promotion = true
ORDER BY created_at DESC;

-- Social Posts
SELECT id, content, platforms, status, created_at
FROM social_posts
WHERE is_self_promotion = true
ORDER BY created_at DESC;
```

### Template Usage
```sql
SELECT
  template_type,
  category,
  title_template,
  times_used,
  last_used_at
FROM writgo_self_promotion_templates
ORDER BY times_used DESC;
```

## 🎨 Content Variatie

Het systeem voorkomt repetitief content door:

1. **Template Rotatie**: Kiest automatisch de minst gebruikte templates
2. **Recent Posts Analysis**: Analyseert de laatste 5 posts om openingszinnen niet te herhalen
3. **High Temperature AI**: Gebruikt temperature 0.8-0.9 voor meer creativiteit
4. **Variation Seed**: Unieke seed per post voor verschillende outputs

## 🔧 Troubleshooting

### Content wordt niet gegenereerd
```sql
-- Check of self-promotion enabled is
SELECT enabled, blog_enabled, social_enabled
FROM writgo_self_promotion_config;

-- Check next run times
SELECT next_blog_run_at, next_social_run_at
FROM writgo_self_promotion_config;

-- Update run times manually if needed
UPDATE writgo_self_promotion_config
SET
  next_blog_run_at = NOW(),
  next_social_run_at = NOW();
```

### Cron job logs bekijken
Check Vercel deployment logs voor `self-promotion cron job` output.

### Templates toevoegen
```sql
INSERT INTO writgo_self_promotion_templates (
  template_type,
  category,
  title_template,
  topic,
  description,
  keywords,
  target_audience
) VALUES (
  'blog',
  'feature_highlight',
  'Your Custom Title Template',
  'Your topic description',
  'Detailed description',
  ARRAY['keyword1', 'keyword2'],
  'target audience'
);
```

## 📈 Best Practices

### Blog Frequency
- **Daily**: Voor aggressive growth (veel content)
- **Weekly**: Voor balanced growth (kwaliteit over kwantiteit) ✅ **Recommended**
- **Monthly**: Voor minimal automation

### Social Frequency
- **Daily**: 1-2 posts per dag ✅ **Recommended**
- **Twice daily**: 2 posts spread over de dag
- **Three times daily**: Maximum engagement (morgen, middag, avond)

### Content Mix
Enable diverse content types voor beste resultaten:
- ✅ Use case studies
- ✅ Feature highlights
- ✅ Tutorials
- ✅ Success stories
- ✅ Comparison posts

### Platforms
Kies platforms waar je target audience is:
- **Instagram**: Visual content, creators, lifestyle
- **LinkedIn**: B2B, professionals, agencies ✅ **Best for WritGo**
- **Twitter**: Tech community, real-time updates
- **Facebook**: Broader audience, groups

## 🚦 Status Overview

| Component | Status | Details |
|-----------|--------|---------|
| Database Schema | ✅ Ready | Migration file created |
| Blog API | ✅ Ready | `/api/writgo/self-promotion/generate-blog` |
| Social API | ✅ Ready | `/api/writgo/self-promotion/generate-social` |
| Cron Job | ✅ Ready | Runs hourly (0 * * * *) |
| Templates | ✅ Ready | 15 blog + 10 social templates |
| Automation | ⏸️ Pending | Activate by running migration |

## 🎯 Volgende Stappen

1. **Run de database migratie** om het systeem te activeren
2. **Monitor de eerste runs** via logs en database queries
3. **Pas configuratie aan** op basis van resultaten
4. **Voeg custom templates toe** voor specifieke use cases
5. **Integreer met Late.dev** voor automatisch publiceren naar social media

## 💡 Tips voor Maximaal Effect

1. **Consistentie is key**: Houd een regelmatig posting schema aan
2. **Monitor engagement**: Check welke post types het beste werken
3. **A/B test templates**: Voeg nieuwe templates toe en test performance
4. **Update keywords**: Pas focus keywords aan op basis van SEO trends
5. **Cross-promote**: Verwijs in social posts naar blog posts en vice versa

---

**Gemaakt door**: WritGo Self-Promotion System
**Versie**: 1.0.0
**Laatst bijgewerkt**: December 2024
