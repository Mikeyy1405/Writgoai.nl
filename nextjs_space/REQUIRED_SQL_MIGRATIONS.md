# 🗄️ Benodigde SQL Migrations Voor WritGo.nl

Dit document bevat een volledig overzicht van alle SQL migrations die uitgevoerd moeten worden voor het WritGo.nl platform. Volg de volgorde zoals hieronder aangegeven.

---

## 📋 Migrations Overzicht

Er zijn in totaal **4 migrations** beschikbaar:

| #  | Bestand | Status | Verplicht | Beschrijving |
|----|---------|--------|-----------|--------------|
| 1  | `20241216000000_wordpress_autopilot.sql` | ⚠️ Optioneel | Nee | WordPress Autopilot System (basis tabellen) |
| 2  | `20241216120000_autopilot_content_features.sql` | ⚠️ Optioneel | Nee | WordPress Autopilot Content Features (uitbreidingen) |
| 3  | `20241217000000_topical_authority.sql` | ⚠️ Deprecated | Nee | Topical Authority (oude versie - **NIET UITVOEREN**) |
| 4  | `20241217120000_topical_authority_fixed.sql` | ✅ **VERPLICHT** | **JA** | Topical Authority (correcte versie) |

---

## 🎯 Volgorde Van Uitvoeren

### ✅ **VERPLICHTE MIGRATION**

#### **Migration 4: Topical Authority System (Fixed)**
- **Bestand:** `supabase/migrations/20241217120000_topical_authority_fixed.sql`
- **Status:** ✅ **MOET WORDEN UITGEVOERD**
- **Beschrijving:** Dit is de correcte en volledige versie van het Topical Authority systeem
- **Wat het doet:**
  - Maakt 6 nieuwe tabellen aan voor het Topical Authority systeem
  - Ondersteunt 400-500 artikel planning per project
  - Integreert met DataForSEO API voor keyword research
  - Cached WordPress sitemap data voor interne links
  - Bevat automatische triggers voor article counts

**Belangrijke tabellen:**
1. `TopicalAuthorityMap` - Hoofdtabel voor content strategy maps
2. `PillarTopic` - Core pillar topics (5-10 per map)
3. `Subtopic` - Subtopics die pillars ondersteunen (40-50 per pillar)
4. `PlannedArticle` - Individuele artikelen (8-10 per subtopic)
5. `WordPressSitemapCache` - Cache voor WordPress sitemap data
6. `DataForSEOCache` - Cache voor DataForSEO API resultaten (30 dagen)

---

### ⚠️ **OPTIONELE MIGRATIONS** (WordPress Autopilot)

#### **Migration 1: WordPress Autopilot Basis**
- **Bestand:** `supabase/migrations/20241216000000_wordpress_autopilot.sql`
- **Status:** ⚠️ Optioneel (alleen als je WordPress Autopilot wilt gebruiken)
- **Beschrijving:** Basis tabellen voor WordPress Autopilot systeem
- **Wat het doet:**
  - Maakt 4 tabellen aan voor WordPress Autopilot
  - `WordPressAutopilotSite` - WordPress site configuraties
  - `ContentStrategy` - Content planning data
  - `ContentCalendarItem` - Geplande content items
  - `AutopilotSettings` - Site-specifieke autopilot instellingen

#### **Migration 2: WordPress Autopilot Features**
- **Bestand:** `supabase/migrations/20241216120000_autopilot_content_features.sql`
- **Status:** ⚠️ Optioneel (alleen na Migration 1)
- **Vereist:** Migration 1 moet eerst zijn uitgevoerd
- **Beschrijving:** Uitbreidingen voor WordPress Autopilot systeem
- **Wat het doet:**
  - Voegt content rules toe aan `AutopilotSettings`
  - Voegt content intent tracking toe aan `ContentCalendarItem`
  - Ondersteunt interne links, affiliate links, en afbeeldingen

---

### ❌ **DEPRECATED MIGRATION**

