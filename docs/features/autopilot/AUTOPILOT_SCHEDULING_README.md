
# Autopilot Scheduling Feature

## Overzicht

De Autopilot heeft nu een krachtige scheduling functionaliteit waarmee je content automatisch kunt laten genereren en publiceren op geplande tijden en intervallen.

## Features

### 1. **Flexibele Planning Opties**

- **Eenmalig**: Plan een enkele run op een specifieke datum en tijd
- **Dagelijks**: Dagelijkse automatische content generatie
- **Wekelijks**: Wekelijks op een specifieke dag van de week
- **Maandelijks**: Maandelijks op een specifieke dag van de maand
- **Custom Interval**: Elke X dagen (bijvoorbeeld elke 3 dagen)

### 2. **Smart Artikel Selectie**

- Selecteer specifieke artikelen uit je Content Calendar
- Kies hoeveel artikelen per run gegenereerd moeten worden
- Bij recurring schedules worden artikelen hergebruikt wanneer alle artikelen zijn verwerkt

### 3. **Automatische WordPress Publicatie**

- Optioneel automatisch publiceren naar WordPress
- Content wordt direct geplaatst na generatie

### 4. **Schedule Management**

- Overzicht van alle actieve en inactieve planningen
- Aan/uit zetten van planningen
- Verwijderen van planningen
- Status tracking (totaal runs, succesvolle runs, gefaalde runs)

## Gebruiksaanwijzing

### Planning Aanmaken

1. **Ga naar de Autopilot pagina**
   - Selecteer een project
   - Filter en selecteer artikelen uit je Content Calendar

2. **Klik op "Plan Autopilot"**
   - Voer een naam in voor de planning (bijv. "Weekend content batch")
   - Kies het type planning:
     - **Eenmalig**: Selecteer datum en tijd
     - **Dagelijks**: Kies tijd van dag
     - **Wekelijks**: Kies dag van de week en tijd
     - **Maandelijks**: Kies dag van de maand en tijd
     - **Interval**: Kies aantal dagen tussen runs en tijd

3. **Configureer Settings**
   - **Artikelen per run**: Hoeveel artikelen per keer genereren
   - **Auto-publiceren**: Direct naar WordPress publiceren of niet

4. **Maak Planning Aan**
   - De planning wordt opgeslagen en automatisch uitgevoerd op de geplande tijden

### Planning Beheren

In het "Geplande Autopilots" overzicht kun je:

- ✅ **Activeren/Deactiveren**: Toggle de on/off switch
- 🗑️ **Verwijderen**: Verwijder de planning compleet
- 📊 **Status bekijken**: Zie wanneer de volgende run is en hoeveel runs er succesvol waren

## Technische Details

### Database Schema

Het `AutopilotSchedule` model bevat:

```typescript
{
  name: string              // Friendly naam
  scheduleType: string      // 'once', 'daily', 'weekly', 'monthly', 'custom'
  scheduledDate: DateTime?  // Voor eenmalige planning
  frequency: string?        // Voor recurring types
  dayOfWeek: number?        // 0-6 (0 = Zondag)
  dayOfMonth: number?       // 1-31
  timeOfDay: string         // HH:MM format
  customInterval: number?   // Voor custom interval
  articleIds: string[]      // Artikelen om te verwerken
  articlesPerRun: number    // Hoeveel per run
  autoPublish: boolean      // Auto WordPress publicatie
  nextRunAt: DateTime?      // Wanneer is de volgende run
  // ... tracking fields
}
```

### API Endpoints

#### `GET /api/client/autopilot/schedule?projectId={id}`
Lijst alle schedules voor een project

#### `POST /api/client/autopilot/schedule`
Maak nieuwe schedule aan

Request body:
```json
{
  "name": "Weekend batch",
  "projectId": "...",
  "scheduleType": "weekly",
  "dayOfWeek": 6,
  "timeOfDay": "09:00",
  "articleIds": ["id1", "id2"],
  "articlesPerRun": 1,
  "autoPublish": true
}
```

#### `PATCH /api/client/autopilot/schedule/{id}`
Update schedule (bijv. activeren/deactiveren)

#### `DELETE /api/client/autopilot/schedule/{id}`
Verwijder schedule

### Cron Job / Scheduled Execution

