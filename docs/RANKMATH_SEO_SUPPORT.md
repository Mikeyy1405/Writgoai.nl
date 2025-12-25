# RankMath SEO Support in Writgo Connector Plugin

## Overzicht

De Writgo Connector plugin ondersteunt nu **beide** populaire WordPress SEO plugins:
- ✅ **Yoast SEO** (versie 1.0.0+)
- ✅ **RankMath SEO** (versie 1.1.0+)

De plugin detecteert automatisch welke SEO plugin geïnstalleerd is en synchroniseert alle SEO metadata correct.

---

## Ondersteunde SEO Data

### Voor Beide Plugins

| SEO Veld | Yoast Meta Key | RankMath Meta Key | Writgo API Param |
|----------|----------------|-------------------|------------------|
| **Meta Title** | `_yoast_wpseo_title` | `rank_math_title` | `seo_title` |
| **Meta Description** | `_yoast_wpseo_metadesc` | `rank_math_description` | `seo_description` |
| **Focus Keyword** | `_yoast_wpseo_focuskw` | `rank_math_focus_keyword` | `focus_keyword` |
| **Canonical URL** | `_yoast_wpseo_canonical` | `rank_math_canonical_url` | `canonical_url` |

---

## Automatische Detectie

De plugin detecteert automatisch welke SEO plugin actief is:

```php
// In WordPress plugin
private function detect_seo_plugin() {
    if (class_exists('RankMath')) {
        return 'rankmath';
    } elseif (class_exists('WPSEO_Meta')) {
        return 'yoast';
    }
    return 'none';
}
```

**Connection test toont SEO plugin:**
```json
GET /wp-json/writgo/v1/test

Response:
{
  "success": true,
  "wordpress_version": "6.4",
  "plugin_version": "1.1.0",
  "seo_plugin": "rankmath"  // or "yoast" or "none"
}
```

---

## API Gebruik

### Artikel Publiceren met SEO Data

**Request:**
```http
POST /wp-json/writgo/v1/posts
X-Writgo-API-Key: your-api-key
Content-Type: application/json

{
  "title": "Best SEO Practices 2025",
  "content": "<p>Content here...</p>",
  "status": "publish",
  "seo_title": "SEO Best Practices Guide 2025 | YourSite",
  "seo_description": "Complete guide to SEO best practices in 2025. Learn ranking factors, optimization tips, and more.",
  "focus_keyword": "seo best practices",
  "canonical_url": "https://yoursite.com/seo-guide/"
}
```

**Response:**
```json
{
  "id": 123,
  "title": "Best SEO Practices 2025",
  "url": "https://yoursite.com/seo-guide/",
  "seo": {
    "title": "SEO Best Practices Guide 2025 | YourSite",
    "description": "Complete guide to SEO best practices...",
    "focus_keyword": "seo best practices",
    "canonical_url": "https://yoursite.com/seo-guide/"
  },
  "seo_plugin": "rankmath"
}
```

**De plugin schrijft automatisch naar de juiste meta keys** afhankelijk van welke SEO plugin actief is!

---

## Writgo Client Gebruik

### TypeScript Client

```typescript
import { WordPressPluginClient } from '@/lib/wordpress-plugin-client';

const client = new WordPressPluginClient({
  apiEndpoint: 'https://jouwsite.nl/wp-json/writgo/v1/',
  apiKey: 'your-api-key',
});

// Test verbinding (detecteert SEO plugin)
const test = await client.testConnection();
console.log(test.seo_plugin); // "rankmath" or "yoast" or "none"

// Publish met SEO data (werkt met beide plugins)
const result = await client.publishArticle({
  title: 'My Article',
  content: '<p>Content...</p>',
  seo_title: 'Custom SEO Title',
  seo_description: 'Custom meta description',
  focus_keyword: 'main keyword',
  canonical_url: 'https://site.com/custom-url/',
});
```

---

## RankMath Specifieke Features

### Canonical URL

RankMath heeft betere canonical URL ondersteuning dan Yoast. De plugin ondersteunt nu canonical URLs voor beide:

