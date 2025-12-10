
# 💰 Admin Affiliate Commissie Beheer Systeem

## 📋 Overzicht

Het nieuwe **Admin Affiliate Commissie Beheer** systeem geeft je als beheerder een compleet overzicht van alle affiliate activiteiten, verdiensten, en uitbetalingsverzoeken. Je kunt nu eenvoudig zien hoeveel commissie je aan affiliates moet uitbetalen en alle payout requests beheren.

---

## 🎯 Toegang tot het Systeem

### Via Admin Dashboard

1. Log in als admin op `https://WritgoAI.nl/admin/dashboard`
2. In het hoofddashboard zie je nu:
   - **Stats Overzicht**: Een nieuw "Te Betalen Bedrag" card met het totale openstaande bedrag
   - **Acties Vereist**: Als er pending payouts zijn, zie je een oranje melding met het aantal en bedrag
   - **Snelle Acties**: Een nieuwe "Affiliate Commissies" knop met badge voor pending payouts

### Direct Link

Je kunt ook direct naar de affiliate commissie pagina gaan:
```
https://WritgoAI.nl/admin/affiliate-payouts
```

---

## 📊 Dashboard Overzicht

### Statistieken Cards

Het dashboard toont 6 belangrijke metrics:

1. **Totaal Affiliates** (blauw)
   - Aantal unieke affiliates die actief zijn
   
2. **Totaal Referrals** (groen)
   - Totaal aantal doorverwezen klanten
   - Toont ook hoeveel daarvan nog actief zijn

3. **Totaal Verdiend** (paars)
   - Totale commissie die je ooit hebt uitgekeerd aan alle affiliates
   
4. **Openstaande Payouts** (geel)
   - Aantal uitbetalingsverzoeken die wachten op goedkeuring
   
5. **Te Betalen Bedrag** (oranje - 2 kolommen breed)
   - ⚠️ **BELANGRIJKSTE METRIC**: Het totale bedrag dat je moet uitbetalen
   - Dit is de som van alle "requested" payouts
   - Dit is het antwoord op jouw vraag: "Hoeveel commissie moet ik uitbetalen?"

---

## 📑 Tabs Systeem

Het dashboard heeft 3 hoofdtabs:

### 1. Uitbetalingsverzoeken Tab

Dit is de belangrijkste tab voor dagelijks beheer.

#### Openstaande Uitbetalingsverzoeken

Hier zie je alle payouts met status "requested":

**Per Payout Card:**
- 👤 **Naam en email** van de affiliate
- 💶 **Bedrag** - groot en duidelijk weergegeven
- 📅 **Aangevraagd op** - datum en tijd van aanvraag
- 💳 **Betaalmethode** - indien opgegeven (bank_transfer, paypal, stripe, credits)

**Acties:**
- ✅ **Goedkeuren** (groen) - Markeert payout als "processing"
- ❌ **Afwijzen** (rood) - Markeert payout als "rejected"

#### In Behandeling Sectie

Als je een payout hebt goedgekeurd, verschijnt deze hier:
- Status: "processing"
- Je kunt deze markeren als "Betaald" wanneer je het geld hebt overgemaakt

**Actie:**
- ✅ **Markeer als Betaald** (blauw) - Registreert dat betaling is voltooid

### 2. Alle Affiliates Tab

Geeft een compleet overzicht van alle affiliates in jouw systeem:

**Per Affiliate Card:**
- 👤 **Basis Info**
  - Naam
  - Email
  - Sinds wanneer affiliate
  
- 💰 **Financiële Stats**
  - Totaal verdiend (groot cijfer rechts)
  - Aantal referrals (totaal en actief)

- 🔍 **Details** (klik op "Bekijk referrals")
  - Lijst van alle doorverwezen klanten
  - Per referral:
    - Naam en email
    - Subscription status (actief/inactief)
    - Subscription plan

### 3. Geschiedenis Tab

Overzicht van alle voltooide en afgewezen uitbetalingen:

**Per Historische Payout:**
- Naam en email van affiliate
- Bedrag
- Status badge (Betaald/Afgewezen)
- Aanvraag datum
- Betaaldatum (indien van toepassing)

---

## 🔄 Workflow: Van Aanvraag tot Betaling

### Stap 1: Affiliate Vraagt Payout Aan

Een affiliate gaat naar hun affiliate portal en vraagt een uitbetaling aan (minimum €50).

**Wat gebeurt er:**
- Payout record wordt aangemaakt met status "requested"
- Verschijnt in jouw "Uitbetalingsverzoeken" tab
- Wordt opgeteld in "Te Betalen Bedrag" op het dashboard
- Je krijgt een melding in het admin dashboard

### Stap 2: Jij Beoordeelt de Aanvraag

1. Open het Admin Dashboard
2. Zie de oranje melding: "X affiliate uitbetalingen te betalen (€XX.XX)"
3. Klik op "Affiliate Commissies" in Snelle Acties
4. Bekijk de details van de payout:
   - Wie vraagt het aan?
   - Hoeveel?
   - Welke betaalmethode?
   - Wanneer aangevraagd?