#### **Migration 3: Topical Authority (Oude Versie)**
- **Bestand:** `supabase/migrations/20241217000000_topical_authority.sql`
- **Status:** ❌ **NIET UITVOEREN** (deprecated)
- **Waarom niet:** Deze migration is vervangen door migration 4 (`20241217120000_topical_authority_fixed.sql`)
- **Opmerking:** Als je deze per ongeluk hebt uitgevoerd, zal migration 4 de tabellen opnieuw aanmaken

---

## 🔍 Hoe Te Controleren Welke Migrations Al Zijn Uitgevoerd

### Methode 1: Check of tabellen bestaan in Supabase

Voer deze query uit in je Supabase SQL Editor:

```sql
-- Check Topical Authority tabellen
SELECT EXISTS (
  SELECT FROM information_schema.tables 
  WHERE table_schema = 'public' 
  AND table_name = 'TopicalAuthorityMap'
) AS topical_authority_exists;

-- Check WordPress Autopilot tabellen
SELECT EXISTS (
  SELECT FROM information_schema.tables 
  WHERE table_schema = 'public' 
  AND table_name = 'WordPressAutopilotSite'
) AS wordpress_autopilot_exists;
```

### Methode 2: Check alle bestaande tabellen

```sql
-- Lijst alle tabellen op
SELECT table_name 
FROM information_schema.tables 
WHERE table_schema = 'public' 
AND table_type = 'BASE TABLE'
ORDER BY table_name;
```

### Methode 3: Check Supabase Migrations tabel

```sql
-- Supabase houdt een lijst bij van uitgevoerde migrations
SELECT * FROM supabase_migrations.schema_migrations
ORDER BY version DESC;
```

---

## 📝 Hoe Te Uitvoeren

### Via Supabase Dashboard (Aanbevolen)

