
# Autopilot "Nu Uitvoeren" Functionaliteit

## Overzicht

De "Nu uitvoeren" knop in de Autopilot stelt gebruikers in staat om direct een nieuwe artikel-run te starten zonder te wachten op de geplande automatische runs.

## Functionaliteit

### Waar vind je het?

De "Nu uitvoeren" knop bevindt zich in de Autopilot pagina (`/client-portal/autopilot`), bovenaan bij de project-specifieke Autopilot configuratie.

### Hoe werkt het?

1. **Selecteer een project** - De gebruiker moet eerst een project selecteren
2. **Klik op "Nu uitvoeren"** - Een prominente oranje knop naast de instellingen knop
3. **Bevestig de actie** - Een dialoog toont:
   - Hoeveel artikelen er gegenereerd worden (op basis van project instellingen)
   - Of artikelen automatisch gepubliceerd worden of opgeslagen in de bibliotheek
4. **Automatische selectie** - De AI selecteert automatisch de beste artikelen op basis van:
   - **Prioriteit** - High > Medium > Low
   - **AI Score** - Hogere scores eerst
   - **Zoekvolume** - Meer volume = meer prioriteit
   - **Project filters** - Alleen artikelen die voldoen aan de autopilot instellingen

### Technische Details

#### API Endpoint: `/api/client/autopilot/run-now`

**Request:**
```json
{
  "projectId": "string",
  "articlesCount": 1  // Optioneel, gebruikt project instellingen als default
}
```

**Response:**
```json
{
  "success": true,
  "message": "X artikel(en) worden gegenereerd",
  "jobIds": ["job-id-1", "job-id-2"],
  "articleIds": ["article-id-1", "article-id-2"],
  "articlesCount": 2
}
```

#### Proces Flow

1. **Validatie**
   - Check of gebruiker ingelogd is
   - Check of project bestaat en toebehoort aan gebruiker
   - Check of er geschikte artikelen zijn

2. **Artikel Selectie**
   - Filter op status: `status = 'idea'` en `hasContent = false`
   - Filter op prioriteit (indien ingesteld in project)
   - Filter op content type (indien ingesteld in project)
   - Sorteer op: prioriteit → AI score → zoekvolume
   - Select top X artikelen (max 5 per keer)

3. **Job Aanmaken**
   - Maak `AutopilotJob` record aan voor elk artikel
   - Update artikel status naar `queued`
   - Start asynchrone verwerking

4. **Asynchrone Verwerking**
   - Genereer content via `/api/client/autopilot/generate`
   - Publiceer naar WordPress (indien `autoPublish = true`)
   - Update job status en progress
   - Bij fouten: reset artikel status naar `idea`

5. **Real-time Progress**
   - UI poll elke 3 seconden voor job updates
   - Toon progress bars en status messages
   - Update artikel lijst automatisch

### Project Instellingen

De "Nu uitvoeren" functie gebruikt de volgende project-specifieke instellingen:

- **articlesPerRun** - Aantal artikelen per run (default: 1, max: 5)
- **autopilotPriority** - Welke prioriteit artikelen selecteren
  - `all` - Alle prioriteiten
  - `high` - Alleen hoge prioriteit
  - `medium` - Hoge en medium prioriteit
- **autopilotContentType** - Welk type content genereren
  - `all` - Alle types
  - `blog` - Alleen blog posts
  - Etc.
- **autopilotAutoPublish** - Automatisch publiceren naar WordPress

### Gebruikers Feedback

#### Success Scenario
- Toast melding: "🚀 X artikel(en) worden gegenereerd!"
- Progress bars worden getoond voor elk artikel
- Status updates in real-time
- Bij voltooiing: artikel wordt gemarkeerd als `completed`

#### Error Scenarios
- Geen project geselecteerd: "Selecteer eerst een project"
- Geen geschikte artikelen: "Geen geschikte artikelen gevonden" + uitleg
- API fout: Error message van API

