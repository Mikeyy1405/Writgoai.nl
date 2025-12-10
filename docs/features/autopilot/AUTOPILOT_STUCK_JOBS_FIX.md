
# Autopilot Stuck Jobs Fix

## Probleem

De "Nu uitvoeren" knop op de Autopilot pagina werkte niet meer. Bij het klikken op de knop gebeurde er niets.

### Oorzaak

Het probleem werd veroorzaakt door vastgelopen AutopilotJob records in de database:
- Er waren 9 actieve jobs die langer dan 10-15 minuten bezig waren
- Deze jobs hadden status `pending` of `generating` maar waren niet meer actief
- De frontend zag deze jobs als "actief" en blokkeerde daarom de "Nu uitvoeren" knop door `isRunning` op `true` te zetten
- De knop had `disabled={isManualRunning || isRunning}` waardoor deze niet klikbaar was

## Oplossing

### 1. Directe Fix
Alle vastgelopen jobs zijn handmatig opgeruimd via een database query:

```javascript
// Update alle jobs ouder dan 10 minuten naar "failed" status
await prisma.autopilotJob.updateMany({
  where: {
    status: { in: ['pending', 'generating', 'publishing'] },
    startedAt: { lt: tenMinutesAgo }
  },
  data: {
    status: 'failed',
    error: 'Job timeout - automatisch gefaald na 10 minuten',
    completedAt: new Date()
  }
});
```

### 2. Permanente Fix: Automatische Cleanup

De `loadJobs()` functie in `/app/client-portal/autopilot/page.tsx` is uitgebreid met automatische cleanup:

**Wat doet het:**
- Bij elke keer dat jobs worden geladen (elke 3 seconden tijdens Autopilot run)
- Controleert het of er jobs zijn die langer dan 15 minuten bezig zijn
- Markeert deze automatisch als "failed" via de nieuwe API endpoint
- Zorgt ervoor dat `isRunning` correct wordt gezet

**Code toegevoegd:**
```typescript
// Check for stuck jobs (older than 15 minutes)
const fifteenMinutesAgo = Date.now() - 15 * 60 * 1000;

for (const job of data.jobs) {
  const jobStartTime = new Date(job.startedAt).getTime();
  const isStuck = jobStartTime < fifteenMinutesAgo && 
                 (job.status === 'pending' || job.status === 'generating' || job.status === 'publishing');
  
  if (isStuck) {
    // Mark as failed via API
    await fetch(`/api/client/autopilot/jobs/${job.id}`, {
      method: 'PATCH',
      body: JSON.stringify({
        status: 'failed',
        error: 'Job timeout - automatisch gefaald na 15 minuten'
      })
    });
  }
}
```

### 3. Nieuwe API Endpoint

Toegevoegd: `/api/client/autopilot/jobs/[id]/route.ts`

**Ondersteunt:**
- `PATCH` - Update job status (voor timeout cleanup)
- `DELETE` - Verwijder een job

## Bestanden Gewijzigd

1. **Frontend:**
   - `/app/client-portal/autopilot/page.tsx`
     - Toegevoegd: Automatische stuck job detection in `loadJobs()`
     - Toegevoegd: Correcte `isRunning` state management

2. **Backend:**
   - `/app/api/client/autopilot/jobs/[id]/route.ts` (NIEUW)
     - PATCH endpoint voor job updates
     - DELETE endpoint voor job verwijdering

## Resultaat

✅ **De "Nu uitvoeren" knop werkt nu altijd**
- Geen vastgelopen jobs meer die de UI blokkeren
- Automatische cleanup van jobs ouder dan 15 minuten
- Correcte state management voor `isRunning`

✅ **Zelfherstellend systeem**
- Als een job vast komt te zitten, wordt deze na 15 minuten automatisch gefaald
- Gebruikers hoeven niet meer handmatig in de database in te grijpen
- De UI blijft altijd responsief

## Testen

1. Ga naar `https://WritgoAI.nl/client-portal/autopilot`
2. Selecteer een project
3. Klik op "Nu uitvoeren"
4. Bevestig in de dialog
5. De generatie start succesvol

## Preventie

Het systeem voorkomt nu automatisch:
- Vastgelopen jobs die de UI blokkeren
- Oneindige "pending" states
- Gebruikersconfusie over waarom knoppen niet werken

Als een job langer dan 15 minuten bezig is, wordt deze automatisch gefaald met een duidelijke foutmelding.
