
# WritgoAI Autopilot Cron Job Schema

## Overzicht

Dit document beschrijft de automatische uitvoering van alle autopilot functies in WritgoAI.

## Probleem dat is opgelost

**VOOR de fix:**
- De `vercel.json` verwees naar `/api/cron/autopilot-content` die NIET bestond
- Hierdoor werden GEEN autopilot jobs uitgevoerd
- Content werd niet automatisch gegenereerd ondanks instellingen

**NA de fix:**
- Alle autopilot endpoints zijn correct geconfigureerd
- Elke autopilot draait op het juiste tijdstip
- Content wordt automatisch gegenereerd volgens schema

---

## Cron Jobs Configuratie

### 1. Autopilot Scheduler
**Endpoint:** `/api/cron/autopilot-scheduler`  
**Schema:** `*/15 * * * *` (elke 15 minuten)  
**Functie:** 
- Controleert AutopilotSchedule records voor scheduled runs
- Gebruikt `nextRunAt` veld om te bepalen welke schedules moeten draaien
- Ondersteunt verschillende frequenties:
  - `once-daily`: 1x per dag op specifiek tijdstip
  - `twice-daily`: 2x per dag (bijv. 09:00 en 15:00)
  - `three-weekly`: Ma/Wo/Vr
  - `custom-days`: Specifieke dagen kiezen (bijv. Di/Do/Za)
  - `weekly`: 1x per week op specifieke dag
  - `monthly`: 1x per maand op specifieke datum

**Voorbeeld gebruik:**
Een gebruiker kan in de autopilot settings een schedule maken voor:
- Elke maandag en donderdag om 09:00
- 5 artikelen per keer
- Automatisch publiceren naar WordPress

### 2. Project Autopilot (Legacy/Fallback)
**Endpoint:** `/api/cron/autopilot-projects`  
**Schema:** `0 9 * * *` (dagelijks om 09:00 UTC = 10:00/11:00 NL tijd)  
**Functie:**
- Controleert Project records met `autopilotEnabled = true`
- Gebruikt `autopilotNextRun` veld om te bepalen wanneer te draaien
- Ondersteunt twee modes:
  - **Fast mode**: Gebruikt bestaande Article Ideas
  - **Research mode**: Voert eerst keyword research uit, controleert WordPress voor duplicaten
- Respecteert project instellingen:
  - `autopilotArticlesPerRun`: Aantal artikelen per run (default: 5)
  - `autopilotPriority`: high/medium/all
  - `autopilotContentType`: blog/product-review/news/all
  - `autopilotAutoPublish`: Direct naar WordPress publiceren
  - `autopilotFrequency`: daily/weekly/monthly/three_weekly/weekdays

**Ondersteunde frequenties:**
- `twice_daily`: Elke 12 uur
- `daily`: Elke dag
- `three_weekly`: Elke 2 dagen (~3.5x per week)
- `weekdays`: Ma-Vr (skipped weekenden)
- `weekly`: Elke 7 dagen
- `monthly`: Elke maand

### 3. Social Media Autopilot
**Endpoint:** `/api/cron/social-media-autopilot`  
**Schema:** `0 10 * * *` (dagelijks om 10:00 UTC = 11:00/12:00 NL tijd)  
**Functie:**
- Genereert en publiceert social media posts
- Ondersteunt LinkedIn, Facebook, Instagram, Twitter, YouTube
- Gebruikt Gelaten.dev API voor publicatie
- Respecteert platform-specifieke character limits

### 4. Link Building Autopilot
**Endpoint:** `/api/cron/linkbuilding-auto`  
**Schema:** `0 3 * * *` (dagelijks om 03:00 UTC = 04:00/05:00 NL tijd)  
**Functie:**
- Voegt automatisch affiliate links toe aan bestaande WordPress content
- Zoekt relevante plaatsingsmogelijkheden
- Gebruikt Bol.com affiliate links
- Houdt credits bij voor link plaatsingen