### UI Elementen

#### Autopilot Configuratie Card
```
┌─────────────────────────────────────────────────┐
│ 🔌 Autopilot voor [Project Name]               │
│ Actief • Dagelijks • 5 artikel(en) per run     │
│                                                 │
│ [🚀 Nu uitvoeren]  [⚙️ Instellingen]          │
│                                                 │
│ ┌─────────────────────────────────────────────┐ │
│ │ 💡 Nu uitvoeren start direct een run zonder │ │
│ │ te wachten op de planning. De AI selecteert │ │
│ │ automatisch 5 artikel(en) op basis van      │ │
│ │ prioriteit en kwaliteit.                    │ │
│ └─────────────────────────────────────────────┘ │
└─────────────────────────────────────────────────┘
```

#### Tijdens Verwerking
- Knop disabled met loading state
- Progress bars voor elk artikel
- Real-time status updates
- Geschatte voltooiing tijd

## Voordelen

1. **Flexibiliteit** - Start runs wanneer je wilt, niet alleen op schema
2. **Testen** - Test de autopilot setup voordat je automatische runs inplant
3. **On-demand** - Genereer extra content wanneer nodig (bijv. voor events, nieuws)
4. **Controle** - Volledige controle over wanneer content wordt gegenereerd
5. **Transparantie** - Zie precies welke artikelen geselecteerd worden en waarom

## Best Practices

1. **Configureer eerst** - Stel de autopilot instellingen in voordat je "Nu uitvoeren" gebruikt
2. **Test met 1 artikel** - Start met 1 artikel om de setup te testen
3. **Check WordPress** - Zorg dat WordPress correct geconfigureerd is als je auto-publish gebruikt
4. **Monitor progress** - Blijf op de pagina om de progress te zien (of kom later terug)
5. **Credits check** - Zorg dat je voldoende credits hebt (elk artikel kost credits)

## Technische Overwegingen

### Timeout & Limiet
- Maximum 5 artikelen per keer
- Timeout: 300 seconden (5 minuten) per artikel
- Async processing voorkomt timeout issues

### Database
- Gebruikt `AutopilotJob` model voor progress tracking
- Jobs blijven persistent (kunnen na page refresh nog steeds geladen worden)
- Failed jobs worden correct gelogd en kunnen opnieuw geprobeerd worden

### Security
- Project ownership check
- Session validatie
- Rate limiting via credit systeem

### Performance
- Asynchrone verwerking voorkomt blocking
- Batch processing van meerdere artikelen
- Efficient polling voor progress updates

## Future Enhancements

Mogelijke toekomstige verbeteringen:

1. **Selectie preview** - Laat zien welke artikelen geselecteerd zullen worden voordat je start
2. **Prioriteit override** - Mogelijkheid om tijdens run andere prioriteit te selecteren
3. **Scheduling voor later** - Plan een run voor een specifieke tijd
4. **Batch size aanpassen** - Dynamisch aantal artikelen kiezen bij "Nu uitvoeren"
5. **Notifications** - Email/push notificaties bij voltooiing

## Troubleshooting

### "Geen geschikte artikelen gevonden"
- Check of er artikel-ideeën zijn in het project
- Verifieer of artikel-ideeën voldoen aan de priority/content type filters
- Zorg dat artikelen nog geen content hebben (`hasContent = false`)

### Jobs blijven hangen op "pending"
- Check server logs voor errors
- Verifieer of er voldoende credits zijn
- Check WordPress configuratie (als auto-publish aan staat)

### Content wordt niet gepubliceerd
- Verifieer WordPress credentials in project instellingen
- Check of `autoPublish` setting aan staat
- Bekijk job error messages in de database

## Conclusie

De "Nu uitvoeren" functionaliteit geeft gebruikers volledige controle over hun content generatie, combineert de kracht van automatisering met de flexibiliteit van on-demand acties, en biedt transparante progress tracking voor een optimale gebruikerservaring.
