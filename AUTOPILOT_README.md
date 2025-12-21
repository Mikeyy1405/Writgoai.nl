# WritGo AutoPilot System

## 🚀 Volledig Geautomatiseerd Content Systeem

### Wat doet het?

WritGo AutoPilot is een volledig hands-off content generatie systeem dat:

1. **RSS Feeds monitort** (19 premium bronnen)
2. **Content kansen detecteert** (nieuws, tutorials, how-tos)
3. **AI artikelen genereert** (2500+ woorden, SEO-geoptimaliseerd)
4. **Featured images maakt** (via Unsplash API)
5. **Automatisch publiceert** (naar WritGo.nl blog)

### Hoe werkt het?

```
┌─────────────────┐
│  Cron Job       │  Elke 6 uur
│  (Render)       │
└────────┬────────┘
         │
         ▼
┌─────────────────────────────────────────┐
│  /api/cron/autopilot                    │
│  ┌─────────────────────────────────┐   │
│  │ 1. Check RSS Feeds              │   │
│  │    - 19 premium feeds           │   │
│  │    - Laatste 10 items per feed  │   │
│  │    - Max 7 dagen oud            │   │
│  └─────────────────────────────────┘   │
│                                         │
│  ┌─────────────────────────────────┐   │
│  │ 2. Auto-Publish                 │   │
│  │    - Scheduled articles         │   │
│  │    - Publish to blog            │   │
│  └─────────────────────────────────┘   │
└─────────────────────────────────────────┘
         │
         ▼
┌─────────────────┐
│  Content Queue  │
│  (Supabase)     │
└─────────────────┘
```

### RSS Feeds (19 bronnen)

**Breaking News (elk uur)**
- Google Search Central Blog
- OpenAI News

**SEO Nieuws (dagelijks)**
- Search Engine Land
- Search Engine Journal
- Search Engine Roundtable
- Google AI Blog
- Anthropic News

**SEO Tutorials**
- Ahrefs Blog
- Moz Blog
- Backlinko
- Semrush Blog

**WordPress How-To**
- Yoast SEO Blog
- WPBeginner
- Kinsta Blog
- WordPress Tavern

**Tips & Best Practices**
- Neil Patel Blog
- HubSpot Marketing
- Copyblogger
- Content Marketing Institute

### Content Generator Features

**✅ 2500-3000 woorden** per artikel
**✅ SEO-geoptimaliseerd**
- Focus keyword optimization
- Meta title & description
- Internal linking
- Schema markup (Article, FAQ, Breadcrumbs)

**✅ Structured Content**
- Intro (200-250 woorden)
- Main sections (H2)
- Subsections (H3, H4)
- FAQ sectie (5-7 vragen)
- Praktische tips
- Conclusie & CTA

**✅ E-E-A-T Signalen**
- Bronvermelding
- Expert perspectief
- Actuele data
- Praktische voorbeelden

**✅ Featured Images**
- AI-generated via Unsplash
- 1200x630px (social media optimized)
- SEO-friendly alt text

### API Endpoints

#### `/api/writgo/check-triggers` (POST)
Check RSS feeds voor nieuwe content kansen

**Response:**
```json
{
  "checked": 19,
  "newOpportunities": 15,
  "errors": [],
  "opportunities": [...]
}
```

#### `/api/writgo/process-opportunity` (POST)
Genereer artikel van een content kans

**Body:**
```json
{
  "opportunityId": "uuid"
}
```

**Response:**
```json
{
  "success": true,
  "article": {...},
  "wordCount": 2847,
  "message": "Article generated and scheduled"
}
```

#### `/api/writgo/auto-publish` (POST/GET)
Publiceer geplande artikelen

**Response:**
```json
{
  "success": true,
  "processed": 3,
  "published": 3,
  "errors": []
}
```

#### `/api/cron/autopilot` (GET/POST)
Voer alle autopilot taken uit (voor cron jobs)

**Response:**
```json
{
  "success": true,
  "timestamp": "2024-12-21T13:00:00Z",
  "checkTriggers": {...},
  "autoPublish": {...},
  "errors": []
}
```

### Cron Job Configuratie

**Render Cron Job:**
- Schedule: `0 */6 * * *` (elke 6 uur)
- Endpoint: `https://writgo.nl/api/cron/autopilot`
- Region: Frankfurt

**Handmatig triggeren:**
```bash
curl -X POST https://writgo.nl/api/cron/autopilot
```

### Database Schema

**writgo_content_triggers**
- RSS feed configuratie
- Check frequency
- Priority
- Last checked timestamp

**writgo_content_opportunities**
- Gedetecteerde content kansen
- Status: detected, generating, queued, published, ignored
- Metadata (title, description, author, etc.)

**writgo_content_queue**
- Gegenereerde artikelen
- Scheduled for timestamp
- Status: scheduled, published, error
- Featured image URL

**articles**
- Gepubliceerde blog artikelen
- SEO metadata
- Schema markup
- Analytics (views, CTR, etc.)

### Monitoring

**Dashboard:** `/dashboard/writgo-autopilot`

**Metrics:**
- RSS feeds gecontroleerd
- Nieuwe kansen gedetecteerd
- Artikelen gegenereerd
- Artikelen gepubliceerd
- Fouten

**Activity Logs:**
- Alle autopilot acties
- Timestamps
- Error tracking

### Environment Variables

```env
# Supabase
NEXT_PUBLIC_SUPABASE_URL=https://xxx.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=xxx
SUPABASE_SERVICE_ROLE_KEY=xxx

# AI
AIML_API_KEY=xxx

# Site
NEXT_PUBLIC_SITE_URL=https://writgo.nl

# Images (optional)
UNSPLASH_ACCESS_KEY=xxx
```

### Troubleshooting

**Geen nieuwe kansen?**
- Check of RSS feeds actief zijn
- Controleer last_checked_at timestamps
- Verhoog tijdspanne (7 → 14 dagen)

**Artikelen worden niet gepubliceerd?**
- Check scheduled_for timestamp
- Controleer cron job status
- Test `/api/writgo/auto-publish` handmatig

**Fouten in RSS parsing?**
- Check feed URL bereikbaarheid
- Valideer RSS format
- Check error logs

### Future Improvements

**Fase 2:**
- [ ] AI image generation (DALL-E, Midjourney)
- [ ] Google Search Console integratie
- [ ] Ranking tracking
- [ ] Email notifications

**Fase 3:**
- [ ] Multi-user support (SaaS)
- [ ] WordPress API integratie
- [ ] Custom RSS feeds per user
- [ ] Billing & subscriptions

**Fase 4:**
- [ ] Video content generation
- [ ] Podcast transcription
- [ ] Link building automation
- [ ] Competitor analysis

---

**Status:** ✅ Fully Operational
**Last Updated:** December 21, 2024
**Version:** 1.0.0
