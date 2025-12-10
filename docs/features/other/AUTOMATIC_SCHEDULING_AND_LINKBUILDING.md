
# Automatische Planning & Linkbuilding Systeem

## Overzicht

Deze update introduceert twee belangrijke functionaliteiten voor WritgoAI:

1. **Automatische Planning van Article Ideas**: Article ideas worden automatisch ingepland op basis van Autopilot instellingen
2. **Linkbuilding Netwerk**: Klanten kunnen samenwerken voor wederzijdse backlinks en credits verdienen

---

## 📅 Automatische Planning Systeem

### Functionaliteit

Het systeem plant automatisch article ideas in wanneer:
- Een nieuw idee wordt toegevoegd (via Content Research of handmatig)
- Autopilot settings worden gewijzigd (frequentie, aantal artikelen per run)
- Een klant handmatig opnieuw inplant via de API

### Planning Parameters

De planning wordt bepaald door de **Autopilot Schedule** instellingen:

- **Frequentie opties:**
  - `once-daily`: Elke dag één run
  - `twice-daily`: Twee runs per dag
  - `three-weekly`: Maandag, Woensdag, Vrijdag
  - `custom-days`: Specifieke weekdagen kiezen
  - `weekly`: Eén keer per week op een specifieke dag
  - `monthly`: Eén keer per maand

- **Artikelen per run:** Hoeveel artikelen per planning moment
- **Tijd van de dag:** Wanneer de artikelen gepubliceerd moeten worden

### Planning Algoritme

1. **Sorteer ideeën** op prioriteit, AI score, en search volume
2. **Bereken volgende datums** gebaseerd op frequentie
3. **Wijs datums toe** aan ideeën in volgorde van prioriteit
4. **Automatische herplanning** bij wijziging van instellingen

### API Endpoints

#### Automatisch Inplannen
```typescript
POST /api/client/article-ideas/schedule
{
  "projectId": "project_id",
  "action": "schedule-all" // of "reschedule-all", "schedule-one"
}
```

#### Handmatig Datum Wijzigen
```typescript
PUT /api/client/article-ideas/schedule
{
  "ideaId": "idea_id",
  "scheduledFor": "2025-11-15T09:00:00Z"
}
```

#### Datum Verwijderen
```typescript
DELETE /api/client/article-ideas/schedule?ideaId=idea_id
```

### Automatische Triggers

Het systeem plant automatisch opnieuw in wanneer:

1. **Nieuwe article idea toegevoegd**: Vindt automatisch de volgende beschikbare datum
2. **Autopilot settings gewijzigd**: Herplant alle ongescheduleerde ideeën
3. **Schedule wijzigingen**: Past alle toekomstige planningen aan

### Gebruik in Client View

In de **Project View Dashboard** (`/project-view/[token]`) zien klanten:

- 📅 **Publicatiedatum** prominent weergegeven bij elk idee
- **Gesorteerd op datum**: Vroegste artikelen eerst
- **Automatische updates**: Bij wijzigingen worden datums aangepast

---

## 🔗 Linkbuilding Netwerk Systeem

### Wat is Linkbuilding?

Linkbuilding is samenwerken met andere WritgoAI klanten voor wederzijdse backlinks. Beide partijen profiteren:

- **Betere SEO** door relevante backlinks
- **Credits verdienen** door links te geven
- **Netwerk uitbreiden** met relevante partners

### Credit Systeem

| Actie | Credits |
|-------|---------|
| Link geven aan partner | +5 credits ✅ |
| Link ontvangen van partner | -2 credits 💳 |

**Netto voordeel:** +3 credits per link exchange

### Hoe Werkt Het?

#### 1. Partners Ontdekken

Ga naar **Client Portal → Linkbuilding → Ontdekken**

- Zoek partners op **niche** (bijv. "elektronica", "reizen")
- Zie **relevantie score** (0-100%) gebaseerd op:
  - Gemeenschappelijke keywords
  - Overlappende niches
  - Content pillars
- Bekijk **matching topics** voor samenwerking

#### 2. Verzoek Versturen

Stuur een partnership verzoek naar potentiële partners:

- **Persoonlijk bericht**: Waarom je wilt samenwerken
- **Voorgestelde onderwerpen**: Waar je over wilt linken
- **Credits aanbieden**: Optioneel extra credits voor partnership
- **Links per maand**: Hoeveel backlinks per maand (1-10)

#### 3. Verzoeken Beheren

