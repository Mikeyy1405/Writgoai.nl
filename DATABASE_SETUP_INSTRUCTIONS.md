# 🛠️ Database Setup Instructies

## 📋 Probleem

De **WebsiteAnalysis** tabel ontbreekt in de database, waardoor de AI Website Analyzer niet werkt.

Foutmelding: `relation "WebsiteAnalysis" does not exist`

## ✅ Oplossingen

Je hebt 2 opties, afhankelijk van wat je nodig hebt:

---

### Optie 1: 🚀 Alleen WebsiteAnalysis Tabel (Snelle Fix)

**Wanneer gebruiken?**
- Je wilt alleen de WebsiteAnalysis functionaliteit repareren
- Andere tabellen bestaan al
- Je wilt de minimale aanpassingen

**Stappen:**

1. **Open Supabase SQL Editor**
   - Ga naar je Supabase project
   - Klik op "SQL Editor" in de zijbalk

2. **Kopieer het script**
   - Open: `/supabase/migrations/CREATE_WEBSITE_ANALYSIS_TABLE.sql`
   - Selecteer ALLES (Ctrl+A of Cmd+A)
   - Kopieer (Ctrl+C of Cmd+C)

3. **Plak en Run**
   - Plak in de SQL Editor (Ctrl+V or Cmd+V)
   - Klik op "Run" (of druk Ctrl+Enter)

4. **Verificatie**
   - Je zou moeten zien: `✅ WebsiteAnalysis tabel succesvol aangemaakt!`
   - Als je een tabel structuur ziet met kolommen, dan werkt het!

**Klaar!** De WebsiteAnalysis tabel is nu aangemaakt. 🎉

---

### Optie 2: 🏗️ Complete Database Setup (Aanbevolen)

**Wanneer gebruiken?**
- Je wilt zeker zijn dat ALLE tabellen bestaan
- Je hebt een nieuwe database
- Je wilt een complete, schone setup

**Dit maakt aan:**
- ✅ Client (klanten)
- ✅ Project (projecten per klant)
- ✅ BlogPost (blog artikelen)
- ✅ ContentPlan (content planning)
- ✅ ContentPlanItem (individuele content items)
- ✅ TopicalAuthorityMap (topical authority maps)
- ✅ TopicalMapArticle (artikelen in maps)
- ✅ SocialMediaStrategy (social media strategieën)
- ✅ SocialMediaPost (social media posts)
- ✅ **WebsiteAnalysis** (AI website analyse) ⭐
- ✅ AutopilotConfig (autopilot instellingen)

**Plus:**
- 🔗 Alle foreign keys tussen tabellen
- 📊 Indexes voor snelle queries
- ⏱️ Automatische updatedAt triggers

**Stappen:**

1. **Open Supabase SQL Editor**
   - Ga naar je Supabase project
   - Klik op "SQL Editor" in de zijbalk

2. **Kopieer het complete script**
   - Open: `/supabase/migrations/COMPLETE_DATABASE_SETUP.sql`
   - Selecteer ALLES (Ctrl+A or Cmd+A)
   - Kopieer (Ctrl+C or Cmd+C)

3. **Plak en Run**
   - Plak in de SQL Editor (Ctrl+V or Cmd+V)
   - Klik op "Run" (of druk Ctrl+Enter)
   - **Let op:** Dit kan 5-10 seconden duren!

4. **Verificatie**
   - Je zou moeten zien:
     - `✅ Complete database setup voltooid!`
     - `🎉 Alle tabellen, foreign keys, indexes en triggers zijn aangemaakt!`
   - Daaronder zie je een lijst met alle aangemaakte tabellen

**Klaar!** Je database is nu compleet opgezet. 🎉

---

## 🔍 Verificatie

### Check of WebsiteAnalysis bestaat

Run deze query in Supabase SQL Editor:

```sql
SELECT table_name 
FROM information_schema.tables
WHERE table_name = 'WebsiteAnalysis';
```

