
# 🔗 Link Building & Affiliate Portal - Complete Documentatie

## 📋 Overzicht

Deze update voegt drie belangrijke features toe aan WritgoAI:

1. **Bulk Delete Functionaliteit** - Voor Autopilot en Keyword Research pagina's
2. **Link Building Systeem** - Automatische interne links tussen gebruikers
3. **Affiliate Portal** - Verdien commissie door nieuwe klanten te werven

---

## 🗑️ 1. Bulk Delete Functionaliteit

### Wat is nieuw?

Gebruikers kunnen nu meerdere content ideeën tegelijk verwijderen op:
- **Autopilot pagina** - `/client-portal/autopilot`
- **Keyword Research pagina** - `/client-portal/content-research`

### Hoe werkt het?

1. **Selecteer artikelen**: Klik op de checkboxes naast artikelen
2. **Bulk actie**: Klik op "Geselecteerde verwijderen" knop
3. **Bevestig**: Bevestig de actie in de dialoog
4. **Klaar**: Artikelen worden verwijderd en lijst wordt ververst

### Technische Details

- **API Endpoint**: `POST /api/client/article-ideas/bulk-delete`
- **Request Body**:
  ```json
  {
    "ids": ["idea-id-1", "idea-id-2", "idea-id-3"]
  }
  ```
- **Response**:
  ```json
  {
    "success": true,
    "message": "3 ideeën verwijderd"
  }
  ```

### UI Verbeteringen

- Checkbox in tabelkop om alle te selecteren/deselecteren
- Teller toont aantal geselecteerde items
- Bulk actie knop verschijnt alleen als items geselecteerd zijn
- Bevestigingsdialoog voorkomt onbedoeld verwijderen

---

## 🔗 2. Link Building Systeem

### Wat is Link Building?

Link building is een SEO-strategie waarbij WritgoAI automatisch relevante links plaatst tussen blogs van verschillende gebruikers die hebben ingestemd met deze functie.

### Voordelen

- ✅ **Betere SEO** - Verbeterde domein autoriteit
- ✅ **Meer traffic** - Links van gerelateerde websites
- ✅ **Automatisch** - Geen handmatig werk nodig
- ✅ **Relevant** - AI selecteert passende artikelen
- ✅ **Opt-in** - Volledige controle over deelname

### Kosten

- **15 credits per geplaatste link**
- Betaling alleen bij succesvolle plaatsing
- Geen kosten voor ontvangen links

### In-/Uitschakelen

**Via Account Instellingen:**

1. Ga naar `/client-portal/account`
2. Scroll naar "Link Building Instellingen"
3. Toggle de schakelaar aan/uit
4. Sla op

**Opties:**

- ✅ **Ingeschakeld**: Jouw content kan links ontvangen en plaatsen
- ❌ **Uitgeschakeld**: Geen deelname, geen kosten

### Hoe werkt het automatisch systeem?

1. **Cron Job**: Draait dagelijks om 03:00 UTC
2. **Selectie**: Zoekt gepubliceerde artikelen van opt-in gebruikers
3. **AI Analyse**: Bepaalt relevantie tussen artikelen (score 0-100)
4. **Link Plaatsing**: 
   - Natuurlijke anchor tekst
   - Contextgericht in artikel
   - WordPress update via API
5. **Tracking**: Link wordt opgeslagen in database
6. **Credits**: Automatisch afgetrokken van gebruiker die link ontvangt

### Minimum Requirements voor Link Plaatsing

- ✅ Artikel moet gepubliceerd zijn op WordPress
- ✅ Minimaal 500 woorden content
- ✅ Relevantie score > 70/100
- ✅ Voldoende credits beschikbaar
- ✅ WordPress credentials geconfigureerd

### Database Schema

**LinkBuildingLink Model:**
```prisma
model LinkBuildingLink {
  id              String   @id @default(cuid())
  sourceClientId  String   // Wie plaatst de link
  targetClientId  String   // Naar wie de link gaat
  sourceArticleId String   // Artikel met de link
  targetArticleId String   // Artikel waar naartoe gelinkt wordt
  anchorText      String   // Tekst van de link
  relevanceScore  Int      // AI score 0-100
  status          String   // 'pending', 'placed', 'failed'
  creditsCharged  Int      // Kosten (meestal 15)
  placedAt        DateTime?
  createdAt       DateTime @default(now())
  
  sourceClient    Client   @relation("SourceLinks", fields: [sourceClientId], references: [id])
  targetClient    Client   @relation("TargetLinks", fields: [targetClientId], references: [id])
}
```

### API Endpoints

#### Link Building Instellingen
```
GET/POST /api/client/linkbuilding/settings
```

**Response:**
```json
{
  "linkBuildingEnabled": true,
  "receivedLinksCount": 12,
  "placedLinksCount": 8
}
```

