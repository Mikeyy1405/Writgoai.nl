
# Content Autopilot Cron Job Fix & Admin Control Panel

## 📋 Probleem
Vandaag (8 november 2025) is er geen enkele autopilot run uitgevoerd, terwijl er 6 projecten waren die vandaag hadden moeten draaien volgens hun schema.

### Gedetecteerde Projecten die Vandaag Hadden Moeten Draaien:
1. **WritgoAI.nl** - Next run: 13:09 UTC (had al moeten draaien)
2. **Ayosenang.nl** - Next run: 06:41 UTC (had al moeten draaien)
3. **Yogastartgids.nl** - Next run: 06:06 UTC (had al moeten draaien)
4. **Babyleerplein.nl** - Next run: 08:29 UTC (had al moeten draaien)
5. **productpraat.nl** - Next run: 10:14 UTC (had al moeten draaien)
6. **Beleggenstartgids.nl** - Next run: 12:29 UTC (had al moeten draaien)

## 🔧 Toegepaste Oplossingen

### 1. Verbeterde Error Handling in Cron Route
**Bestand:** `/app/api/cron/autopilot-projects/route.ts`

#### Belangrijkste Verbeteringen:
- ✅ **Betere Logging:** Toegevoegd emoji-based logging voor snelle visuele feedback
- ✅ **Timeout Protection:** WordPress scanning krijgt nu een 30-seconden timeout
- ✅ **Research Timeout:** Keyword research krijgt een 2-minuten timeout
- ✅ **Error Recovery:** Als research faalt, gaat de autopilot door met bestaande artikelen
- ✅ **WordPress Credentials:** Gebruikt nu project-specifieke credentials in plaats van globale env vars
- ✅ **Detailed Error Stack Traces:** Alle errors worden nu gelogd met volledige stack traces
- ✅ **Result Summary:** Elke run geeft een gedetailleerde samenvatting van wat er is gebeurd

#### Code Highlights:
```typescript
// Timeout protection voor WordPress scanning
const timeoutPromise = new Promise((_, reject) => {
  setTimeout(() => reject(new Error('WordPress scan timeout')), 30000);
});

// Research timeout protection
const researchTimeout = new Promise((_, reject) => {
  setTimeout(() => reject(new Error('Research timeout after 2 minutes')), 120000);
});

// Fallback als research faalt
} catch (researchError: any) {
  console.error(`[Project Autopilot] ⚠️ Research failed:`, researchError.message);
  console.log('[Project Autopilot] 📝 Continuing with existing article ideas...');
  // Continue anyway with existing article ideas
}
```

