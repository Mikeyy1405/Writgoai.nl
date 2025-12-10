# Migration Guide: Stripe to Moneybird

Dit document beschrijft hoe bestaande klanten met Stripe abonnementen gemigreerd worden naar Moneybird.

## Overzicht

De migratie van Stripe naar Moneybird bestaat uit twee onderdelen:
1. **Technische migratie**: Database en systeem updates
2. **Klant migratie**: Bestaande abonnementen overzetten

## Belangrijke Overwegingen

⚠️ **Let op**: Deze migratie vereist zorgvuldige planning:
- Bestaande abonnementen blijven actief in Stripe tot migratie
- Klanten moeten geïnformeerd worden over de wijziging
- Geen onderbreking van service tijdens migratie
- Test eerst met een kleine groep klanten

## Pre-Migratie Checklist

- [ ] Moneybird volledig geconfigureerd en getest
- [ ] Nieuwe prijzen en producten aangemaakt in Moneybird
- [ ] Webhooks werkend en getest
- [ ] Klant communicatie voorbereid
- [ ] Backup van huidige database gemaakt
- [ ] Test migratie uitgevoerd met test accounts

## Stap 1: Data Export uit Stripe

### Export actieve subscriptions

```javascript
// Script: export_stripe_subscriptions.js
const Stripe = require('stripe');
const fs = require('fs');

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);

async function exportSubscriptions() {
  const subscriptions = [];
  let hasMore = true;
  let startingAfter = undefined;

  while (hasMore) {
    const response = await stripe.subscriptions.list({
      status: 'active',
      limit: 100,
      starting_after: startingAfter,
    });

    subscriptions.push(...response.data);
    hasMore = response.has_more;
    if (hasMore) {
      startingAfter = response.data[response.data.length - 1].id;
    }
  }

  // Export naar JSON
  fs.writeFileSync(
    'stripe_subscriptions_export.json',
    JSON.stringify(subscriptions, null, 2)
  );

  console.log(`Exported ${subscriptions.length} active subscriptions`);
}

exportSubscriptions().catch(console.error);
```

### Export klantgegevens

```javascript
// Script: export_stripe_customers.js
async function exportCustomers() {
  const customers = [];
  let hasMore = true;
  let startingAfter = undefined;

  while (hasMore) {
    const response = await stripe.customers.list({
      limit: 100,
      starting_after: startingAfter,
    });

    customers.push(...response.data);
    hasMore = response.has_more;
    if (hasMore) {
      startingAfter = response.data[response.data.length - 1].id;
    }
  }

  fs.writeFileSync(
    'stripe_customers_export.json',
    JSON.stringify(customers, null, 2)
  );

  console.log(`Exported ${customers.length} customers`);
}
```

## Stap 2: Klant Communicatie

### Email Template: Aankondiging (2 weken voor migratie)

```
Onderwerp: Belangrijke update: Overstap naar Moneybird voor facturatie

Beste [Naam],

We hebben goed nieuws! WritgoAI gaat over naar Moneybird voor alle 
facturatie en betalingen. Dit betekent:

✅ Nederlandse facturen met BTW
✅ Automatische boekhouding
✅ Betalen via iDEAL en bankoverschrijving
✅ Alle facturen op één plek

Wat moet je doen?
- Niets! We regelen alles voor je
- Je ontvangt binnenkort een nieuwe factuur via Moneybird
- Je abonnement blijft gewoon doorlopen
- Je credits blijven behouden

Wanneer?
- Overstap vindt plaats op [Datum]
- Geen onderbreking van service
- Je ontvangt een bevestiging na de overstap

Vragen?
Neem contact op via info@writgoai.nl

Met vriendelijke groet,
Het WritgoAI Team
```

### Email Template: Bevestiging (na migratie)

```
Onderwerp: ✅ Je account is succesvol overgezet naar Moneybird

Beste [Naam],

Je WritgoAI account is succesvol overgezet naar Moneybird!

Je abonnement:
- Plan: [Plan Naam]
- Credits: [Aantal] per maand
- Prijs: €[Prijs] per maand
- Volgende factuur: [Datum]

Wat is er veranderd?
- Je ontvangt facturen via Moneybird
- Betalen kan via iDEAL of bankoverschrijving
- Nederlandse BTW facturen
- Je inloggegevens zijn hetzelfde gebleven

Je eerste Moneybird factuur ontvangt je via email op [Datum].

Log in op WritgoAI: https://writgoai.nl/client-login

Vragen?
We helpen je graag: info@writgoai.nl

Met vriendelijke groet,
Het WritgoAI Team
```

## Stap 3: Database Migratie

### Script: Migreer klanten naar Moneybird

