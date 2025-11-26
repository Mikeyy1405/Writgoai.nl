
# Stripe Prijs Correctie

## Probleem
Klanten die het Pro abonnement (€79/maand) willen afsluiten, zien €99 in de Stripe checkout.

## Oorzaak
De Stripe Price ID in `.env` verwijst naar een product met prijs €99 in plaats van €79.

## Oplossing

### Stap 1: Nieuwe Price aanmaken in Stripe Dashboard
1. Ga naar https://dashboard.stripe.com/
2. Navigeer naar "Products" → klik op je Pro product
3. Klik op "Add another price"
4. Stel in:
   - Price: **€79,00 EUR**
   - Billing period: **Monthly**
   - Price description: "Pro Maandelijks - 3000 Credits"
5. Klik "Add price"
6. Kopieer de nieuwe Price ID (begint met `price_...`)

### Stap 2: Update Environment Variables
Update de volgende variabelen in `.env`:

```bash
# Pro abonnement - €79/maand - 3000 credits
STRIPE_PRO_PRICE_ID=price_[JE_NIEUWE_PRICE_ID_HIER]
NEXT_PUBLIC_STRIPE_PRO_PRICE_ID=price_[JE_NIEUWE_PRICE_ID_HIER]
```

### Stap 3: Herstart de applicatie
```bash
# Development
yarn dev

# Production (na deployment)
# De applicatie wordt automatisch herstart
```

## Verificatie
Test de checkout door:
1. Ga naar https://WritgoAI.nl/prijzen
2. Klik op "Kies Pro" (€79/maand)
3. Controleer dat de Stripe checkout €79,00 toont

## Huidige Prijzen in Code
De prijzen in de applicatie zijn correct ingesteld:

- **Starter**: €29/maand - 1000 credits
- **Pro**: €79/maand - 3000 credits  
- **Enterprise**: €199/maand - 10000 credits

Het probleem zit alleen in de Stripe Price ID configuratie, niet in de applicatie code.

## Extra Controle Punten

### Account Settings Pagina
Ook controleren op `/client-portal/account` - prijzen moeten overeenkomen:
- Starter: €29/maand
- Pro: €79/maand
- Enterprise: €199/maand

### Webhook Events
Na het aanpassen van de Price ID, controleer dat:
- Nieuwe subscriptions correct worden aangemaakt
- Credits correct worden toegekend (3000 voor Pro)
- Metadata correct wordt opgeslagen

## Contact
Bij vragen of problemen, neem contact op via info@WritgoAI.nl
