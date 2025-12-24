# Social Media Automation Setup Guide

## 🚀 Overview

Dit systeem automatiseert social media post generatie en scheduling. Posts worden automatisch gegenereerd op basis van je strategie, met geavanceerde AI variatie voor unieke content.

## ✨ Features

### 1. **Recurring Scheduling**
- **Dagelijks**: 1x per dag
- **2x per dag**: Ochtend & middag
- **3x per dag**: Ochtend, middag & avond
- **Werkdagen**: Maandag t/m vrijdag
- **Wekelijks**: 1x per week
- **Custom**: Eigen dagen kiezen

### 2. **Verbeterde Content Variatie**
- Analyseert recente posts om herhaling te voorkomen
- Gebruikt verschillende tonen en stijlen
- Varieert tussen schrijfstijlen
- Hogere AI temperature (0.9) voor creativiteit
- Gebruikt content pillars en brand voice uit strategie
- Roteert tussen verschillende post types

### 3. **Intelligente Post Generatie**
- Gebruikt content ideeën uit strategie
- Voorkomt duplicaten met variation seeds
- Past taal en tone aan op basis van brand voice
- Genereert unieke afbeeldingen per post

## 📋 Setup Instructies

### Stap 1: Database Migratie

Run de SQL migratie om de benodigde tabellen aan te maken:

```bash
# In Supabase SQL Editor
# Voer uit: supabase_social_scheduling_migration.sql
```

Dit maakt aan:
- `social_schedules` tabel
- Trigger functies voor next_run_at berekening
- Nieuwe kolommen in `social_posts` tabel

### Stap 2: Environment Variables

Voeg toe aan `.env.local`:

```env
# Cron Job Secret (genereer een random string)
CRON_SECRET=your-secret-here

# App URL (voor API calls vanuit cron)
NEXT_PUBLIC_APP_URL=https://your-app.vercel.app
```

Genereer CRON_SECRET:
```bash
openssl rand -base64 32
```

### Stap 3: Vercel Cron Setup

De cron job is al geconfigureerd in `vercel.json`:

```json
{
  "crons": [
    {
      "path": "/api/cron/social-autopilot",
      "schedule": "0 * * * *"  // Elk uur
    }
  ]
}
```

**⚠️ Belangrijk**: Voeg `CRON_SECRET` toe aan Vercel Environment Variables!

1. Ga naar Vercel Dashboard → Settings → Environment Variables
2. Voeg toe: `CRON_SECRET` met de waarde uit `.env.local`

### Stap 4: Test de Cron Job Manueel

```bash
curl -X GET https://your-app.vercel.app/api/cron/social-autopilot \
  -H "Authorization: Bearer YOUR_CRON_SECRET"
```

## 🎯 Gebruik

### In de UI

1. Ga naar **Dashboard → Social Media → Automatisering**
2. Schakel automatisering **aan**
3. Kies een **frequentie** (bijv. 2x per dag)
4. Stel **post tijden** in (bijv. 09:00 en 15:00)
5. Selecteer **post types** die moeten roteren
6. Kies of posts direct **gepubliceerd** of als **concept** opgeslagen worden
7. Klik op **"Automatisering Opslaan"**

### Workflow

```
┌─────────────────────────────────────────────────────────────┐
│  1. Cron Job draait elk uur                                 │
└──────────────────────┬──────────────────────────────────────┘
                       │
                       ▼
┌─────────────────────────────────────────────────────────────┐
│  2. Controleert schedules die nu moeten draaien             │
└──────────────────────┬──────────────────────────────────────┘
                       │
                       ▼
┌─────────────────────────────────────────────────────────────┐
│  3. Haalt strategie en recente posts op                     │
└──────────────────────┬──────────────────────────────────────┘
                       │
                       ▼
┌─────────────────────────────────────────────────────────────┐
│  4. Kiest post type (rotatie) en topic (content idee)      │
└──────────────────────┬──────────────────────────────────────┘
                       │
                       ▼
┌─────────────────────────────────────────────────────────────┐
│  5. Genereert post met AI (met variatie instructies)       │
└──────────────────────┬──────────────────────────────────────┘
                       │
                       ▼
┌─────────────────────────────────────────────────────────────┐
│  6. Genereert unieke afbeelding                             │
└──────────────────────┬──────────────────────────────────────┘
                       │
                       ▼
┌─────────────────────────────────────────────────────────────┐
│  7. Slaat post op in database                               │
└──────────────────────┬──────────────────────────────────────┘
                       │
                       ▼
┌─────────────────────────────────────────────────────────────┐
│  8. [Optioneel] Publiceert of plant post via Late API      │
└─────────────────────────────────────────────────────────────┘
```