```typescript
// Automatisch opgeslagen in juiste meta key
await client.createPost({
  title: 'Article',
  content: 'Content',
  canonical_url: 'https://yoursite.com/preferred-url/',
});

// RankMath: rank_math_canonical_url
// Yoast: _yoast_wpseo_canonical
```

### Focus Keyword

RankMath ondersteunt meerdere focus keywords, maar de plugin gebruikt op dit moment alleen het primaire keyword (gelijk aan Yoast):

```typescript
// Focus keyword
focus_keyword: 'seo optimization'

// RankMath: rank_math_focus_keyword
// Yoast: _yoast_wpseo_focuskw
```

---

## Migratie van Yoast naar RankMath

Als een klant van Yoast naar RankMath migreert (of vice versa):

**Wat gebeurt er?**

1. **Plugin detecteert nieuwe SEO plugin automatisch**
   ```
   Oude setup: Yoast actief → SEO data in _yoast_wpseo_* keys
   Nieuwe setup: RankMath actief → SEO data in rank_math_* keys
   ```

2. **Nieuwe posts gebruiken RankMath meta keys**
   ```
   POST /wp-json/writgo/v1/posts
   → Plugin detecteert RankMath
   → Schrijft naar rank_math_title, rank_math_description, etc.
   ```

3. **Oude posts behouden Yoast data**
   ```
   GET /wp-json/writgo/v1/posts/123
   → Als _yoast_wpseo_title bestaat: retourneert Yoast data
   → Als rank_math_title bestaat: retourneert RankMath data
   ```

**RankMath Import Tool:**

RankMath heeft een ingebouwde import tool die Yoast SEO data automatisch migreert:
- WordPress Admin → Rank Math → Status & Tools → Import & Export
- Selecteer "Yoast SEO"
- Klik "Import"
- Alle SEO data wordt gekopieerd naar RankMath meta keys

**Na import werkt alles automatisch!**

---

## Testing

### Test RankMath Support

**Stap 1: Installeer RankMath**
```
WordPress → Plugins → Add New
Search "Rank Math SEO" → Install → Activate
```

**Stap 2: Test Connection**
```bash
curl -H "X-Writgo-API-Key: your-key" \
     https://yoursite.nl/wp-json/writgo/v1/test

# Response bevat:
{
  "seo_plugin": "rankmath"
}
```

**Stap 3: Publish Test Post**
```bash
curl -X POST \
     -H "X-Writgo-API-Key: your-key" \
     -H "Content-Type: application/json" \
     -d '{
       "title": "Test Post",
       "content": "Test content",
       "seo_title": "Custom Title",
       "seo_description": "Custom description",
       "focus_keyword": "test keyword"
     }' \
     https://yoursite.nl/wp-json/writgo/v1/posts
```

**Stap 4: Verify in WordPress**
```
WordPress → Posts → Edit test post
Scroll naar RankMath SEO sectie
Verify:
- Title: "Custom Title"
- Description: "Custom description"
- Focus Keyword: "test keyword"
```

---

## Troubleshooting

### SEO Data Wordt Niet Opgeslagen

**Check 1: SEO Plugin Actief?**
```bash
curl https://yoursite.nl/wp-json/writgo/v1/test

# Check seo_plugin in response
```

**Check 2: Meta Data in Database**
```sql
SELECT meta_key, meta_value
FROM wp_postmeta
WHERE post_id = 123
  AND (meta_key LIKE 'rank_math_%' OR meta_key LIKE '_yoast_wpseo_%');
```

**Check 3: Plugin Detectie**
```php
// In WordPress, test detection manually
$plugin = new Writgo_Connector();
echo $plugin->detect_seo_plugin(); // Should output "rankmath" or "yoast"
```

### SEO Data Leeg bij Ophalen

**Mogelijke oorzaken:**
1. SEO plugin niet actief → `seo_plugin: "none"`
2. Post heeft geen SEO data → Lege strings
3. Verkeerde meta keys → Check database

**Oplossing:**
```typescript
// Check welke SEO plugin actief is
const test = await client.testConnection();
if (test.seo_plugin === 'none') {
  console.log('Geen SEO plugin gedetecteerd!');
  console.log('Installeer Yoast SEO of RankMath');
}
```

---

## Best Practices

### 1. Altijd SEO Plugin Detecteren