```javascript
// Script: migrate_to_moneybird.js
const { PrismaClient } = require('@prisma/client');
const { MoneybirdClient } = require('./lib/moneybird');

const prisma = new PrismaClient();
const moneybird = new MoneybirdClient({
  accessToken: process.env.MONEYBIRD_ACCESS_TOKEN,
  administrationId: process.env.MONEYBIRD_ADMINISTRATION_ID,
});

// Plan mapping
const PLAN_MAPPING = {
  'starter': 'basis',
  'pro': 'professional',
  'enterprise': 'business',
};

async function migrateClient(client) {
  console.log(`Migrating client: ${client.email}`);

  try {
    // 1. Maak Moneybird contact aan
    const contact = await moneybird.createOrUpdateContact({
      company_name: client.companyName || client.name,
      firstname: client.companyName ? '' : client.name.split(' ')[0] || '',
      lastname: client.companyName ? '' : client.name.split(' ').slice(1).join(' ') || '',
      email: client.email,
      customer_id: client.id,
      send_invoices_to_email: client.email,
    });

    console.log(`✅ Created Moneybird contact: ${contact.id}`);

    // 2. Maak subscription aan als client een actief abonnement heeft
    if (client.subscriptionStatus === 'active' && client.subscriptionPlan) {
      const moneybirdPlan = PLAN_MAPPING[client.subscriptionPlan] || client.subscriptionPlan;
      const productId = process.env[`MONEYBIRD_PRODUCT_${moneybirdPlan.toUpperCase()}_ID`];

      if (!productId) {
        console.error(`❌ No product ID for plan: ${moneybirdPlan}`);
        return false;
      }

      const subscription = await moneybird.createSubscription({
        contact_id: contact.id,
        start_date: new Date().toISOString().split('T')[0],
        frequency: 'month',
        frequency_amount: 1,
        auto_send: true,
        details_attributes: [{
          description: `WritgoAI ${moneybirdPlan} Abonnement`,
          price: getPlanPrice(moneybirdPlan).toFixed(2),
          amount: '1',
          tax_rate_id: process.env.MONEYBIRD_TAX_RATE_21_ID,
          ledger_account_id: process.env.MONEYBIRD_REVENUE_LEDGER_ID,
        }],
      });

      console.log(`✅ Created Moneybird subscription: ${subscription.id}`);

      // 3. Update database
      await prisma.client.update({
        where: { id: client.id },
        data: {
          moneybirdContactId: contact.id,
          moneybirdSubscriptionId: subscription.id,
          subscriptionPlan: moneybirdPlan,
        },
      });
    } else {
      // Alleen contact opslaan voor klanten zonder actief abonnement
      await prisma.client.update({
        where: { id: client.id },
        data: {
          moneybirdContactId: contact.id,
        },
      });
    }

    console.log(`✅ Migrated client: ${client.email}\n`);
    return true;

  } catch (error) {
    console.error(`❌ Error migrating ${client.email}:`, error.message);
    return false;
  }
}

function getPlanPrice(plan) {
  const prices = {
    'basis': 49,
    'professional': 99,
    'business': 199,
    'enterprise': 399,
  };
  return prices[plan] || 0;
}

async function migrateAllClients() {
  console.log('Starting migration to Moneybird...\n');

  // Haal alle klanten op
  const clients = await prisma.client.findMany({
    where: {
      // Alleen klanten met een email
      email: { not: null },
    },
  });

  console.log(`Found ${clients.length} clients to migrate\n`);

  let successful = 0;
  let failed = 0;

  for (const client of clients) {
    const success = await migrateClient(client);
    if (success) {
      successful++;
    } else {
      failed++;
    }

    // Wacht 500ms tussen migraties om rate limiting te voorkomen
    await new Promise(resolve => setTimeout(resolve, 500));
  }

  console.log('\n=== Migration Complete ===');
  console.log(`✅ Successful: ${successful}`);
  console.log(`❌ Failed: ${failed}`);
  console.log(`Total: ${clients.length}`);
}

// Run migratie
migrateAllClients()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
```

## Stap 4: Stripe Abonnementen Stopzetten

**Belangrijk**: Doe dit PAS nadat alle klanten succesvol zijn gemigreerd!

