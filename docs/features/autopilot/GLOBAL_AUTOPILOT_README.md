# Globale Autopilot voor Content Planning ✨

## Wat is er veranderd?

**VOOR:** Je moest per individueel content idee de automatisering instellen  
**NU:** Eén globale automatisering voor de hele content planning lijst

## Hoe werkt het?

### 1. Start Content Research
- Ga naar **Content Research** tool
- Voer een keyword research uit of selecteer een project
- Je krijgt nu 30-50 content ideeën

### 2. Activeer de Globale Autopilot
Bovenaan je content ideeën lijst zie je nu een grote **Autopilot sectie**:

```
🚀 Autopilot: Automatische Content Generatie
[Status Badge: Actief/Inactief]

Frequentie: [Dropdown]
- Dagelijks
- 2x per week  
- Wekelijks
- Elke 2 weken
- Maandelijks

[Activeer Knop]
```

### 3. Stel Frequentie In
Kies hoe vaak je wilt dat er automatisch artikelen worden gegenereerd:
- **Dagelijks** = Elke dag 1 artikel
- **2x per week** = Maandag + Donderdag
- **Wekelijks** = Elke week op maandag
- **Elke 2 weken** = Om de week
- **Maandelijks** = Eerste dag van elke maand

### 4. Hoe Kiest de Autopilot?
De autopilot pakt automatisch het **beste volgende idee** uit je lijst op basis van:
1. **AI Score** (hoger = beter)
2. **Trending topics** (actueel = prioriteit)
3. **Priority** (High > Medium > Low)
4. **Competitor gaps** (kansen krijgen voorrang)

### 5. Wat Gebeurt Er Automatisch?
Wanneer de autopilot draait:
1. ✅ Pakt het beste idee uit de lijst
2. ✅ Genereert een volledig artikel
3. ✅ Publiceert naar WordPress  
4. ✅ Slaat op in Content Library met status "Published"
5. ✅ Zet het idee op "Completed"

## Features

### ✨ Volledig Automatisch
- Geen handmatige actie nodig
- Respecteert verboden woorden
- Gebruikt blog styling van je project
- Voegt afbeeldingen toe
- Optimaliseert voor SEO

### 🎯 Slim Prioriteren
- AI bepaalt welk artikel het meeste impact heeft
- Trending topics krijgen voorrang
- Competitor gaps worden als eerste opgepakt

### 📊 Overzicht
- Zie in één oogopslag of autopilot actief is
- Wijzig frequentie wanneer je wilt
- Pauzeer en hervat eenvoudig

## Per-Item Acties

Elk content idee heeft nog steeds:
- **"Nu schrijven"** knop = Direct handmatig schrijven
- **AI Score badge** = Kwaliteit indicator

**VERWIJDERD:** Per-item automatisering (was verwarrend, nu alleen globaal)

## Voorbeeld Workflow

### Scenario: Weekly Content Automation
1. Start keyword research voor "yoga oefeningen"
2. Krijg 50 content ideeën
3. Activeer autopilot met "Wekelijks"
4. **Resultaat:** Elke maandag wordt automatisch 1 artikel uit de lijst gegenereerd en gepubliceerd

### Scenario: High-Frequency Publishing
1. Start keyword research voor "recepten"
2. Krijg 40 content ideeën
3. Activeer autopilot met "Dagelijks"
4. **Resultaat:** Elke dag 1 nieuw recept artikel op je site

## Database Model

```typescript
model AutopilotConfig {
  id               String  @id @default(cuid())
  clientId         String  @unique
  isActive         Boolean @default(false)
  contentInterval  String  // daily, twice_weekly, weekly, bi_weekly, monthly
  autoPublish      Boolean @default(true)
  saveToLibrary    Boolean @default(true)
}
```

## API Endpoints

### GET /api/client/autopilot
Haalt huidige autopilot configuratie op

### POST /api/client/autopilot/toggle
Toggle autopilot aan/uit en update instellingen

```json
{
  "isActive": true,
  "contentInterval": "daily",
  "autoPublish": true
}
```

## UI Componenten

### Locatie
`/app/client-portal/content-research/content-ideas-list.tsx`

### Componenten
1. **Autopilot Control Card** - Grote sectie bovenaan lijst
2. **Status Badge** - Visuele indicator (groen = actief)
3. **Frequency Dropdown** - Kies interval
4. **Toggle Button** - Activeer/Pauzeer

## Cron Job

De autopilot draait via een bestaande cron job die:
- Checkt elke dag om 08:00 of autopilot actief is
- Kijkt of het tijd is voor nieuw artikel (based on interval)
- Pakt het beste idee uit `ArticleIdea` tabel
- Genereert artikel via `/api/client/generate-article`
- Publiceert naar WordPress
- Slaat op in `SavedContent`

## Voordelen van Globale Autopilot

✅ **Simpeler** - Eén knop in plaats van 50  
✅ **Overzichtelijker** - Status direct zichtbaar  
✅ **Slimmer** - AI bepaalt wat het beste is  
✅ **Flexibeler** - Wijzig frequentie wanneer je wilt  
✅ **Betrouwbaarder** - Geen handmatige per-item errors  

## Veelgestelde Vragen

**Q: Kan ik specifieke artikelen overslaan?**  
A: Ja, verwijder ze uit de lijst of markeer als "completed"

**Q: Kan ik de volgorde bepalen?**  
A: Nee, AI bepaalt op basis van score/prioriteit wat het beste is

**Q: Wat als ik de autopilot pauzeer?**  
A: Niks gebeurt, je kunt altijd hervatten zonder verlies

**Q: Blijven de ideeën bewaard?**  
A: Ja, alle ideeën blijven in de lijst staan

**Q: Kan ik nog handmatig schrijven?**  
A: Ja! Gebruik de "Nu schrijven" knop per idee

## Live Deployment

✅ **Live op:** WritgoAI.nl  
✅ **Locatie:** Content Research > Ideeën Tab  
✅ **Status:** Volledig operationeel  

---

**Gemaakt:** 2 november 2024  
**Versie:** 1.0  
**Auteur:** DeepAgent for Writgo Media