```typescript
// Voor elke nieuwe verbinding
const test = await client.testConnection();
const seoPlugin = test.seo_plugin;

// Toon in UI
if (seoPlugin === 'rankmath') {
  console.log('✅ RankMath SEO gedetecteerd');
} else if (seoPlugin === 'yoast') {
  console.log('✅ Yoast SEO gedetecteerd');
} else {
  console.warn('⚠️ Geen SEO plugin - SEO data wordt niet opgeslagen');
}
```

### 2. SEO Data Valideren

```typescript
// Validate SEO data voor publishing
function validateSeoData(article: PluginPost) {
  const warnings = [];

  if (!article.seo_title) {
    warnings.push('Meta title ontbreekt');
  }
  if (!article.seo_description) {
    warnings.push('Meta description ontbreekt');
  } else if (article.seo_description.length > 160) {
    warnings.push('Meta description te lang (max 160 chars)');
  }
  if (!article.focus_keyword) {
    warnings.push('Focus keyword ontbreekt');
  }

  return warnings;
}

// Usage
const warnings = validateSeoData(article);
if (warnings.length > 0) {
  console.warn('SEO warnings:', warnings);
}
```

### 3. Fallback voor Geen SEO Plugin

```typescript
// Als geen SEO plugin actief is, gebruik WordPress defaults
const post = await client.createPost({
  title: article.title, // Wordt ook gebruikt als <title> zonder SEO plugin
  content: article.content,
  excerpt: article.excerpt, // Wordt gebruikt als meta description zonder SEO plugin
  // SEO data wordt genegeerd als geen plugin actief
  seo_title: article.seo_title,
  seo_description: article.seo_description,
});
```

---

## FAQ

**Q: Kan ik beide Yoast EN RankMath tegelijk hebben?**
A: Technisch ja, maar niet aanbevolen. De plugin gebruikt de eerst gedetecteerde:
1. Eerst check op RankMath
2. Dan check op Yoast
3. Anders "none"

**Q: Wat als ik van Yoast naar RankMath switch?**
A: Gebruik RankMath's import tool om Yoast data te migreren. Daarna detecteert de plugin automatisch RankMath en gebruikt die meta keys.

**Q: Worden oude posts met Yoast data nog gelezen?**
A: Ja, de plugin leest altijd uit de juiste meta keys op het moment van ophalen.

**Q: Kan ik handmatig de SEO plugin forceren?**
A: Nee, de plugin detecteert automatisch. Dit voorkomt fouten.

**Q: Ondersteunt RankMath meer SEO features dan Yoast?**
A: Ja, maar de plugin ondersteunt op dit moment alleen de basis SEO fields die beide plugins gemeenschappelijk hebben (title, description, focus keyword, canonical).

---

## Changelog

### Version 1.1.0 (RankMath Support)

**Added:**
- ✅ RankMath SEO plugin detection
- ✅ Automatic meta key mapping (Yoast vs RankMath)
- ✅ Canonical URL support for both plugins
- ✅ `seo_plugin` field in connection test response
- ✅ `seo_plugin` field in post responses

**Improved:**
- Unified SEO meta data functions (`get_seo_meta`, `set_seo_meta`)
- Better SEO data handling in format_post
- Client library TypeScript types updated

**Backwards Compatible:**
- ✅ Bestaande Yoast implementaties blijven werken
- ✅ Geen breaking changes
- ✅ Automatische fallback naar Yoast indien RankMath niet actief

---

## Conclusie

Met **RankMath SEO support** in versie 1.1.0:

✅ **Werkt met beide** populaire SEO plugins (Yoast + RankMath)
✅ **Automatische detectie** - geen configuratie nodig
✅ **Transparant** - zelfde API voor beide plugins
✅ **Backwards compatible** - bestaande Yoast setups blijven werken
✅ **Future-proof** - klaar voor SEO plugin migraties

**Voor klanten betekent dit:**
- Geen extra setup nodig
- Werkt met hun voorkeur SEO plugin
- Gemakkelijke migratie tussen SEO plugins
- Consistente Writgo ervaring

**Voor developers betekent dit:**
- Eén API voor beide plugins
- Automatische meta key mapping
- TypeScript type safety
- Easy testing met beide plugins
