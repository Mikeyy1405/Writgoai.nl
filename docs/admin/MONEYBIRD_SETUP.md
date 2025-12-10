# Moneybird Setup Guide

WritgoAI gebruikt Moneybird voor alle financiële operaties: facturatie, abonnementen, betalingen en BTW-administratie.

## Waarom Moneybird?

- **Alles in één systeem**: Facturatie, abonnementen, BTW-aangifte, inkomstenbelasting
- **Nederlandse boekhoudsoftware**: Perfect voor BTW compliance
- **Synchrone administratie**: Directe koppeling tussen app en boekhouding
- **Automatische facturatie**: Recurring subscriptions met automatische facturatie
- **BTW-compliance**: Automatische berekening en rapportage van Nederlandse BTW

## Vereisten

1. Een Moneybird account: https://www.moneybird.nl
2. Een administratie in Moneybird
3. API toegang (Personal Access Token of OAuth2)

## Stap 1: Moneybird Account en API Token

1. Log in op https://moneybird.com
2. Ga naar je account instellingen
3. Navigeer naar "Applicaties" → "Nieuwe applicatie"
4. Kies "Personal Access Token" voor eenvoudige setup
5. Kopieer het gegenereerde token

**Opmerking**: Voor productie wordt OAuth2 aanbevolen voor extra beveiliging.

## Stap 2: Administratie ID ophalen

1. Open je Moneybird administratie
2. De URL ziet er zo uit: `https://moneybird.com/123456789/...`
3. Het getal `123456789` is je administration_id

## Stap 3: Producten Aanmaken

Maak de volgende producten aan in Moneybird voor abonnementen:

### WritgoAI Basis
- **Naam**: WritgoAI Basis Abonnement
- **Prijs**: €49,00
- **BTW**: 21%
- **Frequentie**: Maandelijks
- **Omschrijving**: 2000 credits per maand voor content generatie

### WritgoAI Professional
- **Naam**: WritgoAI Professional Abonnement
- **Prijs**: €99,00
- **BTW**: 21%
- **Frequentie**: Maandelijks
- **Omschrijving**: 6000 credits per maand voor content generatie

### WritgoAI Business
- **Naam**: WritgoAI Business Abonnement
- **Prijs**: €199,00
- **BTW**: 21%
- **Frequentie**: Maandelijks
- **Omschrijving**: 15000 credits per maand voor content generatie

### WritgoAI Enterprise
- **Naam**: WritgoAI Enterprise Abonnement
- **Prijs**: €399,00
- **BTW**: 21%
- **Frequentie**: Maandelijks
- **Omschrijving**: 40000 credits per maand voor content generatie

**Noteer de Product IDs** van elk product (zie stap 5).

## Stap 4: BTW-tarieven en Grootboekrekeningen

### BTW-tarieven ophalen
1. Ga naar "Instellingen" → "BTW-tarieven"
2. Noteer de IDs van:
   - BTW 21% (standaard voor digitale diensten)
   - BTW 9% (voor eventuele andere diensten)
   - BTW 0% (voor export/vrijgesteld)

### Grootboekrekening ophalen
1. Ga naar "Instellingen" → "Grootboekschema"
2. Noteer de ID van de omzetrekening (bijv. "8000 - Omzet")

## Stap 5: Environment Variables Configureren

Kopieer `.env.example` naar `.env` en vul de volgende variabelen in:

```env
# Moneybird API
MONEYBIRD_ACCESS_TOKEN=your-personal-api-token
MONEYBIRD_ADMINISTRATION_ID=your-administration-id

# Moneybird Product IDs
MONEYBIRD_PRODUCT_BASIS_ID=product-id-from-step-3
MONEYBIRD_PRODUCT_PROFESSIONAL_ID=product-id-from-step-3
MONEYBIRD_PRODUCT_BUSINESS_ID=product-id-from-step-3
MONEYBIRD_PRODUCT_ENTERPRISE_ID=product-id-from-step-3

# Moneybird Tax & Ledger IDs
MONEYBIRD_TAX_RATE_21_ID=tax-rate-id-from-step-4
MONEYBIRD_TAX_RATE_9_ID=tax-rate-id-from-step-4
MONEYBIRD_TAX_RATE_0_ID=tax-rate-id-from-step-4
MONEYBIRD_REVENUE_LEDGER_ID=ledger-account-id-from-step-4

# Moneybird Webhook Token (zelf kiezen, minimaal 32 karakters)
MONEYBIRD_WEBHOOK_TOKEN=your-random-secret-token
```

### Product IDs ophalen via API

Als je de Product IDs niet kunt vinden in de Moneybird interface, gebruik dan dit script:

```bash
curl -X GET "https://moneybird.com/api/v2/YOUR_ADMIN_ID/products.json" \
  -H "Authorization: Bearer YOUR_ACCESS_TOKEN" \
  -H "Content-Type: application/json"
```

## Stap 6: Webhook Configureren

1. Ga naar Moneybird → "Instellingen" → "Webhooks"
2. Klik op "Nieuwe webhook"
3. Vul in:
   - **URL**: `https://jouw-domein.nl/api/moneybird/webhook`
   - **Events**: Selecteer:
     - `sales_invoice_state_changed_to_paid`
     - `sales_invoice_state_changed_to_late`
     - `subscription_created`
     - `subscription_updated`
     - `subscription_cancelled`
     - `payment_registered`
