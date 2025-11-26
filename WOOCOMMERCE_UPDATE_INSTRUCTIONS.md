# WooCommerce Product Auto-Update System

## ✨ Wat doet het systeem?

Het WooCommerce Product Auto-Update systeem controleert wekelijks automatisch:
- ✅ **Actuele prijzen** van producten op Bol.com
- ✅ **Voorraadstatus** (op voorraad / uitverkocht)
- ✅ **Affiliate links** validiteit
- ✅ **Product specificaties** updates

## 🎯 Activeren van Auto-Updates

### Via de UI (Aanbevolen)

1. Ga naar **WooCommerce Producten** pagina
2. Selecteer je project
3. Klik op de **Auto-Update** toggle
4. Het systeem is nu geactiveerd! ✅

### Handmatig Updates Triggeren

Je kunt ook handmatig updates uitvoeren:

```bash
cd /home/ubuntu/writgo_planning_app/nextjs_space
npm run tsx scripts/woocommerce-product-update.ts -- --projectId=YOUR_PROJECT_ID
```

Of alle projecten tegelijk:

```bash
cd /home/ubuntu/writgo_planning_app/nextjs_space
npm run tsx scripts/cron-update-woocommerce-products.ts
```

## 🔧 Externe Cron Service Configuratie

Aangezien crontab niet beschikbaar is in deze omgeving, kun je een externe cron service gebruiken zoals:

### Optie 1: EasyCron (https://www.easycron.com)
1. Maak een gratis account
2. Voeg een nieuwe cron job toe:
   - **URL**: `https://WritgoAI.nl/api/client/woocommerce/update-products`
   - **Method**: POST
   - **Body**: 
     ```json
     {
       "cronSecret": "writgo-content-automation-secret-2025"
     }
     ```
   - **Schedule**: Wekelijks, maandag 03:00 AM

### Optie 2: cron-job.org (https://cron-job.org)
1. Maak een gratis account
2. Voeg een nieuwe cron job toe met dezelfde configuratie als hierboven

### Optie 3: Server-side (Als je SSH toegang hebt)
```bash
# Voeg toe aan crontab
crontab -e

# Voeg deze regel toe (elke maandag om 03:00 AM)
0 3 * * 1 /home/ubuntu/writgo_planning_app/nextjs_space/scripts/run-woocommerce-update.sh >> /home/ubuntu/writgo_planning_app/.logs/woocommerce-update-cron.log 2>&1
```

## 📊 Update Resultaten Bekijken

Na elke update run krijg je een samenvatting te zien met:
- Aantal gecontroleerde producten
- Aantal bijgewerkte producten
- Prijswijzigingen
- Voorraadwijzigingen
- Eventuele fouten

## 🔒 Beveiliging

De API endpoint `/api/client/woocommerce/update-products` is beveiligd met:
- **Session-based auth**: Voor handmatige updates via de UI
- **Cron secret**: Voor geautomatiseerde updates (`cronSecret` in de request body)

De cron secret is: `writgo-content-automation-secret-2025`

## 📁 Bestanden Structuur

```
/scripts/
├── woocommerce-product-update.ts       # Hoofd update script
├── cron-update-woocommerce-products.ts # Batch update voor alle projecten
└── run-woocommerce-update.sh          # Bash wrapper voor cron

/app/api/client/woocommerce/
├── update-products/route.ts            # API endpoint voor updates
└── schedule-updates/route.ts           # API endpoint voor auto-update settings

/prisma/schema.prisma
└── wooCommerceAutoUpdate              # Boolean veld in Project model
└── wooCommerceUpdateSchedule          # String veld in Project model
```

## 🚀 Ontwikkelaar Tips

### Test een update run

```bash
cd /home/ubuntu/writgo_planning_app/nextjs_space
npm run tsx scripts/woocommerce-product-update.ts -- --projectId=<projectId>
```

### Bekijk logs

```bash
tail -f /home/ubuntu/writgo_planning_app/.logs/woocommerce-update-cron.log
```

### Debug API calls

```bash
curl -X POST https://WritgoAI.nl/api/client/woocommerce/update-products \
  -H "Content-Type: application/json" \
  -d '{"projectId": "YOUR_PROJECT_ID", "cronSecret": "writgo-content-automation-secret-2025"}'
```

## ❓ FAQ

**Q: Hoe vaak worden producten bijgewerkt?**  
A: Standaard wekelijks op maandag om 03:00 AM, maar dit is configureerbaar.

**Q: Wat als een product niet meer bestaat op Bol.com?**  
A: De voorraadstatus wordt bijgewerkt naar "uitverkocht" en de laatste prijs blijft behouden.

**Q: Worden klanten automatisch geïnformeerd over prijswijzigingen?**  
A: Nee, alleen de WooCommerce producten worden bijgewerkt. Je kunt zelf notificaties configureren in WooCommerce.

**Q: Kan ik de update frequentie aanpassen?**  
A: Ja, in de toekomst kun je kiezen tussen dagelijks, wekelijks of maandelijks.

## 🆘 Support

Voor vragen of problemen, neem contact op met support@WritgoAI.nl