**Ontvangen verzoeken** (van anderen):
- Bekijk details van het verzoek
- **Accepteren**: Start automatisch een partnership
- **Afwijzen**: Met optionele reden

**Verzonden verzoeken** (door jou):
- Bekijk status: `In afwachting`, `Geaccepteerd`, `Afgewezen`
- Wacht op antwoord van de andere partij

#### 4. Actieve Partnerships

Beheer je actieve partnerships:

**Statistieken:**
- **Links Gegeven**: Aantal backlinks jij hebt geplaatst
- **Links Ontvangen**: Aantal backlinks jij hebt ontvangen
- **Credits Verdiend**: Totaal verdiende credits
- **Max per Maand**: Afgesproken limiet

**Acties:**
- **Pauzeren**: Tijdelijk stoppen
- **Hervatten**: Verder gaan na pauze
- **Beëindigen**: Partnership permanent stoppen

### Database Schema

#### LinkbuildingPartnership
```prisma
model LinkbuildingPartnership {
  id                     String
  requestingClientId     String
  targetClientId         String
  relevantTopics         String[]
  status                 String    // 'active', 'paused', 'ended'
  linksGiven             Int
  linksReceived          Int
  creditsEarned          Float
  creditsSpent           Float
  maxLinksPerMonth       Int
  startDate              DateTime
  lastLinkDate           DateTime?
}
```

#### LinkbuildingRequest
```prisma
model LinkbuildingRequest {
  id                String
  fromClientId      String
  toClientId        String
  message           String?
  proposedTopics    String[]
  relevanceScore    Float?
  matchingTopics    String[]
  status            String    // 'pending', 'accepted', 'rejected', 'expired'
  creditsOffered    Float
  linksPerMonth     Int
  expiresAt         DateTime?
  createdAt         DateTime
}
```

### API Endpoints

#### Discovery
```typescript
GET /api/client/linkbuilding/discover?niche=elektronica
// Retourneert: potential partners met relevance scores
```

#### Requests
```typescript
// List requests
GET /api/client/linkbuilding/requests

// Send request
POST /api/client/linkbuilding/requests
{
  "toClientId": "client_id",
  "message": "Hallo, laten we samenwerken!",
  "proposedTopics": ["elektronica", "gadgets"],
  "creditsOffered": 50,
  "linksPerMonth": 3
}

// Accept/Reject
PATCH /api/client/linkbuilding/requests
{
  "requestId": "request_id",
  "action": "accept", // of "reject"
  "responseMessage": "Leuk! Laten we beginnen."
}
```

#### Partnerships
```typescript
// List partnerships
GET /api/client/linkbuilding/partnerships

// Update status
PATCH /api/client/linkbuilding/partnerships
{
  "partnershipId": "partnership_id",
  "action": "pause" // of "resume", "end"
}

// Record link exchange
POST /api/client/linkbuilding/partnerships
{
  "partnershipId": "partnership_id",
  "linkGiven": true // false voor ontvangen
}
```

#### Credits
```typescript
// Record link exchange met credits
POST /api/client/linkbuilding/credits
{
  "partnershipId": "partnership_id",
  "type": "given", // of "received"
  "articleUrl": "https://example.com/article",
  "anchorText": "beste waterfilter"
}

// Get credits summary
GET /api/client/linkbuilding/credits
// Retourneert: totalEarned, totalSpent, netCredits
```

---

## 🚀 Gebruik en Best Practices

### Automatische Planning

1. **Configureer Autopilot** in projectinstellingen
   - Kies frequentie (dagelijks, wekelijks, custom)
   - Stel aantal artikelen per run in
   - Kies publicatietijd

2. **Voeg ideeën toe** via Content Research
   - Automatisch gepland volgens instellingen
   - Zie publicatiedatum direct in overzicht

3. **Wijzig planning handmatig** indien nodig
   - Via API of (toekomstige) UI
   - Andere ideeën worden automatisch aangepast

### Linkbuilding

1. **Zoek relevante partners**
   - Gebruik je niche als zoekterm
   - Check relevantie score (50%+)
   - Bekijk matching topics

2. **Stuur doordachte verzoeken**
   - Schrijf persoonlijk bericht
   - Geef aan waarom partnership zinvol is
   - Wees realistisch over links per maand

3. **Beheer partnerships actief**
   - Registreer link exchanges
   - Monitor credits balans
   - Communiceer met partners

4. **Verdien credits**
   - +5 credits per link die je geeft
   - -2 credits per link die je ontvangt
   - Netto winst: +3 credits per exchange

---

## ⚠️ Belangrijke Opmerkingen