### Stap 3: Goedkeuren of Afwijzen

**Optie A: Goedkeuren**
- Klik op "✅ Goedkeuren"
- Status verandert naar "processing"
- Payout verhuist naar "In Behandeling" sectie
- Wordt NIET meer meegeteld in "Te Betalen Bedrag"

**Optie B: Afwijzen**
- Klik op "❌ Afwijzen"
- Status verandert naar "rejected"
- Payout verhuist naar "Geschiedenis" tab
- Wordt verwijderd uit "Te Betalen Bedrag"

### Stap 4: Geld Overmaken

Nadat je hebt goedgekeurd:

1. Maak het geld over naar de affiliate via hun opgegeven betaalmethode:
   - **Bank Transfer**: Naar hun bankrekening
   - **PayPal**: Naar hun PayPal email
   - **Stripe**: Via Stripe
   - **Credits**: Voeg credits toe aan hun account

2. **BELANGRIJK**: Dit doe je buiten het systeem om!
   - WritgoAI maakt NIET automatisch het geld over
   - Je moet zelf de banktransactie/PayPal/Stripe uitvoeren

### Stap 5: Markeren als Betaald

Na het overmaken van het geld:

1. Ga terug naar de Admin Affiliate Payouts pagina
2. Vind de payout in "In Behandeling" sectie
3. Klik op "✅ Markeer als Betaald"
4. Payout krijgt status "paid"
5. Verhuist naar "Geschiedenis" tab

---

## 💡 Hoe Weet Ik Hoeveel Ik Moet Betalen?

### Methode 1: Dashboard Card (Snelst)

Op het Admin Dashboard zie je direct de **"Te Betalen Bedrag"** card:
- Oranje kleur voor aandacht
- Toont het exacte bedrag: bijv. "€145.50"
- Subtekst: "Dit bedrag moet je uitbetalen aan affiliates"

### Methode 2: Via Affiliate Payouts Pagina

1. Ga naar `/admin/affiliate-payouts`
2. Bovenaan zie je de stats cards
3. De oranje card "Te Betalen Bedrag" toont het totaal
4. In de "Uitbetalingsverzoeken" tab zie je alle individuele payouts

### Methode 3: Berekening

Het te betalen bedrag is de **som van alle payouts met status "requested"**.

Voorbeeld:
- Affiliate A: €50.00 (requested)
- Affiliate B: €67.50 (requested)
- Affiliate C: €30.00 (requested)
- **Totaal Te Betalen: €147.50**

---

## 📱 API Endpoints

### Voor Beheerders

#### 1. Haal Affiliate Stats en Payouts Op
```
GET /api/admin/affiliate-payouts
```

**Response:**
```json
{
  "success": true,
  "stats": {
    "totalAffiliates": 5,
    "totalReferrals": 12,
    "activeReferrals": 8,
    "totalEarnedAllTime": 450.75,
    "pendingPayouts": 3,
    "pendingPayoutAmount": 147.50
  },
  "affiliates": [...],
  "payouts": [...]
}
```

**Key Field: `pendingPayoutAmount`** - Dit is het totale te betalen bedrag!

#### 2. Update Payout Status
```
PATCH /api/admin/affiliate-payouts/[id]
```

**Request Body:**
```json
{
  "action": "approve",  // of "reject", "mark_paid"
  "notes": "Optionele notitie"
}
```

**Response:**
```json
{
  "success": true,
  "payout": { ... },
  "message": "Payout goedgekeurd"
}
```

### Admin Stats API (Updated)

De bestaande `/api/admin/stats` endpoint is uitgebreid met affiliate info:

```json
{
  "stats": {
    "totalClients": 50,
    "activeSubscriptions": 35,
    ...
    "pendingPayouts": 3,
    "pendingPayoutAmount": 147.50
  }
}
```

---

## 🎨 UI Features

### Visual Cues

1. **Oranje Kleur** - Voor urgent/actie vereist (pending payouts)
2. **Groen** - Voor positieve acties (goedkeuren, betaald)
3. **Rood** - Voor negatieve acties (afwijzen)
4. **Blauw** - Voor processing status

### Badges en Notificaties

- **Badge op "Affiliate Commissies" knop** - Toont aantal pending payouts
- **Oranje melding in "Acties Vereist"** - Herinnert je aan pending payouts
- **Status badges** - Visuele indicatie van payout status

### Loading States

- Spinner tijdens laden
- Disabled buttons tijdens processing
- Real-time updates na acties

---

## 📝 Best Practices

### Dagelijks Gebruik

1. **Check Dashboard Daily**
   - Kijk elke dag naar het admin dashboard
   - Let op de oranje "Te Betalen Bedrag" card

2. **Snelle Review**
   - Als er pending payouts zijn, bekijk ze binnen 24-48 uur
   - Controleer of het bedrag klopt met je commissie tracking

3. **Batch Processing**
   - Goedkeur meerdere payouts tegelijk
   - Maak alle betalingen in één keer over (bijv. wekelijks)
   - Markeer ze daarna allemaal als betaald

