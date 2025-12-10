
# Autopilot WordPress Publishing Fix

## Probleem
De autopilot cron job faalde tijdens het publiceren van gegenereerde content naar WordPress met de foutmelding:
```
Error: Failed to publish content
```

### Oorzaak
Het `/api/client/autopilot/publish` endpoint vereiste een gebruikerssessie via `getServerSession(authOptions)`, maar de cron job is een server-to-server call zonder gebruikerssessie. Dit resulteerde in een 401 Unauthorized error.

## Oplossing
Het publish endpoint is aangepast om twee authenticatiemethoden te ondersteunen:

### 1. **Session-based authenticatie** (voor normale API calls)
Gebruikt `getServerSession()` wanneer de call vanuit een gebruikerssessie komt.

### 2. **Direct clientId authenticatie** (voor cron jobs)
Accepteert een `clientId` parameter wanneer de call vanuit een server context komt.

## Gewijzigde bestanden

### `/app/api/client/autopilot/publish/route.ts`
- **Voor**: Vereiste altijd een gebruikerssessie
- **Na**: Ondersteunt beide authenticatiemethoden:
  ```typescript
  if (clientId) {
    // Direct authentication via clientId (used by cron jobs)
    client = await prisma.client.findUnique({
      where: { id: clientId },
    });
  } else {
    // Session-based authentication (used by regular API calls)
    const session = await getServerSession(authOptions);
    // ...
  }
  ```

### `/app/api/cron/autopilot-projects/route.ts`
- **Voor**: Verzond alleen `contentId` en `projectId`
- **Na**: Verzendt ook `clientId` voor authenticatie:
  ```typescript
  body: JSON.stringify({
    contentId,
    projectId: project.id,
    clientId: project.clientId, // Pass clientId for authentication
  })
  ```

### Verbeterde error logging
Toegevoegd aan het cron endpoint voor betere debugging:
```typescript
if (!publishResponse.ok) {
  const errorData = await publishResponse.json().catch(() => ({ error: 'Unknown error' }));
  console.error(`[Project Autopilot] ❌ Publish failed with status ${publishResponse.status}:`, errorData);
  throw new Error(errorData.error || `Failed to publish content (HTTP ${publishResponse.status})`);
}
```

## Verificatie

### 1. **Controleer autopilot logs**
De autopilot logt nu gedetailleerde informatie:
```
[Project Autopilot] Publishing content to WordPress for article: [titel]
[Project Autopilot] ✅ Published successfully to [URL]
```

Bij fouten:
```
[Project Autopilot] ❌ Publish failed with status 500: [error details]
```

### 2. **Test via Admin Control Panel**
Ga naar: https://WritgoAI.nl/admin/autopilot-control
- Klik op "Autopilot Nu Uitvoeren"
- Bekijk de real-time resultaten
- Controleer of articles succesvol worden gepubliceerd

### 3. **Handmatig triggeren voor testen**
```bash
# Via script (vereist admin toegang)
cd /home/ubuntu/writgo_planning_app
node trigger_autopilot_now.mjs
```

### 4. **Controleer WordPress**
- Log in op de WordPress sites van de betrokken projecten
- Controleer of nieuwe posts zijn verschenen
- Verifieer dat de publicatiedatum correct is

## Betrokken projecten
De fix is toegepast op alle projecten die autopilot gebruiken, waaronder:
- ✅ WritgoAI.nl
- ✅ Beleggenstartgids.nl  
- ✅ Ayosenang.nl
- ✅ Yogastartgids.nl
- ✅ Babyleerplein.nl
- ✅ Productpraat.nl

## Automatische uitvoering
De autopilot cron job draait dagelijks om **09:00 UTC** (10:00 Nederlandse tijd).

## Status
✅ **Fix geïmplementeerd en gedeployed**
- Deployment: WritgoAI.nl
- Build status: Succesvol
- Tests: Passed
- Live sinds: 8 november 2025, 14:05 UTC

## Toekomstige verbeteringen
Mogelijke verbeteringen voor de toekomst:
1. Retry logic bij tijdelijke WordPress connectie fouten
2. Batch publishing met parallelisatie
3. Webhook notificaties bij succesvolle publicaties
4. Rollback mechanisme bij mislukte publicaties
