
# Stripe Abonnement Setup

## Stap 1: Login bij Stripe Dashboard

Ga naar [https://dashboard.stripe.com](https://dashboard.stripe.com) en log in met je account.

## Stap 2: Maak Producten aan

Ga naar **Products** in het menu en maak de volgende producten aan:

### Product 1: WritgoAI Starter
- **Product naam**: WritgoAI Starter
- **Beschrijving**: 100 credits per maand voor het genereren van blogs en videos
- **Pricing Model**: Recurring
- **Price**: €24.99 / maand
- **Currency**: EUR
- **Billing Period**: Monthly

Nadat je het product hebt aangemaakt, kopieer de **Price ID** (begint met `price_...`)

### Product 2: WritgoAI Pro
- **Product naam**: WritgoAI Pro
- **Beschrijving**: 500 credits per maand voor het genereren van blogs en videos
- **Pricing Model**: Recurring
- **Price**: €99.99 / maand
- **Currency**: EUR
- **Billing Period**: Monthly

Nadat je het product hebt aangemaakt, kopieer de **Price ID** (begint met `price_...`)

### Product 3: WritgoAI Business
- **Product naam**: WritgoAI Business
- **Beschrijving**: 2000 credits per maand voor het genereren van blogs en videos
- **Pricing Model**: Recurring
- **Price**: €299.99 / maand
- **Currency**: EUR
- **Billing Period**: Monthly

Nadat je het product hebt aangemaakt, kopieer de **Price ID** (begint met `price_...`)

## Stap 3: Configureer Environment Variables

Update de `.env` file met de juiste Price IDs:

```env
STRIPE_STARTER_PRICE_ID=price_xxx_starter
STRIPE_PRO_PRICE_ID=price_xxx_pro
STRIPE_BUSINESS_PRICE_ID=price_xxx_business

NEXT_PUBLIC_STRIPE_STARTER_PRICE_ID=price_xxx_starter
NEXT_PUBLIC_STRIPE_PRO_PRICE_ID=price_xxx_pro
NEXT_PUBLIC_STRIPE_BUSINESS_PRICE_ID=price_xxx_business
```

## Stap 4: Configureer Webhooks

1. Ga naar **Developers** > **Webhooks** in het Stripe Dashboard
2. Klik op **Add endpoint**
3. URL: `https://WritgoAI.nl/api/stripe/webhook`
4. Events to send:
   - `checkout.session.completed`
   - `customer.subscription.created`
   - `customer.subscription.updated`
   - `customer.subscription.deleted`
   - `invoice.payment_succeeded`
   - `invoice.payment_failed`
5. Klik op **Add endpoint**
6. Kopieer de **Signing secret** (begint met `whsec_...`)
7. Update `.env`:

```env
STRIPE_WEBHOOK_SECRET=whsec_xxx
```

## Stap 5: Configureer Customer Portal

1. Ga naar **Settings** > **Billing** > **Customer portal** in het Stripe Dashboard
2. Enable **Customer portal**
3. Configureer de volgende opties:
   - ✅ Allow customers to update their payment methods
   - ✅ Allow customers to view their invoice history
   - ✅ Allow customers to cancel subscriptions
   - ✅ Allow customers to switch plans

## Stap 6: Test Mode vs Live Mode

⚠️ **Belangrijk**: Zorg ervoor dat je in de juiste mode zit:
- Voor testen: **Test Mode** (toggle linksboven in Stripe Dashboard)
- Voor productie: **Live Mode**

De keys beginnen met:
- Test: `sk_test_...` en `pk_test_...`
- Live: `sk_live_...` en `pk_live_...`

## Testen

1. Test de checkout flow op `/prijzen`
2. Test het kopen van extra credits op `/client-portal/buy-credits`
3. Test het beheren van abonnementen op `/client-portal/account`
4. Controleer of webhooks worden ontvangen in Stripe Dashboard > **Developers** > **Webhooks**

## Support

Bij vragen of problemen, neem contact op met support@WritgoAI.nl
