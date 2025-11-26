# Content Planning Fix - Data Recovery

## Wat is er gebeurd?

Er was een probleem in de nieuwe content research tool waarbij alle bestaande content ideeën werden verwijderd bij het genereren van een nieuwe content planning. Dit is nu opgelost.

## Opgeloste problemen

### 1. Netwerk Error bij Content Planning
- **Probleem**: De oude keyword research tool verwees door naar de nieuwe content research tool, maar de oude API routes waren uitgeschakeld
- **Oplossing**: De API routes zijn nu correct ingesteld en werken weer

### 2. Verloren Content Ideeën
- **Probleem**: Bij het genereren van nieuwe content ideeën werden alle bestaande ideeën verwijderd
- **Oplossing**: De API behoudt nu bestaande ideeën en voegt alleen nieuwe toe

## Wat is er gefixt?

### Database Schema
- ✅ Toegevoegd: Unique constraint op `clientId + slug` om duplicaten te voorkomen
- ✅ Dit voorkomt dat dezelfde content ideeën meerdere keren worden toegevoegd

### API Verbeteringen
- ✅ **Smart Merge**: Nieuwe ideeën worden toegevoegd, bestaande blijven behouden
- ✅ **Intelligente Cleanup**: Alleen oude (>30 dagen) geschreven/gepubliceerde ideeën worden verwijderd
- ✅ **Upsert Logic**: Bestaande ideeën worden bijgewerkt met nieuwe informatie als deze beschikbaar is

### Wat wordt er nu bewaard?
De volgende ideeën blijven ALTIJD behouden:
- ✅ Ideeën in status "idea" (nog niet geschreven)
- ✅ Ideeën in status "queued" (in wachtrij)
- ✅ Ideeën met actieve autopilot planning
- ✅ Recent geschreven content (<30 dagen)

### Wat wordt er opgeruimd?
Alleen deze ideeën worden verwijderd:
- ❌ Geschreven content ouder dan 30 dagen
- ❌ Gepubliceerde content ouder dan 30 dagen

## Content Planning Opnieuw Genereren

Helaas zijn je bestaande content ideeën verwijderd door de vorige versie. Je kunt ze eenvoudig opnieuw genereren:

### Stap 1: Ga naar Keyword Research
1. Log in op WritgoAI (WritgoAI.nl)
2. Klik op "Keyword Research" in het menu
3. Je wordt automatisch doorverwezen naar de nieuwe "Content Research" tool

### Stap 2: Genereer Content Planning
1. Selecteer je project uit het dropdown menu
2. Klik op "Start Research" om nieuwe content ideeën te genereren
3. De tool zal:
   - Je website analyseren
   - Concurrenten analyseren
   - Trending topics vinden
   - 30-50 content ideeën genereren

### Stap 3: Bekijk en Gebruik je Ideeën
1. Bekijk de gegenereerde content ideeën in de lijst
2. Klik op "Nu schrijven" om direct een artikel te schrijven
3. Of gebruik "Automatiseer" om autopilot in te schakelen

## Nieuwe Functionaliteit

### Real-time Progress Updates
Je ziet nu real-time voortgang tijdens het genereren van content ideeën:
- 🚀 Start analyse (0%)
- 🌐 Website analyseren (20%)
- 🔍 Concurrenten analyseren (40%)
- 📈 Trending topics zoeken (60%)
- 💡 Content ideeën genereren (80%)
- 💾 Opslaan (95%)
- ✅ Voltooid! (100%)

### Smart Content Ideas Beheer
- Duplicaten worden automatisch voorkomen
- Bestaande ideeën blijven behouden
- Nieuwe ideeën worden naadloos toegevoegd
- Oude content wordt automatisch opgeruimd

## Technische Details

### API Endpoints
- `POST /api/client/content-research` - Genereer nieuwe content planning
- `GET /api/client/content-research?projectId=xxx` - Haal bestaande planning op
- `POST /api/client/article-ideas/schedule` - Plan artikel voor autopilot
- `GET /api/client/article-ideas/schedule` - Haal geplande artikelen op

### Database Changes
```prisma
model ArticleIdea {
  // ... andere velden
  
  @@unique([clientId, slug])  // ← NIEUW: Voorkomt duplicaten
  @@index([clientId])
  @@index([status])
  @@index([isScheduledForAutopilot])
}
```

## Volgende Stappen

1. **Genereer nieuwe content planning** via de Content Research tool
2. **Plan je content** met de autopilot functie
3. **Start met schrijven** door op "Nu schrijven" te klikken

## Support

Als je verdere vragen hebt of problemen ondervindt, neem dan contact op via het berichtencentrum in de app.

---

**Status**: ✅ Live op WritgoAI.nl
**Datum**: 2 november 2025
**Versie**: 2.1.0