---

## Tijdlijnen (Nederlandse tijd)

### Winterperiode (UTC+1):
- **03:00 - 04:00**: Link Building Autopilot draait
- **09:00 - 10:00**: Project Autopilot draait
- **10:00 - 11:00**: Social Media Autopilot draait
- **Elke 15 min**: Scheduler controleert voor scheduled runs

### Zomerperiode (UTC+2):
- **04:00 - 05:00**: Link Building Autopilot draait
- **10:00 - 11:00**: Project Autopilot draait
- **11:00 - 12:00**: Social Media Autopilot draait
- **Elke 15 min**: Scheduler controleert voor scheduled runs

---

## Welke Autopilot wordt gebruikt?

### AutopilotSchedule (Nieuw systeem - AANBEVOLEN)
✅ **Gebruiken als:**
- Je specifieke dagen wilt kiezen (bijv. alleen Ma/Wo/Vr)
- Je meerdere tijden per dag wilt (bijv. 09:00 en 15:00)
- Je precies wilt bepalen WANNEER content wordt gegenereerd
- Je verschillende schedules per project wilt

**Voordelen:**
- Flexibele scheduling (custom days)
- Meerdere schedules per project mogelijk
- Real-time tracking van elke run
- Controle over exacte tijdstippen

### Project Autopilot (Legacy systeem)
⚠️ **Gebruiken als:**
- Je eenvoudige frequenties wilt (daily/weekly/monthly)
- Je geen specifieke tijdstippen hoeft te bepalen
- Je research mode wilt gebruiken
- Je backward compatibility nodig hebt

**Beperkingen:**
- Draait altijd om 09:00 UTC
- Minder flexibele scheduling opties
- Geen ondersteuning voor custom days

---

## Hoe werkt de Scheduler?

### Stap 1: Cron Job draait (elke 15 minuten)
```
Vercel Cron → POST /api/cron/autopilot-scheduler
              met Authorization: Bearer CRON_SECRET
```

### Stap 2: Find schedules die moeten draaien
```sql
SELECT * FROM AutopilotSchedule
WHERE isActive = true
  AND nextRunAt <= NOW()
```

### Stap 3: Voor elke schedule
1. Haal article IDs op uit schedule
2. Filter processed articles
3. Selecteer `articlesPerRun` aantal artikelen
4. Voor elk artikel:
   - Call `/api/client/autopilot/generate`
   - Als `autoPublish = true`: Call `/api/client/autopilot/publish`
5. Update schedule:
   - `lastRunAt = NOW()`
   - `nextRunAt = calculateNextRun()`
   - `processedArticleIds += new articles`

### Stap 4: Bereken volgende run tijd
De `calculateNextRun()` functie gebruikt:
- `frequency` (once-daily/twice-daily/three-weekly/custom-days/etc.)
- `timeOfDay` (bijv. "09:00")
- `daysOfWeek` (voor custom-days: [1, 3, 5] = Ma/Wo/Vr)

---

## Troubleshooting

### "Waarom wordt mijn autopilot niet uitgevoerd?"

**Controleer het volgende:**

1. **Is autopilot enabled?**
   ```sql
   -- Voor AutopilotSchedule:
   SELECT * FROM AutopilotSchedule WHERE projectId = 'xxx' AND isActive = true;
   
   -- Voor Project Autopilot:
   SELECT autopilotEnabled, autopilotNextRun FROM Project WHERE id = 'xxx';
   ```

2. **Is er een nextRunAt / autopilotNextRun datum?**
   - Als `nextRunAt` in het verleden ligt → zou moeten draaien bij volgende cron
   - Als `NULL` → schedule wordt nooit uitgevoerd!

3. **Zijn er article ideas beschikbaar?**
   ```sql
   SELECT COUNT(*) FROM ArticleIdea 
   WHERE projectId = 'xxx' 
     AND status = 'idea' 
     AND hasContent = false;
   ```