### Financial Tracking

1. **Exporteer Data** (toekomstige feature)
   - Export naar CSV voor boekhouding
   - Track trends in commissie uitbetalingen

2. **Reconciliatie**
   - Check regelmatig of "Te Betalen Bedrag" klopt
   - Vergelijk met je eigen financiële administratie

3. **Communicatie**
   - Email affiliates wanneer je hun payout goedkeurt
   - Email affiliates wanneer betaling is voltooid
   - (Deze emails worden momenteel niet automatisch verzonden)

---

## 🔒 Beveiliging

- Alleen admin accounts kunnen deze pagina's zien
- Session validatie op alle API endpoints
- Geen affiliate kan elkaars gegevens zien
- Alle wijzigingen worden gelogd in de database

---

## 📊 Database Schema

### AffiliatePayout Model

```prisma
model AffiliatePayout {
  id                String    @id @default(cuid())
  affiliateClientId String
  amount            Float
  status            String    // 'requested', 'processing', 'paid', 'rejected'
  paymentMethod     String?
  paymentDetails    Json?
  requestedAt       DateTime  @default(now())
  processedAt       DateTime?
  paidAt            DateTime?
  notes             String?
  
  affiliateClient   Client    @relation(...)
}
```

### AffiliateReferral Model

```prisma
model AffiliateReferral {
  id                String    @id @default(cuid())
  referrerClientId  String    // Wie verwijst
  referredClientId  String    // Wie is verwezen
  referralCode      String
  status            String    // 'active', 'cancelled', 'fraudulent'
  createdAt         DateTime
  
  referrer          Client    @relation(...)
}
```

### AffiliateEarning Model

```prisma
model AffiliateEarning {
  id                String    @id @default(cuid())
  affiliateClientId String
  referredClientId  String
  month             Int
  year              Int
  commissionAmount  Float     // Bedrag verdiend deze maand
  commissionRate    Float     // 0.10 = 10%
}
```

---

## 🚀 Toekomstige Features

Mogelijke uitbreidingen:

- [ ] **Email Notificaties** - Automatische emails bij statuswijzigingen
- [ ] **CSV Export** - Download payout geschiedenis
- [ ] **Bulk Actions** - Goedkeur/afwijs meerdere payouts tegelijk
- [ ] **Payment Integration** - Directe integratie met Stripe/PayPal/Wise
- [ ] **Commissie Regels** - Aanpasbare commissie percentages per affiliate
- [ ] **Analytics Dashboard** - Grafieken en trends
- [ ] **Automatische Goedkeuring** - Auto-approve bij voldoende historie
- [ ] **Payout Scheduling** - Maandelijkse automatische uitbetalingen

---

## ❓ Veelgestelde Vragen

### Hoe weet ik hoeveel commissie ik moet uitbetalen?

Kijk naar de **"Te Betalen Bedrag"** card op het admin dashboard of in de affiliate payouts pagina. Dit is de som van alle openstaande (requested) uitbetalingsverzoeken.

### Waar kan ik het overzicht van alle affiliates zien?

Ga naar `/admin/affiliate-payouts` en klik op de **"Alle Affiliates"** tab. Hier zie je alle affiliates met hun totale verdiensten en referral stats.

### Wat gebeurt er als ik een payout goedkeur?

De payout krijgt status "processing" en verschijnt in de "In Behandeling" sectie. Het bedrag wordt **NIET automatisch uitgekeerd** - je moet zelf het geld overmaken via de opgegeven betaalmethode.

### Hoe markeer ik een payout als betaald?

Na het overmaken van het geld, ga naar de "In Behandeling" sectie en klik op "Markeer als Betaald". Dit registreert dat de betaling is voltooid.

### Kan ik een payout ongedaan maken nadat ik hem heb goedgekeurd?

Op dit moment niet via de UI. Als je per ongeluk een verkeerde payout hebt goedgekeurd, neem dan contact op met support of voer een handmatige database update uit.

### Wat gebeurt er met afgewezen payouts?

Afgewezen payouts krijgen status "rejected" en verschijnen in de "Geschiedenis" tab. Het bedrag wordt verwijderd uit "Te Betalen Bedrag". De affiliate kan een nieuwe aanvraag doen als gewenst.

### Hoe vaak moet ik commissies uitbetalen?

Dit is aan jou! Veel platforms doen dit:
- **Wekelijks** - Voor snelle payouts
- **Tweewekelijks** - Balans tussen frequentie en administratie
- **Maandelijks** - Meest gebruikelijk
- **Op aanvraag** - Wanneer affiliate het vraagt en minimum bereikt

### Wat is het minimum uitbetalingsbedrag?

Het standaard minimum is **€50**. Dit voorkomt te veel kleine transacties en transactiekosten.

---

## 📞 Support

Vragen of problemen met het affiliate commissie beheer systeem?

- **Email**: support@WritgoAI.nl
- **Dashboard**: Feedback knop in admin navigatie

---

**Versie:** 1.0.0  
**Laatst bijgewerkt:** 7 november 2025  
**Auteur:** WritgoAI Development Team
