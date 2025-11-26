# 🧪 Webhook Test Scenarios

## ✅ SCENARIO 1: Nieuwe bestelling (nu)
**Event:** `checkout.session.completed`

### Wat gebeurt er?
1. Klant vult checkout formulier in Stripe
2. Stripe stuurt webhook met:
   - `session.customer_details.email` → betaal email
   - `session.metadata.clientId` → account ID (als ingelogd)
   
3. **Matching logica:**
   - **Methode 1:** Als `clientId` in metadata → Directe match ✅
   - **Methode 2:** Zoek op email → Match via email ✅
   
4. **Account update:**
   - Subscription ID opslaan
   - Subscription credits toevoegen (1000/3000/10000)
   - Trial credits blijven bestaan (topUpCredits)
   
### ✅ Jeffrey's geval:
- Account: jeffrey_keijzer@msn.com (670 trial credits)
- Betaald met: jeffrey_keijzer@msn.com
- **Match:** Email matching ✅
- **Resultaat:** 3000 subscription + 670 trial = 3670 credits

---

## ✅ SCENARIO 2: Maandelijkse renewal (volgende maand)
**Event:** `customer.subscription.updated`

### Wat gebeurt er?
1. Stripe vernieuwt subscription automatisch
2. Stripe stuurt webhook met:
   - `subscription.id` → subscriptionId
   
3. **Matching logica:**
   - Zoek client via `subscriptionId` → Directe match ✅
   
4. **Account update:**
   - Subscription credits RESET naar maandelijks bedrag
   - topUpCredits blijven intact
   - Nieuwe periode start/end dates

### ✅ Jeffrey's geval volgende maand:
- Account gevonden via subscriptionId
- subscriptionCredits: 3000 (reset)
- topUpCredits: [wat er over is]
- **Resultaat:** 3000 nieuwe credits + resterende trial credits

---

## ⚠️ POTENTIEEL PROBLEEM: Verschillende emails

### Situatie:
- Account email: **ayosenang.nl@gmail.com** (Marcel)
- Betaal email: **jeffrey_keijzer@msn.com** (Jeffrey)

### Wat gebeurt er?
1. ❌ **Methode 1 (clientId):** Niet aanwezig in metadata
2. ❌ **Methode 2 (email):** jeffrey_keijzer@msn.com ≠ ayosenang.nl@gmail.com
3. ⚠️  **Resultaat:** Nieuw account aanmaken voor jeffrey_keijzer@msn.com

### Oplossingen:
1. **Altijd inloggen voor checkout** ✅ (stuurt clientId mee)
2. **Zelfde email gebruiken** ✅ (email matching werkt)
3. **Handmatig fixen** ✅ (zoals we nu hebben gedaan)

---

## 📋 CHECKLIST VOOR NIEUWE BESTELLINGEN

### Scenario A: Ingelogde gebruiker
- [✅] Client ID wordt meegestuurd in metadata
- [✅] Direct match via client ID
- [✅] Subscription wordt gekoppeld
- [✅] Credits worden toegevoegd

### Scenario B: Niet ingelogd, zelfde email
- [✅] Email matching werkt
- [✅] Bestaand account wordt geüpdatet
- [✅] Credits worden toegevoegd

### Scenario C: Niet ingelogd, andere email
- [⚠️] Nieuw account wordt aangemaakt
- [⚠️] Oude account blijft zonder subscription
- [❌] Handmatig fixen nodig

---

## 🔧 AANBEVELINGEN

1. **Forceer login voor betaling**
   - Redirect naar login als niet ingelogd
   - Zorg dat clientId altijd wordt meegestuurd
   
2. **Email verificatie**
   - Waarschuw als betaal email ≠ account email
   - Suggestie: "Gebruik hetzelfde email voor betaling"

3. **Admin monitoring**
   - Email bij nieuwe accounts met subscription
   - Check of match succesvol was