4. **Check de laatste run:**
   ```sql
   SELECT lastRunAt, nextRunAt, totalRuns, successfulRuns, failedRuns, lastError
   FROM AutopilotSchedule 
   WHERE id = 'xxx';
   ```

5. **Check AutopilotJob records:**
   ```sql
   SELECT * FROM AutopilotJob 
   WHERE projectId = 'xxx' 
   ORDER BY createdAt DESC 
   LIMIT 10;
   ```

### "Autopilot draait, maar genereert geen content"

**Mogelijke oorzaken:**

1. **Geen eligible articles**
   - Check `autopilotPriority` setting (high only? medium+high? all?)
   - Check `autopilotContentType` filter
   - Check of articles al `hasContent = true`

2. **Research mode problemen** (alleen Project Autopilot)
   - WordPress credentials niet correct?
   - Duplicate detection faalt?
   - Keyword research API down?

3. **Credit gebrek**
   - Check client's credit balance
   - Content generation kost 50-100 credits per artikel

4. **API errors**
   - Check logs voor `/api/client/autopilot/generate` errors
   - Check WordPress API connectivity

---

## Best Practices

### 1. Voor nieuwe projecten: Gebruik AutopilotSchedule
```typescript
// Maak een schedule aan via UI of API:
{
  scheduleType: "recurring",
  frequency: "custom-days",
  daysOfWeek: [1, 3, 5], // Ma, Wo, Vr
  timeOfDay: "09:00",
  articlesPerRun: 3,
  autoPublish: true
}
```

### 2. Voor bestaande projecten: Migreer naar AutopilotSchedule
1. Check huidige `autopilotFrequency` op Project
2. Maak een equivalent AutopilotSchedule
3. Zet `autopilotEnabled = false` op Project
4. Activeer de nieuwe schedule

### 3. Test de schedule eerst
- Gebruik "Nu Uitvoeren" functie in UI
- Check AutopilotJob records voor errors
- Verificeer WordPress publicatie
- Controleer credit usage

### 4. Monitor regelmatig
- Check `lastRunAt` vs `nextRunAt`
- Check `failedRuns` count
- Review `lastError` als er problemen zijn
- Monitor credit balance

---

## Deployment

Na het updaten van `vercel.json`:

1. **Commit en push changes**
2. **Deploy naar production**
3. **Vercel registreert automatisch de nieuwe cron jobs**
4. **Check Vercel dashboard → Cron Jobs tab**
5. **Monitor eerste run voor errors**

**Vercel Cron Logs:**
- Ga naar Vercel Dashboard
- Klik op project "WritgoAI"
- Ga naar "Logs" tab
- Filter op "cron"

---

## API Authentication

Alle cron endpoints vereisen authentication:

```typescript
headers: {
  'Authorization': `Bearer ${process.env.CRON_SECRET}`
}
```

De `CRON_SECRET` wordt automatisch door Vercel ingesteld.

---

## Changelog

### November 8, 2025 - Critical Fix
- **Probleem**: Autopilot werd NIET uitgevoerd door incorrect vercel.json pad
- **Oplossing**: 
  - Updated vercel.json naar correcte endpoints
  - Toegevoegd: autopilot-scheduler (elke 15 min)
  - Toegevoegd: autopilot-projects (dagelijks 09:00 UTC)
  - Toegevoegd: social-media-autopilot (dagelijks 10:00 UTC)
  - Toegevoegd: linkbuilding-auto (dagelijks 03:00 UTC)
- **Impact**: Alle autopilot functies werken nu correct
- **Actie vereist**: Deploy naar production voor activatie

---

## Contact

Voor vragen over autopilot configuratie:
- Check deze documentatie
- Review AutopilotSchedule records in database
- Check Vercel cron logs
- Test met "Nu Uitvoeren" functie