De schedules worden uitgevoerd door het `/api/cron/autopilot-scheduler` endpoint.

#### Setup Cron Job

Je moet een externe cron job instellen die dit endpoint periodiek aanroept (bijv. elk uur):

**Optie 1: Externe Cron Service (bijv. cron-job.org)**
1. Ga naar https://cron-job.org
2. Maak een nieuwe cron job aan:
   - URL: `https://WritgoAI.nl/api/cron/autopilot-scheduler`
   - Method: POST
   - Header: `Authorization: Bearer {CRON_SECRET}`
   - Interval: Elk uur

**Optie 2: Server Cron (indien je server toegang hebt)**
```bash
# Voeg toe aan crontab
0 * * * * curl -X POST https://WritgoAI.nl/api/cron/autopilot-scheduler \
  -H "Authorization: Bearer YOUR_CRON_SECRET"
```

**Optie 3: Vercel Cron (indien gehost op Vercel)**
Voeg toe aan `vercel.json`:
```json
{
  "crons": [{
    "path": "/api/cron/autopilot-scheduler",
    "schedule": "0 * * * *"
  }]
}
```

#### Environment Variable

Zorg dat `CRON_SECRET` is ingesteld in je `.env`:
```
CRON_SECRET=je-geheime-cron-key
```

Dit voorkomt ongeautoriseerde aanroepen van het cron endpoint.

### Hoe het Werkt

1. **Cron roept endpoint aan** (elk uur)
2. **Endpoint checkt actieve schedules** die moeten draaien (nextRunAt <= now)
3. **Voor elke schedule:**
   - Selecteer artikelen die nog niet verwerkt zijn
   - Genereer content via `/api/client/autopilot/generate`
   - Publiceer naar WordPress via `/api/client/autopilot/publish` (indien autoPublish = true)
   - Update processedArticleIds en tracking
   - Bereken nextRunAt voor recurring schedules
4. **Eenmalige schedules** worden gedeactiveerd na uitvoering
5. **Recurring schedules** worden herhaald volgens hun interval

## Best Practices

### Planning Namen
Gebruik duidelijke namen:
- ✅ "Dagelijkse blog om 9u"
- ✅ "Weekend content batch"
- ✅ "Maandelijkse nieuwsbrief content"
- ❌ "Planning 1"

### Artikelen Selectie
- Selecteer voldoende artikelen voor recurring schedules
- Bij recurring: de artikelen worden hergebruikt na volledige cyclus
- Overweeg verschillende prioriteiten

### Timing
- Plan buiten piekuren voor betere performance
- Houd rekening met tijdzones (standaard server tijd)
- Test eerst met eenmalige planning voordat je recurring instelt

### WordPress Configuratie
- Zorg dat WordPress instellingen correct zijn geconfigureerd
- Test handmatige publicatie eerst
- Monitor de eerste paar automatische publicaties

## Troubleshooting

### Planning draait niet
1. Check of schedule actief is (groen "Actief" badge)
2. Check nextRunAt datum/tijd
3. Controleer of cron job correct draait
4. Check server logs voor errors

### Content wordt niet gegenereerd
1. Check credits balance
2. Controleer artikel IDs zijn geldig
3. Check project configuratie
4. Kijk in error logs voor specifieke foutmeldingen

### WordPress publicatie faalt
1. Controleer WordPress credentials
2. Test handmatige publicatie
3. Check WordPress permissions
4. Controleer WordPress URL configuratie

## Monitoring

Je kunt schedule performance monitoren via:
- **Geplande Autopilots** lijst: toont success/fail stats
- **Content Library**: bekijk gegenereerde content
- **WordPress**: controleer gepubliceerde artikelen

## Limits & Aanbevelingen

- **Artikelen per run**: Aanbevolen max 5 (afhankelijk van content complexiteit)
- **Minimum interval**: 1 uur tussen runs (vermijd overbelasting)
- **Credits**: Zorg voor voldoende credits voor geplande runs
- **Storage**: Monitor WordPress storage bij veel content

## Updates & Roadmap

**Toekomstige features:**
- Email notificaties bij voltooiing/falen
- Gedetailleerde run logs
- Batch statistics & analytics
- Template-based scheduling
- Multi-project scheduling

---

Voor vragen of problemen, neem contact op via support.