#### Zoek Link Mogelijkheden (Manueel)
```
POST /api/client/linkbuilding/find-opportunities
```

**Request:**
```json
{
  "articleId": "saved-content-id",
  "projectId": "project-id"
}
```

**Response:**
```json
{
  "opportunities": [
    {
      "targetArticleId": "...",
      "targetClientName": "Voorbeeld Blog",
      "relevanceScore": 85,
      "reason": "Beide artikelen gaan over WordPress SEO",
      "suggestedAnchor": "meer over WordPress optimalisatie"
    }
  ]
}
```

#### Plaats Link (Manueel)
```
POST /api/client/linkbuilding/create-link
```

**Request:**
```json
{
  "sourceArticleId": "...",
  "targetArticleId": "...",
  "anchorText": "klik hier voor meer info"
}
```

**Response:**
```json
{
  "success": true,
  "link": {
    "id": "...",
    "creditsCharged": 15,
    "placedAt": "2025-11-07T15:30:00Z"
  }
}
```

### Automatische Link Building Cron

**Endpoint:** `GET /api/cron/linkbuilding-auto`

**Proces:**
1. Haal alle opt-in clients op
2. Voor elke client met voldoende credits:
   - Selecteer recent gepubliceerd artikel
   - Zoek matching target artikelen van andere users
   - AI analyseert relevantie
   - Plaats link als score > 70
   - Update WordPress
   - Registreer in database
   - Trek credits af

**Frequentie:** Dagelijks om 03:00 UTC

---

## 💰 3. Affiliate Portal

### Wat is het Affiliate Portal?

Een systeem waarmee gebruikers geld kunnen verdienen door nieuwe klanten naar WritgoAI te brengen.

### Commissie Structuur

- **10% per maand** van de abonnementskosten van geworven klanten
- **Recurring commissie** - Elke maand opnieuw
- **Lifetime tracking** - Zolang de klant abonnee blijft

**Voorbeelden:**

| Klant Abonnement | Jouw Commissie/maand |
|------------------|----------------------|
| €29/maand        | €2,90                |
| €99/maand        | €9,90                |
| €299/maand       | €29,90               |

### Hoe werkt het?

1. **Genereer Code**: Unieke affiliate code krijgen
2. **Deel Link**: `https://WritgoAI.nl/aanmelden?ref=JOUW_CODE`
3. **Klanten Werven**: Mensen melden zich aan via jouw link
4. **Verdienen**: Automatische commissie tracking
5. **Uitbetalen**: Aanvragen vanaf €50 opgebouwde commissie

### Affiliate Portal Pagina

**Locatie:** `/client-portal/affiliate`

**Features:**

#### 📊 Statistieken Dashboard
- Totaal verdiende commissie (all-time)
- Uitbetaalbaar saldo
- Aantal referrals (actieve klanten)
- Aangevraagde uitbetalingen

#### 🔗 Jouw Affiliate Code
- Unieke tracking code
- Direct kopieerbare link
- Automatische tracking bij registratie

#### 💸 Uitbetalingen Aanvragen
- Minimum: €50
- Request via formulier
- Admin goedkeuring vereist
- Tracking van status

### Database Schema

**AffiliateProgram Model:**
```prisma
model AffiliateProgram {
  id                String   @id @default(cuid())
  clientId          String   @unique
  affiliateCode     String   @unique
  totalEarned       Float    @default(0)
  availableBalance  Float    @default(0)
  referralCount     Int      @default(0)
  createdAt         DateTime @default(now())
  
  client            Client   @relation(fields: [clientId], references: [id])
  referrals         AffiliateReferral[]
  payouts           AffiliatePayout[]
}

model AffiliateReferral {
  id                String   @id @default(cuid())
  affiliateProgramId String
  referredClientId  String   @unique
  totalCommission   Float    @default(0)
  lastPaidAt        DateTime?
  createdAt         DateTime @default(now())
  
  affiliateProgram  AffiliateProgram @relation(fields: [affiliateProgramId], references: [id])
  referredClient    Client           @relation(fields: [referredClientId], references: [id])
}

model AffiliatePayout {
  id                String   @id @default(cuid())
  affiliateProgramId String
  amount            Float
  status            String   // 'pending', 'approved', 'paid', 'rejected'
  requestedAt       DateTime @default(now())
  processedAt       DateTime?
  
  affiliateProgram  AffiliateProgram @relation(fields: [affiliateProgramId], references: [id])
}
```

### API Endpoints

#### Genereer Affiliate Code
```
POST /api/client/affiliate/generate-code
```

**Response:**
```json
{
  "affiliateCode": "WRI-ABC123",
  "link": "https://WritgoAI.nl/aanmelden?ref=WRI-ABC123"
}
```