4. Gebruik de `MONEYBIRD_WEBHOOK_TOKEN` uit je `.env` voor verificatie

## Stap 7: Database Migratie

Voer de database migratie uit om de Moneybird velden toe te voegen:

```bash
cd nextjs_space
npx prisma migrate deploy
```

Of als je development draait:

```bash
npx prisma migrate dev
```

## Stap 8: Testen

### Test de Moneybird connectie

1. Start je development server
2. Log in als client
3. Ga naar de prijzen pagina
4. Kies een abonnement
5. Controleer in Moneybird of:
   - Een contact is aangemaakt
   - Een subscription is aangemaakt
   - Een factuur is verstuurd

### Test credit top-up

1. Log in met een account met een actief abonnement
2. Ga naar "Credits kopen"
3. Kies een pakket
4. Controleer in Moneybird of een factuur is aangemaakt en verzonden

### Test webhook

1. Betaal een testfactuur in Moneybird (markeer als betaald)
2. Controleer de logs: de webhook moet worden ontvangen
3. Controleer in de database of credits zijn toegevoegd

## API Endpoints

### Abonnementen

- **POST** `/api/moneybird/create-subscription`: Nieuw abonnement aanmaken
- **POST** `/api/moneybird/cancel-subscription`: Abonnement opzeggen

### Invoices

- **POST** `/api/moneybird/create-invoice`: Eenmalige factuur aanmaken (credit top-up)

### Webhooks

- **POST** `/api/moneybird/webhook`: Moneybird webhook events ontvangen

## Moneybird Subscription Workflow

1. **Client kiest abonnement** → Klik op "Abonneer"
2. **API maakt contact aan** → In Moneybird als deze nog niet bestaat
3. **API maakt subscription aan** → Recurring invoice in Moneybird
4. **Moneybird stuurt factuur** → Automatisch naar client email
5. **Client betaalt factuur** → Via iDEAL, bankrekening, etc.
6. **Webhook ontvangt betaling** → `sales_invoice_state_changed_to_paid`
7. **Credits worden toegevoegd** → Automatisch in de database
8. **Abonnement wordt actief** → Client kan WritgoAI gebruiken

## Credit Top-up Workflow

1. **Client kiest pakket** → Bijv. 1000 credits voor €32
2. **API maakt factuur aan** → Eenmalige factuur in Moneybird
3. **Moneybird stuurt factuur** → Per email naar client
4. **Client betaalt factuur** → Via gekozen betaalmethode
5. **Webhook ontvangt betaling** → Credits worden toegevoegd
6. **Client ontvangt credits** → Direct beschikbaar in account

## Troubleshooting

### "Moneybird API error: 401 Unauthorized"
- Controleer of `MONEYBIRD_ACCESS_TOKEN` correct is ingesteld
- Verifieer dat het token nog geldig is

### "Product ID niet geconfigureerd"
- Controleer of alle `MONEYBIRD_PRODUCT_*_ID` variabelen zijn ingesteld
- Gebruik de API of dashboard om product IDs op te halen

### "BTW of grootboekrekening niet geconfigureerd"
- Controleer of `MONEYBIRD_TAX_RATE_21_ID` en `MONEYBIRD_REVENUE_LEDGER_ID` zijn ingesteld
- Gebruik de API of dashboard om deze IDs op te halen

### Webhook wordt niet ontvangen
- Controleer of de webhook URL correct is geconfigureerd in Moneybird
- Verifieer dat de URL publiek toegankelijk is (niet localhost)
- Controleer de webhook logs in Moneybird voor fouten

### Credits worden niet toegevoegd na betaling
- Controleer de server logs voor webhook events
- Verifieer dat `MONEYBIRD_WEBHOOK_TOKEN` correct is
- Controleer of de invoice ID correct is gekoppeld in de database

## Rate Limiting

Moneybird heeft de volgende rate limits:
- **150 requests per 5 minuten** (normale endpoints)
- **50 requests per 5 minuten** (reports endpoints)

De Moneybird client in `lib/moneybird.ts` heeft automatische retry logic voor rate limiting.

## Productie Checklist

- [ ] Productie Moneybird account aangemaakt
- [ ] Alle producten aangemaakt met correcte prijzen
- [ ] API token gegenereerd en opgeslagen in environment variables
- [ ] Webhook geconfigureerd met productie URL
- [ ] Database migratie uitgevoerd op productie
- [ ] Test abonnement aangemaakt en betaald
- [ ] Test credit top-up uitgevoerd
- [ ] Webhook events geverifieerd
- [ ] BTW instellingen geverifieerd (21% voor NL)

## Migratie van Bestaande Klanten

Als je bestaande klanten hebt met Stripe abonnementen:

1. Exporteer alle actieve subscriptions uit Stripe
2. Voor elke klant:
   - Maak een Moneybird contact aan
   - Maak een nieuwe subscription aan in Moneybird
   - Update de database met nieuwe IDs
   - Informeer de klant over de wijziging
3. Stop alle Stripe subscriptions
4. Verwijder Stripe configuratie

**Belangrijk**: Communiceer duidelijk met klanten over de overgang en geef ze tijd om hun betaalgegevens bij te werken.

## Support

Voor vragen over Moneybird API:
- Documentatie: https://developer.moneybird.com/
- Support: support@moneybird.com

Voor vragen over WritgoAI integratie:
- Bekijk de code in `lib/moneybird.ts`
- Check de API routes in `app/api/moneybird/`
