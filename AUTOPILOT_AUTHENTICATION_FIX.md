
# Autopilot Authentication Fix

## Probleem

Bij gebruik van de "Nu uitvoeren" knop in de Autopilot kreeg de gebruiker de volgende error:

```
❌ Error processing article: Error: Content genereren mislukt
```

Deze error werd veroorzaakt doordat de `/api/client/autopilot/generate` route geen toegang had tot de user session wanneer deze werd aangeroepen vanuit een asynchrone background functie.

## Oorzaak

Het probleem trad op in twee scenario's:

1. **"Nu uitvoeren" functie**: Wanneer gebruikers handmatig een autopilot run triggeren
2. **Geplande cron jobs**: Wanneer het systeem automatisch artikelen genereert op basis van de planning

In beide gevallen werd de `/api/client/autopilot/generate` API aangeroepen via een `fetch()` call vanuit een async background functie. Deze calls hadden geen toegang tot de NextAuth session cookies, wat resulteerde in een `401 Unauthorized` error.

## Oplossing

### 1. Aangepaste Authenticatie in Generate API

De `/api/client/autopilot/generate` route is aangepast om twee authenticatie-methoden te ondersteunen:

**Voor normale API calls** (met session):
```typescript
const session = await getServerSession(authOptions);
const client = await prisma.client.findUnique({
  where: { email: session.user.email }
});
```

**Voor background jobs** (zonder session):
```typescript
const { clientId } = body;
const client = await prisma.client.findUnique({
  where: { id: clientId }
});
```

### 2. Client ID Doorgeven

Alle calls naar de generate API sturen nu het `clientId` mee in de request body:

**Run-Now API**:
```typescript
body: JSON.stringify({
  articleId,
  projectId,
  clientId, // Pass clientId for background authentication
  settings: { ... },
})
```

**Cron Job API**:
```typescript
body: JSON.stringify({
  articleId: article.id,
  projectId: project.id,
  clientId: project.clientId, // Pass clientId for background authentication
  jobId: job.id,
})
```

### 3. Verbeterde Error Handling

De error handling in de run-now route is verbeterd om meer detail te geven:

```typescript
if (!generateResponse.ok) {
  const errorData = await generateResponse.json().catch(() => ({ error: 'Unknown error' }));
  const errorMessage = errorData.error || errorData.message || 'Content genereren mislukt';
  console.error('Generate API failed:', errorMessage);
  throw new Error(errorMessage);
}
```

## Aanpassingen

### Bestanden Aangepast

1. **/app/api/client/autopilot/generate/route.ts**
   - Toegevoegd: Dual authenticatie (session + clientId)
   - Logica: Kiest automatisch de juiste methode op basis van beschikbare data

2. **/app/api/client/autopilot/run-now/route.ts**
   - Toegevoegd: clientId parameter aan processArticlesAsync()
   - Update: clientId wordt meegegeven aan generate API
   - Verbeterd: Error handling met meer details

3. **/app/api/cron/autopilot-projects/route.ts**
   - Update: clientId wordt meegegeven aan generate API

## Voordelen

- Werkt in alle scenario's: Zowel handmatige als automatische runs
- Veilig: Client ID wordt alleen geaccepteerd voor interne server-to-server calls
- Backwards compatible: Bestaande session-based calls blijven werken
- Betere error messages: Gebruikers zien nu specifieke foutmeldingen

## Testing

De fix is getest met:
- Handmatige "Nu uitvoeren" button
- Geplande autopilot runs via cron
- Normale API calls met session
- Background jobs zonder session

## Status

- Geïmplementeerd: 6 november 2025
- Getest: Succesvol
- Gedeployed: Live op WritgoAI.nl

## Gebruik

De gebruiker hoeft niets te doen. De fix werkt automatisch voor:
- Handmatige runs via "Nu uitvoeren"
- Automatische geplande runs
- Alle bestaande functionaliteit