**Verwacht resultaat:**
```
table_name
--------------
WebsiteAnalysis
```

Als je een rij ziet met "WebsiteAnalysis", dan werkt het! ✅

### Check alle tabellen

Run deze query om alle belangrijke tabellen te zien:

```sql
SELECT 
  table_name,
  (SELECT COUNT(*) FROM information_schema.columns 
   WHERE columns.table_name = tables.table_name) as column_count
FROM information_schema.tables
WHERE table_schema = 'public'
  AND table_type = 'BASE TABLE'
  AND table_name IN (
    'Client', 'Project', 'BlogPost', 'ContentPlan', 
    'TopicalAuthorityMap', 'WebsiteAnalysis', 'AutopilotConfig'
  )
ORDER BY table_name;
```

**Verwacht resultaat:** Een lijst met alle tabellen en hun aantal kolommen.

---

## ⚠️ Belangrijke Opmerkingen

### ✅ Veilig te gebruiken

- Beide scripts gebruiken `IF NOT EXISTS` checks
- Ze kunnen **veilig meerdere keren** worden uitgevoerd
- Ze **verwijderen GEEN bestaande data**
- Ze **overschrijven GEEN bestaande tabellen**

### 🔄 Idempotent

Als een tabel al bestaat, wordt deze overgeslagen. Geen errors!

### 🚨 Wat als het faalt?

**Foreign Key Errors:**
Als je errors ziet over foreign keys:
1. Run eerst het complete script (Optie 2)
2. Dit zorgt ervoor dat alle parent tabellen bestaan

**Permission Errors:**
Als je `permission denied` ziet:
1. Zorg dat je ingelogd bent als admin/owner
2. Check je Supabase rol permissies

---

## 🧪 Test de WebsiteAnalysis Functionaliteit

Na het runnen van het script, test of het werkt:

1. **Login in je Writgo.nl admin**
2. **Ga naar Blog Management**
3. **Klik op "Analyseer Website"**
4. **Selecteer een client met content**
5. **Klik op de analyse knop**

Als het werkt, zou je moeten zien:
- ✨ Niche detectie
- 👥 Doelgroep analyse
- 🎵 Tone of voice detectie
- 🔑 Keywords en thema's

---

## 📚 Technische Details

### Database Structuur

**WebsiteAnalysis tabel bevat:**
- `id` - Unieke identifier
- `clientId` - Link naar Client (met CASCADE delete)
- `projectId` - Optionele link naar Project
- `niche` - Gedetecteerde niche (met confidence score)
- `targetAudience` - Gedetecteerde doelgroep (met confidence score)
- `tone` - Gedetecteerde tone of voice (met confidence score)
- `keywords` - Array van keywords
- `themes` - Array van content thema's
- `reasoning` - AI uitleg van de analyse
- `websiteUrl` - URL van geanalyseerde website
- `blogPostsAnalyzed` - Aantal blog posts gebruikt in analyse
- `socialPostsAnalyzed` - Aantal social posts gebruikt in analyse
- `analyzedAt` - Timestamp van analyse
- `createdAt` / `updatedAt` - Record timestamps

### Foreign Keys

- `WebsiteAnalysis.clientId` → `Client.id` (ON DELETE CASCADE)
- `WebsiteAnalysis.projectId` → `Project.id` (ON DELETE CASCADE)

### Indexes

Voor optimale performance:
- Index op `clientId` (voor queries per klant)
- Index op `projectId` (voor queries per project)
- Index op `analyzedAt` (voor chronologische queries)

---

## 🆘 Hulp Nodig?

Als je problemen hebt:

1. **Check de Supabase logs** voor error details
2. **Run de verificatie queries** hierboven
3. **Check of je admin rechten hebt** in Supabase
4. **Probeer het complete setup script** (Optie 2) als Optie 1 faalt

---

## ✨ Klaar!

Na het succesvol runnen van één van deze scripts, zou de AI Website Analyzer het moeten doen! 🚀

Veel succes! 💪