```javascript
// Script: cancel_stripe_subscriptions.js
const Stripe = require('stripe');
const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);

async function cancelAllSubscriptions() {
  console.log('⚠️  WARNING: This will cancel all Stripe subscriptions!');
  console.log('Press Ctrl+C to abort, or wait 10 seconds to continue...');
  
  await new Promise(resolve => setTimeout(resolve, 10000));

  const subscriptions = await getAllSubscriptions();
  
  console.log(`Found ${subscriptions.length} active subscriptions`);
  
  for (const sub of subscriptions) {
    try {
      // Cancel at period end (geen terugbetaling)
      await stripe.subscriptions.update(sub.id, {
        cancel_at_period_end: true,
      });
      console.log(`✅ Scheduled cancellation: ${sub.id}`);
    } catch (error) {
      console.error(`❌ Failed to cancel ${sub.id}:`, error.message);
    }
  }
  
  console.log('\n✅ All Stripe subscriptions scheduled for cancellation');
}

async function getAllSubscriptions() {
  const subscriptions = [];
  let hasMore = true;
  let startingAfter = undefined;

  while (hasMore) {
    const response = await stripe.subscriptions.list({
      status: 'active',
      limit: 100,
      starting_after: startingAfter,
    });

    subscriptions.push(...response.data);
    hasMore = response.has_more;
    if (hasMore) {
      startingAfter = response.data[response.data.length - 1].id;
    }
  }

  return subscriptions;
}

cancelAllSubscriptions().catch(console.error);
```

## Stap 5: Post-Migratie Verificatie

### Verificatie Checklist

```javascript
// Script: verify_migration.js
async function verifyMigration() {
  console.log('Verifying migration...\n');

  // 1. Check alle klanten hebben Moneybird contact ID
  const clientsWithoutContact = await prisma.client.count({
    where: {
      email: { not: null },
      moneybirdContactId: null,
    },
  });

  console.log(`Clients without Moneybird contact: ${clientsWithoutContact}`);

  // 2. Check actieve subscriptions hebben Moneybird subscription ID
  const activeWithoutSubscription = await prisma.client.count({
    where: {
      subscriptionStatus: 'active',
      moneybirdSubscriptionId: null,
    },
  });

  console.log(`Active subscriptions without Moneybird ID: ${activeWithoutSubscription}`);

  // 3. Check Stripe fields zijn niet meer in gebruik
  const hasStripeData = await prisma.client.count({
    where: {
      OR: [
        { stripeCustomerId: { not: null } },
      ],
    },
  });

  console.log(`Clients with Stripe data: ${hasStripeData}`);

  console.log('\n=== Verification Complete ===');
  
  if (clientsWithoutContact === 0 && activeWithoutSubscription === 0) {
    console.log('✅ Migration successful!');
  } else {
    console.log('⚠️  Some clients need attention');
  }
}

verifyMigration()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
```

## Rollback Plan

Als er iets misgaat tijdens de migratie:

### 1. Stop de migratie
```bash
# Stop alle migratie scripts
pkill -f "migrate_to_moneybird"
```

### 2. Herstel database backup
```bash
# Herstel backup (voorbeeld voor PostgreSQL)
pg_restore -d writgo_db -c backup_before_migration.dump
```

### 3. Heractiveer Stripe
- Zet Stripe code terug (gebruik git om vorige versie te herstellen)
- Verwijder Moneybird routes tijdelijk
- Informeer klanten

## Tijdlijn Voorbeeld

**Week 1-2**: Voorbereiding
- Moneybird configureren
- Test migratie opzetten
- Email templates voorbereiden

**Week 3**: Communicatie
- Aankondiging email versturen
- FAQ pagina publiceren
- Support team briefen

**Week 4**: Pilot
- Migreer 10-20 test klanten
- Verzamel feedback
- Fix eventuele issues

**Week 5**: Bulk Migratie
- Migreer alle klanten in batches
- Monitor voor errors
- Direct support beschikbaar

**Week 6**: Afronden
- Stripe subscriptions stopzetten
- Verificatie uitvoeren
- Success email versturen

## Support en Troubleshooting

### Veelvoorkomende Issues

**Issue**: Moneybird contact bestaat al
- **Oplossing**: Gebruik `getContactByCustomerId()` om bestaand contact te vinden

**Issue**: Product ID niet gevonden
- **Oplossing**: Controleer of alle `MONEYBIRD_PRODUCT_*_ID` variabelen correct zijn

**Issue**: Rate limiting errors
- **Oplossing**: Verhoog delay tussen migraties van 500ms naar 1000ms

**Issue**: Klant ontvangt geen factuur
- **Oplossing**: Controleer email instellingen in Moneybird en spam folder

## Contact

Voor vragen over de migratie:
- **Technical**: developers@writgoai.nl
- **Customer Support**: support@writgoai.nl
- **Emergency**: [Emergency contact]

## Conclusie

Deze migratie vergt zorgvuldige planning en uitvoering. Neem de tijd, test grondig, en communiceer helder met je klanten. Met deze guide zou de migratie soepel moeten verlopen.

**Succes met de migratie! 🚀**