## 🔍 Content Variatie Mechanisme

### Hoe werkt de variatie?

1. **Recent Posts Analyse**
   - Haalt laatste 5 posts op
   - Extraheert openingszinnen
   - Geeft dit mee aan AI om te vermijden

2. **Variatie Instructies**
   ```
   - Gebruik NIET deze openingszinnen: [recent]
   - Wissel af tussen tonen: informatief, inspirerend, persoonlijk
   - Varieer schrijfstijl: korte zinnen vs lange verhalen
   - Gebruik verschillende structuren: lijstjes, verhaal, Q&A
   ```

3. **Strategische Context**
   - Brand voice uit strategie
   - Content pillars voor relevante topics
   - Hashtag strategie

4. **Temperature & Seeds**
   - Temperature 0.9 (hoog voor creativiteit)
   - Unieke variation seed per post
   - Voorkomt exact dezelfde output

## 📊 Database Schema

### `social_schedules`
```sql
- id: UUID
- project_id: UUID (FK)
- enabled: BOOLEAN
- frequency: TEXT (daily/twice_daily/etc)
- custom_days: INTEGER[]
- post_times: TEXT[]
- auto_generate_content: BOOLEAN
- use_content_ideas: BOOLEAN
- post_types: TEXT[]
- target_platforms: TEXT[]
- auto_publish: BOOLEAN
- schedule_posts: BOOLEAN
- last_run_at: TIMESTAMP
- next_run_at: TIMESTAMP (auto-calculated)
```

### Nieuwe kolommen in `social_posts`
```sql
- schedule_id: UUID (FK)
- auto_generated: BOOLEAN
- variation_seed: TEXT
```

## 🛠️ API Endpoints

### `/api/social/schedule`

**GET** - Haal schedule op voor project
```
GET /api/social/schedule?project_id=xxx
```

**POST** - Maak of update schedule
```json
POST /api/social/schedule
{
  "project_id": "xxx",
  "enabled": true,
  "frequency": "twice_daily",
  "post_times": ["09:00", "15:00"],
  "post_types": ["educational", "storytelling"],
  "auto_publish": false
}
```

**PATCH** - Toggle enabled status
```json
PATCH /api/social/schedule
{
  "schedule_id": "xxx",
  "enabled": true
}
```

**DELETE** - Verwijder schedule
```
DELETE /api/social/schedule?schedule_id=xxx
```

### `/api/cron/social-autopilot`

**GET** - Voer cron job uit (alleen met CRON_SECRET)
```
GET /api/cron/social-autopilot
Header: Authorization: Bearer {CRON_SECRET}
```

## 🔧 Troubleshooting

### Cron draait niet
1. Controleer Vercel logs
2. Verifieer CRON_SECRET in environment variables
3. Test manueel met curl command

### Posts worden niet gegenereerd
1. Check of schedule `enabled = true`
2. Controleer of `next_run_at` in het verleden ligt
3. Bekijk cron job logs voor errors
4. Verifieer dat strategie bestaat voor project

### Alle posts zijn hetzelfde
1. Check of recente posts worden opgehaald
2. Verifieer temperature setting (moet 0.9 zijn)
3. Controleer variation seeds in database
4. Zorg dat meerdere post types geselecteerd zijn

### Next_run_at wordt niet berekend
1. Check database trigger functie
2. Verifieer post_times array formaat
3. Run migration opnieuw als nodig

## 📈 Best Practices

1. **Start Klein**: Begin met 1x per dag, schaal later op
2. **Test Eerst**: Gebruik concept modus voordat je auto-publish aanzet
3. **Varieer Post Types**: Selecteer minstens 3 verschillende types
4. **Meerdere Tijden**: Bij 2x/3x per dag, kies optimale tijden voor je doelgroep
5. **Monitor Output**: Check regelmatig de gegenereerde posts voor kwaliteit
6. **Update Strategie**: Refresh je strategie periodiek voor verse content ideeën

## 🎨 Content Kwaliteit Tips

Om de beste resultaten te krijgen:

1. ✅ Zorg voor een goede **strategie** met:
   - Duidelijke brand voice
   - Diverse content pillars
   - Veel content ideeën (15+)

2. ✅ Selecteer **meerdere post types** (min. 3)
3. ✅ Gebruik **content ideeën** optie
4. ✅ Start met **concept modus** om kwaliteit te checken
5. ✅ **Monitor** en pas aan op basis van resultaten

## 🆘 Support

Voor vragen of problemen:
- Check de logs in Vercel
- Bekijk Supabase database voor schedule status
- Test API endpoints manueel met curl/Postman

---

**Gemaakt door**: Claude AI Assistant
**Versie**: 1.0
**Datum**: December 2024