### Automatische Planning

- **Eerst Autopilot instellen**: Planning werkt alleen met actieve Autopilot
- **Handmatige aanpassingen**: Blijven behouden tot volledige herplanning
- **Verwijderde ideeën**: Andere ideeën worden automatisch opgeschoven

### Linkbuilding

- **Relevantie is belangrijk**: Alleen linken in relevante context
- **Max per maand**: Respecteer afgesproken limieten
- **Credits eerst controleren**: Zorg voor voldoende saldo
- **Kwaliteit boven kwantiteit**: Goede backlinks zijn waardevoller

---

## 🔧 Technische Details

### Scheduling Algoritme

```typescript
// Prioriteit volgorde voor planning:
1. priority (high > medium > low)
2. aiScore (hoger is beter)
3. searchVolume (hoger is beter)
4. createdAt (ouder eerst)

// Datum berekening:
- Start met huidige datum + tijd
- Vind volgende beschikbare datum volgens frequentie
- Wijs datum toe aan idee
- Herhaal voor volgende idee
```

### Relevance Score Berekening

```typescript
// Linkbuilding partner matching:
relevanceScore = 0

// Keyword matches: +10 punten per match
keywords.forEach(keyword => {
  if (partnerKeywords.includes(keyword)) {
    relevanceScore += 10
  }
})

// Content pillar matches: +15 punten per match
contentPillars.forEach(pillar => {
  if (partnerPillars.includes(pillar)) {
    relevanceScore += 15
  }
})

// Niche match: +20 punten
if (niche.includes(partnerNiche)) {
  relevanceScore += 20
}
```

---

## 📊 Credits Tracking

Alle linkbuilding credits worden geregistreerd als `CreditTransaction`:

```typescript
{
  type: "earned_linkbuilding" | "spent_linkbuilding",
  amount: +5 | -2,
  description: "Linkbuilding: Link gegeven/ontvangen",
  balanceAfter: currentBalance + amount
}
```

---

## 🎯 Toekomstige Verbeteringen

### Automatische Planning
- UI voor handmatig wijzigen van datums
- Drag-and-drop planning calendar
- Bulk editing van meerdere ideeën
- Planning preview voordat toepassen

### Linkbuilding
- AI-gestuurde partner matching
- Automatische link plaatsing suggesties
- Domain Authority tracking
- Link quality scoring
- Partner reviews en ratings
- Automated link checking
- Partnership analytics dashboard

---

## 📝 Changelog

### Version 3.3.0 (November 2025)

**Nieuw:**
- ✅ Automatische planning van article ideas
- ✅ Linkbuilding netwerk systeem
- ✅ Credits verdienen met linkbuilding
- ✅ Partner discovery met relevance matching
- ✅ Partnership management dashboard
- ✅ Automatic rescheduling bij settings wijziging

**Database:**
- ✅ `LinkbuildingPartnership` model
- ✅ `LinkbuildingRequest` model
- ✅ Automatische datum velden in `ArticleIdea`

**API:**
- ✅ `/api/client/article-ideas/schedule` - Planning management
- ✅ `/api/client/linkbuilding/discover` - Partner discovery
- ✅ `/api/client/linkbuilding/requests` - Request management
- ✅ `/api/client/linkbuilding/partnerships` - Partnership management
- ✅ `/api/client/linkbuilding/credits` - Credit tracking

**UI:**
- ✅ Linkbuilding page in client portal
- ✅ Partner discovery interface
- ✅ Request management tabs
- ✅ Partnership dashboard
- ✅ Publicatiedatum display in project view

---

## 💡 Tips voor Klanten

### Maximaliseer Credits met Linkbuilding

1. **Zoek actief naar partners**: Meer partnerships = meer mogelijkheden
2. **Geef meer links dan je ontvangt**: Verdien netto credits
3. **Focus op kwaliteit**: Relevante links zijn waardevoller
4. **Wees betrouwbaar**: Bouw lange-termijn partnerships op

### Optimaliseer Planning

1. **Stel realistische frequentie in**: Haalbaar aantal artikelen
2. **Check planning regelmatig**: Pas aan indien nodig
3. **Prioriteer belangrijke onderwerpen**: High priority eerst
4. **Gebruik AI scores**: Automatisch sorteren op potentieel

---

## 📞 Support

Voor vragen of problemen met automatische planning of linkbuilding:
- Check deze documentatie eerst
- Contacteer WritgoAI support
- Deel feedback voor verbeteringen

---

**WritgoAI - Slimmer Content Beheer** 🚀