1. **Open Supabase Dashboard**
   - Ga naar [https://app.supabase.com](https://app.supabase.com)
   - Selecteer je WritGo.nl project

2. **Open SQL Editor**
   - Klik op "SQL Editor" in het linkermenu
   - Klik op "New Query"

3. **Voer Migration 4 uit (VERPLICHT)**
   - Open het bestand: `supabase/migrations/20241217120000_topical_authority_fixed.sql`
   - Kopieer de volledige inhoud
   - Plak in de SQL Editor
   - Klik op "Run" (of Ctrl/Cmd + Enter)
   - ✅ Wacht tot de query succesvol is uitgevoerd

4. **Optioneel: WordPress Autopilot migrations**
   - **Alleen als je WordPress Autopilot wilt gebruiken:**
   - Voer migration 1 uit (`20241216000000_wordpress_autopilot.sql`)
   - Voer migration 2 uit (`20241216120000_autopilot_content_features.sql`)

### Via Supabase CLI

Als je de Supabase CLI hebt geïnstalleerd:

```bash
# Ga naar je project directory
cd /home/ubuntu/writgoai_nl/nextjs_space

# Voer migration 4 uit (VERPLICHT)
supabase db push

# Of voer een specifieke migration uit
supabase migration up
```

---

## ✅ Verificatie Na Uitvoeren

Voer deze verificatie queries uit om te controleren of alles goed is gegaan:

### Topical Authority Verificatie

```sql
-- Check alle Topical Authority tabellen
SELECT 'TopicalAuthorityMap' as table_name, COUNT(*) as count FROM "TopicalAuthorityMap"
UNION ALL
SELECT 'PillarTopic', COUNT(*) FROM "PillarTopic"
UNION ALL
SELECT 'Subtopic', COUNT(*) FROM "Subtopic"
UNION ALL
SELECT 'PlannedArticle', COUNT(*) FROM "PlannedArticle"
UNION ALL
SELECT 'WordPressSitemapCache', COUNT(*) FROM "WordPressSitemapCache"
UNION ALL
SELECT 'DataForSEOCache', COUNT(*) FROM "DataForSEOCache";
```

### WordPress Autopilot Verificatie (optioneel)

```sql
-- Check alle WordPress Autopilot tabellen
SELECT 'WordPressAutopilotSite' as table_name, COUNT(*) as count FROM "WordPressAutopilotSite"
UNION ALL
SELECT 'ContentStrategy', COUNT(*) FROM "ContentStrategy"
UNION ALL
SELECT 'ContentCalendarItem', COUNT(*) FROM "ContentCalendarItem"
UNION ALL
SELECT 'AutopilotSettings', COUNT(*) FROM "AutopilotSettings";
```

### Triggers Verificatie

```sql
-- Check of triggers zijn aangemaakt
SELECT trigger_name, event_object_table, action_statement
FROM information_schema.triggers
WHERE trigger_schema = 'public'
AND event_object_table IN ('TopicalAuthorityMap', 'PlannedArticle');
```

---

## 🚨 Troubleshooting

### Error: "relation already exists"

Dit betekent dat de tabel al bestaat. Migration 4 heeft een ingebouwde `DROP TABLE IF EXISTS` die dit automatisch oplost. Als je deze error ziet:

1. Controleer of je migration 3 (de oude versie) hebt uitgevoerd
2. Voer migration 4 nogmaals uit - deze dropt eerst alle oude tabellen
3. Alles zou nu correct moeten worden aangemaakt

### Error: "foreign key constraint"

Dit betekent dat er referenties zijn naar tabellen die niet bestaan:

1. Zorg ervoor dat de `Project`, `Client`, en `SavedContent` tabellen bestaan
2. Deze zijn onderdeel van je basis WritGo.nl database schema
3. Als deze niet bestaan, moet je eerst de basis migrations uitvoeren

### Error: "permission denied"

Je hebt geen rechten om tabellen aan te maken:

1. Check of je bent ingelogd met de juiste Supabase account
2. Controleer of je "Service Role" rechten hebt
3. Gebruik de Supabase dashboard in plaats van direct SQL

---

## 📊 Database Schema Diagram

```
TopicalAuthorityMap (1 per project)
├── PillarTopic (5-10 per map)
│   ├── Subtopic (40-50 per pillar)
│   │   └── PlannedArticle (8-10 per subtopic)
│   └── PlannedArticle (1 pillar artikel)
│
├── WordPressSitemapCache (N per project)
└── DataForSEOCache (shared cache met 30 dagen expiry)
```

**Totaal per map:** 400-500 artikelen
- 10 pillar artikelen
- 100 subtopics (10 pillars × 10 subtopics)
- 400 cluster artikelen (100 subtopics × 4 artikelen)

---

## 📚 Gerelateerde Documentatie

- **Topical Authority Service:** `lib/services/topical-authority-service.ts`
- **DataForSEO API Client:** `lib/dataforseo-api.ts`
- **WordPress Sitemap Parser:** `lib/wordpress-sitemap-parser.ts`
- **API Routes:**
  - `/api/client/topical-authority/generate-map/route.ts`
  - `/api/client/topical-authority/maps/route.ts`
  - `/api/client/topical-authority/articles/route.ts`

---

## 🎉 Klaar!

Na het uitvoeren van **Migration 4** ben je klaar om het Topical Authority systeem te gebruiken. Je kunt nu:

✅ Content maps genereren met 400-500 artikelen  
✅ Pillar topics en subtopics beheren  
✅ DataForSEO integratie gebruiken voor keyword research  
✅ Automatische interne links suggesties krijgen  
✅ Content plannen en genereren via de API  

**Volgende stappen:**
1. Test de API endpoint: `POST /api/client/topical-authority/generate-map`
2. Controleer de nieuwe tabellen in Supabase
3. Begin met het genereren van je eerste Topical Authority map! 🚀

---

**Laatst bijgewerkt:** 17 december 2024  
**Versie:** 1.0  
**Auteur:** WritGo.nl Development Team