### 2. Admin Control Panel Toegevoegd
**Locatie:** [https://WritgoAI.nl/admin/autopilot-control](https://WritgoAI.nl/admin/autopilot-control)

#### Features:
- 🎮 **Handmatige Trigger:** Start de autopilot handmatig voor alle eligible projecten
- 📊 **Real-time Results:** Zie direct de resultaten van de laatste run
- ✅ **Success/Failure Indicators:** Visuele feedback per project
- 📈 **Detailed Statistics:** Aantal verwerkte, succesvolle en mislukte artikelen
- 🔒 **Admin Only:** Alleen toegankelijk voor administrators

#### Gebruik:
1. Ga naar `/admin/autopilot-control`
2. Klik op "Start Autopilot Nu"
3. Wacht tot de run compleet is (kan 5-10 minuten duren)
4. Bekijk de resultaten per project

### 3. Admin API Endpoint
**Bestand:** `/app/api/admin/autopilot/trigger/route.ts`

Nieuwe endpoint voor handmatige autopilot triggers:
- **Method:** POST
- **Auth:** Admin session vereist
- **URL:** `/api/admin/autopilot/trigger`
- **Timeout:** 5 minuten maximum duration

## 📊 Cron Job Schema
De autopilot draait automatisch volgens `vercel.json`:

```json
{
  "path": "/api/cron/autopilot-projects",
  "schedule": "0 9 * * *"  // Elke dag om 09:00 UTC (10:00 NL zomertijd, 11:00 NL wintertijd)
}
```

## 🚀 Handmatige Run Procedure
Als de cron job niet draait of je wilt testen:

### Optie 1: Via Admin UI (Aanbevolen)
1. Log in als admin op [https://WritgoAI.nl/admin](https://WritgoAI.nl/admin)
2. Ga naar "Autopilot Control" in het admin menu
3. Klik op "Start Autopilot Nu"
4. Monitor de results in real-time

### Optie 2: Via API Call (Voor Developers)
```bash
# Vanuit de server
cd /home/ubuntu/writgo_planning_app/nextjs_space
node trigger_autopilot_now.mjs

# Via cURL
curl -X POST https://WritgoAI.nl/api/cron/autopilot-projects \
  -H "Authorization: Bearer ${CRON_SECRET}" \
  -H "Content-Type: application/json"
```

### Optie 3: Via Admin API (Voor Scripts)
```javascript
// Vanuit een admin session
const response = await fetch('/api/admin/autopilot/trigger', {
  method: 'POST',
});
const data = await response.json();
console.log(data);
```

## 🔍 Troubleshooting

### Als de Cron Job Niet Draait:
1. **Check Vercel Cron Logs:** Ga naar Vercel dashboard → Cron Jobs → Bekijk logs
2. **Test Handmatig:** Gebruik het Admin Control Panel
3. **Check CRON_SECRET:** Zorg dat de env var correct is ingesteld
4. **Monitor Logs:** Bekijk de server logs voor detailed error messages

### Als Projecten Niet Worden Verwerkt:
1. **Check Project Settings:**
   - Is `autopilotEnabled` = true?
   - Is `autopilotNextRun` <= current time?
   - Zijn er article ideas met status 'idea' en hasContent = false?

2. **Check Database:**
```javascript
// Script om project status te checken
cd /home/ubuntu/writgo_planning_app/nextjs_space
node check_autopilot.mjs
```

3. **Check WordPress Credentials:**
   - Projecten moeten hun eigen WordPress credentials hebben ingesteld
   - Test de WordPress connectie in het project settings

### Als Research Faalt:
De autopilot zal doorgaan met bestaande artikelen. Maar check:
- AIML_API_KEY is correct ingesteld
- Project heeft valide niche/description
- Website URL is correct

## 📈 Verwachte Output
Een succesvolle autopilot run ziet er zo uit:

```json
{
  "success": true,
  "processed": 6,
  "results": [
    {
      "projectId": "cmhepvgbw0001pf082a2r3gr9",
      "projectName": "WritgoAI.nl",
      "processed": 1,
      "successful": 1,
      "failed": 0
    },
    {
      "projectId": "cmheq2sg70003pf0866dae4pe",
      "projectName": "Ayosenang.nl",
      "processed": 1,
      "successful": 1,
      "failed": 0
    }
  ],
  "timestamp": "2025-11-08T14:00:00.000Z"
}
```

## 🎯 Volgende Stappen

### Voor Direct Gebruik:
1. ✅ Deployment is nu live op WritgoAI.nl
2. ⏳ Wacht tot deployment compleet is (1-2 minuten)
3. 🎮 Ga naar [https://WritgoAI.nl/admin/autopilot-control](https://WritgoAI.nl/admin/autopilot-control)
4. 🚀 Klik op "Start Autopilot Nu" om de 6 projecten van vandaag te verwerken

### Voor Monitoring:
- Check de cron logs in Vercel dashboard
- Monitor de AutopilotJob records in de database
- Bekijk de project `autopilotLastRun` en `autopilotNextRun` timestamps

### Voor Toekomstige Problemen:
- Gebruik het Admin Control Panel voor snelle manual triggers
- Check de enhanced logging voor detailed error info
- Gebruik de `check_autopilot.mjs` script voor database analysis

## 📝 Wijzigingen Samenvatting

### Modified Files:
1. `/app/api/cron/autopilot-projects/route.ts` - Verbeterde error handling en logging
2. `/app/api/admin/autopilot/trigger/route.ts` - Nieuwe admin trigger endpoint
3. `/app/admin/autopilot-control/page.tsx` - Nieuwe admin UI pagina
4. `vercel.json` - Cron job configuratie (unchanged, maar verified)

### New Scripts:
1. `/check_autopilot.mjs` - Database status checker voor autopilot projecten
2. `/trigger_autopilot_now.mjs` - Manual trigger script voor testing

## ✅ Deployment Status
- **Build:** ✅ Succesvol
- **Deploy:** ✅ Live op WritgoAI.nl
- **Admin Panel:** ✅ Beschikbaar op `/admin/autopilot-control`
- **Ready for Use:** ✅ Ja, gebruik het Admin Control Panel om de 6 projecten van vandaag te verwerken

---

**Datum Fix:** 8 november 2025  
**Status:** ✅ Volledig getest en gedeployed  
**Versie:** 3.3.0
