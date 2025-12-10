# Twee-Tier Credit Systeem

## Overzicht

Het credit systeem is nu opgesplitst in **twee types credits**:

### 1. 🔄 Abonnement Credits
- **Wat**: Maandelijkse credits die je krijgt met je abonnement
- **Vernieuwing**: Worden elke maand gereset naar het aantal uit je plan
- **Gebruik**: Worden EERST gebruikt wanneer je credits nodig hebt
- **Voorbeeld**: 
  - Starter plan: 5000 credits/maand
  - Pro plan: 20000 credits/maand
  - Business plan: 100000 credits/maand

### 2. 💳 Top-Up Credits  
- **Wat**: Eenmalig gekochte credits
- **Vervaldatum**: NOOIT - blijven beschikbaar tot je ze gebruikt
- **Gebruik**: Worden pas gebruikt wanneer abonnement credits op zijn
- **Voorbeeld**: Koop een pakket van 5000 credits voor €25

## Hoe het werkt

### Scenario 1: Client met abonnement + top-up
```
Status:
- Abonnement credits: 1500
- Top-up credits: 3000
- Totaal beschikbaar: 4500 credits

Actie: Client gebruikt 2000 credits voor content generatie

Resultaat:
- Abonnement credits: 0 (1500 gebruikt)
- Top-up credits: 2500 (500 gebruikt)
- Totaal beschikbaar: 2500 credits
```

### Scenario 2: Abonnement vernieuwing
```
Voor vernieuwing (einde maand):
- Abonnement credits: 200 (bijna op)
- Top-up credits: 5000
- Totaal: 5200 credits

Na vernieuwing (nieuwe maand):
- Abonnement credits: 20000 (gereset naar plan amount!)
- Top-up credits: 5000 (blijft hetzelfde)
- Totaal: 25000 credits
```

### Scenario 3: Alleen top-up (geen abonnement)
```
Status:
- Abonnement credits: 0
- Top-up credits: 10000
- Totaal: 10000 credits

Bij gebruik worden alleen top-up credits gebruikt.
```

## Voor Ontwikkelaars

### Database Schema
```prisma
model Client {
  subscriptionCredits Float @default(0)  // Maandelijkse credits van abo
  topUpCredits        Float @default(0)  // Eenmalig gekocht
  monthlyCredits      Float?             // Hoeveel credits je per maand krijgt
}
```

### Credit Deductie Logica
```typescript
// Eerst proberen uit subscription credits te halen
if (subscriptionCredits >= amount) {
  // Alles uit subscription credits
  subscriptionCredits -= amount
} else {
  // Subscription credits op, gebruik top-up
  amount -= subscriptionCredits
  subscriptionCredits = 0
  topUpCredits -= amount
}
```

### API Routes

#### GET /api/credits/balance
```json
{
  "subscriptionCredits": 5000,
  "topUpCredits": 3000,
  "totalCredits": 8000,
  "isUnlimited": false
}
```

#### Stripe Webhook Events
- **One-time purchase**: Voegt credits toe aan `topUpCredits`
- **Subscription created**: Zet `subscriptionCredits` 
- **Invoice paid (renewal)**: RESET `subscriptionCredits` naar `monthlyCredits`

### UI Components

#### Credit Display Component
Toont nu:
- Totaal aantal credits (groot)
- Breakdown: "Abo: 5000 • Top-up: 3000" (klein, onder totaal)

## Migratie

Bestaande credits zijn gemigreerd naar:
- Clients MET actief abonnement → `subscriptionCredits`
- Clients ZONDER abonnement → `topUpCredits`

## Voordelen

1. **Duidelijk**: Users weten precies wat ze hebben
2. **Eerlijk**: Top-up credits blijven beschikbaar
3. **Flexibel**: Abo voor dagelijks gebruik + top-up voor pieken
4. **Transparant**: Transaction logs tonen welke credits gebruikt zijn

## Credit Costs

Kosten per actie (voorbeelden):
- Chat bericht (basis): 0.1 credit
- Chat bericht (geavanceerd): 0.5 credit  
- Image generatie: 0.5-2.0 credits
- Video generatie: 5-10 credits
- Content generatie: 1.0 credit

## Unlimited Accounts

Speciale accounts (`mikeschonewille@gmail.com`, `cgrotebeverborg@gmail.com`):
- `isUnlimited: true`
- Geen credit checks
- Alle usage wordt gelogd voor analytics