#### Haal Affiliate Stats Op
```
GET /api/client/affiliate/stats
```

**Response:**
```json
{
  "totalEarned": 145.50,
  "availableBalance": 67.80,
  "referralCount": 5,
  "pendingPayouts": [
    {
      "id": "...",
      "amount": 50,
      "status": "pending",
      "requestedAt": "2025-11-01T10:00:00Z"
    }
  ]
}
```

#### Vraag Uitbetaling Aan
```
POST /api/client/affiliate/request-payout
```

**Request:**
```json
{
  "amount": 50
}
```

**Response:**
```json
{
  "success": true,
  "payout": {
    "id": "...",
    "amount": 50,
    "status": "pending"
  }
}
```

### Registratie Tracking

Het affiliate systeem werkt via de registratie flow:

**Updated: `/api/client-auth/register`**

```typescript
// Check for referral code in request
const { referralCode } = req.body;

if (referralCode) {
  // Find affiliate program
  const affiliate = await prisma.affiliateProgram.findUnique({
    where: { affiliateCode: referralCode }
  });
  
  if (affiliate) {
    // Create referral link
    await prisma.affiliateReferral.create({
      data: {
        affiliateProgramId: affiliate.id,
        referredClientId: newClient.id
      }
    });
  }
}
```

### Maandelijkse Commissie Berekening

**Proces (Cron Job):**

1. Haal alle actieve referrals op
2. Check abonnement status van referred client
3. Bereken 10% van maandelijkse kosten
4. Update `totalCommission` in AffiliateReferral
5. Update `totalEarned` en `availableBalance` in AffiliateProgram
6. Verhoog `referralCount` bij nieuwe actieve klant

---

## 📊 Credit Gebruik Overzicht

| Feature | Credits | Timing |
|---------|---------|--------|
| Link plaatsen (bulk) | 15 | Per geplaatste link |
| Link plaatsen (manueel) | 15 | Per geplaatste link |
| Affiliate commissie | 0 | Gratis (verdien geld!) |
| Bulk delete | 0 | Gratis |

---

## 🎯 Best Practices

### Link Building

1. **Houd voldoende credits** - Minimaal 100 credits voor automatische runs
2. **Check WordPress credentials** - Zorg dat deze up-to-date zijn
3. **Publiceer regelmatig** - Meer content = meer link mogelijkheden
4. **Schrijf kwaliteit content** - Hogere relevantie scores
5. **Monitor geplaatste links** - Check of ze correct zijn geplaatst

### Affiliate Marketing

1. **Deel je link actief** - Social media, email signature, blog
2. **Leg de voordelen uit** - Help prospects begrijpen wat WritgoAI doet
3. **Geef support** - Help je referrals om succesvol te zijn
4. **Wacht op €50** - Minimaal bedrag voor uitbetaling
5. **Track je progress** - Check regelmatig je dashboard

---

## 🔧 Troubleshooting

### Link Building werkt niet

**Probleem:** Links worden niet automatisch geplaatst

**Oplossingen:**
- ✅ Check of Link Building is ingeschakeld in Account settings
- ✅ Controleer of je voldoende credits hebt (min. 15)
- ✅ Verifieer WordPress credentials in Project settings
- ✅ Zorg dat artikelen gepubliceerd zijn (niet draft)
- ✅ Check of artikelen minimaal 500 woorden bevatten

### Affiliate code werkt niet

**Probleem:** Registraties worden niet getrackt

**Oplossingen:**
- ✅ Verifieer dat affiliate code is gegenereerd
- ✅ Check of de link correct is: `?ref=CODE` parameter
- ✅ Zorg dat registratie succesvol is afgerond
- ✅ Wacht 5-10 minuten voor stats update

### Uitbetaling wordt niet verwerkt

**Probleem:** Payout request blijft op 'pending'

**Oplossingen:**
- ✅ Minimum bedrag is €50
- ✅ Admin moet handmatig goedkeuren
- ✅ Check spam folder voor admin notifications
- ✅ Contacteer support na 48 uur

---

## 🚀 Toekomstige Updates

Geplande verbeteringen:

- [ ] Link building analytics dashboard
- [ ] Automatische anchor text suggesties
- [ ] Link plaatsing scheduling
- [ ] Affiliate marketing materials (banners, templates)
- [ ] Tiered commissie structuur (meer referrals = hoger %)
- [ ] Affiliate leaderboard
- [ ] Link health monitoring (broken link detection)

---

## 📞 Support

Vragen of problemen? Contacteer ons:

- **Email**: support@WritgoAI.nl
- **Dashboard**: Feedback knop in navigatie
- **Documentatie**: Deze file!

---

**Versie:** 1.0.0  
**Datum:** 7 november 2025  
**Auteur:** WritgoAI Development Team
