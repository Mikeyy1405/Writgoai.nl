# 🚀 WritgoAI Autopilot - Complete Handleiding

## Overzicht

De WritgoAI Autopilot is een volledig geautomatiseerd content generation systeem dat:
- Keywords zoekt via de Content Research tool
- Automatisch artikelen genereert op basis van jouw instellingen
- Artikelen publiceert naar WordPress
- Alles opslaat in je Content Bibliotheek
- Email notificaties stuurt wanneer content is gepubliceerd

## Hoe werkt het?

### Stap 1: Keyword Research
1. Ga naar **Content Research & Planning**
2. Kies een project of voer een keyword in
3. Klik op **Start Analyse**
4. De AI genereert content ideeën op basis van:
   - Je website analyse
   - Concurrentie analyse
   - Trending topics
   - SEO opportuniteiten

### Stap 2: Content Ideeën Automatiseren
Voor elk content idee kun je de **Automatiseren** optie kiezen:

**Niet automatisch** - Handmatige generatie (standaard)

**Eenmalig** - Direct genereren (binnen 5 minuten)

**Dagelijks** - Elke dag een nieuw artikel

**Wekelijks** - Elke week een nieuw artikel  

**Maandelijks** - Elke maand een nieuw artikel

### Stap 3: Autopilot Activeren
1. Selecteer het interval voor een content idee
2. De AI plant automatisch de generatie
3. Elk uur controleert het systeem of er content gegenereerd moet worden
4. Als het tijd is, wordt het artikel:
   - Gegenereerd met SEO optimalisatie
   - Voorzien van afbeeldingen en YouTube video's
   - Opgeslagen in de Content Bibliotheek
   - Gepubliceerd naar WordPress (als geconfigureerd)
   - Een email notificatie wordt verstuurd

## Technische Werking

### Cron Job Scheduling
De Autopilot gebruikt Vercel Cron Jobs die elk uur worden uitgevoerd:

```
Schedule: 0 * * * * (elk uur op minuut 0)
Endpoint: /api/cron/autopilot-content
```

### Flow Diagram
```
[Keyword Research] 
    ↓
[Content Ideeën Genereren]
    ↓
[Gebruiker selecteert interval]
    ↓
[Article Idea wordt "geplanned"]
    ↓
[Cron Job controleert elk uur]
    ↓
[Is het tijd? JA]
    ↓
[Artikel Generatie Start]
    ↓
├─ Check Credits
├─ Genereer Artikel (SEO geoptimaliseerd)
├─ Voeg Afbeeldingen toe
├─ Voeg YouTube Videos toe
├─ Sla op in Bibliotheek
├─ Publiceer naar WordPress
└─ Stuur Email Notificatie
    ↓
[Bereken Volgende Run (als herhalend)]
```

### Database Schema

**ArticleIdea**
- `isScheduledForAutopilot`: boolean - Of de idea gepland is
- `autopilotFrequency`: string - 'once' | 'daily' | 'weekly' | 'monthly'
- `autopilotNextRun`: DateTime - Wanneer de volgende run gepland staat
- `autopilotLastRun`: DateTime - Wanneer de laatste run was

**AutopilotConfig** (Legacy - niet meer actief gebruikt)
- Oude configuratie voor bulk autopilot
- Vervangen door per-idea scheduling voor meer controle

## API Endpoints

### Schedule Article Idea
```typescript
POST /api/client/article-ideas/schedule
Body: {
  ideaId: string
  isScheduled: boolean
  frequency: 'once' | 'daily' | 'weekly' | 'monthly'
}
```

### Get Scheduled Ideas
```typescript
GET /api/client/article-ideas/schedule
Response: {
  scheduledIdeas: ArticleIdea[]
  count: number
}
```

### Cron Job Trigger
```typescript
GET /api/cron/autopilot-content
Headers: {
  Authorization: Bearer ${CRON_SECRET}
}
```

## Vereisten

### Environment Variables
```bash
CRON_SECRET=writgo-content-automation-secret-2025
NEXTAUTH_URL=https://WritgoAI.nl
```

### WordPress Configuratie
Voor automatische publicatie:
- WordPress URL geconfigureerd in client instellingen
- Application Password ingesteld
- Categorieën en tags correct geconfigureerd

### Credits
- Minimum 50 credits per artikel
- Check gebeurt automatisch voor elke generatie
- Email notificatie bij onvoldoende credits

## Monitoring & Debugging

### Logs Bekijken
Alle autopilot activiteit wordt gelogd met prefixes:
- `🤖` - Cron job start
- `📋` - Article ideas gevonden
- `🚀` - Start artikel generatie
- `✍️` - Schrijven gestart
- `💾` - Opslaan in bibliotheek
- `🌐` - WordPress publicatie
- `📧` - Email notificatie
- `✅` - Succesvol voltooid
- `❌` - Error opgetreden
- `⚠️` - Waarschuwing

### Veelvoorkomende Issues

**Autopilot genereert geen content**
- Check of er geplande ideas zijn: `GET /api/client/article-ideas/schedule`
- Controleer `autopilotNextRun` timestamp
- Verifieer dat Vercel Cron Job is geactiveerd
- Check CRON_SECRET in environment variables

**Content wordt niet gepubliceerd**
- Verificeer WordPress configuratie
- Check Application Password
- Controleer WordPress URL (moet eindigen zonder /)
- Bekijk API logs voor WordPress errors

**Onvoldoende credits errors**
- Client moet minimum 50 credits hebben
- Check `subscriptionCredits + topUpCredits`
- Upgrade plan of koop credit top-up

## Best Practices

1. **Start Voorzichtig** - Begin met "Eenmalig" om te testen
2. **Monitor Eerste Runs** - Check of artikelen correct worden gegenereerd
3. **WordPress Test** - Verifieer dat publicatie correct werkt
4. **Credits Beheer** - Zorg voor voldoende credits voor automatische runs
5. **Email Checks** - Controleer of email notificaties aankomen
6. **Interval Keuze** - Dagelijks is intensief, wekelijks is duurzaam

## Toekomstige Verbeteringen

- [ ] Custom scheduling times per idea
- [ ] Batch processing voor grotere volumes
- [ ] A/B testing van headlines
- [ ] Automatic social media sharing
- [ ] Analytics integratie voor performance tracking
- [ ] Content calendar visualisatie
- [ ] Smart keyword rotation
- [ ] Quality score tracking

## Support

Bij problemen met de Autopilot:
1. Check de logs in Vercel dashboard
2. Verifieer alle environment variables
3. Test handmatige article generatie eerst
4. Controleer WordPress connectie
5. Contact support via email

---

**Laatste Update**: 2 November 2025
**Versie**: 2.0
**Status**: ✅ Production Ready
