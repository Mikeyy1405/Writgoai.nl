
# Autopilot Cron Job Setup

## Probleem
De Vercel cron jobs in `vercel.json` werken alleen op **betaalde Vercel plannen** (Pro/Enterprise).

## Oplossing: Externe Cron Service

### Stap 1: Test de Autopilot Endpoint

Test eerst of de autopilot endpoint werkt:

```bash
curl -X POST https://WritgoAI.nl/api/cron/autopilot-projects \
  -H "Authorization: Bearer writgo-content-automation-secret-2025" \
  -H "Content-Type: application/json"
```

Je zou een JSON response moeten zien met de verwerkte projecten.

### Stap 2: Externe Cron Service Instellen

#### Optie A: cron-job.org (AANBEVOLEN - 100% gratis)

1. Ga naar https://cron-job.org/en/
2. Maak een gratis account aan
3. Klik op "Create cronjob"
4. Vul in:
   - **Title**: WritGo Autopilot - Daily
   - **URL**: `https://WritgoAI.nl/api/cron/autopilot-projects`
   - **Schedule**: Elke dag om 09:00
   - **HTTP Method**: POST
   - **Custom Headers**: 
     ```
     Authorization: Bearer writgo-content-automation-secret-2025
     Content-Type: application/json
     ```
5. Klik op "Create cronjob"

#### Optie B: EasyCron (Gratis tier: 20 taken/maand)

1. Ga naar https://www.easycron.com/
2. Maak een gratis account aan
3. Klik op "Add Cron Job"
4. Vul in:
   - **URL**: `https://WritgoAI.nl/api/cron/autopilot-projects`
   - **Cron Expression**: `0 9 * * *` (09:00 daily)
   - **HTTP Method**: POST
   - **Headers**:
     ```
     Authorization: Bearer writgo-content-automation-secret-2025
     Content-Type: application/json
     ```
5. Save

#### Optie C: UptimeRobot (Gratis - ook voor monitoring)

1. Ga naar https://uptimerobot.com/
2. Maak een gratis account aan
3. Klik op "+ Add New Monitor"
4. Vul in:
   - **Monitor Type**: HTTP(s)
   - **Friendly Name**: WritGo Autopilot
   - **URL**: `https://WritgoAI.nl/api/cron/autopilot-projects`
   - **Monitoring Interval**: Elke dag (kies de langste interval)
5. Sla op

**Let op:** UptimeRobot kan alleen GET requests doen, dus hiervoor moet de endpoint aangepast worden om ook GET te accepteren.

### Stap 3: Alle Cron Jobs Instellen

Je hebt 4 cron jobs nodig:

1. **Autopilot Projects** (09:00 dagelijks)
   - URL: `https://WritgoAI.nl/api/cron/autopilot-projects`
   - Schedule: `0 9 * * *`

2. **Social Media Autopilot** (10:00 dagelijks)
   - URL: `https://WritgoAI.nl/api/cron/social-media-autopilot`
   - Schedule: `0 10 * * *`

3. **Link Building Auto** (03:00 dagelijks)
   - URL: `https://WritgoAI.nl/api/cron/linkbuilding-auto`
   - Schedule: `0 3 * * *`

4. **Autopilot Scheduler** (Elke 15 minuten)
   - URL: `https://WritgoAI.nl/api/cron/autopilot-scheduler`
   - Schedule: `*/15 * * * *`

Alle endpoints gebruiken dezelfde Authorization header:
```
Authorization: Bearer writgo-content-automation-secret-2025
```

### Stap 4: Verificatie

Na het instellen:
1. Check de logs in je cron service
2. Controleer in WritGo of er content gegenereerd wordt
3. Check de database voor nieuwe autopilot jobs:
   ```sql
   SELECT * FROM "AutopilotJob" ORDER BY "createdAt" DESC LIMIT 10;
   ```

## Monitoring

Je kunt de autopilot status monitoren via:
- WritGo client portal → Content Research → Autopilot tab
- Database: `Project` tabel → `autopilotLastRun` en `autopilotNextRun` kolommen
- Cron service logs

## Troubleshooting

### Cron job faalt met 401 Unauthorized
→ Check of de Authorization header correct is ingesteld

### Cron job faalt met 500 error
→ Check de Vercel logs voor de specifieke error

### Content wordt niet gegenereerd
→ Check of projecten `autopilotEnabled = true` hebben
→ Check of er artikel ideeën beschikbaar zijn

### Autopilot draait maar publiceert niet naar WordPress
→ Check `autopilotAutoPublish` setting in project
→ Verify WordPress credentials zijn ingesteld

## Database Queries voor Troubleshooting

```sql
-- Check welke projecten autopilot enabled hebben
SELECT id, name, "autopilotEnabled", "autopilotFrequency", "autopilotLastRun", "autopilotNextRun"
FROM "Project"
WHERE "autopilotEnabled" = true;

-- Check recente autopilot jobs
SELECT aj.id, aj.status, aj.progress, aj."currentStep", aj."createdAt", 
       p.name as project_name, ai.title as article_title
FROM "AutopilotJob" aj
LEFT JOIN "Project" p ON aj."projectId" = p.id
LEFT JOIN "ArticleIdea" ai ON aj."articleId" = ai.id
ORDER BY aj."createdAt" DESC
LIMIT 20;

-- Check artikel ideeën die klaar zijn voor autopilot
SELECT ai.id, ai.title, ai.status, ai."hasContent", p.name as project_name
FROM "ArticleIdea" ai
LEFT JOIN "Project" p ON ai."projectId" = p.id
WHERE p."autopilotEnabled" = true
  AND ai.status = 'idea'
  AND ai."hasContent" = false
ORDER BY ai.priority ASC, ai."aiScore" DESC;
```

