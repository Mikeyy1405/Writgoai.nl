
# Autopilot Frequentie Opties

## Overzicht

De Autopilot in WritgoAI biedt nu uitgebreide frequentie-opties waarmee je precies kunt bepalen hoe vaak content automatisch wordt gegenereerd.

## Beschikbare Frequenties

### 1. **2 keer per dag** (`twice_daily`)
- Content wordt elke 12 uur gegenereerd
- Ideaal voor platforms die zeer frequent content nodig hebben
- Bijvoorbeeld: 's ochtends en 's avonds

### 2. **1 keer per dag** (`daily`)
- Content wordt dagelijks op dezelfde tijd gegenereerd
- Beste keuze voor blogs en nieuwssites
- Zorgt voor dagelijkse verse content

### 3. **3 keer per week** (`three_weekly`)
- Content wordt ongeveer elke 2 dagen gegenereerd
- Goede balans tussen consistentie en kwaliteit
- Uitstekend voor standaard blogs

### 4. **Elke werkdag (Ma-Vr)** (`weekdays`)
- Content wordt alleen op werkdagen gegenereerd
- Weekends worden automatisch overgeslagen
- Perfect voor zakelijke content

### 5. **1 keer per week** (`weekly`)
- Content wordt wekelijks gegenereerd
- Geschikt voor minder frequente updates
- Goede optie voor niche blogs

### 6. **1 keer per maand** (`monthly`)
- Content wordt maandelijks gegenereerd
- Ideaal voor diepgaande, uitgebreide content
- Geschikt voor strategische updates

## Hoe Werkt Het?

### Backend Logica

De scheduling logica in `/api/cron/autopilot-projects` berekent automatisch de volgende run-tijd op basis van de gekozen frequentie:

```typescript
function calculateNextRun(lastRun: Date, frequency: string | null): Date {
  const nextRun = new Date(lastRun);

  switch (frequency) {
    case 'twice_daily':
      nextRun.setHours(nextRun.getHours() + 12);
      break;
      
    case 'daily':
      nextRun.setDate(nextRun.getDate() + 1);
      break;
      
    case 'three_weekly':
      nextRun.setDate(nextRun.getDate() + 2);
      break;
      
    case 'weekdays':
      nextRun.setDate(nextRun.getDate() + 1);
      // Skip weekends
      while (nextRun.getDay() === 0 || nextRun.getDay() === 6) {
        nextRun.setDate(nextRun.getDate() + 1);
      }
      break;
      
    case 'weekly':
      nextRun.setDate(nextRun.getDate() + 7);
      break;
      
    case 'monthly':
      nextRun.setMonth(nextRun.getMonth() + 1);
      break;
  }

  return nextRun;
}
```

### Frontend Interface

Gebruikers kunnen de frequentie eenvoudig instellen via:

1. **Eerste activatie**: Bij het activeren van Autopilot wordt een dialog getoond met alle frequentie-opties
2. **Live aanpassen**: In het Autopilot dashboard kan de frequentie op elk moment worden aangepast
3. **Per project**: Elk project kan een eigen frequentie hebben

## Gebruik

### Autopilot Activeren met Frequentie

1. Ga naar **Content Research** of **Content Kalender**
2. Klik op **"Activeer Autopilot"**
3. Kies je gewenste frequentie
4. Klik op **"Activeer"**

### Frequentie Aanpassen

1. In het Autopilot dashboard zie je de huidige frequentie
2. Klik op het dropdown menu naast "Frequentie:"
3. Selecteer een nieuwe frequentie
4. De wijziging wordt direct opgeslagen

### Nu Uitvoeren

Naast de geplande runs kun je altijd handmatig een run starten met de **"Nu uitvoeren"** knop. Dit heeft geen invloed op de planning van toekomstige automatische runs.

## Technische Details

### Wijzigingen

1. **Backend** (`/api/cron/autopilot-projects/route.ts`):
   - Uitgebreide `calculateNextRun` functie met ondersteuning voor alle frequenties
   - Automatische weekend-skipping voor werkdagen optie

2. **Frontend** (`/client-portal/content-research/content-ideas-list.tsx`):
   - Nieuwe dropdown opties voor alle frequenties
   - Labels vertaald naar Nederlands
   - Consistente weergave in dialogs en dashboard

3. **Database**:
   - Bestaande `autopilotFrequency` veld ondersteunt alle nieuwe waarden
   - Geen schema wijzigingen nodig

## Voordelen

- **Flexibiliteit**: Kies de frequentie die past bij je content strategie
- **Automatisering**: Eenmaal ingesteld, werkt het volledig automatisch
- **Controle**: Pas de frequentie op elk moment aan zonder verlies van data
- **Betrouwbaarheid**: Getest met alle frequenties en edge cases

## Tips

1. **Start voorzichtig**: Begin met een lagere frequentie en schaal op als je tevreden bent
2. **Monitor de kwaliteit**: Hogere frequenties betekenen meer content, maar monitor de kwaliteit
3. **Gebruik werkdagen**: Voor zakelijke content is de werkdagen optie vaak het beste
4. **Combineer met prioriteiten**: Gebruik samen met prioriteit filters voor optimale resultaten

## Implementatie Datum

6 november 2025
